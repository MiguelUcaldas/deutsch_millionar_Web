import { expect, test } from '@playwright/test';

test.describe('PWA', () => {
  test('publica un manifiesto instalable con íconos', async ({ page, request }) => {
    await page.goto('/');
    const enlace = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(enlace).toBeTruthy();
    const manifiesto = await (await request.get(new URL(enlace!, page.url()).href)).json();
    expect(manifiesto.name).toBeTruthy();
    expect(manifiesto.display).toBe('standalone');
    expect(manifiesto.start_url).toBeTruthy();
    const tamanos = manifiesto.icons.map((i: { sizes: string }) => i.sizes);
    expect(tamanos).toEqual(expect.arrayContaining(['192x192', '512x512']));
    for (const icono of manifiesto.icons) {
      const respuesta = await request.get(new URL(icono.src, page.url()).href);
      expect(respuesta.status(), icono.src).toBe(200);
    }
  });

  test('funciona sin conexión después de la primera visita', async ({ page, context }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (ruta) => ruta.abort());
    await page.goto('/');
    await page.getByRole('heading', { level: 1 }).waitFor();
    // Espera a que el service worker esté activo y controlando la página.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
      .toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.locator('button.boton--principal').click();
    await expect(page.locator('[data-opcion]').first()).toBeVisible();
    await context.setOffline(false);
  });
});
