import type { AppError, Dataset, Device } from '../contract';
import { dailyCounts, inLastDays, percentile, ratio, shareBy, time } from './common';

const DEVICE_LABELS: Record<Device, string> = { desktop: 'ordinateur', mobile: 'mobile', tablet: 'tablette' };

export interface ErrorGroup {
  message: string;
  occurrences: number;
  users: number;
  lastAt: string;
  page: string;
  browser: string;
  version: string;
  type: string;
}

/** Regroupe les erreurs par message, la plus récente en premier. */
export function groupErrors(errors: AppError[]): ErrorGroup[] {
  const groups = new Map<string, { last: AppError; occurrences: number; users: Set<string> }>();
  for (const e of errors) {
    const g = groups.get(e.message) ?? { last: e, occurrences: 0, users: new Set<string>() };
    g.occurrences++;
    if (e.userId) g.users.add(e.userId);
    if (time(e.at) >= time(g.last.at)) g.last = e;
    groups.set(e.message, g);
  }
  return [...groups.values()]
    .map(({ last, occurrences, users }) => ({
      message: last.message,
      occurrences,
      users: users.size,
      lastAt: last.at,
      page: last.page,
      browser: last.browser,
      version: last.version,
      type: last.type,
    }))
    .sort((a, b) => time(b.lastAt) - time(a.lastAt));
}

export function healthMetrics(ds: Dataset, now: Date, errorsDays: number) {
  const errors24h = ds.errors.filter((e) => inLastDays(e.at, now, 1));
  const errors7d = ds.errors.filter((e) => inLastDays(e.at, now, 7));
  const errorsWindow = ds.errors.filter((e) => inLastDays(e.at, now, errorsDays));
  const sessions7d = ds.sessions.filter((s) => inLastDays(s.startedAt, now, 7));

  const sessionsWithError = new Set(errors7d.map((e) => e.sessionId).filter(Boolean));
  const loads = sessions7d.map((s) => s.loadTimeMs).filter((v): v is number => typeof v === 'number');

  return {
    errors24h: errors24h.length,
    errors7d: errors7d.length,
    errorsWindow: errorsWindow.length,
    distinctErrorsWindow: new Set(errorsWindow.map((e) => e.message)).size,
    sessions7d: sessions7d.length,
    errorSessionRate: ratio(sessions7d.filter((s) => sessionsWithError.has(s.id)).length, sessions7d.length),
    loadMedianMs: percentile(loads, 50),
    loadP95Ms: percentile(loads, 95),
    errorsPerDay: dailyCounts(errorsWindow.map((e) => e.at), now, errorsDays),
    versions: shareBy(sessions7d, (s) => s.version),
    browsers: shareBy(sessions7d, (s) => s.browser),
    devices: shareBy(sessions7d, (s) => DEVICE_LABELS[s.device]),
    latestErrors: groupErrors(errorsWindow),
  };
}
