import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

/** Lee un texto simple (`campo: '...'`) de la configuración del temario para nombrar la app instalada. */
function leerCampo(temario: string, campo: string): string | undefined {
  try {
    const texto = readFileSync(
      path.resolve(import.meta.dirname, `temarios/${temario}/temario.config.ts`),
      'utf8',
    );
    return new RegExp(`^\\s*${campo}:\\s*'([^']*)'`, 'm').exec(texto)?.[1];
  } catch {
    return undefined;
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const temario = env.TEMARIO ?? 'aleman';
  const base = env.BASE_PATH ?? '/';
  const nombre = leerCampo(temario, 'titulo') ?? 'Millonario';

  return {
    base,
    resolve: {
      alias: [
        { find: '@motor', replacement: path.resolve(import.meta.dirname, 'src/motor') },
        // "@temario" a secas es la configuración; "@temario/..." es cualquier archivo de la carpeta.
        {
          find: /^@temario$/,
          replacement: path.resolve(import.meta.dirname, `temarios/${temario}/temario.config.ts`),
        },
        {
          find: /^@temario\//,
          replacement: path.resolve(import.meta.dirname, `temarios/${temario}`) + '/',
        },
      ],
    },
    plugins: [
      svelte(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['recursos/iconos/favicon.svg', 'recursos/iconos/apple-touch-icon.png'],
        manifest: {
          name: nombre,
          short_name: nombre.length > 14 ? 'Millonario' : nombre,
          description: leerCampo(temario, 'descripcion') ?? 'Juego de preguntas tipo millonario',
          lang: 'es',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#0e1424',
          theme_color: '#0e1424',
          icons: [
            { src: 'recursos/iconos/icono-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'recursos/iconos/icono-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'recursos/iconos/icono-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,mp3}'],
          runtimeCaching: [
            {
              // Las fuentes vienen de Google Fonts: se guardan para que el juego se vea igual sin conexión.
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fuentes',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    test: {
      include: ['tests/motor/**/*.test.ts', 'tests/aleman/**/*.test.ts'],
      environment: 'node',
    },
  };
});
