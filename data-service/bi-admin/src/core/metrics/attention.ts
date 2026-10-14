import type { BiConfig, ModuleId } from '../config';
import type { Dataset } from '../contract';
import { inLastDays, ratio } from './common';
import { activeUserIds, ghostAccounts } from './adoption';
import { unansweredFeedback } from './feedback';
import { groupErrors } from './health';

export type Severity = 'high' | 'medium' | 'low';

export interface AttentionPoint {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  action: { label: string; module: ModuleId };
}

const ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Règles « points d'attention » de la vue d'ensemble, de la plus urgente à la moins urgente. */
export function attentionPoints(ds: Dataset, config: BiConfig, now: Date): AttentionPoint[] {
  const t = config.thresholds;
  const points: AttentionPoint[] = [];

  const errors24h = ds.errors.filter((e) => inLastDays(e.at, now, 1));
  if (errors24h.length) {
    points.push({
      id: 'errors',
      severity: errors24h.length >= t.errors24hHigh ? 'high' : 'medium',
      title: `${errors24h.length} erreur${errors24h.length > 1 ? 's' : ''} dans les dernières 24 h`,
      detail: groupErrors(errors24h)[0].message,
      action: { label: 'Voir les erreurs', module: 'health' },
    });
  }

  const unanswered = unansweredFeedback(ds, now, t.feedbackUnansweredDays);
  if (unanswered.length) {
    points.push({
      id: 'feedback',
      severity: 'medium',
      title: `${unanswered.length} retour${unanswered.length > 1 ? 's' : ''} sans réponse depuis plus de ${t.feedbackUnansweredDays} jours`,
      detail: 'Passez-les en revue pour que les utilisateurs soient prévenus.',
      action: { label: 'Traiter les retours', module: 'feedback' },
    });
  }

  const inactiveShare = 1 - ratio(activeUserIds(ds, now, t.inactiveDays).size, ds.users.length);
  if (ds.users.length && inactiveShare > 0.5) {
    points.push({
      id: 'inactive',
      severity: 'low',
      title: `${Math.round(inactiveShare * 100)} % des comptes inactifs depuis ${t.inactiveDays} jours`,
      detail: "Regardez où les utilisateurs décrochent dans l'entonnoir d'adoption.",
      action: { label: "Voir l'adoption", module: 'adoption' },
    });
  }

  const ghosts = ghostAccounts(ds, config, now);
  if (ghosts.length) {
    points.push({
      id: 'ghosts',
      severity: 'low',
      title: `${ghosts.length} compte${ghosts.length > 1 ? 's' : ''} fantôme${ghosts.length > 1 ? 's' : ''}`,
      detail: `Inscrits depuis plus de ${t.ghostAfterDays} jours sans usage réel ou sans connexion récente.`,
      action: { label: 'Voir les comptes', module: 'adoption' },
    });
  }

  return points.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
