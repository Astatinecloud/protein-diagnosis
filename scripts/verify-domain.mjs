// Dependency-free supplementary verification for Node 24, useful offline.
// The full required suite remains `npm test` (Vitest + Testing Library).
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

registerHooks({
  resolve(specifier, context, next) {
    const extensionlessTypeScriptImport = specifier.startsWith('.')
      && context.parentURL?.endsWith('.ts')
      && !/\.[a-z]+$/i.test(specifier);

    if (extensionlessTypeScriptImport) specifier += '.ts';
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) {
      return {
        format: 'module',
        source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8')),
        shortCircuit: true,
      };
    }

    return next(url, context);
  },
});

const { distribution } = await import('../src/domain/distribution.ts');
const { diagnose, mapResult } = await import('../src/domain/resultMapping.ts');
const { statistics, rawScore, vector } = await import('../src/domain/scoring.ts');
const { validateQuestionSet } = await import('../src/domain/validation.ts');
const questions = JSON.parse(
  readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'),
);
const { proteins } = JSON.parse(
  readFileSync(new URL('../src/data/proteins.json', import.meta.url), 'utf8'),
);

assert.equal(validateQuestionSet(questions).ok, true);
for (const file of ['questions.json', 'proteins.json']) {
  assert.deepEqual(
    readFileSync(new URL(`../design/${file}`, import.meta.url)),
    readFileSync(new URL(`../src/data/${file}`, import.meta.url)),
  );
}

const answers = [0, 1, 2, 3, 0, 1, 2, 3];
assert.equal(diagnose(questions, answers, proteins), diagnose(questions, answers, proteins));
assert.notDeepEqual(rawScore(questions, answers), rawScore(questions, [1, ...answers.slice(1)]));
assert.equal(diagnose(questions, answers.slice(1), proteins), null);

const invalid = structuredClone(questions);
Object.assign(invalid.questions[0].options[0].scores, {
  action: NaN,
  harmony: 'bad',
  support: Infinity,
  unknown: 100,
});
assert.doesNotThrow(() => diagnose(invalid, Array(8).fill(0), proteins));

const zero = structuredClone(questions);
zero.questions.forEach(question => {
  question.options.forEach(option => {
    option.scores = {};
  });
});
assert.deepEqual(Object.values(statistics(zero).sd), Array(8).fill(1));
const fallbackIndex = answers.reduce((sum, answer, q) => sum + answer * 4 ** q, 0) % 12;
assert.equal(diagnose(zero, answers, proteins), proteins[fallbackIndex]);

const z = { ...vector(), action: 1 };
const first = { ...proteins[0], profile: { ...z, harmony: .00001 } };
assert.equal(mapResult(z, answers, [first, { ...proteins[1], profile: z }]), first);

const expected = [8.70, 8.76, 7.97, 7.89, 8.61, 8.58, 8.71, 7.89, 8.07, 7.89, 8.77, 8.16];
const result = distribution(questions, proteins);
assert.equal(Object.values(result.counts).reduce((sum, count) => sum + count, 0), 65536);
proteins.forEach((protein, index) => {
  assert.ok(result.percentages[protein.id] >= 4 && result.percentages[protein.id] <= 16);
  assert.ok(Math.abs(result.percentages[protein.id] - expected[index]) <= .01);
});

console.log(JSON.stringify(result, null, 2));
console.log(
  'PASS: data byte equality, validation, determinism, changed answers, invalid scores, '
    + 'incomplete answers, zero SD, fallback, ties, and full distribution.',
);
