"""Indicateurs du tableau de bord central d'une organisation (fonctionnalité 6).

Définitions : data-service/docs/07-contrat-evenements-et-indicateurs.md. Toutes les requêtes sont filtrées par
`organization_id` (isolation multi-tenant) ; aucune donnée d'une autre organisation n'est lue.
"""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import and_, func, select
from sqlalchemy.engine import Engine

from .db import action, certificate, diagnostic, document, enrollment, membership, regulatory_alert, score

OPEN_STATUSES = ("todo", "in_progress", "in_review")


def organization_indicators(engine: Engine, organization_id: str, today: date | None = None,
                            due_soon_days: int = 14) -> dict:
    today = today or date.today()
    soon = today + timedelta(days=due_soon_days)
    with engine.connect() as conn:
        # Dernier diagnostic validé et ses scores.
        last_diag = conn.execute(
            select(diagnostic.c.id, diagnostic.c.validated_at)
            .where(and_(diagnostic.c.organization_id == organization_id, diagnostic.c.status == "validated"))
            .order_by(diagnostic.c.validated_at.desc()).limit(1)).first()
        scores = {"global": None, "pillars": {}, "validated_at": None, "algo_version": None, "evolution": None}
        if last_diag:
            rows = conn.execute(select(score).where(score.c.diagnostic_id == last_diag.id)).mappings().all()
            for r in rows:
                if r["scope"] == "global":
                    scores["global"] = r["value"]
                    scores["algo_version"] = r["algo_version"]
                elif r["scope"] == "pillar":
                    scores["pillars"][r["key"]] = r["value"]
            scores["validated_at"] = last_diag.validated_at.isoformat() if last_diag.validated_at else None
            # Évolution par rapport au diagnostic validé précédent (US-10).
            previous = conn.execute(
                select(score.c.value).select_from(score.join(diagnostic, score.c.diagnostic_id == diagnostic.c.id))
                .where(and_(diagnostic.c.organization_id == organization_id, diagnostic.c.status == "validated",
                            diagnostic.c.id != last_diag.id, score.c.scope == "global",
                            diagnostic.c.validated_at < last_diag.validated_at))
                .order_by(diagnostic.c.validated_at.desc()).limit(1)).scalar()
            if previous is not None and scores["global"] is not None:
                scores["evolution"] = round(scores["global"] - previous, 1)

        acts = conn.execute(select(action.c.status, action.c.due_date)
                            .where(action.c.organization_id == organization_id)).all()
        open_acts = [a for a in acts if a.status in OPEN_STATUSES]
        actions = {
            "total": len(acts),
            "by_status": {s: sum(1 for a in acts if a.status == s) for s in (*OPEN_STATUSES, "done")},
            "late": sum(1 for a in open_acts if a.due_date and a.due_date < today),
            "due_soon": sum(1 for a in open_acts if a.due_date and today <= a.due_date <= soon),
            "completion_rate": round(sum(1 for a in acts if a.status == "done") / len(acts), 3) if acts else None,
        }

        members = conn.execute(select(func.count()).select_from(membership)
                               .where(membership.c.organization_id == organization_id)).scalar() or 0
        enr = conn.execute(select(enrollment.c.user_id, enrollment.c.progress, enrollment.c.quiz_score,
                                  enrollment.c.completed_at)
                           .where(enrollment.c.organization_id == organization_id)).all()
        completed = [e for e in enr if e.completed_at is not None]
        quiz = [e.quiz_score for e in completed if e.quiz_score is not None]
        training = {
            "enrollments": len(enr),
            "completed": len(completed),
            "completion_rate": round(len(completed) / len(enr), 3) if enr else None,
            "trained_members_share": round(len({e.user_id for e in completed}) / members, 3) if members else None,
            "average_quiz_score": round(sum(quiz) / len(quiz), 1) if quiz else None,
        }

        certs = conn.execute(select(func.count()).select_from(certificate)
                             .where(certificate.c.organization_id == organization_id)).scalar() or 0
        docs = conn.execute(select(func.count(), func.max(document.c.uploaded_at))
                            .where(document.c.organization_id == organization_id)).first()
        unread = conn.execute(select(func.count()).select_from(regulatory_alert)
                              .where(and_(regulatory_alert.c.organization_id == organization_id,
                                          regulatory_alert.c.read_at.is_(None)))).scalar() or 0

    return {
        "organization_id": organization_id,
        "computed_for": today.isoformat(),
        "score": scores,
        "actions": actions,
        "training": training,
        "certificates": certs,
        "documents": {"count": docs[0] or 0, "last_upload": docs[1].isoformat() if docs[1] else None},
        "regulatory_alerts_unread": unread,
    }
