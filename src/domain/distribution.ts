import { normalize, rawScore, statistics } from './scoring';
import { mapResult } from './resultMapping';
import type { Protein, QuestionSet } from './types';

export function distribution(set: QuestionSet, proteins: readonly Protein[]) {
  const counts: Record<string, number> = Object.fromEntries(
    proteins.map(protein => [protein.id, 0]),
  );
  const stats = statistics(set);
  const total = 4 ** 8;

  for (let n = 0; n < total; n++) {
    const answers = Array.from({ length: 8 }, (_, q) => Math.floor(n / 4 ** q) % 4);
    const result = mapResult(normalize(rawScore(set, answers), stats), answers, proteins);

    if (result) counts[result.id]++;
  }

  return {
    total,
    counts,
    percentages: Object.fromEntries(
      proteins.map(protein => [protein.id, counts[protein.id] / total * 100]),
    ),
  };
}
