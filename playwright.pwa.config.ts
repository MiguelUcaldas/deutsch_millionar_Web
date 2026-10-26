import { defineConfig } from '@playwright/test';
import { TEMARIO } from './tests/e2e/temario';

const PUERTO = 4175;

// Prueba el sitio ya compilado (el service worker solo existe en la versión de producción).
export default defineConfig({
  testDir: 'tests/pwa',
  reporter: [['list']],
  webServer: {
    command: `npm run build && npx vite preview --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { TEMARIO },
  },
  use: { baseURL: `http://localhost:${PUERTO}`, locale: 'es' },
});
