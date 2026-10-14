export const MINUTE = 60_000;
export const DAY = 86_400_000;

export const time = (iso: string) => Date.parse(iso);

/** Vrai si la date est dans les `days` derniers jours avant `now` (inclus). */
export function inLastDays(iso: string, now: Date, days: number): boolean {
  const t = time(iso);
  return t <= now.getTime() && t > now.getTime() - days * DAY;
}

/** Clé de jour locale AAAA-MM-JJ. */
export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface DailyPoint {
  date: string;
  /** Libellé court JJ/MM. */
  label: string;
  value: number;
}

/** Série quotidienne sur les `days` derniers jours, du plus ancien au plus récent. */
export function dailySeries(
  now: Date,
  days: number,
  valueFor: (key: string) => number,
): DailyPoint[] {
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const key = dayKey(d);
    points.push({ date: key, label: `${key.slice(8, 10)}/${key.slice(5, 7)}`, value: valueFor(key) });
  }
  return points;
}

/** Compte des dates par jour sur les `days` derniers jours. */
export function dailyCounts(dates: string[], now: Date, days: number): DailyPoint[] {
  const counts = new Map<string, number>();
  for (const iso of dates) {
    if (!inLastDays(iso, now, days)) continue;
    const key = dayKey(new Date(iso));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return dailySeries(now, days, (key) => counts.get(key) ?? 0);
}

export interface Share {
  label: string;
  count: number;
  share: number;
}

/** Répartition d'une liste par clé, triée par effectif décroissant. */
export function shareBy<T>(items: T[], key: (item: T) => string): Share[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, share: items.length ? count / items.length : 0 }))
    .sort((a, b) => b.count - a.count);
}

/** Centile par interpolation linéaire (p entre 0 et 100). */
export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

export const ratio = (num: number, den: number) => (den ? num / den : 0);
