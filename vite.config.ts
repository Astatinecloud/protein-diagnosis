import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => ({
  base: (loadEnv(mode, '.', '').BASE_PATH || '/').replace(/\/+$/, '') + '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testSetup.ts'],
  },
}));
