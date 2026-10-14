import { describe, expect, it } from 'vitest';
import { regloConfig } from '../../config/reglo.config';
import { generateDataset } from '../../datasources/mock/generator';
import type { Dataset } from '../contract';
import { adoptionMetrics, funnel, ghostAccounts } from './adoption';
import { attentionPoints } from './attention';
import { dailyCounts, DAY, percentile } from './common';
import { connectionsMetrics } from './connections';
import { contentMetrics } from './content';
import { unansweredFeedback } from './feedback';
import { groupErrors, healthMetrics } from './health';
import { userRows, usersToCsv } from './users';

const NOW = new Date('2026-10-12T12:00:00Z');
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();

/** Petit jeu de données maîtrisé : chaque attendu se vérifie à la main. */
function fixture(): Dataset {
  return {
    generatedAt: NOW.toISOString(),
    users: [
      { id: 'a', name: 'Alice', email: 'alice@test', role: 'admin', suspended: false, createdAt: ago(200) },
      { id: 'b', name: 'Bob', email: 'bob@test', role: 'user', suspended: false, createdAt: ago(100) },
      { id: 'c', name: 'Chloé', email: 'chloe@test', role: 'user', suspended: false, createdAt: ago(10) },
      { id: 'd', name: 'David', email: 'david@test', role: 'user', suspended: true, createdAt: ago(120) },
    ],
    companies: [],
    sessions: [
      { id: 's1', userId: 'a', startedAt: ago(1), version: 'v2', browser: 'Chrome', device: 'desktop', loadTimeMs: 300, location: { lat: 47.47, lng: -0.56 } },
      { id: 's2', userId: 'a', startedAt: ago(3), version: 'v2', browser: 'Chrome', device: 'desktop', loadTimeMs: 500, location: null },
      { id: 's3', userId: 'b', startedAt: ago(95), version: 'v1', browser: 'Firefox', device: 'mobile', loadTimeMs: 900 },
      { id: 's4', userId: 'c', startedAt: ago(9.5), version: 'v2', browser: 'Edge', device: 'mobile', loadTimeMs: 400 },
    ],
    pageViews: [
      { sessionId: 's1', userId: 'a', page: 'home', at: ago(1) },
      { sessionId: 's4', userId: 'c', page: 'watch', at: ago(9.5) },
    ],
    errors: [
      { id: 'e1', message: 'Boom', type: 'exception', page: 'home', version: 'v2', browser: 'Chrome', userId: 'a', sessionId: 's1', at: ago(0.5) },
      { id: 'e2', message: 'Boom', type: 'exception', page: 'home', version: 'v2', browser: 'Chrome', userId: 'a', sessionId: 's1', at: ago(0.2) },
      { id: 'e3', message: 'Upload', type: 'promesse', page: 'documents', version: 'v2', browser: 'Edge', userId: 'c', sessionId: 's4', at: ago(9) },
    ],
    feedback: [
      { id: 'f1', userId: 'b', category: 'bug', title: 'Vieux bug', status: 'open', createdAt: ago(10) },
      { id: 'f2', userId: 'c', category: 'feature', title: 'Récent', status: 'open', createdAt: ago(2) },
      { id: 'f3', userId: 'b', category: 'bug', title: 'Répondu', status: 'in_progress', createdAt: ago(20), answeredAt: ago(19) },
    ],
    documents: [
      { id: 'd1', userId: 'a', sizeBytes: 1000, type: 'DUERP', createdAt: ago(50) },
      { id: 'd2', userId: 'a', sizeBytes: 3000, type: 'DUERP', createdAt: ago(40), deletedAt: ago(5) },
    ],
    releases: [],
    businessEvents: [
      { userId: 'a', type: 'company_profile_completed', at: ago(199) },
      { userId: 'a', type: 'training_started', at: ago(150) },
      { userId: 'c', type: 'company_profile_completed', at: ago(9) },
    ],
  };
}

describe('outils communs', () => {
  it('calcule les centiles par interpolation', () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(percentile([10, 20, 30], 100)).toBe(30);
  });

  it('produit une série quotidienne complète, jours vides compris', () => {
    const series = dailyCounts([ago(0.1), ago(0.2), ago(2)], NOW, 7);
    expect(series).toHaveLength(7);
    expect(series.reduce((s, p) => s + p.value, 0)).toBe(3);
  });
});

