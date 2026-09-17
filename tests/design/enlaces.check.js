// Comprueba recuperar contraseña, verificar email y las invitaciones que llegan por enlace.
//   node tests/design/enlaces.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];

const OLVIDO = 'src/app/pages/forgot-password/forgot-password.page.html';
tiene(OLVIDO, ['fill="outline"', 'type="email"', 'f-key pink']);
noTiene(OLVIDO, COLORES_VIEJOS);

const VERIFICAR = 'src/app/pages/verify-email/verify-email.page.html';
tiene(VERIFICAR, ['ya-verificado', 'f-key pink', 'f-title']);
noTiene(VERIFICAR, COLORES_VIEJOS);

const INVITACION = 'src/app/pages/invite/invite.page.ts';
tiene(INVITACION, ['aceptar-invitacion', '<span translate="no">Follendario</span>', 'f-key pink', 'f-title', 'f-ghost']);
assert.match(leer(INVITACION), /class="[^"]*\bf-key pink\b[^"]*\baceptar-invitacion\b/, `${INVITACION}: aceptar es la tecla rosa`);
noTiene(INVITACION, [...COLORES_VIEJOS, 'SexControl']);

const UNIRSE = 'src/app/pages/join-group/join-group.page.ts';
// tests/e2e/invites pulsa .entrar-grupo.
tiene(UNIRSE, ['entrar-grupo', 'aviso-privacidad', 'f-card', 'f-label', 'f-title']);
assert.match(leer(UNIRSE), /class="[^"]*\bf-key pink\b[^"]*\bentrar-grupo\b/, `${UNIRSE}: entrar es la tecla rosa`);
noTiene(UNIRSE, [...COLORES_VIEJOS, '👥']);
console.log('enlaces: ok');
