import type { BiConfig } from '../config';
import type { Dataset, User } from '../contract';
import { DAY, MINUTE } from './common';
import { lastSessionByUser } from './adoption';
import { liveDocuments } from './content';

export type UserStatus = 'suspended' | 'never' | 'inactive' | 'active';

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  never: 'Jamais connecté',
  suspended: 'Suspendu',
};

export interface UserRow {
  user: User;
  companyName?: string;
  status: UserStatus;
  online: boolean;
  lastSessionAt: number | null;
  connections: number;
  objects: number[];
  documents: number;
  documentBytes: number;
}

export function userRows(ds: Dataset, config: BiConfig, now: Date): UserRow[] {
  const last = lastSessionByUser(ds);
  const companies = new Map(ds.companies.map((c) => [c.id, c.name]));
  const docs = liveDocuments(ds, now);
  const { inactiveDays, onlineMinutes } = config.thresholds;

  return ds.users.map((user) => {
    const lastAt = last.get(user.id) ?? null;
    let status: UserStatus;
    if (user.suspended) status = 'suspended';
    else if (lastAt === null) status = 'never';
    else if (lastAt < now.getTime() - inactiveDays * DAY) status = 'inactive';
    else status = 'active';

    const userDocs = docs.filter((d) => d.userId === user.id);
    return {
      user,
      companyName: user.companyId ? companies.get(user.companyId) : undefined,
      status,
      online: lastAt !== null && lastAt >= now.getTime() - onlineMinutes * MINUTE,
      lastSessionAt: lastAt,
      connections: ds.sessions.filter((s) => s.userId === user.id).length,
      objects: config.trackedObjects.map(
        (o) => ds.businessEvents.filter((e) => e.userId === user.id && e.type === o.eventType).length,
      ),
      documents: userDocs.length,
      documentBytes: userDocs.reduce((sum, d) => sum + d.sizeBytes, 0),
    };
  });
}

/** Export CSV (séparateur « ; » pour Excel FR). */
export function usersToCsv(rows: UserRow[], config: BiConfig): string {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const header = [
    'Nom', 'Email', 'Entreprise', 'Rôle', 'Statut', 'Créé le', 'Dernière connexion', 'Connexions',
    ...config.trackedObjects.map((o) => o.label), 'Documents', 'Taille documents (octets)',
  ];
  const lines = rows.map((r) => [
    r.user.name, r.user.email, r.companyName ?? '', r.user.role, STATUS_LABELS[r.status], r.user.createdAt,
    r.lastSessionAt ? new Date(r.lastSessionAt).toISOString() : '', r.connections, ...r.objects,
    r.documents, r.documentBytes,
  ]);
  return [header, ...lines].map((l) => l.map(escape).join(';')).join('\n');
}