describe('santé du système', () => {
  const m = healthMetrics(fixture(), NOW, 30);

  it('compte les erreurs par fenêtre', () => {
    expect(m.errors24h).toBe(2);
    expect(m.errors7d).toBe(2);
    expect(m.errorsWindow).toBe(3);
    expect(m.distinctErrorsWindow).toBe(2);
  });

  it('calcule la part de sessions avec erreur sur 7 jours', () => {
    expect(m.sessions7d).toBe(2);
    expect(m.errorSessionRate).toBe(0.5);
  });

  it('regroupe les erreurs par message avec occurrences et comptes touchés', () => {
    const [first] = groupErrors(fixture().errors);
    expect(first).toMatchObject({ message: 'Boom', occurrences: 2, users: 1 });
  });
});

describe('adoption', () => {
  it('franchit les étapes de l’entonnoir de façon cumulative', () => {
    const steps = funnel(fixture(), regloConfig.funnel);
    expect(steps.map((s) => s.count)).toEqual([4, 2, 1, 0, 0, 0]);
    expect(steps[1].dropFromPrevious).toBe(0.5);
  });

  it('détecte les comptes fantômes', () => {
    const ghosts = ghostAccounts(fixture(), regloConfig, NOW).map((g) => g.user.id);
    // Bob : inscrit il y a 100 j, aucune utilisation, dernière session il y a 95 j.
    // David : inscrit il y a 120 j, jamais connecté. Alice : active. Chloé : trop récente.
    expect(ghosts.sort()).toEqual(['b', 'd']);
  });

  it('calcule actifs, inactifs et engagement répété', () => {
    const m = adoptionMetrics(fixture(), regloConfig, NOW);
    expect(m.active7).toBe(1);
    expect(m.active30).toBe(2);
    expect(m.inactive).toBe(2);
    expect(m.new30).toBe(1);
    expect(m.repeatEngagement).toBe(0.5);
  });
});

describe('contenu', () => {
  it('ignore les documents supprimés', () => {
    const m = contentMetrics(fixture(), regloConfig, NOW);
    expect(m.documents).toBe(1);
    expect(m.totalBytes).toBe(1000);
    expect(m.documentErrors).toBe(1);
    expect(m.buckets.find((b) => b.label === '0')?.value).toBe(3);
  });
});

describe('retours', () => {
  it('ne signale que les retours ouverts, sans réponse, plus vieux que le seuil', () => {
    expect(unansweredFeedback(fixture(), NOW, 7).map((f) => f.id)).toEqual(['f1']);
  });
});

describe('connexions', () => {
  it('calcule la part de sessions localisées et la heatmap', () => {
    const m = connectionsMetrics(fixture(), NOW, 30);
    expect(m.sessions).toBe(3);
    expect(m.localizedShare).toBeCloseTo(1 / 3);
    expect(m.heatmap.flat().reduce((s, v) => s + v, 0)).toBe(3);
    expect(m.clusters).toEqual([{ lat: 47.5, lng: -0.6, count: 1 }]);
  });
});

describe('utilisateurs', () => {
  it('attribue le bon statut à chaque compte', () => {
    const rows = userRows(fixture(), regloConfig, NOW);
    expect(Object.fromEntries(rows.map((r) => [r.user.id, r.status]))).toEqual({
      a: 'active', b: 'inactive', c: 'active', d: 'suspended',
    });
  });

  it('échappe les guillemets dans l’export CSV', () => {
    const ds = fixture();
    ds.users[1].name = 'Bob "le testeur"';
    expect(usersToCsv(userRows(ds, regloConfig, NOW), regloConfig)).toContain('"Bob ""le testeur"""');
  });
});

describe('points d’attention', () => {
  it('trie les alertes de la plus urgente à la moins urgente', () => {
    const ids = attentionPoints(fixture(), regloConfig, NOW).map((p) => p.id);
    expect(ids).toEqual(['errors', 'feedback', 'ghosts']);
  });
});

describe('générateur de données fictives', () => {
  it('est déterministe et respecte le contrat', () => {
    const a = generateDataset({ seed: 1, now: NOW });
    const b = generateDataset({ seed: 1, now: NOW });
    expect(a).toEqual(b);
    const userIds = new Set(a.users.map((u) => u.id));
    expect(a.sessions.every((s) => userIds.has(s.userId))).toBe(true);
    expect(a.sessions.every((s) => Date.parse(s.startedAt) <= NOW.getTime())).toBe(true);
  });
});
