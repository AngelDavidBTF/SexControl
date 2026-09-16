// Ejecuta los E2E contra la build de producción (www/), que se sirve en local durante la prueba.
// Ver tests/README.md.
const { serveWww } = require('../helpers/serve-www');
const { summary } = require('../helpers/report');
const { BASE_URL } = require('../helpers/config');

const SUITES = [require('./smoke.e2e'), require('./social.e2e'), require('./invites.e2e'), require('./pwa.e2e')];

(async () => {
  // Con SEXCONTROL_TEST_URL apuntando a otro sitio (el dominio publicado, por ejemplo) no se
  // levanta nada en local.
  const local = BASE_URL.startsWith('http://localhost');
  const stop = local ? await serveWww() : null;
  if (local) {
    console.log(`Sirviendo www/ en ${BASE_URL}`);
  } else {
    console.log(`Probando contra ${BASE_URL}`);
  }
  try {
    for (const suite of SUITES) {
      await suite.run();
    }
  } finally {
    await stop?.();
  }
  const failures = summary('E2E');
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
  console.error('\nLos E2E se han cortado:', error.message);
  process.exit(1);
});
