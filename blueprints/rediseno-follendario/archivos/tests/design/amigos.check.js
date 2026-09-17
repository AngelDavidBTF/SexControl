// Comprueba la pestaña Amigos rediseñada: piezas de Follendario y selectores que usan los E2E.
//   node tests/design/amigos.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
// Antes secondary era el rosa y primary el cian; el tema nuevo los invierte, así que ya no se usan en plantillas.
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];
const estiloLimpio = (ruta) => {
  const css = leer(ruta);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${ruta}: colores en hexadecimal; usa los tokens --f-*`);
  assert.ok(!css.includes('--ion-color-'), `${ruta}: usa los tokens --f-*, no --ion-color-*`);
  assert.ok(Buffer.byteLength(css) < 4000, `${ruta}: pasa de 4 kB`);
};

const HTML = 'src/app/pages/amigos/amigos.page.html';
// Selectores de tests/e2e (social, invites, smoke).
tiene(HTML, ['invitar-amigo', 'ion-searchbar', 'duelo-aviso', 'aceptar-reto', 'rechazar-reto', 'duelo-vivo', 'duelo-marcador', 'reaccion-texto', 'limpiar-reacciones', 'solicitudes-badge', 've-de-ti']);
assert.match(leer(HTML), /<ion-item[^>]*class="[^"]*\bamigo\b/, `${HTML}: los amigos siguen siendo <ion-item class="… amigo">`);
assert.match(leer(HTML), /<ion-item[^>]*class="[^"]*\bgrupo\b/, `${HTML}: los grupos siguen siendo <ion-item class="… grupo">`);
// El E2E lee el marcador del duelo como «1 – 4».
assert.match(leer(HTML), /duelo-marcador[\s\S]*?\{\{ duelo\.mine \}\}[\s\S]*?–[\s\S]*?\{\{ duelo\.theirs \}\}/, `${HTML}: el marcador del duelo es «mine – theirs»`);
// Piezas nuevas.
tiene(HTML, ['<app-marca titulo="amigos">', 'mode="ios"', 'class="f-console', 'class="f-line', 'f-row', 'f-badge c', 'f-badge s', 'f-badge t', 'f-key pink', 'f-section', '~/novedades', '~/te-han-escrito']);
noTiene(HTML, [...COLORES_VIEJOS, 'ion-item-divider', 'mode="md"', '[translucent]']);
estiloLimpio('src/app/pages/amigos/amigos.page.scss');

assert.match(leer('src/app/pages/amigos/amigos.page.ts'), /MarcaComponent/, 'amigos.page.ts importa MarcaComponent');

const LIGA = 'src/app/components/friends-league/friends-league.component.ts';
tiene(LIGA, ['class="f-card', 'f-label', 'mode="ios"', 'ver-liga', 'periodo-liga', 'dato']);
noTiene(LIGA, ['--ion-color-', 'mode="md"']);
console.log('amigos: ok');
