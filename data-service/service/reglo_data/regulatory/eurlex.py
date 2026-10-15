"""EUR-Lex : actes législatifs et propositions de l'UE, via le point d'accès SPARQL public (Cellar)."""

from __future__ import annotations

from datetime import date

import requests

from .. import taxonomy

SPARQL_URL = "https://publications.europa.eu/webapi/rdf/sparql"
QUERY = """
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?celex ?date ?title WHERE {{
  ?work cdm:resource_legal_id_celex ?celex ; cdm:work_date_document ?date .
  ?expr cdm:expression_belongs_to_work ?work ; cdm:expression_title ?title ;
        cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/FRA> .
  FILTER(?date >= "{since}"^^xsd:date)
  FILTER(REGEX(STR(?celex), "^[35]"))
  FILTER(REGEX(?title, "{pattern}", "i"))
  FILTER(!REGEX(?title, "rectificatif|rectifiant|versions linguistiques", "i"))
}} ORDER BY DESC(?date) LIMIT 300
"""
# Expressions de présélection côté EUR-Lex (les thèmes clients sont recalculés ensuite par la taxonomie).
PATTERNS = ["durabilité", "devoir de vigilance", "santé et (de la )?sécurité", "sécurité et (de la )?santé",
            "déchets", "emballages", "économie circulaire", "gaz à effet de serre", "efficacité énergétique",
            "taxonomie", "2023/2772", "2013/34/UE", "2022/2464", "2024/1760", "89/391/CEE"]
KINDS = {"R": "Règlement", "L": "Directive", "D": "Décision", "PC": "Proposition", "DC": "Communication",
         "SC": "Document de travail", "XC": "Communication", "H": "Recommandation"}


def celex_kind(celex: str) -> str:
    body = celex[5:]
    return next((KINDS[c] for c in sorted(KINDS, key=len, reverse=True) if body.startswith(c)), "Acte")


def build_query(since: date) -> str:
    return QUERY.format(since=since.isoformat(), pattern="|".join(f"({p})" for p in PATTERNS))


def parse_bindings(rows: list[dict]) -> list[dict]:
    texts, seen = [], set()
    for row in rows:
        celex = row["celex"]["value"]
        title = " ".join(row["title"]["value"].replace("#", " ").split())
        key = taxonomy.normalize(title)
        if celex in seen or key in seen:
            continue
        seen.update({celex, key})
        themes = taxonomy.classify(title)
        if not themes:
            continue
        texts.append({
            "id": f"celex-{celex}", "source": "EUR-Lex", "nature": celex_kind(celex), "reference": celex,
            "title": title, "authority": "Union européenne", "published_at": date.fromisoformat(row["date"]["value"][:10]),
            "url": f"https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:{celex}",
            "themes": themes, "naf_scope": taxonomy.naf_scope(title),
        })
    return texts


def fetch(since: date, session: requests.Session | None = None, timeout: float = 90) -> tuple[list[dict], dict]:
    http = session or requests.Session()
    last_error = None
    for _ in range(2):  # point d'accès parfois lent : une seconde tentative
        try:
            resp = http.get(SPARQL_URL, params={"query": build_query(since), "format": "application/sparql-results+json"},
                            timeout=timeout)
            resp.raise_for_status()
            rows = resp.json()["results"]["bindings"]
            texts = parse_bindings(rows)
            return texts, {"read": len(rows), "excluded_personal": 0}
        except (requests.RequestException, ValueError, KeyError) as e:
            last_error = e
    raise RuntimeError(f"EUR-Lex indisponible : {last_error}")
