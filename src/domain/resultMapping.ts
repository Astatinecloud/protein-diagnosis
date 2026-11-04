import { axes, identity, whitening, type Matrix } from './whitening';
import { traitKeys } from './traits';
import { normalize, rawScore, statistics } from './scoring';
import type { Protein, QuestionSet, Vector } from './types';

export function mapResult(
  z: Vector,
  answers: readonly number[],
  proteins: readonly Protein[],
  transform: Matrix = identity(),
): Protein | null {
  if (!proteins?.length) return null;

  if (traitKeys.every(d => z[d] === 0)) {
    const index = answers.reduce((sum, answer, q) => sum + answer * 4 ** q, 0) % proteins.length;
    return proteins[index] ?? null;
  }

  const d = axes(z);
  const code = transform.map((row, i) =>
    row.reduce((sum, value, j) => sum + value * d[j], 0) > 0
      ? ['E', 'B', 'U', 'H'][i]
      : ['N', 'S', 'T', 'X'][i],
  ).join('');
  return proteins.find(protein => protein.typeCode === code) ?? null;
}

export function isCompleteAnswerSet(set: QuestionSet, answers: readonly number[]): boolean {
  const count = set?.questions?.length;
  if (!count || !Array.isArray(answers) || answers.length !== count) {
    return false;
  }

  // Check every position explicitly: sparse arrays must not count as complete.
  return Array.from({ length: count }, (_, index) => index).every(index => {
    const answer = answers[index];
    return (
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < 4 &&
      Boolean(set.questions[index]?.options?.[answer])
    );
  });
}

export function diagnose(
  set: QuestionSet,
  answers: readonly number[],
  proteins: readonly Protein[],
): Protein | null {
  if (!isCompleteAnswerSet(set, answers)) return null;

  const z = normalize(rawScore(set, answers), statistics(set));
  return mapResult(z, answers, proteins, whitening(set));
}
