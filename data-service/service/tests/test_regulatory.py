"""Scénarios de test de la veille réglementaire (taxonomie, JORF, EUR-Lex, stockage)."""

import io
import tarfile
from datetime import date
from pathlib import Path

from reglo_data import taxonomy
from reglo_data.db import create_data_tables, get_engine
from reglo_data.regulatory import eurlex, jorf
from reglo_data.regulatory.store import list_texts, upsert_texts

FIXTURE = (Path(__file__).parent / "fixtures" / "JORFTEXT000054977578.xml").read_bytes()


def make_text(text_id, title, nature="DECRET", published="2026-10-13"):
    return (f'<?xml version="1.0" encoding="UTF-8"?><TEXTE_VERSION><META><META_COMMUN><ID>{text_id}</ID>'
            f'<NATURE>{nature}</NATURE></META_COMMUN><META_SPEC><META_TEXTE_CHRONICLE><NOR>TEST{text_id[-4:]}</NOR>'
            f'<DATE_PUBLI>{published}</DATE_PUBLI></META_TEXTE_CHRONICLE><META_TEXTE_VERSION>'
            f'<TITREFULL>{title}</TITREFULL><MINISTERE>Ministère test</MINISTERE></META_TEXTE_VERSION></META_SPEC>'
            f'</META></TEXTE_VERSION>').encode()


def make_archive(files: dict[str, bytes]) -> bytes:
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w:gz") as tar:
        for name, data in files.items():
            info = tarfile.TarInfo(name)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
    return buf.getvalue()


# ── Taxonomie ──
def test_classement_par_themes_clients():
    assert taxonomy.classify("Décret relatif au diagnostic des maladies professionnelles") == ["social"]
    assert "dechets" in taxonomy.classify("Arrêté portant cahier des charges des éco-organismes de la filière REP emballages")
    assert "loi_climat" in taxonomy.classify("Décret relatif aux budgets carbone et à la rénovation énergétique")
    assert "csrd" in taxonomy.classify("Ordonnance relative à la publication d'informations en matière de durabilité")
    assert taxonomy.classify("Arrêté relatif aux cotyles à double mobilité") == []        # faux positif évité
    assert taxonomy.classify("Décision mettant en demeure l'association Radio Menergy") == []


def test_ciblage_sectoriel():
    assert taxonomy.naf_scope("Arrêté relatif à la prévention des risques sur les chantiers du BTP") == ["F"]
    assert taxonomy.naf_scope("Décret relatif aux installations classées") == ["C", "D", "E"]
    assert taxonomy.naf_scope("Décret relatif au code du travail") == []                   # tous secteurs


def test_mesures_nominatives_detectees():
    for title in ("Décret du 2 octobre 2026 portant nomination du directeur général",
                  "Décret portant cessation de fonction de la directrice", "Arrêté portant changement de corps sur liste d'aptitude",
                  "Décret portant affectation d'un officier général"):
        assert taxonomy.is_personal(title), title
    assert not taxonomy.is_personal("Décret relatif à la prévention des risques professionnels")


# ── JORF ──
def test_lecture_d_un_vrai_texte_du_jo():
    t = jorf.parse_text(FIXTURE)
    assert t["id"] == "JORFTEXT000054977578" and t["nature"] == "DECRET"
    assert t["published_at"] == date(2026, 10, 13) and t["reference"] == "TRSS2616720D"
    assert t["title"].startswith("Décret n° 2026-948 du 12 octobre 2026")
    assert t["url"] == "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054977578"


def test_xml_invalide_ignore():
    assert jorf.parse_text(b"<pas du xml") is None


def test_archive_selection_et_exclusions():
    base = "20261013-000000/jorf/global/texte/version/JORF/TEXT/00/00/00/00/00/"
    archive = make_archive({
        base + "JORFTEXT000000000001.xml": make_text("JORFTEXT000000000001", "Décret relatif à la prévention des risques professionnels"),
        base + "JORFTEXT000000000002.xml": make_text("JORFTEXT000000000002", "Décret portant nomination au conseil"),
        base + "JORFTEXT000000000003.xml": make_text("JORFTEXT000000000003", "Avis relatif aux déchets", nature="AVIS"),
        base + "JORFTEXT000000000004.xml": make_text("JORFTEXT000000000004", "Arrêté relatif aux tarifs postaux"),
        base + "JORFTEXT000000000005.xml": make_text("JORFTEXT000000000005", "Arrêté portant extension de l'avenant n° 3 sur la formation professionnelle"),
        "20261013-000000/jorf/global/conteneur/JORF/CONT/x.xml": b"<JO/>",
    })
    texts = jorf.parse_archive(archive)
    assert len(texts) == 5                                   # le conteneur n'est pas un texte
    kept, personal = jorf.select(texts)
    assert [t["id"] for t in kept] == ["JORFTEXT000000000001"]
    assert personal == 1 and kept[0]["themes"] == ["social"] and kept[0]["source"] == "JORF"


def test_liste_des_archives_depuis_une_date():
    html = "JORF_20261001-010101.tar.gz JORF_20261012-212534.tar.gz JORF_20261013-002011.tar.gz JORF_20261013-002011.tar.gz"
    assert jorf.list_archives(html, date(2026, 10, 12)) == ["JORF_20261012-212534.tar.gz", "JORF_20261013-002011.tar.gz"]


# ── EUR-Lex ──
def test_eurlex_dedoublonnage_et_themes():
    rows = [
        {"celex": {"value": "32026R1563"}, "date": {"value": "2026-07-03"},
         "title": {"value": "Règlement délégué modifiant le règlement délégué (UE) 2023/2772 (normes d'information en matière de durabilité)"}},
        {"celex": {"value": "32026R1563"}, "date": {"value": "2026-07-03"}, "title": {"value": "doublon"}},
        {"celex": {"value": "52026XC0001"}, "date": {"value": "2026-07-01"}, "title": {"value": "Communication sans thème client"}},
    ]
    texts = eurlex.parse_bindings(rows)
    assert len(texts) == 1 and texts[0]["themes"] == ["csrd"] and texts[0]["nature"] == "Règlement"
    assert "2023/2772" in eurlex.build_query(date(2026, 6, 1))


# ── Stockage et lecture (US-11) ──
def test_stockage_filtres_et_mise_a_jour(tmp_path):
    engine = get_engine(f"sqlite:///{tmp_path / 't.sqlite'}")
    create_data_tables(engine)
    texts = [
        {"id": "A", "source": "JORF", "nature": "DECRET", "reference": "N1", "title": "Prévention BTP", "authority": "Travail",
         "published_at": date(2026, 10, 1), "url": "https://x/A", "themes": ["social"], "naf_scope": ["F"]},
        {"id": "B", "source": "JORF", "nature": "ARRETE", "reference": "N2", "title": "Déchets", "authority": "Écologie",
         "published_at": date(2026, 10, 5), "url": "https://x/B", "themes": ["dechets"], "naf_scope": []},
    ]
    assert upsert_texts(engine, texts) == 2
    assert upsert_texts(engine, texts) == 0                           # idempotent
    assert [t["id"] for t in list_texts(engine, since=date(2026, 9, 1))] == ["B", "A"]   # plus récent d'abord
    assert [t["id"] for t in list_texts(engine, theme="social", since=date(2026, 9, 1))] == ["A"]
    assert [t["id"] for t in list_texts(engine, naf_section="H", since=date(2026, 9, 1))] == ["B"]  # A cible le BTP seulement
    assert list_texts(engine, theme="csrd", since=date(2026, 9, 1)) == []
