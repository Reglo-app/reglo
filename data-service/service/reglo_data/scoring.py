"""Calcul du score du diagnostic RSE / QHSE (US-03, US-04, US-10).

Spécification : data-service/docs/06-specification-score.md. Principes :
1. chaque réponse est convertie en note de 0 à 100 selon le type de question ;
2. « non applicable » est exclu du calcul (ni bonus ni pénalité) ;
3. règle de preuve : une question qui exige une preuve, sans justification ni document, est plafonnée ;
4. agrégation pondérée : question → thématique → pilier → score global ;
5. les écarts prioritaires sont les questions dont l'amélioration ferait gagner le plus de points au global.

Le module est pur (aucun accès réseau ni base) : il est testable et rejouable, et chaque résultat porte
`ALGO_VERSION` pour comparer deux diagnostics (US-10).
"""

from __future__ import annotations

from dataclasses import dataclass, field

ALGO_VERSION = "1.0.0"

MATURITY_LEVELS = [  # seuils proposés, à valider avec l'expertise QHSE
    (75, "Exemplaire"),
    (50, "Maîtrisé"),
    (25, "En structuration"),
    (0, "Initial"),
]


class ScoringError(ValueError):
    """Diagnostic non calculable (champ obligatoire vide, réponse invalide…)."""

    def __init__(self, errors: list[dict]):
        super().__init__(f"{len(errors)} erreur(s) de saisie")
        self.errors = errors


@dataclass(frozen=True)
class Answer:
    question_id: str
    value: object = None            # dépend du type de question ; None = pas de réponse
    not_applicable: bool = False
    justification: str | None = None
    has_document: bool = False


@dataclass
class QuestionResult:
    question_id: str
    pillar: str
    theme: str
    score: float | None             # None = non applicable / non noté
    capped_for_proof: bool = False


@dataclass
class ScoreResult:
    algo_version: str
    questionnaire_version: str
    global_score: float | None
    maturity: str | None
    pillars: dict[str, float | None]
    themes: dict[str, float | None]
    coverage: float                  # part des questions notables effectivement notées (hors N/A)
    gaps: list[dict] = field(default_factory=list)
    questions: list[QuestionResult] = field(default_factory=list)


def maturity_label(score: float | None) -> str | None:
    if score is None:
        return None
    return next(label for threshold, label in MATURITY_LEVELS if score >= threshold)


def _question_score(q: dict, a: Answer) -> float:
    """Note de 0 à 100 d'une réponse. Lève ValueError si la réponse ne correspond pas au type."""
    qtype, value = q["type"], a.value
    if qtype == "yes_no":
        if value not in (True, False, "yes", "no", "partial"):
            raise ValueError("réponse attendue : yes / no / partial")
        return {True: 100.0, "yes": 100.0, "partial": 50.0, False: 0.0, "no": 0.0}[value]
    if qtype == "scale":
        levels = q["levels"]  # libellés du niveau le plus bas au plus haut
        if value not in range(len(levels)):
            raise ValueError(f"niveau attendu entre 0 et {len(levels) - 1}")
        return 100.0 * value / (len(levels) - 1)
    if qtype == "single_choice":
        points = {o["id"]: o["points"] for o in q["options"]}
        if value not in points:
            raise ValueError(f"option inconnue : {value!r}")
        return float(points[value])
    if qtype == "multi_choice":
        points = {o["id"]: o["points"] for o in q["options"]}
        if not isinstance(value, (list, tuple)) or any(v not in points for v in value):
            raise ValueError("liste d'options connues attendue")
        return float(min(100, sum(points[v] for v in set(value))))
    raise ValueError(f"type de question non noté : {qtype}")


def _weighted_mean(pairs: list[tuple[float | None, float]]) -> float | None:
    """Moyenne pondérée en ignorant les valeurs None (non applicables)."""
    kept = [(v, w) for v, w in pairs if v is not None and w > 0]
    total = sum(w for _, w in kept)
    return round(sum(v * w for v, w in kept) / total, 1) if total else None


def iter_questions(questionnaire: dict):
    for pillar in questionnaire["pillars"]:
        for theme in pillar["themes"]:
            for q in theme["questions"]:
                yield pillar, theme, q


