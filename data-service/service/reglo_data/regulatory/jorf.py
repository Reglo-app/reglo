"""Journal officiel (JORF) : archives quotidiennes de l'open data DILA, sans clé d'API.

Source : https://echanges.dila.gouv.fr/OPENDATA/JORF/ (Licence Ouverte Etalab). Chaque archive
`JORF_AAAAMMJJ-HHMMSS.tar.gz` contient les textes publiés (texte/version/.../JORFTEXT*.xml).

Le collecteur ne garde que les métadonnées (nature, NOR, dates, titre, ministère, lien Légifrance),
écarte les mesures nominatives (données personnelles) et les textes hors des thèmes clients.
"""

from __future__ import annotations

import io
import re
import tarfile
from datetime import date, datetime
from xml.etree import ElementTree as ET

import requests

from .. import taxonomy

BASE_URL = "https://echanges.dila.gouv.fr/OPENDATA/JORF/"
ARCHIVE_RE = re.compile(r"JORF_(\d{8})-(\d{6})\.tar\.gz")
TEXT_PATH_RE = re.compile(r"/texte/version/JORF/TEXT/.*/(JORFTEXT\d+)\.xml$")
# Natures retenues : textes normatifs. Les avis, rectificatifs et informations diverses sont écartés.
KEPT_NATURES = {"LOI", "ORDONNANCE", "DECRET", "ARRETE", "DECISION", "CIRCULAIRE", "INSTRUCTION"}


def list_archives(index_html: str, since: date) -> list[str]:
    """Noms d'archives publiées depuis `since`, de la plus ancienne à la plus récente."""
    names = sorted(set(m.group(0) for m in ARCHIVE_RE.finditer(index_html)))
    return [n for n in names if datetime.strptime(ARCHIVE_RE.match(n).group(1), "%Y%m%d").date() >= since]


def _text(root: ET.Element, path: str) -> str:
    node = root.find(path)
    return (node.text or "").strip() if node is not None and node.text else ""


def parse_text(xml_bytes: bytes) -> dict | None:
    """Métadonnées d'un texte JORF (fichier texte/version). None si le fichier est illisible."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return None
    text_id = _text(root, "META/META_COMMUN/ID")
    if not text_id:
        return None
    chronicle = "META/META_SPEC/META_TEXTE_CHRONICLE/"
    version = "META/META_SPEC/META_TEXTE_VERSION/"
    title = _text(root, version + "TITREFULL") or _text(root, version + "TITRE")
    published = _text(root, chronicle + "DATE_PUBLI")
    return {
        "id": text_id,
        "nature": _text(root, "META/META_COMMUN/NATURE"),
        "reference": _text(root, chronicle + "NOR"),
        "title": " ".join(title.split()),
        "authority": _text(root, version + "MINISTERE") or _text(root, version + "AUTORITE"),
        "published_at": date.fromisoformat(published) if published else None,
        "url": f"https://www.legifrance.gouv.fr/jorf/id/{text_id}",
    }


def parse_archive(data: bytes) -> list[dict]:
    """Tous les textes d'une archive quotidienne (sans filtrage)."""
    texts = []
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        for member in tar:
            if member.isfile() and TEXT_PATH_RE.search(member.name):
                f = tar.extractfile(member)
                parsed = parse_text(f.read()) if f else None
                if parsed and parsed["published_at"]:
                    texts.append(parsed)
    return texts


def select(texts: list[dict]) -> tuple[list[dict], int]:
    """Garde les textes normatifs des thèmes clients ; écarte les mesures nominatives.
    Renvoie (textes retenus enrichis de leurs thèmes et secteurs, nombre de textes nominatifs écartés)."""
    kept, personal = [], 0
    for t in texts:
        if taxonomy.is_personal(t["title"]):
            personal += 1
            continue
        if t["nature"] not in KEPT_NATURES or taxonomy.is_noise(t["title"]):
            continue
        themes = taxonomy.classify(t["title"])
        if not themes:
            continue
        kept.append({**t, "source": "JORF", "themes": themes, "naf_scope": taxonomy.naf_scope(t["title"])})
    return kept, personal


def fetch(since: date, session: requests.Session | None = None, timeout: float = 60) -> tuple[list[dict], dict]:
    """Télécharge et filtre les archives depuis `since`. Renvoie (textes retenus, statistiques)."""
    http = session or requests.Session()
    index = http.get(BASE_URL, timeout=timeout)
    index.raise_for_status()
    stats = {"archives": 0, "read": 0, "excluded_personal": 0}
    kept: dict[str, dict] = {}
    for name in list_archives(index.text, since):
        resp = http.get(BASE_URL + name, timeout=timeout)
        resp.raise_for_status()
        # Les archives contiennent aussi des versions modifiées de textes anciens : seule la période compte.
        texts = [t for t in parse_archive(resp.content) if t["published_at"] >= since]
        selected, personal = select(texts)
        stats["archives"] += 1
        stats["read"] += len(texts)
        stats["excluded_personal"] += personal
        kept.update({t["id"]: t for t in selected})  # un texte republié garde sa dernière version
    return list(kept.values()), stats
