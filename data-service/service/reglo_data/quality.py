"""Contrôles de qualité des données (carte « Qualité des données, tests et dossier individuel »).

Chaque contrôle renvoie : identifiant, description, nombre d'anomalies, statut (ok / alerte / erreur)
et mesure corrective proposée. Exécutable en ligne de commande et exposé par l'API (/quality).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import and_, func, inspect, select
from sqlalchemy.engine import Engine

from .db import action, collection_run, diagnostic, document, enrollment, regulatory_text, score

ALLOWED_MIME = {"application/pdf", "image/png", "image/jpeg", "image/webp", "text/csv",
                "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
MAX_DOC_BYTES = 20 * 1024 * 1024  # US-07


def _check(cid: str, label: str, anomalies: int, fix: str, level: str = "erreur") -> dict:
    return {"id": cid, "label": label, "anomalies": anomalies, "status": "ok" if anomalies == 0 else level,
            "corrective_action": fix if anomalies else None}


def _app_ready(engine: Engine) -> bool:
    """Les tables de la plateforme (schéma app) existent-elles ? Pas encore tant que les devs n'ont pas livré."""
    schema = None if engine.dialect.name == "sqlite" else "app"
    return inspect(engine).has_table("diagnostic", schema=schema)


APP_CHECKS = [("diagnostic_sans_score", "Tout diagnostic validé a un score global"),
              ("score_bornes", "Tous les scores sont entre 0 et 100"),
              ("action_echeance", "Aucune échéance antérieure à la création (US-05)"),
              ("document_format", "Formats autorisés et taille ≤ 20 Mo (US-07)"),
              ("formation_bornes", "Progression entre 0 et 1, score de quiz entre 0 et 100")]


def run_checks(engine: Engine, today: date | None = None, freshness_days: int = 4) -> list[dict]:
    today = today or date.today()
    checks = []
    app_ready = _app_ready(engine)
    with engine.connect() as conn:
        # ── Veille réglementaire ──
        latest = conn.execute(select(func.max(regulatory_text.c.published_at))).scalar()
        stale = latest is None or latest < today - timedelta(days=freshness_days)
        checks.append(_check("veille_fraicheur", f"Texte le plus récent publié il y a moins de {freshness_days} jours",
                             int(stale), "Vérifier la dernière collecte (journal collection_run) et relancer.", "alerte"))
        dup = conn.execute(select(func.count()).select_from(
            select(regulatory_text.c.reference).where(regulatory_text.c.reference != "")
            .group_by(regulatory_text.c.source, regulatory_text.c.reference).having(func.count() > 1).subquery())).scalar()
        checks.append(_check("veille_doublons", "Aucune référence (NOR / CELEX) en double", dup or 0,
                             "Dédoublonner par référence en gardant la version la plus récente."))
        no_theme = sum(1 for (t,) in conn.execute(select(regulatory_text.c.themes)) if not t)
        checks.append(_check("veille_themes", "Chaque texte a au moins un thème client", no_theme,
                             "Revoir la taxonomie (taxonomy.py) ou exclure ces textes."))
        failed = conn.execute(select(func.count()).select_from(collection_run).where(and_(
            collection_run.c.ok.is_(False), collection_run.c.started_at >= datetime.now(timezone.utc) - timedelta(days=7)))).scalar()
        checks.append(_check("veille_collectes", "Aucune collecte en échec sur 7 jours", failed or 0,
                             "Consulter l'erreur dans collection_run ; la source a pu changer de format.", "alerte"))

        if not app_ready:
            # Plateforme pas encore déployée : contrôles prêts, exécutés dès que le schéma app existe.
            checks += [{"id": cid, "label": label, "anomalies": None, "status": "non applicable",
                        "corrective_action": "Tables de la plateforme absentes (en attente de la v0.1)."}
                       for cid, label in APP_CHECKS]
            return checks

        # ── Diagnostic et scores ──
        unscored = conn.execute(select(func.count()).select_from(diagnostic).where(and_(
            diagnostic.c.status == "validated",
            ~diagnostic.c.id.in_(select(score.c.diagnostic_id).where(score.c.scope == "global"))))).scalar()
        checks.append(_check("diagnostic_sans_score", "Tout diagnostic validé a un score global", unscored or 0,
                             "Relancer le calcul (POST /scores) pour ces diagnostics."))
        out_of_range = conn.execute(select(func.count()).select_from(score).where(
            (score.c.value < 0) | (score.c.value > 100))).scalar()
        checks.append(_check("score_bornes", "Tous les scores sont entre 0 et 100", out_of_range or 0,
                             "Vérifier la version de l'algorithme et recalculer."))

        # ── Plan d'actions, documents, formations ──
        bad_due = conn.execute(select(func.count()).select_from(action).where(and_(
            action.c.due_date.is_not(None), action.c.created_at.is_not(None),
            action.c.due_date < func.date(action.c.created_at)))).scalar()
        checks.append(_check("action_echeance", "Aucune échéance antérieure à la création (US-05)", bad_due or 0,
                             "Contrôle à ajouter côté API ; corriger les échéances existantes.", "alerte"))
        docs = conn.execute(select(document.c.mime, document.c.size_bytes)).all()
        bad_docs = sum(1 for d in docs if d.mime not in ALLOWED_MIME or (d.size_bytes or 0) > MAX_DOC_BYTES)
        checks.append(_check("document_format", "Formats autorisés et taille ≤ 20 Mo (US-07)", bad_docs,
                             "Contrôle à renforcer à l'upload ; isoler les fichiers non conformes."))
        bad_progress = conn.execute(select(func.count()).select_from(enrollment).where(
            (enrollment.c.progress < 0) | (enrollment.c.progress > 1) |
            (enrollment.c.quiz_score < 0) | (enrollment.c.quiz_score > 100))).scalar()
        checks.append(_check("formation_bornes", "Progression entre 0 et 1, score de quiz entre 0 et 100",
                             bad_progress or 0, "Corriger le calcul de progression côté plateforme."))
    return checks


def summary(checks: list[dict]) -> dict:
    return {"checks": len(checks), "ok": sum(c["status"] == "ok" for c in checks),
            "alertes": sum(c["status"] == "alerte" for c in checks),
            "erreurs": sum(c["status"] == "erreur" for c in checks),
            "non_applicables": sum(c["status"] == "non applicable" for c in checks)}
