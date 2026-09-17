// Comprueba la ficha del amigo, compartir invitación, elegir @usuario y crear grupo.
//   node tests/design/modales.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];

const FICHA = 'src/app/components/friend-detail/friend-detail.modal.ts';
// tests/e2e/social pulsa .accion-duelo y .accion-pulla (los textos de las hojas salen de amigos.page.ts y friend.model.ts).
tiene(FICHA, ['accion-duelo', 'accion-pulla', 'accion-reaccion', 'accion-privacidad', 'accion-eliminar', 'accion-bloquear', 'aceptar-duelo', 'rechazar-duelo', 'duelo-marcador', 've-de-ti']);
assert.match(leer(FICHA), /class="[^"]*\bf-key pink\b[^"]*\baccion-duelo\b/, `${FICHA}: retar es la tecla rosa (f-key pink accion-duelo)`);
assert.match(leer(FICHA), /class="[^"]*\bf-key solo\b[^"]*\baccion-pulla\b/, `${FICHA}: la pulla es la tecla cian (f-key solo accion-pulla)`);
tiene(FICHA, ['f-card', 'f-label', 'f-legend', 'f-mid', 'f-ghost danger']);
noTiene(FICHA, [...COLORES_VIEJOS, '--ion-color-step-100']);

const QR = 'src/app/components/share-invite/share-invite.modal.ts';
// tests/e2e/invites: el QR sigue siendo una <img> dentro de .qr, el enlace un <code> dentro de .enlace
// y el primer ion-button de la cabecera cierra.
tiene(QR, ['class="qr', 'class="enlace', '<code', 'compartir-invitacion', 'copiar-invitacion', 'renovar-invitacion', 'assets/follendario/simbolo.png']);
assert.match(leer(QR), /class="qr[^"]*"[\s\S]{0,300}?<img /, `${QR}: el QR se pinta con <img> dentro de .qr`);
assert.match(leer(QR), /<ion-header>[\s\S]*?<ion-button[^>]*\(click\)="close\(\)"/, `${QR}: el primer botón de la cabecera cierra`);
assert.match(leer(QR), /class="[^"]*\bf-key pink\b[^"]*\bcompartir-invitacion\b/, `${QR}: compartir es la tecla rosa`);
noTiene(QR, COLORES_VIEJOS);

const USUARIO = 'src/app/components/username/username.modal.ts';
tiene(USUARIO, ['guardar-usuario', 'usuario-mas-tarde', 'campo-usuario', 'f-key pink', 'fill="outline"']);
noTiene(USUARIO, COLORES_VIEJOS);

const CREAR = 'src/app/pages/create-group/create-group.page.html';
tiene(CREAR, ['crear-grupo', 'nombre-grupo', 'amigo-seleccionable', 'f-row', 'f-key pink']);
noTiene(CREAR, [...COLORES_VIEJOS, '<ion-fab']);
console.log('modales: ok');
