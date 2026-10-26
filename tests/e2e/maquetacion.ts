import type { Page } from '@playwright/test';

/**
 * Revisa la maquetación de lo que hay en pantalla y devuelve los problemas encontrados:
 * scroll horizontal de la página, textos que se montan unos sobre otros y textos recortados.
 */
export async function revisarMaquetacion(page: Page, etiqueta = ''): Promise<string[]> {
  // Con el alto de página completo la barra pegajosa queda en su sitio natural y no tapa nada.
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  const ancho = page.viewportSize()!.width;
  await page.setViewportSize({ width: ancho, height: Math.min(alto, 6000) });

  const problemas = await page.evaluate(() => {
    const encontrados: string[] = [];
    const nombre = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;

    // 1) Sin scroll horizontal en la página.
    const raiz = document.documentElement;
    if (raiz.scrollWidth > window.innerWidth + 1) {
      encontrados.push(`scroll horizontal: ${raiz.scrollWidth} > ${window.innerWidth}`);
    }

    // Si hay un diálogo abierto solo se revisa el diálogo (el resto queda tapado por el velo).
    const dialogo = document.querySelector('[role="dialog"]');
    const zona: ParentNode = dialogo ?? document.body;

    // 2) Textos visibles: una caja por línea de cada nodo de texto.
    interface Linea {
      nodo: Text;
      x: number;
      y: number;
      x2: number;
      y2: number;
    }
    const lineas: Linea[] = [];
    const recorrido = document.createTreeWalker(zona as Node, NodeFilter.SHOW_TEXT);
    for (
      let nodo = recorrido.nextNode() as Text | null;
      nodo;
      nodo = recorrido.nextNode() as Text | null
    ) {
      if (!nodo.textContent?.trim()) continue;
      const padre = nodo.parentElement;
      if (!padre || padre.closest('[aria-hidden="true"], .oculto-visual, script, style')) continue;
      const estilo = getComputedStyle(padre);
      if (estilo.visibility === 'hidden' || estilo.display === 'none') continue;
      const rango = document.createRange();
      rango.selectNodeContents(nodo);
      for (const r of rango.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        // Solo cuenta lo que se ve: el texto fuera de un contenedor con scroll queda recortado.
        let x = r.left;
        let y = r.top;
        let x2 = r.right;
        let y2 = r.bottom;
        for (let el: Element | null = padre; el && el !== document.body; el = el.parentElement) {
          const e = getComputedStyle(el);
          if (e.overflowX === 'visible' && e.overflowY === 'visible') continue;
          const c = el.getBoundingClientRect();
          if (e.overflowX !== 'visible') {
            x = Math.max(x, c.left);
            x2 = Math.min(x2, c.right);
          }
          if (e.overflowY !== 'visible') {
            y = Math.max(y, c.top);
            y2 = Math.min(y2, c.bottom);
          }
        }
        if (x2 - x < 1 || y2 - y < 1) continue;
        lineas.push({ nodo, x, y, x2, y2 });
      }
    }
    const margen = 1.5;
    for (let i = 0; i < lineas.length; i++) {
      for (let j = i + 1; j < lineas.length; j++) {
        const a = lineas[i]!;
        const b = lineas[j]!;
        if (a.nodo === b.nodo) continue;
        const dx = Math.min(a.x2, b.x2) - Math.max(a.x, b.x);
        const dy = Math.min(a.y2, b.y2) - Math.max(a.y, b.y);
        if (dx > margen && dy > margen) {
          encontrados.push(
            `texto superpuesto: «${a.nodo.textContent!.trim().slice(0, 30)}» (${nombre(a.nodo.parentElement!)}) con «${b.nodo.textContent!.trim().slice(0, 30)}» (${nombre(b.nodo.parentElement!)})`,
          );
        }
      }
    }

    // 3) Nada de texto recortado en botones, celdas y etiquetas.
    for (const el of (zona as Element | Document).querySelectorAll<HTMLElement>(
      'button, td, th, .chip, a, label, kbd',
    )) {
      if (el.closest('[aria-hidden="true"]') || el.offsetParent === null) continue;
      if (el.scrollWidth > el.clientWidth + 1) {
        encontrados.push(`texto recortado en ${nombre(el)}: ${el.scrollWidth} > ${el.clientWidth}`);
      }
    }
    return [...new Set(encontrados)];
  });

  await page.setViewportSize({ width: ancho, height: 800 });
  return problemas.map((p) => (etiqueta ? `[${etiqueta}] ${p}` : p));
}
