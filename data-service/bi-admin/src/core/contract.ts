/**
 * Contrat de données du BI admin.
 *
 * C'est la seule chose que l'application (DFS) doit fournir pour que tous les
 * modules fonctionnent. Les dates sont des chaînes ISO 8601 (UTC).
 * Voir docs/data/02-bi-admin-fonctionnalites.md §4.
 */

export type Role = 'admin' | 'user';
export type Device = 'desktop' | 'mobile' | 'tablet';
export type FeedbackCategory = 'bug' | 'improvement' | 'feature' | 'other';
export type FeedbackStatus = 'open' | 'in_progress' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Compte suspendu par un administrateur. */
  suspended: boolean;
  createdAt: string;
  /** Entreprise cliente de rattachement (multi-tenant). */
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  /** Code NAF (secteur d'activité). */
  naf?: string;
  plan?: string;
}

/** Une session = ouverture de l'app, au plus une nouvelle toutes les 30 min par compte. */
export interface Session {
  id: string;
  userId: string;
  startedAt: string;
  /** Version déployée (hash de commit) ou "local". */
  version: string;
  browser: string;
  device: Device;
  /** Temps d'ouverture de l'app, en millisecondes. */
  loadTimeMs?: number;
  /**
   * Position approximative (~10 km) déduite de l'IP, uniquement si
   * l'utilisateur a consenti à la localisation. null = pas de consentement.
   */
  location?: { lat: number; lng: number; city?: string } | null;
}

export interface PageView {
  sessionId: string;
  userId: string;
  /** Identifiant de page, libellé défini dans la configuration. */
  page: string;
  at: string;
}

export interface AppError {
  id: string;
  message: string;
  /** Ex. "promesse", "exception", "réseau". */
  type: string;
  page: string;
  version: string;
  browser: string;
  userId?: string;
  sessionId?: string;
  at: string;
}

export interface Feedback {
  id: string;
  userId: string;
  category: FeedbackCategory;
  title: string;
  status: FeedbackStatus;
  createdAt: string;
  /** Date de la première réponse d'un administrateur. */
  answeredAt?: string;
}

export interface StoredDocument {
  id: string;
  userId: string;
  sizeBytes: number;
  type: string;
  createdAt: string;
  deletedAt?: string;
}

export interface Release {
  version: string;
  date: string;
  title: string;
  features: string[];
  improvements: string[];
  fixes: string[];
}

/** Événement métier (étapes d'entonnoir, objets créés…). Types définis dans la config. */
export interface BusinessEvent {
  userId: string;
  type: string;
  at: string;
}

export interface Dataset {
  /** Instant de calcul : sert de « maintenant » pour toutes les fenêtres. */
  generatedAt: string;
  users: User[];
  companies: Company[];
  sessions: Session[];
  pageViews: PageView[];
  errors: AppError[];
  feedback: Feedback[];
  documents: StoredDocument[];
  releases: Release[];
  businessEvents: BusinessEvent[];
}
