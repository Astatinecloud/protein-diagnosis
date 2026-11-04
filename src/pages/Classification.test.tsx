import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import App from '../App';
import data from '../data/proteins.json';
import { classificationDisclaimer, codeLabels } from '../domain/typeCode';
import { shareUrl } from '../export/urls';

const open = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

it.each(data.proteins)('shows classification on result, share and encyclopedia for $id', protein => {
  for (const path of ['/result/' + protein.id, '/?result=' + protein.id]) {
    const view = open(path);
    expect(screen.getByText(protein.typeCode)).toBeTruthy();
    expect(screen.getByText(classificationDisclaimer)).toBeTruthy();
    for (const label of codeLabels(protein.typeCode))
      expect(screen.getByText(label.letter + ' ' + label.science)).toBeTruthy();
    if (protein.classificationNote)
      expect(screen.getByText(protein.classificationNote)).toBeTruthy();
    if (!path.startsWith('/?'))
      expect(screen.getByRole('link', { name: shareUrl(protein.id) }).getAttribute('href')).toBe(shareUrl(protein.id));
    view.unmount();
  }
  const view = open('/result/' + protein.id + '/zukan');
  const card = document.getElementById('protein-' + protein.id)!;
  expect(within(card).getByText(protein.typeCode)).toBeTruthy();
  const table = screen.getByRole('table');
  expect(within(table).getAllByRole('link')).toHaveLength(16);
  const link = within(table).getByRole('link', { name: protein.typeCode + ' ' + protein.nameJa });
  expect(link.getAttribute('href')).toBe('#protein-' + protein.id);
  expect(link.getAttribute('aria-current')).toBe('true');
  view.unmount();
});

it.each(data.retired)('handles all legacy URLs for $id', protein => {
  for (const path of ['/result/' + protein.id, '/result/' + protein.id + '/zukan', '/?result=' + protein.id]) {
    const view = open(path);
    expect(screen.getByText(protein.nameJa + 'は診断のリニューアルで入れ替わりました')).toBeTruthy();
    if (path.startsWith('/?')) {
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    }
    else
      expect(screen.getByRole('link', { name: 'トップへ' }).getAttribute('href')).toBe('/');
    view.unmount();
  }
});

it('classification table targets the matching card', () => {
  open('/result/gfp/zukan');
  expect(screen.getByRole('columnheader', { name: '分類' })).toBeTruthy();
  const caption = screen.getByRole('table').querySelector('caption')!;
  expect(caption.textContent).toContain('行（1・2文字目）');
  expect(caption.textContent).toContain('列（3・4文字目）');
  for (const { letter, science } of codeLabels('ENBSUTHX')) {
    expect(caption.textContent).toContain(`${letter} ${science}`);
  }
  const link = within(screen.getByRole('table')).getAllByRole('link')[0];
  const target = document.querySelector(link.getAttribute('href')!)!;
  expect(target.getAttribute('data-protein-id')).toBe(data.proteins.find(p => p.typeCode === 'ESUH')!.id);
  const spy = vi.fn();
  link.addEventListener('click', spy);
  fireEvent.click(link);
  expect(spy).toHaveBeenCalledOnce();
});
