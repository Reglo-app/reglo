import type { Dataset, Feedback, FeedbackCategory } from '../contract';
import { DAY, dailyCounts, time } from './common';

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug',
  improvement: 'Amélioration',
  feature: 'Nouvelle fonctionnalité',
  other: 'Autre',
};

/** Retours ouverts, sans réponse, créés il y a plus de `days` jours. */
export function unansweredFeedback(ds: Dataset, now: Date, days: number): Feedback[] {
  const limit = now.getTime() - days * DAY;
  return ds.feedback.filter((f) => f.status === 'open' && !f.answeredAt && time(f.createdAt) < limit);
}

export function feedbackMetrics(ds: Dataset, now: Date, windowDays: number) {
  const byCategory = (Object.keys(CATEGORY_LABELS) as FeedbackCategory[]).map((c) => ({
    category: c,
    label: CATEGORY_LABELS[c],
    value: ds.feedback.filter((f) => f.category === c).length,
  }));

  return {
    total: ds.feedback.length,
    bugs: ds.feedback.filter((f) => f.category === 'bug').length,
    featureRequests: ds.feedback.filter((f) => f.category === 'feature').length,
    open: ds.feedback.filter((f) => f.status !== 'done').length,
    byCategory,
    perDay: dailyCounts(ds.feedback.map((f) => f.createdAt), now, windowDays),
    submittedInWindow: ds.feedback.filter((f) => time(f.createdAt) > now.getTime() - windowDays * DAY).length,
    list: [...ds.feedback].sort((a, b) => time(b.createdAt) - time(a.createdAt)),
  };
}
