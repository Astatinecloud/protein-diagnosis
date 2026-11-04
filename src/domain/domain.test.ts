import { describe, it, expect, vi } from 'vitest';
import questionsJson from '../data/questions.json';
import data from '../data/proteins.json';
import type { QuestionSet } from './types';
import { traitKeys } from './traits';
import { rawScore, statistics, normalize, vector } from './scoring';
import { diagnose, isCompleteAnswerSet } from './resultMapping';
import { distribution } from './distribution';
import { validateQuestionSet } from './validation';
import { getQuestions, QUESTION_STORAGE_KEY } from '../state/questionStore';

const questions: QuestionSet = questionsJson;
const answers = Array.from({ length: questions.questions.length }, (_, i) => i % 4);

describe('scoring and mapping', () => {
  it('requires every bundled question and rejects an empty set', () => {
    expect(isCompleteAnswerSet(questions, answers.slice(0, -1))).toBe(false);
    expect(isCompleteAnswerSet(questions, answers)).toBe(true);
    expect(isCompleteAnswerSet({ version: 1, questions: [] }, [])).toBe(false);
  });
  it('is deterministic and recalculates changed answers', () => {
    expect(diagnose(questions, answers, data.proteins)).toEqual(
      diagnose(questions, answers, data.proteins),
    );
    expect(diagnose(questions, answers, data.proteins)).not.toBeNull();
    expect(rawScore(questions, answers)).not.toEqual(
      rawScore(questions, [1, ...answers.slice(1)]),
    );
  });

  it('calculates population statistics and z scores from the question set', () => {
    const stats = statistics(questions);

    for (const trait of traitKeys) {
      const means = questions.questions.map(question =>
        question.options.reduce((sum, option) => sum + (option.scores[trait] ?? 0), 0) / 4,
      );
      const mu = means.reduce((sum, mean) => sum + mean, 0);
      const variance = questions.questions.reduce((sum, question, index) => {
        const squaredDeviations = question.options.reduce(
          (total, option) => total + ((option.scores[trait] ?? 0) - means[index]) ** 2,
          0,
        );
        return sum + squaredDeviations / 4;
      }, 0);

      expect(stats.mu[trait]).toBe(mu);
      expect(stats.sd[trait]).toBe(Math.sqrt(variance) || 1);
      expect(normalize(rawScore(questions, answers), stats)[trait]).toBe(
        (rawScore(questions, answers)[trait] - mu) / (Math.sqrt(variance) || 1),
      );
    }
  });

  it('ignores invalid scores and unknown keys', () => {
    const set = structuredClone(questions);
    Object.assign(set.questions[0].options[0].scores, {
      action: NaN,
      harmony: 'bad',
      support: Infinity,
      unknown: 999,
    });
    expect(() => diagnose(set, Array(questions.questions.length).fill(0), data.proteins)).not.toThrow();

    const clean = structuredClone(set);
    Object.assign(clean.questions[0].options[0].scores, {
      action: 0,
      harmony: 0,
      support: 0,
      unknown: 0,
    });
    expect(rawScore(set, Array(questions.questions.length).fill(0))).toEqual(
      rawScore(clean, Array(questions.questions.length).fill(0)),
    );
    expect(statistics(set)).toEqual(statistics(clean));
    expect(() => diagnose(null as never, null as never, data.proteins)).not.toThrow();
  });

  it('uses sd=1 and answer encoding for zero vectors', () => {
    const set = structuredClone(questions);
    set.questions.forEach(question => {
      question.options.forEach(option => {
        option.scores = {};
      });
    });

    expect(Object.values(statistics(set).sd)).toEqual(Array(Object.keys(vector()).length).fill(1));
    const index = answers.reduce((sum, answer, q) => sum + answer * 4 ** q, 0) % data.proteins.length;
    expect(diagnose(set, answers, data.proteins)?.id).toBe(data.proteins[index].id);
  });

  it('rejects incomplete and invalid answers', () => {
    const invalidAnswers = [
      [],
      answers.slice(1),
      Array(questions.questions.length),
      [...answers.slice(1), 4],
      [...answers.slice(1), NaN],
    ];

    for (const invalid of invalidAnswers) {
      expect(diagnose(questions, invalid, data.proteins)).toBeNull();
    }
  });
});

