// Humo de la build para el CI: sirve www/ y comprueba que la pantalla de login SE VE.
// No necesita Firebase ni cuentas: solo abre la app sin sesión.
//
// Existe por el fallo que dejó la app en negro en producción mientras en desarrollo funcionaba:
// con el proveedor de Ionic equivocado, la build optimizada no registraba ningún componente.
const { chromium } = require('playwright');
const { serveWww } = require('../helpers/serve-www');
const { BASE_URL } = require('../helpers/config');

(async () => {
  const stop = await serveWww();
  const browser = await chromium.launch();
  const problemas = [];
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', (error) => problemas.push(`error de JavaScript: ${error.message}`));
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
    await page.waitForSelector('ion-button', { timeout: 30000 });
    await page.waitForTimeout(1500);

    const estado = await page.evaluate(() => {
      const boton = document.querySelector('ion-button');
      const rect = boton?.getBoundingClientRect();
      return {
        registrados: ['ion-app', 'ion-content', 'ion-button'].every((tag) => !!customElements.get(tag)),
        visible: !!rect && rect.width > 0 && rect.height > 0 && getComputedStyle(boton).opacity !== '0',
        invisibles: document.querySelectorAll('.ion-page-invisible').length,
        // Material pinta los botones en mayúsculas, así que se compara sin distinguirlas.
        texto: /entrar/i.test(document.body.innerText),
      };
    });

    if (!estado.registrados) problemas.push('los componentes de Ionic no se registran');
    if (!estado.visible) problemas.push('los botones no se ven (pantalla en blanco)');
    if (estado.invisibles > 0) problemas.push(`${estado.invisibles} página(s) se quedan invisibles`);
    if (!estado.texto) problemas.push('la pantalla de login no muestra su contenido');
  } finally {
    await browser.close();
    await stop();
  }

  if (problemas.length > 0) {
    console.error('La build no se ve bien:\n - ' + problemas.join('\n - '));
    process.exit(1);
  }
  console.log('La build de producción se ve correctamente.');
})().catch((error) => {
  console.error('El humo de la build se ha cortado:', error.message);
  process.exit(1);
});
