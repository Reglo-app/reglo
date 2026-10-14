import { healthMetrics } from '../core/metrics/health';
import { BarSeries, Card, Empty, Grid, Kpi, KpiRow, ShareList } from '../ui/components';
import { formatDateTime, formatMs, formatNumber, formatPercent, plural } from '../ui/format';
import type { ModuleProps } from './types';

export function Health({ data, config, now }: ModuleProps) {
  const days = config.windows.errorsDays;
  const m = healthMetrics(data, now, days);

  return (
    <>
      <KpiRow>
        <Kpi label="Erreurs (24 h)" value={formatNumber(m.errors24h)} tone={m.errors24h ? 'danger' : undefined} />
        <Kpi label="Erreurs (7 jours)" value={formatNumber(m.errors7d)} />
        <Kpi label="Erreurs par session" value={formatPercent(m.errorSessionRate)} hint={`${plural(m.sessions7d, 'session')} sur 7 jours`} tone={m.errorSessionRate > 0.05 ? 'danger' : undefined} />
        <Kpi label="Chargement médian" value={formatMs(m.loadMedianMs)} hint="ouverture de l’app, 7 jours" />
        <Kpi label="Chargement p95" value={formatMs(m.loadP95Ms)} hint="95 % des ouvertures plus rapides" />
      </KpiRow>

      <Card title={`Erreurs par jour (${days} jours)`} subtitle={`${plural(m.errorsWindow, 'erreur')} remontée${m.errorsWindow > 1 ? 's' : ''} sur ${days} jours, ${plural(m.distinctErrorsWindow, 'distincte')}.`}>
        <BarSeries data={m.errorsPerDay} valueLabel="Erreurs" color="var(--chart-muted)" />
      </Card>

      <Grid cols={3}>
        <Card title="Versions en circulation (7 j)"><ShareList items={m.versions} /></Card>
        <Card title="Navigateurs"><ShareList items={m.browsers} /></Card>
        <Card title="Appareils"><ShareList items={m.devices} /></Card>
      </Grid>

      <Card title="Dernières erreurs">
        {m.latestErrors.length ? (
          <ul className="error-list">
            {m.latestErrors.slice(0, 10).map((e) => (
              <li key={e.message}>
                <div className="error-head">
                  <strong>{e.message}</strong>
                  <span className="mono muted">{formatDateTime(e.lastAt)}</span>
                </div>
                <div className="muted small">
                  {plural(e.occurrences, 'fois', 'fois')} · {plural(e.users, 'compte')} · /{e.page} · {e.browser} · version {e.version} · {e.type}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Aucune erreur sur la période.</Empty>
        )}
      </Card>
    </>
  );
}
