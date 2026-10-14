import type { Dataset } from '../../core/contract';
import type { DataSource } from '../../core/datasource';
import { generateDataset, type MockOptions } from './generator';

/** Source fictive en mémoire : données générées une fois, actions appliquées localement. */
export function createMockDataSource(options: MockOptions = {}): DataSource {
  const data: Dataset = generateDataset(options);

  return {
    async load() {
      return structuredClone({ ...data, generatedAt: new Date().toISOString() });
    },
    actions: {
      async setUserSuspended(userId, suspended) {
        const user = data.users.find((u) => u.id === userId);
        if (user) user.suspended = suspended;
      },
      async setFeedbackStatus(feedbackId, status) {
        const item = data.feedback.find((f) => f.id === feedbackId);
        if (!item) return;
        item.status = status;
        item.answeredAt ??= new Date().toISOString();
      },
      async publishRelease(release) {
        data.releases = [...data.releases.filter((r) => r.version !== release.version), release];
      },
      async deleteRelease(version) {
        data.releases = data.releases.filter((r) => r.version !== version);
      },
    },
  };
}
