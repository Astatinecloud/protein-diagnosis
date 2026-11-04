import { traitKeys } from './traits';
import type { QuestionSet, Vector } from './types';

export const finite = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export const vector = (): Vector =>
  Object.fromEntries(traitKeys.map(trait => [trait, 0])) as Vector;

export function statistics(set: QuestionSet) {
  const mu = vector();
  const sd = vector();

  for (const question of set?.questions ?? []) {
    for (const trait of traitKeys) {
      const scores = (question?.options ?? []).map(option => finite(option?.scores?.[trait]));
      const mean = scores.reduce((sum, score) => sum + score, 0) / (scores.length || 1);
      const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0)
        / (scores.length || 1);

      mu[trait] += mean;
      sd[trait] += variance;
    }
  }

  for (const trait of traitKeys) {
    sd[trait] = Math.sqrt(sd[trait]) || 1;
  }

  return { mu, sd };
}

export function rawScore(set: QuestionSet, answers: readonly number[]): Vector {
  const scores = vector();

  (set?.questions ?? []).forEach((question, index) => {
    for (const trait of traitKeys) {
      scores[trait] += finite(question?.options?.[answers?.[index]]?.scores?.[trait]);
    }
  });

  return scores;
}

export function normalize(scores: Vector, stats: ReturnType<typeof statistics>): Vector {
  return Object.fromEntries(
    traitKeys.map(trait => [trait, finite((scores[trait] - stats.mu[trait]) / stats.sd[trait])]),
  ) as Vector;
}
