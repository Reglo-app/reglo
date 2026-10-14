import type { Dataset } from '../contract';
import { inLastDays, ratio } from './common';

/** Jours de la semaine, lundi en premier. */
export const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Index lundi = 0 … dimanche = 6. */
export const mondayIndex = (d: Date) => (d.getDay() + 6) % 7;

export interface LocationCluster {
  lat: number;
  lng: number;
  count: number;
}

export function connectionsMetrics(ds: Dataset, now: Date, days: number) {
  const sessions = ds.sessions.filter((s) => inLastDays(s.startedAt, now, days));
  const localized = sessions.filter((s) => s.location);

  // Heatmap jour × heure.
  const heatmap = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  const byHour = new Array<number>(24).fill(0);
  const byWeekday = new Array<number>(7).fill(0);
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    heatmap[mondayIndex(d)][d.getHours()]++;
    byHour[d.getHours()]++;
    byWeekday[mondayIndex(d)]++;
  }
  const argmax = (arr: number[]) => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0);

  // Regroupement des positions arrondies à 0,1° (~10 km).
  const clusters = new Map<string, LocationCluster>();
  for (const s of localized) {
    const lat = Math.round(s.location!.lat * 10) / 10;
    const lng = Math.round(s.location!.lng * 10) / 10;
    const key = `${lat},${lng}`;
    const c = clusters.get(key) ?? { lat, lng, count: 0 };
    c.count++;
    clusters.set(key, c);
  }

  return {
    sessions: sessions.length,
    distinctUsers: new Set(sessions.map((s) => s.userId)).size,
    localizedShare: ratio(localized.length, sessions.length),
    peakHour: sessions.length ? argmax(byHour) : null,
    busiestWeekday: sessions.length ? WEEKDAYS[argmax(byWeekday)] : null,
    heatmap,
    heatmapMax: Math.max(0, ...heatmap.flat()),
    clusters: [...clusters.values()].sort((a, b) => b.count - a.count),
  };
}
