import { useMemo, useState } from 'react';
import { STATUS_LABELS, userRows, usersToCsv, type UserRow, type UserStatus } from '../core/metrics/users';
import { Badge, Card, Empty } from '../ui/components';
import { formatBytes, formatDateYear, formatNumber } from '../ui/format';
import type { ModuleProps } from './types';

type Sort = 'lastSession' | 'connections' | 'name' | 'created';

const STATUS_TONES: Record<UserStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success', inactive: 'warning', never: 'neutral', suspended: 'danger',
};

const SORTERS: Record<Sort, (a: UserRow, b: UserRow) => number> = {
  lastSession: (a, b) => (b.lastSessionAt ?? 0) - (a.lastSessionAt ?? 0),
  connections: (a, b) => b.connections - a.connections,
  name: (a, b) => a.user.name.localeCompare(b.user.name, 'fr'),
  created: (a, b) => Date.parse(b.user.createdAt) - Date.parse(a.user.createdAt),
};

export function Users({ data, config, now, actions, reload }: ModuleProps) {
  const rows = useMemo(() => userRows(data, config, now), [data, config, now]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [sort, setSort] = useState<Sort>('lastSession');

  const q = query.trim().toLowerCase();
  const visible = rows
    .filter((r) => status === 'all' || r.status === status)
    .filter((r) => !q || r.user.name.toLowerCase().includes(q) || r.user.email.toLowerCase().includes(q))
    .sort(SORTERS[sort]);
  const online = rows.filter((r) => r.online).length;

  const exportCsv = () => {
    const blob = new Blob(['﻿' + usersToCsv(visible, config)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs-${now.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSuspended = async (r: UserRow) => {
    const suspend = !r.user.suspended;
    if (suspend && !window.confirm(`Suspendre le compte de ${r.user.name} ?`)) return;
    await actions.setUserSuspended(r.user.id, suspend);
    await reload();
  };

  return (
    <Card>
      <div className="toolbar">
        <input type="search" placeholder="Nom ou email" aria-label="Rechercher un utilisateur" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="toolbar-actions">
          <label>Statut{' '}
            <select value={status} onChange={(e) => setStatus(e.target.value as UserStatus | 'all')}>
              <option value="all">Tous ({rows.length})</option>
              {(Object.keys(STATUS_LABELS) as UserStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]} ({rows.filter((r) => r.status === s).length})</option>
              ))}
            </select>
          </label>
          <label>Trier par{' '}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="lastSession">Dernière connexion</option>
              <option value="connections">Connexions</option>
              <option value="name">Nom</option>
              <option value="created">Date d’inscription</option>
            </select>
          </label>
        </div>
      </div>

      <div className="toolbar">
        <span className="small">
          <Badge tone="success">● {online} en ligne (moins de {config.thresholds.onlineMinutes} min)</Badge>{' '}
          <span className="muted">{rows.length} comptes · inactif = aucune connexion depuis {config.thresholds.inactiveDays} jours</span>
        </span>
        <button className="button" onClick={exportCsv}>⭳ Exporter en CSV</button>
      </div>

      {visible.length ? (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th><th>Email</th><th>Entreprise</th><th>Rôle</th><th>Statut</th><th>Créé le</th>
                <th>Dernière connexion</th><th>Connexions</th>
                {config.trackedObjects.map((o) => <th key={o.label}>{o.label}</th>)}
                <th>Documents</th><th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.user.id}>
                  <td><strong>{r.online && <span className="online-dot" aria-label="en ligne" />}{r.user.name}</strong></td>
                  <td>{r.user.email}</td>
                  <td>{r.companyName ?? '—'}</td>
                  <td>{r.user.role === 'admin' ? <Badge tone="accent">Admin</Badge> : 'Utilisateur'}</td>
                  <td><Badge tone={STATUS_TONES[r.status]}>{STATUS_LABELS[r.status]}</Badge></td>
                  <td className="mono">{formatDateYear(r.user.createdAt)}</td>
                  <td className="mono">{formatDateYear(r.lastSessionAt)}</td>
                  <td className="mono">{formatNumber(r.connections)}</td>
                  {r.objects.map((n, i) => <td key={i} className="mono">{formatNumber(n)}</td>)}
                  <td className="mono">{formatNumber(r.documents)} ({formatBytes(r.documentBytes)})</td>
                  <td>
                    {r.user.role !== 'admin' && (
                      <button className="link danger" onClick={() => toggleSuspended(r)}>
                        {r.user.suspended ? 'Réactiver' : '⊘ Suspendre'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty>Aucun utilisateur ne correspond.</Empty>}
    </Card>
  );
}
