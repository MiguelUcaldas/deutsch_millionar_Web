// Genera los íconos PNG de la PWA a partir de public/favicon.svg (se usa Chromium de Playwright).
// Se ejecuta con: npm run generar-iconos
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const publico = path.resolve(import.meta.dirname, '..', 'public');
const svg = readFileSync(path.join(publico, 'favicon.svg'), 'utf8');

const navegador = await chromium.launch();
const pagina = await navegador.newPage();

async function pintar(archivo: string, lado: number, margen: number) {
  await pagina.setViewportSize({ width: lado, height: lado });
  // El margen deja una zona segura para íconos «maskable» (el sistema los recorta en círculo).
  await pagina.setContent(
    `<body style="margin:0;background:#0e1424;display:grid;place-items:center;height:100vh">
       <div style="width:${lado - margen * 2}px;height:${lado - margen * 2}px">${svg.replace(
         '<svg ',
         '<svg width="100%" height="100%" ',
       )}</div>
     </body>`,
  );
  await pagina.screenshot({ path: path.join(publico, archivo) });
  console.log(`public/${archivo}`);
}

await pintar('icono-192.png', 192, 0);
await pintar('icono-512.png', 512, 0);
await pintar('icono-maskable-512.png', 512, 64);
await pintar('apple-touch-icon.png', 180, 0);
await navegador.close();
