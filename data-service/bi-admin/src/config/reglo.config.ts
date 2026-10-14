import type { BiConfig } from '../core/config';

/**
 * Configuration métier Reglo.
 * Les étapes d'entonnoir, objets suivis et seuils sont des propositions
 * à valider avec l'équipe (docs/data/02-bi-admin-fonctionnalites.md §5).
 */
export const regloConfig: BiConfig = {
  appName: 'Reglo',
  modules: ['overview', 'health', 'adoption', 'content', 'feedback', 'connections', 'users', 'releases'],
  windows: {
    activityDays: 90,
    errorsDays: 30,
  },
  thresholds: {
    inactiveDays: 30,
    onlineMinutes: 30,
    repeatEngagementMinDays: 2,
    repeatEngagementWindowDays: 30,
    ghostAfterDays: 90,
    feedbackUnansweredDays: 7,
    errors24hHigh: 10,
  },
  storageQuotaBytes: 1024 ** 3,
  funnel: [
    { id: 'signup', label: 'Inscription', kind: 'signup' },
    { id: 'company', label: 'Profil entreprise complété', kind: 'event', eventType: 'company_profile_completed' },
    { id: 'training_started', label: 'Formation commencée', kind: 'event', eventType: 'training_started' },
    { id: 'training_completed', label: 'Formation terminée', kind: 'event', eventType: 'training_completed' },
    { id: 'returned', label: 'Revenu après 7 jours', kind: 'returnedAfterDays', days: 7 },
    { id: 'subscribed', label: 'Abonnement souscrit', kind: 'event', eventType: 'subscription_started' },
  ],
  trackedObjects: [
    { label: 'Formations suivies', eventType: 'training_started' },
    { label: 'Alertes consultées', eventType: 'regulatory_alert_viewed' },
  ],
  coreEventTypes: ['company_profile_completed', 'training_started', 'regulatory_alert_viewed'],
  documentPages: ['documents'],
  pageLabels: {
    home: 'Accueil',
    watch: 'Veille réglementaire',
    trainings: 'Formations',
    documents: 'Documents',
    indicators: 'Indicateurs QHSE',
    actions: "Plan d'actions",
    profile: 'Profil',
    help: 'Aide',
  },
};
