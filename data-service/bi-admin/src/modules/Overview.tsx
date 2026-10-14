import { activeUserIds } from '../core/metrics/adoption';
import { attentionPoints } from '../core/metrics/attention';
import { contentMetrics } from '../core/metrics/content';
import { healthMetrics } from '../core/metrics/health';
import { Kpi, KpiRow } from '../ui/components';
import { formatBytes, formatNumber, formatPercent } from '../ui/format';
import type { ModuleProps } from './types';

const SEVERITY_LABELS = { high: 'URGENT', medium: 'À SURVEILLER', low: 'À SUIVRE' } as const;

export function Overview({ data, config, now, goTo }: ModuleProps) {
  const points = attentionPoints(data, config, now);
  const health = healthMetrics(data, now, config.windows.errorsDays);
  const content = contentMetrics(data, config, now);
  const active7 = activeUserIds(data, now, 7).size;
  const openFeedback = data.feedback.filter((f) => f.status !== 'done').length;

  return (
    <>
      <h2 className="section-title">Points d’attention</h2>
      <p className="section-subtitle">Ce qui mérite d’être regardé en premier, du plus urgent au moins urgent.</p>
      {points.length ? (
        <div className="grid grid-2">
          {points.map((p) => (
            <article key={p.id} className={`card attention ${p.severity}`}>
              <div className="attention-head">
                <h3>⚠ {p.title}</h3>
                <span className="attention-tag">{SEVERITY_LABELS[p.severity]}</span>
              </div>
              <p className="attention-detail">{p.detail}</p>
              <button className="link" onClick={() => goTo(p.action.module)}>{p.action.label} →</button>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">Rien à signaler.</p>
      )}

      <h2 className="section-title">L’essentiel</h2>
      <KpiRow>
        <Kpi label="Actifs (7 jours)" value={formatNumber(active7)} hint={`sur ${formatNumber(data.users.length)} comptes`} />
        <Kpi label="Sessions (7 jours)" value={formatNumber(health.sessions7d)} />
        <Kpi label="Erreurs (7 jours)" value={formatNumber(health.errors7d)} hint={`${health.errors24h} sur 24 h`} tone={health.errors7d ? 'danger' : undefined} />
        <Kpi label="Retours à traiter" value={formatNumber(openFeedback)} tone={openFeedback ? 'danger' : undefined} />
        <Kpi label="Stockage" value={formatBytes(content.totalBytes)} hint={`${formatPercent(content.quotaShare)} du quota`} />
      </KpiRow>
    </>
  );
}
