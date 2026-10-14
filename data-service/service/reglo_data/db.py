"""Tables lues ou écrites par le service data (SQLAlchemy Core).

Miroir du modèle de données partagé (data-service/docs/05-modele-de-donnees.md, sql/001_schemas_postgres.sql).
- schéma `app`     : propriété de l'API Symfony (Doctrine) ; le service data le LIT seulement ;
- schéma `veille`  : propriété du service data (textes réglementaires) ;
- schéma `analytics` : propriété du service data (événements produit).

En production (PostgreSQL), les tables sont qualifiées par leur schéma. En test (SQLite), les schémas
sont neutralisés via `schema_translate_map`.
"""

from __future__ import annotations

import os

from sqlalchemy import (JSON, Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, MetaData, String, Table,
                        Text, create_engine)
from sqlalchemy.engine import Engine

metadata = MetaData()

# ── Schéma app (lecture seule pour le service data) ──
organization = Table(
    "organization", metadata,
    Column("id", String(36), primary_key=True),
    Column("name", String(255), nullable=False),
    Column("naf_code", String(6)),
    Column("size_band", String(20)),
    schema="app",
)
diagnostic = Table(
    "diagnostic", metadata,
    Column("id", String(36), primary_key=True),
    Column("organization_id", String(36), ForeignKey("app.organization.id"), nullable=False),
    Column("questionnaire_version", String(50), nullable=False),
    Column("status", String(20), nullable=False),          # draft | validated
    Column("started_at", DateTime(timezone=True)),
    Column("validated_at", DateTime(timezone=True)),
    schema="app",
)
score = Table(
    "score", metadata,
    Column("diagnostic_id", String(36), ForeignKey("app.diagnostic.id"), primary_key=True),
    Column("scope", String(20), primary_key=True),         # global | pillar | theme
    Column("key", String(50), primary_key=True),            # ex. « social », « dechets », « global »
    Column("value", Float),
    Column("algo_version", String(20), nullable=False),
    Column("computed_at", DateTime(timezone=True)),
    schema="app",
)
action = Table(
    "action", metadata,
    Column("id", String(36), primary_key=True),
    Column("organization_id", String(36), ForeignKey("app.organization.id"), nullable=False),
    Column("pillar", String(50)),
    Column("owner_id", String(36)),
    Column("due_date", Date),
    Column("status", String(20), nullable=False),          # todo | in_progress | in_review | done
    Column("created_at", DateTime(timezone=True)),
    schema="app",
)
document = Table(
    "document", metadata,
    Column("id", String(36), primary_key=True),
    Column("organization_id", String(36), ForeignKey("app.organization.id"), nullable=False),
    Column("mime", String(100)),
    Column("size_bytes", Integer),
    Column("uploaded_at", DateTime(timezone=True)),
    schema="app",
)
membership = Table(
    "membership", metadata,
    Column("organization_id", String(36), ForeignKey("app.organization.id"), primary_key=True),
    Column("user_id", String(36), primary_key=True),
    Column("role", String(20), nullable=False),
    schema="app",
)
enrollment = Table(
    "enrollment", metadata,
    Column("user_id", String(36), primary_key=True),
    Column("module_id", String(36), primary_key=True),
    Column("organization_id", String(36), ForeignKey("app.organization.id"), nullable=False),
    Column("progress", Float, nullable=False),              # 0 à 1
    Column("quiz_score", Float),                            # 0 à 100
    Column("completed_at", DateTime(timezone=True)),
    schema="app",
)
certificate = Table(
    "certificate", metadata,
    Column("id", String(36), primary_key=True),
    Column("organization_id", String(36), ForeignKey("app.organization.id"), nullable=False),
    Column("user_id", String(36), nullable=False),
    Column("verification_code", String(32), nullable=False, unique=True),
    Column("issued_at", DateTime(timezone=True)),
    schema="app",
)
regulatory_alert = Table(
    "regulatory_alert", metadata,
    Column("organization_id", String(36), ForeignKey("app.organization.id"), primary_key=True),
    Column("text_id", String(64), primary_key=True),
    Column("read_at", DateTime(timezone=True)),
    schema="app",
)

# ── Schéma veille (propriété du service data) ──
regulatory_text = Table(
    "regulatory_text", metadata,
    Column("id", String(64), primary_key=True),             # ex. JORFTEXT000054977578, celex-32026R2241
    Column("source", String(20), nullable=False),            # JORF | EUR-Lex
    Column("nature", String(40)),                            # DECRET, ARRETE, Règlement…
    Column("reference", String(80)),                         # NOR, numéro CELEX
    Column("title", Text, nullable=False),
    Column("authority", String(255)),                        # ministère / institution
    Column("published_at", Date, nullable=False),
    Column("url", String(500), nullable=False),
    Column("themes", JSON, nullable=False),                  # ["loi_climat", "dechets", …]
    Column("naf_scope", JSON, nullable=False),               # [] = tous secteurs
    Column("collected_at", DateTime(timezone=True), nullable=False),
    schema="veille",
)
collection_run = Table(
    "collection_run", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("source", String(20), nullable=False),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("finished_at", DateTime(timezone=True)),
    Column("ok", Boolean),
    Column("read", Integer),
    Column("kept", Integer),
    Column("excluded_personal", Integer),
    Column("error", Text),
    schema="veille",
)

# ── Schéma analytics (événements produit, contrat data-service/docs/07) ──
event = Table(
    "event", metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(60), nullable=False),
    Column("occurred_at", DateTime(timezone=True), nullable=False),
    Column("organization_id", String(36)),
    Column("user_id", String(36)),
    Column("session_id", String(36)),
    Column("properties", JSON),
    schema="analytics",
)

APP_TABLES = [organization, membership, diagnostic, score, action, document, enrollment, certificate, regulatory_alert]
DATA_TABLES = [regulatory_text, collection_run, event]

DEFAULT_URL = "sqlite:///data/reglo_data.sqlite"


def get_engine(url: str | None = None) -> Engine:
    """Moteur SQLAlchemy. Sous SQLite (développement, tests), les schémas sont neutralisés."""
    url = url or os.environ.get("DATABASE_URL", DEFAULT_URL)
    if url.startswith("sqlite:///") and not url.startswith("sqlite:///:memory:"):
        os.makedirs(os.path.dirname(url.removeprefix("sqlite:///")) or ".", exist_ok=True)
    engine = create_engine(url, future=True)
    if engine.dialect.name == "sqlite":
        engine = engine.execution_options(schema_translate_map={"app": None, "veille": None, "analytics": None})
    return engine


def create_data_tables(engine: Engine, include_app: bool = False) -> None:
    """Crée les tables du service data (et, en test ou démo, les tables app en lecture)."""
    tables = DATA_TABLES + (APP_TABLES if include_app else [])
    metadata.create_all(engine, tables=tables)
