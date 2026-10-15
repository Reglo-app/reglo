/** Identifiants des modules (onglets) disponibles. */
export type ModuleId =
  | 'overview'
  | 'health'
  | 'adoption'
  | 'content'
  | 'feedback'
  | 'connections'
  | 'users'
  | 'releases';

/** Étape d'entonnoir d'adoption. Une étape est franchie si les précédentes le sont aussi. */
export type FunnelStep =
  | { id: string; label: string; kind: 'signup' }
  | { id: string; label: string; kind: 'event'; eventType: string }
  | { id: string; label: string; kind: 'returnedAfterDays'; days: number };

/** Objet métier compté par compte (ex. véhicules, formations suivies…). */
export interface TrackedObject {
  label: string;
  eventType: string;
}

/** Couche métier : tout ce qui change d'un produit à l'autre. */
export interface BiConfig {
  appName: string;
  modules: ModuleId[];
  windows: {
    /** Historique des connexions et de l'activité. */
    activityDays: number;
    /** Historique des erreurs et des retours. */
    errorsDays: number;
  };
  thresholds: {
    inactiveDays: number;
    onlineMinutes: number;
    repeatEngagementMinDays: number;
    repeatEngagementWindowDays: number;
    ghostAfterDays: number;
    feedbackUnansweredDays: number;
    /** Au-delà, le point d'attention « erreurs » passe en priorité haute. */
    errors24hHigh: number;
  };
  storageQuotaBytes: number;
  funnel: FunnelStep[];
  /** Objets métier affichés dans Contenu et Utilisateurs. */
  trackedObjects: TrackedObject[];
  /** Événements qui prouvent qu'un compte a réellement utilisé le produit (comptes fantômes). */
  coreEventTypes: string[];
  /** Pages dont les erreurs sont comptées comme « erreurs documents ». */
  documentPages: string[];
  /** Libellés des identifiants de page. */
  pageLabels: Record<string, string>;
}
