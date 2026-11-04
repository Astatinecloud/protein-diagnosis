import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import App from '../App';
import data from '../data/proteins.json';

function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

it('lists the shared protein dataset with the result first, structure links and fallback', () => {
  open('/result/gfp/zukan');
  const cards = screen.getAllByRole('article');
  expect(cards).toHaveLength(data.proteins.length);
  expect(cards.map(card => card.dataset.proteinId).sort()).toEqual(data.proteins.map(p => p.id).sort());
  expect(cards[0].dataset.proteinId).toBe('gfp');
  expect(within(cards[0]).getByText('あなたのタンパク質！')).toBeTruthy();
  expect(screen.getAllByText('あなたのタンパク質！')).toHaveLength(1);
  expect(cards.slice(1).map(card => card.dataset.proteinId)).toEqual(
    data.proteins.filter(p => p.id !== 'gfp').map(p => p.id),
  );
  for (const link of screen.getAllByRole('link', { name: '診断結果に戻る' })) {
    expect(link.getAttribute('href')).toBe('/result/gfp');
  }
  for (const card of cards) {
    const protein = data.proteins.find(p => p.id === card.dataset.proteinId)!;
    expect(within(card).getByRole('heading', { name: protein.nameJa })).toBeTruthy();
    expect(within(card).getByText(protein.zukan.role)).toBeTruthy();
    expect(within(card).getByText(protein.zukan.summary)).toBeTruthy();
    const img = within(card).getByRole('img');
    expect(img.getAttribute('alt')).toBe(`${protein.nameJa}の実験で決定された立体構造（PDB ID ${protein.structure.pdbId}）`);
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('width')).toBe(img.getAttribute('height'));
  }
  const image = within(cards[0]).getByRole('img');
  fireEvent.error(image);
  expect(image.hidden).toBe(true);
  expect(within(cards[0]).getByRole('status').textContent).toBe('構造画像を表示できません');
  expect(screen.getAllByRole('img')).toHaveLength(data.proteins.length - 1);
  fireEvent.click(screen.getAllByRole('link', { name: '診断結果に戻る' })[0]);
  expect(screen.getByRole('link', { name: 'ほかのタンパク質も見てみる！' }).getAttribute('href')).toBe('/result/gfp/zukan');
});

it('accepts every result id from the shared dataset', () => {
  for (const protein of data.proteins) {
    const view = open(`/result/${protein.id}`);
    expect(screen.getByText(protein.nameEn)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ほかのタンパク質も見てみる！' }).getAttribute('href')).toBe(
      `/result/${protein.id}/zukan`,
    );
    view.unmount();
  }
});

it('shows the existing unknown-result message for an unknown encyclopedia id', () => {
  open('/result/nope/zukan');
  expect(screen.getByRole('heading', { name: '結果が見つかりません' })).toBeTruthy();
  expect(screen.queryAllByRole('article')).toHaveLength(0);
});
