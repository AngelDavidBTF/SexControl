// Utilidades de los E2E: abrir la app, entrar con una cuenta de prueba y guardar capturas.
const fs = require('fs');
const path = require('path');
const { appContext } = require('../helpers/firebase');
const { accounts, PASSWORD, BASE_URL } = require('../helpers/config');

const SHOTS = path.join(__dirname, '..', '.out');

// Entra con una de las cuentas de prueba y deja la app en las pestañas.
async function signInApp(browser, which) {
  const page = await (await appContext(browser)).newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.errors = errors;
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
  await page.waitForSelector('ion-input[type="email"] input', { timeout: 30000 });
  await page.fill('ion-input[type="email"] input', accounts[which]);
  await page.fill('ion-input[type="password"] input', PASSWORD);
  await page.locator('ion-button[color="primary"]:has-text("Entrar")').click();
  await page.waitForURL(/tabs/, { timeout: 30000 });
  return page;
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
}

module.exports = { signInApp, shot, SHOTS, BASE_URL };
