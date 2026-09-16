// Ejecuta todas las pruebas de reglas contra el proyecto real. Ver tests/README.md.
const { summary } = require('../helpers/report');

const SUITES = [
  require('./privacy.rules'),
  require('./social.rules'),
  require('./groups.rules'),
  require('./invites.rules'),
  require('./feed.rules'),
];

(async () => {
  for (const suite of SUITES) {
    await suite.run();
  }
  const failures = summary('Reglas');
  process.exit(failures === 0 ? 0 : 1);
})().catch((error) => {
  console.error('\nLas pruebas de reglas se han cortado:', error.message);
  process.exit(1);
});
