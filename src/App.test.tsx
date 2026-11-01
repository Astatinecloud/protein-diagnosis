import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App';
import questions from './data/questions.json';
import proteins from './data/proteins.json';

const open = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <App />
  </MemoryRouter>,
);

afterEach(() => vi.useRealTimers());

it('shows all questions, retains answers, permits changes and reaches a result', () => {
  vi.useFakeTimers();
  open('/quiz');
  expect(screen.getByText(`Q1 / ${questions.questions.length}`)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: /A 最後まで/ }));
  expect(
    screen.getByRole('button', { name: /A 最後まで/ }).getAttribute('aria-pressed'),
  ).toBe('true');
  act(() => vi.advanceTimersByTime(250));

  fireEvent.click(screen.getByRole('button', { name: /戻る/ }));
  expect(
    screen.getByRole('button', { name: /A 最後まで/ }).getAttribute('aria-pressed'),
  ).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: /B 大切な人/ }));
  act(() => vi.advanceTimersByTime(250));

  fireEvent.click(screen.getByRole('button', { name: /戻る/ }));
  expect(
    screen.getByRole('button', { name: /B 大切な人/ }).getAttribute('aria-pressed'),
  ).toBe('true');

  for (let q = 0; q < questions.questions.length; q++) {
    expect(screen.getByRole('heading', { name: questions.questions[q].text })).toBeTruthy();
    expect(screen.getByText(`Q${q + 1} / ${questions.questions.length}`)).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('max')).toBe(String(questions.questions.length));
    fireEvent.click(screen.getByRole('button', {
      name: `A ${questions.questions[q].options[0].label}`,
    }));
    act(() => vi.advanceTimersByTime(250));
  }

  expect(screen.getByRole('status')).toBeTruthy();
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.getByText('あなたの特徴', { exact: false })).toBeTruthy();

  fireEvent.click(screen.getByRole('link', { name: 'ほかのタンパク質も見てみる！' }));
  expect(screen.getAllByRole('article')).toHaveLength(proteins.proteins.length);
  fireEvent.click(screen.getAllByRole('link', { name: '診断結果に戻る' })[0]);
  expect(screen.getByText('あなたの特徴', { exact: false })).toBeTruthy();
  // Visiting the quiz again preserves the final answer after the encyclopedia round trip.
  fireEvent.click(screen.getByRole('link', { name: /たんぱく質診断/ }));
  fireEvent.click(screen.getByRole('link', { name: /診断スタート/ }));
  expect(screen.getByText(`Q${questions.questions.length} / ${questions.questions.length}`)).toBeTruthy();
  expect(screen.getByRole('button', { pressed: true }).textContent).toContain(questions.questions.at(-1)!.options[0].label);
  fireEvent.click(screen.getByRole('button', { pressed: true }));
  act(() => vi.advanceTimersByTime(1750));
  act(() => vi.advanceTimersByTime(1500));

  fireEvent.click(screen.getByRole('link', { name: 'もう一度診断する' }));
  fireEvent.click(screen.getByRole('link', { name: /診断スタート/ }));
  expect(screen.getByText(`Q1 / ${questions.questions.length}`)).toBeTruthy();
  expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
});

it('shows a shared GFP result directly with science, credits and no compatibility feature', () => {
  open('/result/gfp');
  expect(screen.getByText('Green Fluorescent Protein')).toBeTruthy();
  expect(screen.getByText('実験で決定された構造')).toBeTruthy();
  expect(screen.getByText(/構造画像: RCSB PDB/).textContent).toContain(
    'Mol* (Sehnal et al., 2021) で描画。',
  );
  expect(document.body.textContent).not.toContain('相性');
  expect(screen.getByRole('img').getAttribute('src')).toBe('/structures/1gfl.jpeg');
});

it('redirects incomplete diagnosing to quiz', () => {
  open('/diagnosing');
  expect(screen.getByText(`Q1 / ${questions.questions.length}`)).toBeTruthy();
});

it('shows unknown result and unknown route messages', () => {
  const view = open('/result/nope');
  expect(screen.getByText('結果が見つかりません')).toBeTruthy();

  view.unmount();
  open('/missing');
  expect(screen.getByText('ページが見つかりません')).toBeTruthy();
});
