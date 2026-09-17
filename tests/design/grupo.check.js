// Comprueba la pantalla de grupo rediseñada: ticket de la semana, totales, muro y miembros.
//   node tests/design/grupo.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];
const estiloLimpio = (ruta) => {
  const css = leer(ruta);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${ruta}: colores en hexadecimal; usa los tokens --f-*`);
  assert.ok(!css.includes('--ion-color-'), `${ruta}: usa los tokens --f-*, no --ion-color-*`);
  assert.ok(Buffer.byteLength(css) < 4000, `${ruta}: pasa de 4 kB`);
};

const HTML = 'src/app/pages/group/group.page.html';
// Selectores de tests/e2e/invites y clases que ya existían.
tiene(HTML, ['editar-grupo', 'salir-grupo', 'compartir-semana', 'ver-palmares', 'periodo-ranking', 'total-grupo', 'total-compania', 'total-solitario', 'escribir-muro', 'quitar-muro', 'privacidad-grupo', 'toggle-privacidad-grupo', 'ion-searchbar', 'hacer-admin', 'quitar-miembro', 'pedir-amistad']);
assert.match(leer(HTML), /<ion-item[^>]*class="[^"]*\bmiembro\b/, `${HTML}: los miembros siguen siendo <ion-item class="… miembro">`);
// Piezas nuevas.
tiene(HTML, ['<app-ticket', 'class="f-console', '~/muro', 'f-row', 'f-badge c', 'f-badge s', 'f-card', 'f-big', 'f-num-c', 'f-num-s', 'mode="ios"', 'f-key neutral']);
noTiene(HTML, [...COLORES_VIEJOS, '<ion-text', 'contenedorNumeros', 'assets/groups/1.svg']);
estiloLimpio('src/app/pages/group/group.page.scss');

const TS = 'src/app/pages/group/group.page.ts';
tiene(TS, ['TicketComponent', 'filasTicket']);

const MIEMBROS = 'src/app/pages/group/add-members.modal.ts';
tiene(MIEMBROS, ['confirmar-miembros', 'f-row']);
noTiene(MIEMBROS, COLORES_VIEJOS);
console.log('grupo: ok');
