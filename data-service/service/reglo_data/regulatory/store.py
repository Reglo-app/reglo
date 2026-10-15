"""Enregistrement et lecture des textes réglementaires (schéma veille)."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.engine import Engine

from ..db import collection_run, regulatory_text


BATCH = 500  # par lots : SQLite limite le nombre de paramètres par requête (défaut révélé par bench.py)
FIELDS = ("id", "source", "nature", "reference", "title", "authority", "published_at", "url", "themes", "naf_scope")


def upsert_texts(engine: Engine, texts: list[dict]) -> int:
    """Insère les nouveaux textes, met à jour les existants. Renvoie le nombre de nouveaux textes."""
    now = datetime.now(timezone.utc)
    new = 0
    with engine.begin() as conn:
        for i in range(0, len(texts), BATCH):
            chunk = {t["id"]: {**{k: t.get(k) for k in FIELDS}, "collected_at": now} for t in texts[i:i + BATCH]}
            existing = {r[0] for r in conn.execute(select(regulatory_text.c.id).where(regulatory_text.c.id.in_(list(chunk))))}
            inserts = [row for tid, row in chunk.items() if tid not in existing]
            if inserts:
                conn.execute(regulatory_text.insert(), inserts)
                new += len(inserts)
            for tid in existing:
                conn.execute(regulatory_text.update().where(regulatory_text.c.id == tid).values(**chunk[tid]))
    return new


def log_run(engine: Engine, source: str, started_at: datetime, ok: bool, stats: dict, error: str | None = None) -> None:
    with engine.begin() as conn:
        conn.execute(collection_run.insert().values(
            source=source, started_at=started_at, finished_at=datetime.now(timezone.utc), ok=ok,
            read=stats.get("read"), kept=stats.get("kept"), excluded_personal=stats.get("excluded_personal"),
            error=error))


def list_texts(engine: Engine, theme: str | None = None, naf_section: str | None = None,
               since: date | None = None, limit: int = 50) -> list[dict]:
    """Textes récents (US-11). `naf_section` garde les textes ciblant ce secteur ou tous les secteurs."""
    since = since or date.today() - timedelta(days=90)
    with engine.connect() as conn:
        rows = conn.execute(select(regulatory_text).where(and_(regulatory_text.c.published_at >= since))
                            .order_by(regulatory_text.c.published_at.desc())).mappings().all()
    out = []
    for r in rows:
        if theme and theme not in r["themes"]:
            continue
        if naf_section and r["naf_scope"] and naf_section not in r["naf_scope"]:
            continue
        out.append({**dict(r), "published_at": r["published_at"].isoformat(),
                    "collected_at": r["collected_at"].isoformat() if r["collected_at"] else None})
        if len(out) >= limit:
            break
    return out
