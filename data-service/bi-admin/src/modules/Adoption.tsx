import { adoptionMetrics } from '../core/metrics/adoption';
import { BarSeries, Card, DataDetails, Empty, Grid, Kpi, KpiRow } from '../ui/components';
import { formatDate, formatDateYear, formatNumber, formatPercent } from '../ui/format';
import type { ModuleProps } from './types';

export function Adoption({ data, config, now }: ModuleProps) {
  const m = adoptionMetrics(data, config, now);
  const t = config.thresholds;
  const maxUsage = Math.max(1, ...m.featureUsage.map((f) => f.sessions));

  return (
    <>
      <p className="definitions">
        <strong>Actif</strong> : a ouvert l’app sur la période (une session au plus toutes les 30 minutes).{' '}
        <strong>Engagement répété</strong> : venu au moins {t.repeatEngagementMinDays} jours différents sur {t.repeatEngagementWindowDays} jours.{' '}
        <strong>Compte fantôme</strong> : inscrit depuis plus de {t.ghostAfterDays} jours, sans utilisation du produit, ou sans connexion depuis {t.ghostAfterDays} jours.
      </p>

      <KpiRow>
        <Kpi label="Comptes" value={formatNumber(m.total)} />
        <Kpi label="Actifs (7 j)" value={formatNumber(m.active7)} hint={`${formatPercent(m.active7 / (m.total || 1))} des comptes`} />
        <Kpi label="Actifs (30 j)" value={formatNumber(m.active30)} hint={`${formatPercent(m.active30 / (m.total || 1))} des comptes`} />
        <Kpi label="Inactifs" value={formatNumber(m.inactive)} hint={`aucune connexion depuis ${t.inactiveDays} jours`} />
        <Kpi label="Nouveaux comptes (30 j)" value={formatNumber(m.new30)} />
        <Kpi label="Engagement répété" value={formatPercent(m.repeatEngagement)} hint={`${m.repeatEngagementCount} sur ${m.visitorsInWindow} comptes venus en ${t.repeatEngagementWindowDays} j`} />
      </KpiRow>

      <Grid>
        <Card title="Utilisateurs actifs par jour (30 jours)" subtitle="Comptes distincts ouvrant l’app chaque jour.">
          <BarSeries data={m.dailyActive} valueLabel="Comptes actifs" />
        </Card>

        <Card title="Entonnoir d’adoption" subtitle="Chaque étape compte les comptes ayant aussi franchi les précédentes.">
          <ol className="funnel">
            {m.funnel.map((s, i) => (
              <li key={s.id}>
                <div className="share-head">
                  <span>{i + 1}. {s.label}</span>
                  <span className="mono">
                    {formatNumber(s.count)} · {formatPercent(s.share)}
                    {i > 0 && <span className="muted"> (−{formatPercent(s.dropFromPrevious)})</span>}
                  </span>
                </div>
                <div className="bar-track"><div className="bar-fill accent" style={{ width: `${s.share * 100}%` }} /></div>
              </li>
            ))}
          </ol>
          <DataDetails
            headers={['Étape', 'Comptes', '% des inscrits', 'Perte vs étape précédente']}
            rows={m.funnel.map((s) => [s.label, s.count, formatPercent(s.share), formatPercent(s.dropFromPrevious)])}
          />
        </Card>
      </Grid>

      <Grid>
        <Card title="Fonctionnalités utilisées" subtitle={`Comptes ayant ouvert chaque page et nombre de sessions (${config.windows.activityDays} j).`}>
          {m.featureUsage.length ? (
            <ul className="share-list">
              {m.featureUsage.map((f) => (
                <li key={f.page}>
                  <div className="share-head">
                    <span>{f.label}</span>
                    <span className="mono">{formatNumber(f.users)} comptes · {formatNumber(f.sessions)} sessions</span>
                  </div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${(f.sessions / maxUsage) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <Empty />}
        </Card>

        <Card title="Utilisateurs les plus actifs">
          {m.topUsers.length ? (
            <table className="table">
              <thead>
                <tr><th>Nom</th><th>Sessions ({config.windows.activityDays} j)</th><th>Actions</th><th>Dernière connexion</th></tr>
              </thead>
              <tbody>
                {m.topUsers.map((u) => (
                  <tr key={u.user.id}>
                    <td><strong>{u.user.name}</strong></td>
                    <td className="mono">{formatNumber(u.sessions)}</td>
                    <td className="mono">{formatNumber(u.actions)}</td>
                    <td className="mono">{formatDate(u.lastSessionAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty />}
        </Card>
      </Grid>

      <Card title={`Comptes fantômes (${m.ghosts.length})`} subtitle="Utile pour relancer ces personnes ou comprendre où elles décrochent.">
        {m.ghosts.length ? (
          <table className="table">
            <thead>
              <tr><th>Nom</th><th>Email</th><th>Créé le</th><th>Dernière connexion</th><th>Raison</th></tr>
            </thead>
            <tbody>
              {m.ghosts.map((g) => (
                <tr key={g.user.id}>
                  <td>{g.user.name}</td>
                  <td>{g.user.email}</td>
                  <td className="mono">{formatDateYear(g.user.createdAt)}</td>
                  <td className="mono">{formatDateYear(g.lastSessionAt)}</td>
                  <td>{g.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>Aucun compte fantôme.</Empty>}
      </Card>
    </>
  );
}
