import { useState } from 'react';
import type { FeedbackCategory, FeedbackStatus } from '../core/contract';
import { CATEGORY_LABELS, feedbackMetrics } from '../core/metrics/feedback';
import { BarSeries, Card, Empty, Grid, Kpi, KpiRow } from '../ui/components';
import { formatDate, formatNumber, plural } from '../ui/format';
import type { ModuleProps } from './types';

const STATUS_LABELS: Record<FeedbackStatus, string> = { open: 'Reçu', in_progress: 'En cours', done: 'Traité' };

export function Feedback({ data, config, now, actions, reload }: ModuleProps) {
  const days = config.windows.errorsDays;
  const m = feedbackMetrics(data, now, days);
  const [category, setCategory] = useState<FeedbackCategory | 'all'>('all');
  const [status, setStatus] = useState<'open' | 'all'>('open');
  const users = new Map(data.users.map((u) => [u.id, u.name]));

  const list = m.list.filter(
    (f) => (category === 'all' || f.category === category) && (status === 'all' || f.status !== 'done'),
  );

  const changeStatus = async (id: string, next: FeedbackStatus) => {
    await actions.setFeedbackStatus(id, next);
    await reload();
  };

  return (
    <>
      <KpiRow>
        <Kpi label="Total des retours" value={formatNumber(m.total)} />
        <Kpi label="Bugs signalés" value={formatNumber(m.bugs)} />
        <Kpi label="Demandes de fonctionnalités" value={formatNumber(m.featureRequests)} />
        <Kpi label="À traiter" value={formatNumber(m.open)} hint={`${plural(m.open, 'ouvert')} au total`} tone={m.open ? 'danger' : undefined} />
      </KpiRow>

      <Grid>
        <Card title="Retours par catégorie" subtitle={m.byCategory.map((c) => `${c.label} ${c.value}`).join(', ')}>
          <BarSeries data={m.byCategory} valueLabel="Retours" />
        </Card>
        <Card title={`Soumissions par jour (${days} jours)`} subtitle={`${plural(m.submittedInWindow, 'retour')} sur les ${days} derniers jours.`}>
          <BarSeries data={m.perDay} valueLabel="Retours" />
        </Card>
      </Grid>

      <Card>
        <div className="toolbar">
          <h3 className="card-title">Demandes</h3>
          <div className="toolbar-actions">
            <select aria-label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value as FeedbackCategory | 'all')}>
              <option value="all">Toutes catégories</option>
              {(Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <select aria-label="Statut" value={status} onChange={(e) => setStatus(e.target.value as 'open' | 'all')}>
              <option value="open">Ouvertes</option>
              <option value="all">Toutes</option>
            </select>
          </div>
        </div>
        {list.length ? (
          <table className="table">
            <thead><tr><th>Date</th><th>Catégorie</th><th>Titre</th><th>Auteur</th><th>Statut</th></tr></thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}>
                  <td className="mono">{formatDate(f.createdAt)}</td>
                  <td>{CATEGORY_LABELS[f.category]}</td>
                  <td><strong>{f.title}</strong></td>
                  <td>{users.get(f.userId) ?? '—'}</td>
                  <td>
                    <select aria-label={`Statut de « ${f.title} »`} value={f.status} onChange={(e) => changeStatus(f.id, e.target.value as FeedbackStatus)}>
                      {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty>Aucune demande.</Empty>}
      </Card>
    </>
  );
}
