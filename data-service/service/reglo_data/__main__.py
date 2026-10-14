"""Ligne de commande du service data.

    python -m reglo_data init-db                      crée les tables du service data
    python -m reglo_data collect --days 30            collecte JORF + EUR-Lex (job quotidien)
    python -m reglo_data quality                      contrôles de qualité des données
    python -m reglo_data serve                        lance l'API (http://127.0.0.1:8000/docs)
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta, timezone

import requests

from . import quality
from .db import create_data_tables, get_engine
from .regulatory import eurlex, jorf
from .regulatory.store import log_run, upsert_texts

USER_AGENT = "RegloDataService/0.1 (projet étudiant MyDigitalSchool)"


def collect(days: int, sources: list[str]) -> int:
    engine = get_engine()
    create_data_tables(engine)
    http = requests.Session()
    http.headers["User-Agent"] = USER_AGENT
    since = date.today() - timedelta(days=days)
    failures = 0
    for name, module in (("JORF", jorf), ("EUR-Lex", eurlex)):
        if name.lower() not in sources:
            continue
        started = datetime.now(timezone.utc)
        try:
            texts, stats = module.fetch(since, session=http)
            stats["kept"] = len(texts)
            new = upsert_texts(engine, texts)
            log_run(engine, name, started, True, stats)
            print(f"{name} : {stats.get('read')} lus, {len(texts)} retenus ({new} nouveaux), "
                  f"{stats.get('excluded_personal', 0)} mesures nominatives écartées")
        except Exception as e:  # une source en panne n'empêche pas l'autre
            failures += 1
            log_run(engine, name, started, False, {}, error=f"{type(e).__name__}: {e}"[:500])
            print(f"{name} : ÉCHEC ({type(e).__name__}: {e})")
    return 1 if failures else 0


def main(argv: list[str] | None = None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(prog="reglo_data")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init-db")
    c = sub.add_parser("collect")
    c.add_argument("--days", type=int, default=7)
    c.add_argument("--sources", default="jorf,eur-lex")
    sub.add_parser("quality")
    s = sub.add_parser("serve")
    s.add_argument("--port", type=int, default=8000)
    args = parser.parse_args(argv)

    if args.command == "init-db":
        create_data_tables(get_engine())
        print("Tables du service data créées.")
        return 0
    if args.command == "collect":
        return collect(args.days, args.sources.lower().split(","))
    if args.command == "quality":
        checks = quality.run_checks(get_engine())
        print(json.dumps({"summary": quality.summary(checks), "checks": checks}, ensure_ascii=False, indent=2))
        return 0
    if args.command == "serve":
        import uvicorn
        uvicorn.run("reglo_data.api:app", host="127.0.0.1", port=args.port)
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
