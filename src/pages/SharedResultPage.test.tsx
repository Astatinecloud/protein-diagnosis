import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../App';
import SharedResultPage from './SharedResultPage';
import data from '../data/proteins.json';
import questions from '../data/questions.json';
import { imagePath } from '../structures/structures';
import { shareUrl, qrUrl } from '../export/urls';

vi.mock('qrcode', () => ({ toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr') }));

afterEach(() => vi.restoreAllMocks());

function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

it.each(data.proteins)('shows only the shared result for $id', protein => {
  open('/?result=' + protein.id);
  expect(screen.getByText(protein.nameEn)).toBeTruthy();
  expect(screen.getByText(protein.nameJa)).toBeTruthy();
  expect(screen.getByRole('heading', { name: protein.typeName + 'タイプ！' })).toBeTruthy();
  expect(screen.getByText(protein.catchCopy)).toBeTruthy();
  expect(screen.getByText(protein.personality)).toBeTruthy();
  expect(screen.getByText(protein.biology)).toBeTruthy();
  expect(screen.getByRole('link', { name: protein.structure.pdbId + ' ↗' })).toBeTruthy();
  const image = screen.getByRole('img');
  expect(image.getAttribute('src')).toBe(imagePath(protein));
  expect(image.getAttribute('alt')).toBe(`${protein.nameJa}の実験で決定された立体構造（PDB ID ${protein.structure.pdbId}）`);
  expect(screen.getByRole('button', { name: '結果画像を保存' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '立体構造を動かしてみる' })).toBeTruthy();
  for (const label of ['もう一度診断する', '診断スタート', 'ほかのタンパク質も見てみる！', 'QRコード', 'QUESTIONS']) {
    expect(document.body.textContent).not.toContain(label);
  }
  for (const question of questions.questions) expect(screen.queryByText(question.text)).toBeNull();
  expect(document.querySelector('.site-header a')).toBeNull();
  expect(document.querySelector('a[href="/"]')).toBeNull();
  expect(document.querySelector('a[href*="admin"]')).toBeNull();
});

it.each(['nope', ''])('shows a result-only error for %s', id => {
  open('/?result=' + id);
  expect(screen.getByRole('heading', { name: '結果が見つかりません' })).toBeTruthy();
  expect(screen.getByText('QRコードをもう一度読み取ってください。')).toBeTruthy();
  expect(screen.queryAllByRole('link')).toHaveLength(0);
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});

it('renders without a QuizProvider or answers', () => {
  render(<MemoryRouter initialEntries={['/?result=gfp']}><SharedResultPage /></MemoryRouter>);
  expect(screen.getByText('Green Fluorescent Protein')).toBeTruthy();
});

it('keeps the normal top page and site QR', () => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute('open'); },
  });
  open('/');
  expect(screen.getByRole('link', { name: /診断スタート/ })).toBeTruthy();
  expect(document.querySelector('.site-header a')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'このサイトのQRコード' }));
  expect(screen.getByRole('link', { name: qrUrl() }).getAttribute('href')).toBe(qrUrl());
});

it('switches the result QR URL per protein and retains play actions', () => {
  const view = open('/result/gfp');
  expect(screen.getByRole('link', { name: shareUrl('gfp') }).getAttribute('href')).toBe(shareUrl('gfp'));
  expect(screen.getByRole('link', { name: 'もう一度診断する' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'ほかのタンパク質も見てみる！' }).getAttribute('href')).toBe('/result/gfp/zukan');
  view.unmount();
  const other = data.proteins.find(protein => protein.id !== 'gfp')!;
  open('/result/' + other.id);
  expect(screen.getByRole('link', { name: shareUrl(other.id) }).getAttribute('href')).toBe(shareUrl(other.id));
  expect(shareUrl(other.id)).not.toBe(shareUrl('gfp'));
});
