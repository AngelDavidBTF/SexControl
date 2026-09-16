// La PWA: manifiesto, service worker activo y la app abriendo sin conexión.
const { chromium } = require('playwright');
const { appContext } = require('../helpers/firebase');
const { expectEqual, expectTrue, title } = require('../helpers/report');
const { BASE_URL } = require('./app');

async function run() {
  title('E2E · PWA instalable y sin conexión');
  const browser = await chromium.launch();
  try {
    const context = await appContext(browser);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });

    const manifest = await page.evaluate(async () => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? await (await fetch(link.href)).json() : null;
    });
    expectEqual('el manifiesto declara la app', manifest?.name, 'SexControl');
    expectEqual('se instala como aplicación', manifest?.display, 'standalone');
    expectTrue('tiene iconos', (manifest?.icons?.length ?? 0) > 0);

    // El service worker tarda un poco en tomar el control tras la primera carga.
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, { timeout: 30000 });
    expectTrue('el service worker toma el control', true);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('ion-button', { timeout: 30000 });
    const texto = await page.evaluate(() => document.body.innerText);
    expectTrue('sin conexión la app sigue abriendo', texto.includes('Login'));
    await context.setOffline(false);
  } finally {
    await browser.close();
  }
}

module.exports = { run };
