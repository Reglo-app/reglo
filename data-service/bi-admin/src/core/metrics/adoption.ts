import type { BiConfig, FunnelStep } from '../config';
import type { Dataset, User } from '../contract';
import { DAY, dailySeries, dayKey, inLastDays, ratio, time } from './common';

/** Dernière session de chaque compte (timestamp). */
export function lastSessionByUser(ds: Dataset): Map<string, number> {
  const last = new Map<string, number>();
  for (const s of ds.sessions) {
    const t = time(s.startedAt);
    if (t > (last.get(s.userId) ?? -Infinity)) last.set(s.userId, t);
  }
  return last;
}

export function activeUserIds(ds: Dataset, now: Date, days: number): Set<string> {
  return new Set(ds.sessions.filter((s) => inLastDays(s.startedAt, now, days)).map((s) => s.userId));
}

export interface FunnelResult {
  id: string;
  label: string;
  count: number;
  /** Part des inscrits ayant franchi l'étape. */
  share: number;
  /** Perte par rapport à l'étape précédente (0 à 1). */
  dropFromPrevious: number;
}

function passesStep(step: FunnelStep, user: User, ds: Dataset, eventsByUser: Map<string, Set<string>>): boolean {
  switch (step.kind) {
    case 'signup':
      return true;
    case 'event':
      return eventsByUser.get(user.id)?.has(step.eventType) ?? false;
    case 'returnedAfterDays': {
      const threshold = time(user.createdAt) + step.days * DAY;
      return ds.sessions.some((s) => s.userId === user.id && time(s.startedAt) >= threshold);
    }
  }
}

/** Entonnoir cumulatif : un compte franchit une étape seulement s'il a franchi les précédentes. */
export function funnel(ds: Dataset, steps: FunnelStep[]): FunnelResult[] {
  const eventsByUser = new Map<string, Set<string>>();
  for (const e of ds.businessEvents) {
    const set = eventsByUser.get(e.userId) ?? new Set<string>();
    set.add(e.type);
    eventsByUser.set(e.userId, set);
  }

  let remaining = ds.users;
  const total = ds.users.length;
  const results: FunnelResult[] = [];
  for (const step of steps) {
    const previous = remaining.length;
    remaining = remaining.filter((u) => passesStep(step, u, ds, eventsByUser));
    results.push({
      id: step.id,
      label: step.label,
      count: remaining.length,
      share: ratio(remaining.length, total),
      dropFromPrevious: results.length ? 1 - ratio(remaining.length, previous) : 0,
    });
  }
  return results;
}

export interface GhostAccount {
  user: User;
  lastSessionAt: number | null;
  reason: string;
}

/** Comptes inscrits depuis longtemps sans usage réel ou sans connexion récente. */
export function ghostAccounts(ds: Dataset, config: BiConfig, now: Date): GhostAccount[] {
  const { ghostAfterDays } = config.thresholds;
  const last = lastSessionByUser(ds);
  const core = new Set(config.coreEventTypes);
  const usedProduct = new Set(ds.businessEvents.filter((e) => core.has(e.type)).map((e) => e.userId));
  const limit = now.getTime() - ghostAfterDays * DAY;

  const ghosts: GhostAccount[] = [];
  for (const user of ds.users) {
    if (time(user.createdAt) > limit) continue;
    const lastAt = last.get(user.id) ?? null;
    const reasons: string[] = [];
    if (!usedProduct.has(user.id)) reasons.push('aucune utilisation du produit');
    if (lastAt === null || lastAt < limit) reasons.push(`aucune connexion depuis ${ghostAfterDays} jours`);
    if (reasons.length) ghosts.push({ user, lastSessionAt: lastAt, reason: reasons.join(', ') });
  }
  return ghosts;
}

export function adoptionMetrics(ds: Dataset, config: BiConfig, now: Date) {
  const { inactiveDays, repeatEngagementMinDays, repeatEngagementWindowDays } = config.thresholds;
  const activityDays = config.windows.activityDays;

  const active7 = activeUserIds(ds, now, 7);
  const active30 = activeUserIds(ds, now, 30);
  const activeInactiveWindow = activeUserIds(ds, now, inactiveDays);

  // Engagement répété : parmi les comptes venus sur la fenêtre, part venue au moins N jours distincts.
  const daysByUser = new Map<string, Set<string>>();
  for (const s of ds.sessions) {
    if (!inLastDays(s.startedAt, now, repeatEngagementWindowDays)) continue;
    const set = daysByUser.get(s.userId) ?? new Set<string>();
    set.add(dayKey(new Date(s.startedAt)));
    daysByUser.set(s.userId, set);
  }
  const repeated = [...daysByUser.values()].filter((d) => d.size >= repeatEngagementMinDays).length;

  // Utilisateurs actifs par jour.
  const usersByDay = new Map<string, Set<string>>();
  for (const s of ds.sessions) {
    if (!inLastDays(s.startedAt, now, 30)) continue;
    const key = dayKey(new Date(s.startedAt));
    const set = usersByDay.get(key) ?? new Set<string>();
    set.add(s.userId);
    usersByDay.set(key, set);
  }

  // Fonctionnalités utilisées (pages vues sur la fenêtre d'activité).
  const pages = new Map<string, { users: Set<string>; sessions: Set<string> }>();
  for (const pv of ds.pageViews) {
    if (!inLastDays(pv.at, now, activityDays)) continue;
    const p = pages.get(pv.page) ?? { users: new Set<string>(), sessions: new Set<string>() };
    p.users.add(pv.userId);
    p.sessions.add(pv.sessionId);
    pages.set(pv.page, p);
  }
  const featureUsage = [...pages.entries()]
    .map(([page, p]) => ({
      page,
      label: config.pageLabels[page] ?? page,
      users: p.users.size,
      sessions: p.sessions.size,
    }))
    .sort((a, b) => b.sessions - a.sessions);

  // Utilisateurs les plus actifs.
  const last = lastSessionByUser(ds);
  const sessionsByUser = new Map<string, number>();
  for (const s of ds.sessions) {
    if (inLastDays(s.startedAt, now, activityDays)) sessionsByUser.set(s.userId, (sessionsByUser.get(s.userId) ?? 0) + 1);
  }
  const actionsByUser = new Map<string, number>();
  for (const e of ds.businessEvents) {
    if (inLastDays(e.at, now, activityDays)) actionsByUser.set(e.userId, (actionsByUser.get(e.userId) ?? 0) + 1);
  }
  const topUsers = ds.users
    .map((user) => ({
      user,
      sessions: sessionsByUser.get(user.id) ?? 0,
      actions: actionsByUser.get(user.id) ?? 0,
      lastSessionAt: last.get(user.id) ?? null,
    }))
    .filter((u) => u.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  return {
    total: ds.users.length,
    active7: active7.size,
    active30: active30.size,
    inactive: ds.users.filter((u) => !activeInactiveWindow.has(u.id)).length,
    new30: ds.users.filter((u) => inLastDays(u.createdAt, now, 30)).length,
    repeatEngagement: ratio(repeated, daysByUser.size),
    repeatEngagementCount: repeated,
    visitorsInWindow: daysByUser.size,
    dailyActive: dailySeries(now, 30, (key) => usersByDay.get(key)?.size ?? 0),
    funnel: funnel(ds, config.funnel),
    featureUsage,
    topUsers,
    ghosts: ghostAccounts(ds, config, now),
  };
}
