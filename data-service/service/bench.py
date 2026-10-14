"""Banc de montée en charge : volume de données → temps de traitement (critère « Déploiement » de la grille data).

    python bench.py            # écrit ../docs/bench-resultats.md

Données synthétiques uniquement. SQLite ici : en production (PostgreSQL + index), les temps de lecture
seront à remesurer sur le VPS (à faire avec Florian).
"""

from __future__ import annotations

import json
import random
import tempfile
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from reglo_data.db import action, create_data_tables, diagnostic, enrollment, get_engine, membership, organization, score
from reglo_data.indicators import organization_indicators
from reglo_data.regulatory.store import list_texts, upsert_texts
from reglo_data.scoring import Answer, compute

ROOT = Path(__file__).parent
Q = json.loads((ROOT / "reglo_data" / "questionnaire_example.json").read_text(encoding="utf-8"))
rng = random.Random(42)


def random_answers() -> list[Answer]:
    return [Answer("S1", rng.choice(["yes", "no", "partial"]), justification=rng.choice([None, "ok"])),
            Answer("S2", rng.randint(0, 3)), Answer("S3", rng.choice(["yes", "no"])),
            Answer("S4", rng.choice(["lt25", "25_50", "50_80", "gt80"])), Answer("E1", rng.choice(["yes", "no"]), has_document=True),
            Answer("E2", rng.sample(["eclairage", "chauffage", "mobilite", "achats"], rng.randint(0, 4))),
            Answer("E3", rng.randint(0, 2)), Answer("H1", rng.randint(0, 2)), Answer("H2", rng.choice(["yes", "no"])),
            Answer("G1", rng.choice(["yes", "no"])), Answer("G2", rng.randint(0, 2))]


def timed(fn) -> float:
    start = time.perf_counter()
    fn()
    return time.perf_counter() - start


def bench_scoring() -> list[tuple]:
    rows = []
    for n in (100, 1_000, 10_000):
        batch = [random_answers() for _ in range(n)]
        t = timed(lambda: [compute(Q, a) for a in batch])
        rows.append(("Calcul de score", f"{n:,} diagnostics".replace(",", " "), t, t / n * 1000))
    return rows


def bench_regulatory(tmp: Path) -> list[tuple]:
    rows = []
    for n in (1_000, 10_000, 50_000):
        engine = get_engine(f"sqlite:///{tmp / f'veille_{n}.sqlite'}")
        create_data_tables(engine)
        themes = ["loi_climat", "csrd", "dechets", "social"]
        texts = [{"id": f"T{i}", "source": "JORF", "nature": "DECRET", "reference": f"N{i}", "title": f"Texte {i}",
                  "authority": "Test", "published_at": date(2026, 10, 13) - timedelta(days=i % 365),
                  "url": f"https://x/{i}", "themes": [rng.choice(themes)], "naf_scope": rng.choice([[], ["F"], ["H"]])}
                 for i in range(n)]
        t_insert = timed(lambda: upsert_texts(engine, texts))
        t_read = timed(lambda: list_texts(engine, theme="social", naf_section="F", since=date(2026, 7, 15)))
        rows.append(("Veille : insertion", f"{n:,} textes".replace(",", " "), t_insert, t_insert / n * 1000))
        rows.append(("Veille : lecture filtrée (US-11)", f"{n:,} textes".replace(",", " "), t_read, t_read * 1000))
    return rows


def bench_indicators(tmp: Path) -> list[tuple]:
    rows = []
    for n_orgs in (10, 100, 1_000):
        engine = get_engine(f"sqlite:///{tmp / f'app_{n_orgs}.sqlite'}")
        create_data_tables(engine, include_app=True)
        now = datetime(2026, 10, 13, tzinfo=timezone.utc)
        with engine.begin() as c:
            c.execute(organization.insert(), [{"id": f"o{i}", "name": f"Org {i}"} for i in range(n_orgs)])
            c.execute(membership.insert(), [{"organization_id": f"o{i}", "user_id": f"u{i}_{j}", "role": "user"}
                                            for i in range(n_orgs) for j in range(20)])
            c.execute(diagnostic.insert(), [{"id": f"d{i}", "organization_id": f"o{i}", "questionnaire_version": "exemple-1",
                                             "status": "validated", "validated_at": now} for i in range(n_orgs)])
            c.execute(score.insert(), [{"diagnostic_id": f"d{i}", "scope": "global", "key": "global",
                                        "value": rng.uniform(0, 100), "algo_version": "1.0.0"} for i in range(n_orgs)])
            c.execute(action.insert(), [{"id": f"a{i}_{j}", "organization_id": f"o{i}", "status": rng.choice(["todo", "done"]),
                                         "due_date": date(2026, 10, 1) + timedelta(days=j), "created_at": now}
                                        for i in range(n_orgs) for j in range(50)])
            c.execute(enrollment.insert(), [{"user_id": f"u{i}_{j}", "module_id": "m1", "organization_id": f"o{i}",
                                             "progress": 1.0, "quiz_score": 70.0, "completed_at": now}
                                            for i in range(n_orgs) for j in range(20)])
        sample = [f"o{rng.randrange(n_orgs)}" for _ in range(50)]
        t = timed(lambda: [organization_indicators(engine, o, today=date(2026, 10, 13)) for o in sample])
        rows.append(("Indicateurs d'une organisation", f"{n_orgs:,}".replace(",", " ") + " organisations (50 actions et 20 salariés chacune)",
                     t, t / len(sample) * 1000))
    return rows


def main() -> None:
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as d:  # SQLite garde un verrou sous Windows
        tmp = Path(d)
        rows = bench_scoring() + bench_regulatory(tmp) + bench_indicators(tmp)
    lines = ["# Banc de montée en charge du service data", "",
             f"Mesuré le {date.today().isoformat()} sur le poste de développement (SQLite, Python 3.11). "
             "Données synthétiques. À remesurer sur le VPS (PostgreSQL).", "",
             "| Traitement | Volume | Temps total (s) | Temps unitaire (ms) |", "|---|---|---|---|"]
    lines += [f"| {a} | {b} | {t:.3f} | {u:.3f} |" for a, b, t, u in rows]
    out = ROOT.parent / "docs" / "bench-resultats.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
