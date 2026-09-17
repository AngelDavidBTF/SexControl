// Comprueba login y registro: plantillas y, en la build de producción servida, el aspecto real
// (fuente Geist, fondo de cada tema, tecla rosa de Entrar y marca o «Notas»).
//   npm run build -- --configuration production && node tests/design/acceso.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { serveWww } = require('../helpers/serve-www');
const { BASE_URL } = require('../helpers/config');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];
const estiloLimpio = (ruta) => {
  const css = leer(ruta);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${ruta}: colores en hexadecimal; usa los tokens --f-*`);
  assert.ok(!css.includes('--ion-color-'), `${ruta}: usa los tokens --f-*, no --ion-color-*`);
};

const LOGIN = 'src/app/pages/login/login.page.html';
// tests/e2e/app.js entra con estos selectores.
tiene(LOGIN, ['type="email"', 'type="password"', 'color="primary"', '>Entrar</ion-button>']);
tiene(LOGIN, ['assets/follendario/simbolo.png', 'assets/follendario/logotipo.png', 'assets/follendario/logotipo-tinta.png', 'lo-notas', 'f-key pink', 'f-btn', 'fill="outline"']);
noTiene(LOGIN, [...COLORES_VIEJOS, 'logo-sexcontrol', 'ion-item-divider']);
estiloLimpio('src/app/pages/login/login.page.scss');

const REGISTRO = 'src/app/pages/register/register.page.html';
tiene(REGISTRO, ['assets/follendario/simbolo.png', 'reg-notas', 'f-key pink', 'fill="outline"', 'formControlName="name"', 'formControlName="email"', 'formControlName="pass"', 'formControlName="repeatPass"']);
noTiene(REGISTRO, [...COLORES_VIEJOS, 'logo-sexcontrol', 'ion-item-divider']);
estiloLimpio('src/app/pages/register/register.page.scss');
noTiene('src/app/pages/register/register.page.scss', ['color: red']);

const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

async function mirar(browser, colorScheme, ajustes) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme });
  if (ajustes) {
    await context.addInitScript((valor) => localStorage.setItem('sexcontrol.settings.v1', valor), JSON.stringify(ajustes));
  }
  const page = await context.newPage();
  const errores = [];
  page.on('pageerror', (error) => errores.push(error.message));
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
  await page.waitForSelector('ion-input[type="email"] input', { timeout: 30000 });
  await page.waitForTimeout(1200);
  const estado = await page.evaluate(() => {
    const visible = (selector) => {
      const el = document.querySelector(selector);
      return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    };
    const entrar = document.querySelector('ion-button[color="primary"]');
    return {
      fuente: getComputedStyle(document.body).fontFamily,
      fondo: getComputedStyle(document.body).backgroundColor,
      entrar: entrar ? getComputedStyle(entrar.shadowRoot.querySelector('.button-native')).backgroundColor : null,
      borde: getComputedStyle(document.querySelector('ion-input[type="email"]')).getPropertyValue('--border-color').trim(),
      marca: visible('app-login .lo-marca'),
      notas: visible('app-login .lo-notas'),
      claro: visible('app-login .lo-claro'),
      oscuro: visible('app-login .lo-oscuro'),
    };
  });
  await context.close();
  assert.deepEqual(errores, [], `errores de JavaScript en /login (${colorScheme})`);
  return estado;
}

(async () => {
  const stop = await serveWww();
  const browser = await chromium.launch();
  try {
    const claro = await mirar(browser, 'light');
    assert.match(claro.fuente, /Geist/, 'el texto usa Geist');
    assert.equal(claro.fondo, rgb('#f4e6de'), 'tema claro: fondo papel crema #f4e6de');
    assert.equal(claro.entrar, rgb('#fc2a6c'), 'Entrar es la tecla rosa #fc2a6c');
    assert.equal(claro.borde, '#e2c5c9', 'los campos usan el borde del tema (ion-input.input-fill-outline en _ionic.scss)');
    assert.ok(claro.marca && claro.claro && !claro.oscuro && !claro.notas, 'tema claro: logotipo en tinta, sin «Notas»');

    const oscuro = await mirar(browser, 'dark');
    assert.equal(oscuro.fondo, rgb('#10081a'), 'tema oscuro: fondo ciruela #10081a');
    assert.ok(oscuro.oscuro && !oscuro.claro, 'tema oscuro: logotipo crema');

    const discreto = await mirar(browser, 'light', {
      theme: 'sistema',
      discreet: { enabled: true, lock: false, pinHash: null, pinSalt: null, hideNumbers: true, neutralName: true },
      reminders: { enabled: false, days: 3, hour: 21 },
    });
    assert.ok(discreto.notas && !discreto.marca, 'modo discreto con nombre neutro: se ve «Notas» y no la marca');
    assert.equal(discreto.fondo, rgb('#f2f1ee'), 'modo discreto claro: fondo neutro #f2f1ee');
  } finally {
    await browser.close();
    await stop();
  }
  console.log('acceso: ok');
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
