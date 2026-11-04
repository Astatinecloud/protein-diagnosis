import { finite, statistics } from './scoring';
import type { QuestionSet, Vector } from './types';

export type Matrix = number[][];

export const identity = (): Matrix =>
  Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => +(i === j)));

export const axes = (z: Vector): number[] => [
  z.action - z.steady,
  z.guard - z.flexible,
  z.curious - z.harmony,
  z.support - z.express,
];
const pairs = [['action', 'steady'], ['guard', 'flexible'], ['curious', 'harmony'], ['support', 'express']] as const;

export function axisCovariance(set: QuestionSet): Matrix {
  const { sd } = statistics(set);
  const result = identity().map(row => row.map(() => 0));
  for (const question of set.questions) {
    const values = question.options.map(option => pairs.map(([a, b]) =>
      finite(option.scores[a]) / sd[a] - finite(option.scores[b]) / sd[b],
    ));
    const means = pairs.map((_, i) => values.reduce((s, v) => s + v[i], 0) / values.length);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result[i][j] += values.reduce((s, v) => s + (v[i] - means[i]) * (v[j] - means[j]), 0) / values.length;
      }
    }
  }
  return result;
}

// Symmetric Jacobi eigendecomposition, with orthonormal eigenvectors in columns.
export function inverseSquareRoot(input: Matrix): Matrix {
  const a = input.map(row => [...row]);
  const v = identity();
  for (let iteration = 0; iteration < 100; iteration++) {
    let p = 0;
    let q = 1;
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        if (Math.abs(a[i][j]) > Math.abs(a[p][q])) {
          p = i;
          q = j;
        }
      }
    }
    if (Math.abs(a[p][q]) < 1e-12) break;
    const angle = .5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    for (let k = 0; k < 4; k++) {
      if (k !== p && k !== q) {
        const kp = a[k][p];
        const kq = a[k][q];
        a[k][p] = a[p][k] = c * kp - s * kq;
        a[k][q] = a[q][k] = s * kp + c * kq;
      }
      const vp = v[k][p];
      const vq = v[k][q];
      v[k][p] = c * vp - s * vq;
      v[k][q] = s * vp + c * vq;
    }
    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][q] = a[q][p] = 0;
  }
  const eigen = a.map((row, i) => row[i]);
  if (eigen.some(value => !Number.isFinite(value) || value <= 1e-10 * Math.max(1, ...eigen))) {
    return identity();
  }
  return v.map(row => v.map(other => row.reduce((sum, value, k) => sum + value * other[k] / Math.sqrt(eigen[k]), 0)));
}

export const whitening = (set: QuestionSet): Matrix => inverseSquareRoot(axisCovariance(set));
