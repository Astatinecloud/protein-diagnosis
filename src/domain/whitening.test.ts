import { expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import data from '../data/proteins.json';
import questions from '../data/questions.json';
import { axes, axisCovariance, identity, inverseSquareRoot } from './whitening';
import { normalize, rawScore, statistics } from './scoring';

it('covers exactly sixteen codes and disjoint retired ids with local JPEGs', () => {
  const expected = ['ES', 'EB', 'NS', 'NB'].flatMap(row => ['UH', 'UX', 'TH', 'TX'].map(col => row + col));
  expect(data.proteins.map(p => p.typeCode).sort()).toEqual(expected.sort());
  expect(data.retired).toHaveLength(8);
  for (const retired of data.retired)
    expect(data.proteins.some(p => p.id === retired.id)).toBe(false);
  for (const p of data.proteins)
    expect(existsSync('public/structures/' + p.structure.pdbId.toLowerCase() + '.jpeg')).toBe(true);
  expect(readFileSync('src/data/proteins.json')).toEqual(readFileSync('design/proteins.json'));
});

it('matches analytical covariance to exhaustive population covariance and whitens it', () => {
  const total = 4 ** questions.questions.length, stats = statistics(questions);
  const sums = [0, 0, 0, 0], products = identity().map(row => row.map(() => 0));
  for (let n = 0; n < total; n++) {
    const answers = questions.questions.map((_, q) => Math.floor(n / 4 ** q) % 4);
    const d = axes(normalize(rawScore(questions, answers), stats));
    for (let i = 0; i < 4; i++) {
      sums[i] += d[i];
      for (let j = 0; j < 4; j++)
        products[i][j] += d[i] * d[j];
    }
  }
  const covariance = axisCovariance(questions), w = inverseSquareRoot(covariance);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      expect(covariance[i][j]).toBeCloseTo(products[i][j] / total - sums[i] * sums[j] / total ** 2, 9);
      const whitened = w[i].reduce((sum, wi, k) => sum + wi * covariance[k].reduce((s, c, l) => s + c * w[j][l], 0), 0);
      expect(whitened).toBeCloseTo(+(i === j), 9);
    }
}, 20000);

it('uses identity for singular and nearly singular covariance', () => {
  expect(inverseSquareRoot(identity().map(row => row.map(() => 0)))).toEqual(identity());
  const singular = identity();
  singular[3][3] = 1e-15;
  expect(inverseSquareRoot(singular)).toEqual(identity());
});
