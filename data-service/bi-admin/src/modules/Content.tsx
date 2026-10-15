import { contentMetrics } from '../core/metrics/content';
import { BarSeries, Card, Empty, Grid, Kpi, KpiRow } from '../ui/components';
import { formatBytes, formatNumber, formatPercent, plural } from '../ui/format';
import type { ModuleProps } from './types';

export function Content({ data, config, now }: ModuleProps) {
  const m = contentMetrics(data, config, now);

  return (
    <>
      <KpiRow>
        <Kpi label="Stockage des documents" value={formatBytes(m.totalBytes)} hint={`${formatPercent(m.quotaShare)} du quota (${formatBytes(config.storageQuotaBytes)})`} />
        <Kpi label="Documents stockés" value={formatNumber(m.documents)} hint={`${plural(m.usersWithDocuments, 'compte concerné', 'comptes concernés')}`} />
        <Kpi label="Documents par compte" value={m.documentsPerUser.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} hint="moyenne sur tous les comptes" />
        {m.objects.map((o) => (
          <Kpi key={o.label} label={o.label} value={formatNumber(o.count)} hint={`${o.perUser.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} par compte`} />
        ))}
        <Kpi label={`Erreurs documents (${config.windows.errorsDays} j)`} value={formatNumber(m.documentErrors)} tone={m.documentErrors ? 'danger' : undefined} />
      </KpiRow>

      <Grid>
        <Card title="Comptes par nombre de documents" subtitle={m.buckets.map((b) => `${b.label} : ${b.value}`).join(', ')}>
          <BarSeries data={m.buckets} valueLabel="Comptes" color="var(--chart-alt)" />
        </Card>
        <Card title="Comptes qui stockent le plus">
          {m.topStorers.length ? (
            <table className="table">
              <thead><tr><th>Nom</th><th>Documents</th><th>Taille</th></tr></thead>
              <tbody>
                {m.topStorers.map((s) => (
                  <tr key={s.user!.id}>
                    <td>{s.user!.name}</td>
                    <td className="mono">{formatNumber(s.count)}</td>
                    <td className="mono">{formatBytes(s.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty />}
        </Card>
      </Grid>
      <p className="footnote">Tailles mesurées à l’ajout et à la suppression de chaque document.</p>
    </>
  );
}