def compute(questionnaire: dict, answers: list[Answer], top_gaps: int = 3) -> ScoreResult:
    """Calcule les scores d'un diagnostic validé. Lève ScoringError si le diagnostic n'est pas complet."""
    by_id = {a.question_id: a for a in answers}
    known = {q["id"] for _, _, q in iter_questions(questionnaire)}
    errors: list[dict] = [{"question_id": qid, "error": "question inconnue"} for qid in by_id if qid not in known]
    proof_cap = float(questionnaire.get("proof_cap", 50))

    results: list[QuestionResult] = []
    for pillar, theme, q in iter_questions(questionnaire):
        a = by_id.get(q["id"])
        scorable = q["type"] != "text"
        answered = a is not None and (a.not_applicable or a.value is not None)
        if q.get("mandatory", True) and not answered:
            errors.append({"question_id": q["id"], "error": "réponse obligatoire manquante"})
            continue
        if not scorable or a is None or a.not_applicable or a.value is None:
            # « Non applicable » seulement là où le questionnaire l'autorise (sinon contournement du score).
            if a is not None and a.not_applicable and not q.get("allow_na", False):
                errors.append({"question_id": q["id"], "error": "« non applicable » non autorisé"})
            results.append(QuestionResult(q["id"], pillar["id"], theme["id"], None))
            continue
        try:
            score = _question_score(q, a)
        except ValueError as e:
            errors.append({"question_id": q["id"], "error": str(e)})
            continue
        capped = False
        if q.get("requires_proof") and not (a.justification or "").strip() and not a.has_document and score > proof_cap:
            score, capped = proof_cap, True
        results.append(QuestionResult(q["id"], pillar["id"], theme["id"], score, capped))

    if errors:
        raise ScoringError(errors)

    by_q = {r.question_id: r for r in results}
    themes: dict[str, float | None] = {}
    pillars: dict[str, float | None] = {}
    for pillar in questionnaire["pillars"]:
        theme_pairs = []
        for theme in pillar["themes"]:
            t_score = _weighted_mean([(by_q[q["id"]].score, q.get("weight", 1.0))
                                      for q in theme["questions"] if q["id"] in by_q])
            themes[theme["id"]] = t_score
            theme_pairs.append((t_score, theme.get("weight", 1.0)))
        pillars[pillar["id"]] = _weighted_mean(theme_pairs)
    global_score = _weighted_mean([(pillars[p["id"]], p.get("weight", 1.0)) for p in questionnaire["pillars"]])

    scorable_total = sum(1 for _, _, q in iter_questions(questionnaire) if q["type"] != "text")
    scored = sum(1 for r in results if r.score is not None)

    return ScoreResult(
        algo_version=ALGO_VERSION,
        questionnaire_version=str(questionnaire.get("version", "")),
        global_score=global_score,
        maturity=maturity_label(global_score),
        pillars=pillars,
        themes=themes,
        coverage=round(scored / scorable_total, 3) if scorable_total else 0.0,
        gaps=_gaps(questionnaire, by_q, pillars, themes, top_gaps),
        questions=results,
    )


def _gaps(questionnaire: dict, by_q: dict, pillars: dict, themes: dict, top: int) -> list[dict]:
    """Questions dont l'amélioration à 100 ferait gagner le plus de points au score global.

    Poids effectif d'une question = part de la question dans sa thématique × part de la thématique
    dans son pilier × part du pilier dans le global (en ne comptant que les éléments notés)."""
    active_pillars = [p for p in questionnaire["pillars"] if pillars[p["id"]] is not None]
    p_total = sum(p.get("weight", 1.0) for p in active_pillars)
    gaps = []
    for pillar in active_pillars:
        active_themes = [t for t in pillar["themes"] if themes[t["id"]] is not None]
        t_total = sum(t.get("weight", 1.0) for t in active_themes)
        for theme in active_themes:
            scored = [q for q in theme["questions"] if by_q.get(q["id"]) and by_q[q["id"]].score is not None]
            q_total = sum(q.get("weight", 1.0) for q in scored)
            for q in scored:
                share = (q.get("weight", 1.0) / q_total) * (theme.get("weight", 1.0) / t_total) * (pillar.get("weight", 1.0) / p_total)
                potential = round(share * (100 - by_q[q["id"]].score), 2)
                if potential > 0:
                    gaps.append({"question_id": q["id"], "label": q.get("label", ""), "pillar": pillar["id"],
                                 "theme": theme["id"], "score": by_q[q["id"]].score, "potential_points": potential,
                                 "capped_for_proof": by_q[q["id"]].capped_for_proof})
    return sorted(gaps, key=lambda g: g["potential_points"], reverse=True)[:top]


def validate_questionnaire(questionnaire: dict) -> list[str]:
    """Contrôles de cohérence d'un questionnaire avant publication (qualité des données)."""
    problems, seen = [], set()
    for pillar, theme, q in iter_questions(questionnaire):
        if q["id"] in seen:
            problems.append(f"identifiant de question en double : {q['id']}")
        seen.add(q["id"])
        if q.get("weight", 1.0) < 0:
            problems.append(f"{q['id']} : poids négatif")
        if q["type"] == "scale" and len(q.get("levels", [])) < 2:
            problems.append(f"{q['id']} : une échelle doit avoir au moins 2 niveaux")
        if q["type"] in ("single_choice", "multi_choice"):
            pts = [o.get("points") for o in q.get("options", [])]
            if not pts or any(p is None or not 0 <= p <= 100 for p in pts):
                problems.append(f"{q['id']} : chaque option doit avoir des points entre 0 et 100")
        if q["type"] not in ("yes_no", "scale", "single_choice", "multi_choice", "text"):
            problems.append(f"{q['id']} : type inconnu {q['type']!r}")
    return problems
