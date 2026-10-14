import type { Dataset } from '../../core/contract';
import type { DataSource } from '../../core/datasource';

/**
 * Source HTTP : point de branchement pour l'API Reglo (à implémenter côté DFS).
 *
 * Routes attendues (préfixe `baseUrl`, ex. /api/admin/bi) :
 *   GET    /dataset                    → Dataset (contrat core/contract.ts)
 *   POST   /users/:id/suspension       { suspended: boolean }
 *   POST   /feedback/:id/status        { status }
 *   POST   /releases                   Release
 *   DELETE /releases/:version
 * Toutes réservées au rôle admin (contrôle côté serveur).
 */
export function createHttpDataSource(baseUrl: string): DataSource {
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) throw new Error(`BI API ${init?.method ?? 'GET'} ${path} : ${res.status}`);
    return res;
  };
  const post = (path: string, body: unknown) => call(path, { method: 'POST', body: JSON.stringify(body) });

  return {
    async load() {
      return (await (await call('/dataset')).json()) as Dataset;
    },
    actions: {
      async setUserSuspended(userId, suspended) {
        await post(`/users/${encodeURIComponent(userId)}/suspension`, { suspended });
      },
      async setFeedbackStatus(feedbackId, status) {
        await post(`/feedback/${encodeURIComponent(feedbackId)}/status`, { status });
      },
      async publishRelease(release) {
        await post('/releases', release);
      },
      async deleteRelease(version) {
        await call(`/releases/${encodeURIComponent(version)}`, { method: 'DELETE' });
      },
    },
  };
}