it('enumerates all answer combinations and matches the specification', () => {
  const result = distribution(questions, data.proteins);
  console.log('DISTRIBUTION', JSON.stringify(result));

  expect(result.total).toBe(4 ** questions.questions.length);
  expect(Object.values(result.counts).reduce((sum, count) => sum + count, 0)).toBe(4 ** questions.questions.length);

  data.proteins.forEach((protein) => {
    expect(result.counts[protein.id]).toBeGreaterThan(0);
    expect(result.percentages[protein.id]).toBeGreaterThanOrEqual(5);
    expect(result.percentages[protein.id]).toBeLessThanOrEqual(7.5);
  });
}, 20000);

describe('validation', () => {
  it('accepts bundled questions', () => {
    expect(validateQuestionSet(questions).ok).toBe(true);
    const shorter = { ...questions, questions: questions.questions.slice(1) };
    expect(validateQuestionSet(shorter).errors).toContain(`質問はちょうど${questions.questions.length}問必要です`);
  });

  const invalidCases = [
    'seven',
    'three',
    'blank',
    'long question',
    'long option',
    'range',
    'unknown',
    'duplicate question',
    'duplicate option',
    'zero',
    'NaN',
    'string',
    'Infinity',
    'malformed',
  ];

  it.each(invalidCases)('rejects %s with Japanese contextual errors', kind => {
    const set = structuredClone(questions);

    if (kind === 'seven') set.questions.pop();
    if (kind === 'three') set.questions[0].options.pop();
    if (kind === 'blank') set.questions[0].text = '   ';
    if (kind === 'long question') set.questions[0].text = 'あ'.repeat(81);
    if (kind === 'long option') set.questions[0].options[0].label = 'あ'.repeat(41);
    if (kind === 'range') set.questions[0].options[0].scores.guard = 9;
    if (kind === 'unknown') Object.assign(set.questions[0].options[0].scores, { wat: 1 });

    if (kind === 'duplicate question') {
      set.questions[1].id = set.questions[0].id;
    }
    if (kind === 'duplicate option') {
      set.questions[1].options[0].id = set.questions[0].options[0].id;
    }
    if (kind === 'zero') {
      set.questions[0].options.forEach(option => {
        option.scores = {};
      });
    }
    if (['NaN', 'string', 'Infinity'].includes(kind)) {
      Object.assign(set.questions[0].options[0].scores, {
        guard: kind === 'NaN' ? NaN : kind === 'Infinity' ? Infinity : '1',
      });
    }

    const result = validateQuestionSet(kind === 'malformed' ? null : set);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.join('')).toMatch(/質問|Q1|Q2/);
  });
});

describe('question store', () => {
  it('does not load the previous storage version', () => {
    const old = structuredClone(questions);
    old.questions.pop();
    localStorage.setItem('protein-quiz.questions.v1', JSON.stringify(old));
    expect(QUESTION_STORAGE_KEY).toBe('protein-quiz.questions.v2');
    expect(getQuestions(true)).toEqual(questions);
  });
  it('falls back on corrupt, invalid or unavailable storage', () => {
    for (const value of ['{bad', 'null', '{}']) {
      localStorage.setItem(QUESTION_STORAGE_KEY, value);
      expect(getQuestions(true)).toEqual(questions);
    }
  });

  it('only prefers validated storage when enabled', () => {
    const custom = structuredClone(questions);
    custom.questions[0].text = '変更した質問';
    localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(custom));

    expect(getQuestions(true)).toEqual(custom);
    expect(getQuestions(false)).toEqual(questions);
  });

  it('falls back if the browser denies storage access', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    try {
      expect(getQuestions(true)).toEqual(questions);
    } finally {
      spy.mockRestore();
    }
  });
});
