import type { Dataset, FeedbackStatus, Release } from './contract';

/** Actions d'administration. Chaque source de données les implémente à sa façon. */
export interface DataSourceActions {
  setUserSuspended(userId: string, suspended: boolean): Promise<void>;
  setFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void>;
  publishRelease(release: Release): Promise<void>;
  deleteRelease(version: string): Promise<void>;
}

/**
 * Point de branchement du BI.
 * - En local : source fictive (datasources/mock).
 * - En production : source HTTP (datasources/http) ou toute autre implémentation
 *   qui renvoie un Dataset conforme au contrat.
 */
export interface DataSource {
  load(): Promise<Dataset>;
  actions: DataSourceActions;
}
