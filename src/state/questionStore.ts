import bundled from '../data/questions.json';
import { validateQuestionSet } from '../domain/validation';
import type { QuestionSet } from '../domain/types';

export const QUESTION_STORAGE_KEY = 'protein-quiz.questions.v1';

export function getQuestions(
  enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true',
): QuestionSet {
  if (enabled) {
    try {
      const stored = localStorage.getItem(QUESTION_STORAGE_KEY);

      if (stored) {
        const result = validateQuestionSet(JSON.parse(stored));
        if (result.ok && result.value) return result.value;
      }
    } catch {
      // Unavailable storage or corrupt JSON: use bundled data.
    }
  }

  return bundled;
}
