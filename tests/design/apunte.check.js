// Comprueba los detalles de un registro, «¿Se te olvidó apuntar una?» y la pantalla de bloqueo.
//   node tests/design/apunte.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];

const DETALLES = 'src/app/components/fap-details/fap-details.modal.ts';
tiene(DETALLES, ['guardar-detalles', 'estrella', 'etiqueta', 'nueva-etiqueta', 'nota', 'f-label', 'seleccionada', 'fill="outline"']);
noTiene(DETALLES, [...COLORES_VIEJOS, '--ion-color-step-250']);

const OLVIDADA = 'src/app/pages/sumar/add-past-fap.modal.ts';
tiene(OLVIDADA, ['¿Se te olvidó apuntar una?', 'mode="ios"', 'atajos', 'fecha', 'resumen', 'resumen-fecha', 'tipo-compania', 'tipo-solitario', 'confirmar', 'f-paper']);
assert.match(leer(OLVIDADA), /class="[^"]*\bf-key\b[^"]*\bconfirmar\b/, `${OLVIDADA}: confirmar es una tecla f-key`);
assert.match(leer(OLVIDADA), /\[class\.pink\]="[^"]+"/, `${OLVIDADA}: la tecla de confirmar es rosa en compañía ([class.pink])`);
assert.match(leer(OLVIDADA), /\[class\.solo\]="[^"]+"/, `${OLVIDADA}: y cian en solitario ([class.solo])`);
noTiene(OLVIDADA, [...COLORES_VIEJOS, 'mode="md"']);

const BLOQUEO = 'src/app/components/lock-screen/lock-screen.component.ts';
tiene(BLOQUEO, ["'Notas' : 'Follendario'", 'translate="no"', 'aria-live="polite"', '¿has olvidado el PIN?', 'olvidado', 'teclado', 'puntos', 'var(--f-']);
noTiene(BLOQUEO, ['SexControl', 'He olvidado el PIN', '--ion-text-color', '--ion-background-color', '--ion-color-step', '🔒']);
assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(leer(BLOQUEO)), `${BLOQUEO}: colores en hexadecimal; usa los tokens --f-*`);
console.log('apunte: ok');
