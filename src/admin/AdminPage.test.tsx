import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import AdminPage from './AdminPage';
import { QuizProvider } from '../state/QuizContext';
import { QUESTION_STORAGE_KEY } from '../state/questionStore';
import bundled from '../data/questions.json';

function open() {
  render(<MemoryRouter><QuizProvider><AdminPage /></QuizProvider></MemoryRouter>);
}

it('saves validated edits, rejects invalid edits and cancels to the last save', () => {
  open();
  expect(screen.getAllByLabelText('質問文')).toHaveLength(bundled.questions.length);
  expect(screen.getAllByRole('button', { name: '下へ' }).at(-1)?.hasAttribute('disabled')).toBe(true);
  const question = screen.getAllByLabelText('質問文')[0];
  fireEvent.change(question, { target: { value: '編集した質問' } });
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  expect(JSON.parse(localStorage.getItem(QUESTION_STORAGE_KEY)!).questions[0].text).toBe('編集した質問');
  fireEvent.change(question, { target: { value: ' ' } });
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  expect(screen.getByRole('alert').textContent).toContain('Q1');
  expect(JSON.parse(localStorage.getItem(QUESTION_STORAGE_KEY)!).questions[0].text).toBe('編集した質問');
  fireEvent.click(screen.getByRole('button', { name: '変更を取り消す' }));
  expect((question as HTMLTextAreaElement).value).toBe('編集した質問');
});

it('reorders questions and restores bundled data only after confirmation', () => {
  open();
  fireEvent.click(screen.getAllByRole('button', { name: '下へ' })[0]);
  expect((screen.getAllByLabelText('質問文')[0] as HTMLTextAreaElement).value)
    .toBe(bundled.questions[1].text);
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: '初期設定に戻す' }));
  expect((screen.getAllByLabelText('質問文')[0] as HTMLTextAreaElement).value)
    .toBe(bundled.questions[1].text);
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: '初期設定に戻す' }));
  expect((screen.getAllByLabelText('質問文')[0] as HTMLTextAreaElement).value)
    .toBe(bundled.questions[0].text);
  expect(localStorage.getItem(QUESTION_STORAGE_KEY)).toBeNull();
  confirm.mockRestore();
});
