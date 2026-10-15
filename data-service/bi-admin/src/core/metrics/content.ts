import type { BiConfig } from '../config';
import type { Dataset, StoredDocument } from '../contract';
import { inLastDays, ratio, time } from './common';

export const DOCUMENT_BUCKETS = [
  { label: '0', min: 0, max: 0 },
  { label: '1 à 2', min: 1, max: 2 },
  { label: '3 à 5', min: 3, max: 5 },
  { label: '6 à 10', min: 6, max: 10 },
  { label: 'Plus de 10', min: 11, max: Infinity },
];

/** Documents encore présents à l'instant `now`. */
export function liveDocuments(ds: Dataset, now: Date): StoredDocument[] {
  return ds.documents.filter(
    (d) => time(d.createdAt) <= now.getTime() && (!d.deletedAt || time(d.deletedAt) > now.getTime()),
  );
}

export function contentMetrics(ds: Dataset, config: BiConfig, now: Date) {
  const docs = liveDocuments(ds, now);
  const totalBytes = docs.reduce((sum, d) => sum + d.sizeBytes, 0);

  const byUser = new Map<string, { count: number; bytes: number }>();
  for (const d of docs) {
    const u = byUser.get(d.userId) ?? { count: 0, bytes: 0 };
    u.count++;
    u.bytes += d.sizeBytes;
    byUser.set(d.userId, u);
  }

  const buckets = DOCUMENT_BUCKETS.map((b) => ({
    label: b.label,
    value: ds.users.filter((u) => {
      const n = byUser.get(u.id)?.count ?? 0;
      return n >= b.min && n <= b.max;
    }).length,
  }));

  const usersById = new Map(ds.users.map((u) => [u.id, u]));
  const topStorers = [...byUser.entries()]
    .map(([userId, v]) => ({ user: usersById.get(userId), ...v }))
    .filter((v) => v.user)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5);

  const documentPages = new Set(config.documentPages);
  const objects = config.trackedObjects.map((o) => {
    const count = ds.businessEvents.filter((e) => e.type === o.eventType).length;
    return { label: o.label, count, perUser: ratio(count, ds.users.length) };
  });

  return {
    totalBytes,
    quotaShare: ratio(totalBytes, config.storageQuotaBytes),
    documents: docs.length,
    usersWithDocuments: byUser.size,
    documentsPerUser: ratio(docs.length, ds.users.length),
    documentErrors: ds.errors.filter(
      (e) => documentPages.has(e.page) && inLastDays(e.at, now, config.windows.errorsDays),
    ).length,
    buckets,
    topStorers,
    objects,
  };
}
