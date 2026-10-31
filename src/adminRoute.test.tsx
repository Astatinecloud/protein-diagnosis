import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';

it('does not register the admin route when disabled', async () => {
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_ENABLE_ADMIN', 'false');
  try {
    const { default: App } = await import('./App');
    render(<MemoryRouter initialEntries={['/admin']}><App /></MemoryRouter>);
    expect(screen.getByText('ページが見つかりません')).toBeTruthy();
    expect(screen.queryByText('質問データ管理画面')).toBeNull();
  } finally {
    vi.unstubAllEnvs();
  }
});
