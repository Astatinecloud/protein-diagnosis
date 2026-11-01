import bundled from '../data/questions.json';
import { traitKeys, type Trait } from './traits';
import type { QuestionSet } from './types';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function validateQuestionSet(
  data: unknown,
): { ok: boolean; errors: string[]; value?: QuestionSet } {
  const errors: string[] = [];

  if (!record(data) || !Array.isArray(data.questions)) {
    return { ok: false, errors: ['質問セットの形式が不正です'] };
  }

  if (data.questions.length !== bundled.questions.length) {
    errors.push(`質問はちょうど${bundled.questions.length}問必要です`);
  }

  const ids = new Set<string>();

  function validateId(value: unknown, location: string) {
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${location}: IDが必要です`);
    } else if (ids.has(value)) {
      errors.push(`${location}: IDが重複しています（${value}）`);
    } else {
      ids.add(value);
    }
  }

  function validateText(value: unknown, max: number, location: string) {
    if (typeof value !== 'string' || !value.trim() || [...value].length > max) {
      errors.push(`${location}: 文字列は空白以外を含む${max}文字以内にしてください`);
    }
  }

  data.questions.forEach((question: unknown, questionIndex: number) => {
    const location = `Q${questionIndex + 1}`;

    if (!record(question)) {
      errors.push(`${location}: 質問の形式が不正です`);
      return;
    }

    validateId(question.id, location);
    validateText(question.text, 80, location);

    if (!Array.isArray(question.options)) {
      errors.push(`${location}: 選択肢が必要です`);
      return;
    }

    if (question.options.length !== 4) {
      errors.push(`${location}: 選択肢はちょうど4つ必要です`);
    }

    let contributes = false;

    question.options.forEach((option: unknown, optionIndex: number) => {
      const optionLocation = `${location} の選択肢${String.fromCharCode(65 + optionIndex)}`;

      if (!record(option)) {
        errors.push(`${optionLocation}: 形式が不正です`);
        return;
      }

      validateId(option.id, optionLocation);
      validateText(option.label, 40, optionLocation);

      if (!record(option.scores)) {
        errors.push(`${optionLocation}: スコアの形式が不正です`);
        return;
      }

      Object.entries(option.scores).forEach(([key, value]) => {
        const knownTrait = traitKeys.includes(key as Trait);

        if (!knownTrait) {
          errors.push(`${optionLocation}: 未知の特性 “${key}” です`);
        }

        if (typeof value !== 'number' || !Number.isFinite(value) || value < -5 || value > 5) {
          errors.push(`${optionLocation}: スコア “${key}” が範囲外です（${String(value)}）`);
        } else if (value !== 0 && knownTrait) {
          contributes = true;
        }
      });
    });

    if (!contributes) {
      errors.push(`${location}: 全選択肢のスコアが0です`);
    }
  });

  return errors.length
    ? { ok: false, errors }
    : { ok: true, errors, value: data as unknown as QuestionSet };
}
