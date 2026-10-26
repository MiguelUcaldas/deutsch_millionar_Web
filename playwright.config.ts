import { defineConfig } from '@playwright/test';
import { TEMARIO } from './tests/e2e/temario';

const PUERTO = 5174;

export default defineConfig({
  testDir: 'tests/e2e',
  // Capturas de referencia separadas por sistema operativo (el texto se dibuja distinto).
  snapshotPathTemplate: '{testDir}/capturas/{platform}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  webServer: {
    // El modo «test» expone la respuesta correcta en un atributo data- y permite fijar la semilla.
    command: `npx vite --mode test --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}`,
    env: { TEMARIO },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  use: { baseURL: `http://localhost:${PUERTO}`, locale: 'es' },
});
