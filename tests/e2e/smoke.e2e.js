// Humo de la BUILD DE PRODUCCIÓN. Existe por un fallo real: al arrancar Ionic con el proveedor
// que no tocaba, la build optimizada no registraba ningún componente y la app se veía en negro,
// mientras que con "ionic serve" funcionaba. Por eso estas pruebas van siempre contra www/.
const { chromium } = require('playwright');
const { appContext } = require('../helpers/firebase');
const { expectEqual, expectTrue, title } = require('../helpers/report');
const { signInApp, shot, BASE_URL } = require('./app');

async function run() {
  title('E2E · la build de producción se ve y funciona');
  const browser = await chromium.launch();
  try {
    const page = await (await appContext(browser)).newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
    await page.waitForSelector('ion-button', { timeout: 30000 });
    await page.waitForTimeout(1500);

    // Lo que fallaba: los componentes de Ionic no llegaban a registrarse y todo quedaba invisible.
    const estado = await page.evaluate(() => ({
      registrados: ['ion-app', 'ion-content', 'ion-button'].every((tag) => !!customElements.get(tag)),
      visible: (() => {
        const boton = document.querySelector('ion-button');
        const rect = boton?.getBoundingClientRect();
        return !!rect && rect.width > 0 && rect.height > 0 && getComputedStyle(boton).opacity !== '0';
      })(),
      pagina: !document.querySelector('.ion-page-invisible'),
    }));
    expectTrue('los componentes de Ionic se registran', estado.registrados);
    expectTrue('los botones se ven (nada de pantalla en blanco)', estado.visible);
    expectTrue('ninguna página se queda invisible', estado.pagina);
    await shot(page, 'smoke-login');

    // Con sesión, las tres pestañas cargan con sus datos.
    const dentro = await signInApp(browser, 'a');
    for (const [ruta, selector, nombre] of [
      ['/tabs/sumar', '.total', 'sumar'],
      ['/tabs/amigos', 'ion-searchbar', 'amigos'],
      ['/tabs/estadisticas', 'ion-content', 'estadisticas'],
    ]) {
      await dentro.goto(`${BASE_URL}${ruta}`, { waitUntil: 'load' });
      await dentro.waitForSelector(selector, { state: 'visible', timeout: 30000 });
      await dentro.waitForTimeout(1200);
      await shot(dentro, `smoke-${nombre}`);
      expectTrue(`la pestaña ${nombre} carga`, true);
    }
    expectEqual('sin errores de JavaScript', dentro.errors, []);
  } finally {
    await browser.close();
  }
}

module.exports = { run };
