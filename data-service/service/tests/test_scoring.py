"""Scénarios de test du calcul de score (data-service/docs/06-specification-score.md, §6)."""

import json
from pathlib import Path

import pytest

from reglo_data.scoring import ALGO_VERSION, Answer, ScoringError, compute, maturity_label, validate_questionnaire

Q = json.loads((Path(__file__).parent.parent / "reglo_data" / "questionnaire_example.json").read_text(encoding="utf-8"))
SCORABLE = ["S1", "S2", "S3", "S4", "E1", "E2", "E3", "H1", "H2", "G1", "G2"]


def all_best() -> list[Answer]:
    return [Answer("S1", "yes", justification="DUERP 2026"), Answer("S2", 3), Answer("S3", "yes"), Answer("S4", "gt80"),
            Answer("E1", "yes", has_document=True), Answer("E2", ["eclairage", "chauffage", "mobilite"]),
            Answer("E3", 2), Answer("H1", 2), Answer("H2", "yes", has_document=True), Answer("G1", "yes"), Answer("G2", 2)]


def all_worst() -> list[Answer]:
    return [Answer("S1", "no"), Answer("S2", 0), Answer("S3", "no"), Answer("S4", "lt25"), Answer("E1", "no"),
            Answer("E2", []), Answer("E3", 0), Answer("H1", 0), Answer("H2", "no"), Answer("G1", "no"), Answer("G2", 0)]


def test_questionnaire_exemple_coherent():
    assert validate_questionnaire(Q) == []


def test_tout_au_maximum_donne_100():
    r = compute(Q, all_best())
    assert r.global_score == 100.0 and r.maturity == "Exemplaire"
    assert all(v == 100.0 for v in r.pillars.values())
    assert r.gaps == [] and r.coverage == 1.0 and r.algo_version == ALGO_VERSION


def test_tout_au_minimum_donne_0():
    r = compute(Q, all_worst())
    assert r.global_score == 0.0 and r.maturity == "Initial"
    assert len(r.gaps) == 3


def test_non_applicable_exclu_du_calcul():
    answers = [a for a in all_best() if a.question_id != "E3"] + [Answer("E3", not_applicable=True)]
    r = compute(Q, answers)
    assert r.themes["dechets"] is None          # thématique entièrement non applicable
    assert r.pillars["environnement"] == 100.0  # le pilier ne compte que les thématiques notées
    assert r.coverage == round(10 / 11, 3)


def test_non_applicable_refuse_si_non_autorise():
    answers = [a for a in all_best() if a.question_id != "S1"] + [Answer("S1", not_applicable=True)]
    with pytest.raises(ScoringError) as e:
        compute(Q, answers)
    assert e.value.errors[0]["question_id"] == "S1"


def test_champ_obligatoire_vide_bloque_la_validation():
    answers = [a for a in all_best() if a.question_id != "G2"]
    with pytest.raises(ScoringError) as e:
        compute(Q, answers)
    assert {"question_id": "G2", "error": "réponse obligatoire manquante"} in e.value.errors


def test_question_texte_facultative_non_notee():
    r = compute(Q, all_best() + [Answer("G3", "RAS")])
    assert r.global_score == 100.0


def test_regle_de_preuve_plafonne_sans_justification():
    answers = [a for a in all_best() if a.question_id != "S1"] + [Answer("S1", "yes")]  # ni justification ni document
    r = compute(Q, answers)
    s1 = next(q for q in r.questions if q.question_id == "S1")
    assert s1.score == 50.0 and s1.capped_for_proof
    assert r.gaps[0]["question_id"] == "S1" and r.gaps[0]["capped_for_proof"]


def test_ponderation_question_dans_la_thematique():
    # S1 (poids 3) à 0, S2 (2) et S3 (1) à 100 → (0×3 + 100×2 + 100×1) / 6 = 50
    answers = [a for a in all_best() if a.question_id != "S1"] + [Answer("S1", "no")]
    r = compute(Q, answers)
    assert r.themes["sante_securite"] == 50.0
    # pilier social : thématique santé-sécurité (poids 2) à 50, compétences (1) à 100 → 66,7
    assert r.pillars["social"] == 66.7


def test_types_de_reponses():
    answers = [a for a in all_best() if a.question_id not in ("S2", "E2", "S3")] + [
        Answer("S2", 1), Answer("E2", ["eclairage", "eclairage", "achats"]), Answer("S3", "partial")]
    r = compute(Q, answers)
    by = {q.question_id: q.score for q in r.questions}
    assert by["S2"] == pytest.approx(33.33, abs=0.01)  # échelle à 4 niveaux, niveau 1
    assert by["E2"] == 60.0                             # doublon ignoré : 30 + 30
    assert by["S3"] == 50.0                             # réponse partielle


def test_choix_multiples_plafonne_a_100():
    answers = [a for a in all_best() if a.question_id != "E2"] + [Answer("E2", ["eclairage", "chauffage", "mobilite", "achats"])]
    assert next(q.score for q in compute(Q, answers).questions if q.question_id == "E2") == 100.0


@pytest.mark.parametrize("qid,value", [("S2", 9), ("S4", "inconnu"), ("S1", "peut-être"), ("E2", "eclairage")])
def test_reponses_invalides_refusees(qid, value):
    answers = [a for a in all_best() if a.question_id != qid] + [Answer(qid, value)]
    with pytest.raises(ScoringError):
        compute(Q, answers)


def test_question_inconnue_refusee():
    with pytest.raises(ScoringError):
        compute(Q, all_best() + [Answer("ZZ9", "yes")])


def test_ecarts_tries_par_points_potentiels():
    gaps = compute(Q, all_worst()).gaps
    assert [g["potential_points"] for g in gaps] == sorted((g["potential_points"] for g in gaps), reverse=True)
    # Le plus gros écart vaut sa part du global : G2 = poids 2/3 de la thématique, seule du pilier (1/4) → 16,67 pts.
    assert gaps[0]["question_id"] == "G2" and gaps[0]["potential_points"] == pytest.approx(16.67, abs=0.01)


def test_resultat_deterministe():
    a, b = compute(Q, all_worst()), compute(Q, all_worst())
    assert (a.global_score, a.pillars, a.gaps) == (b.global_score, b.pillars, b.gaps)


def test_niveaux_de_maturite():
    assert [maturity_label(v) for v in (0, 24.9, 25, 50, 74.9, 75, 100)] == [
        "Initial", "Initial", "En structuration", "Maîtrisé", "Maîtrisé", "Exemplaire", "Exemplaire"]


def test_validation_questionnaire_detecte_les_erreurs():
    bad = {"pillars": [{"id": "p", "themes": [{"id": "t", "questions": [
        {"id": "X", "type": "scale", "levels": ["seul"]}, {"id": "X", "type": "inconnu"},
        {"id": "Y", "type": "single_choice", "options": [{"id": "a", "points": 150}]}]}]}]}
    problems = validate_questionnaire(bad)
    assert len(problems) == 4
