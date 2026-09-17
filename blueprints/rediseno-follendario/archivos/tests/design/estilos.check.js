// Comprueba que la build de producción lleva la piel de Follendario: tokens, piezas y movimiento.
//   npm run build -- --configuration production && node tests/design/estilos.check.js
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const hojas = fs.readdirSync('www').filter((f) => /^styles-[A-Z0-9]+\.css$/.test(f));
assert.equal(hojas.length, 1, 'www/ debe tener exactamente una hoja styles-*.css (¿falta la build?)');
const css = fs.readFileSync(path.join('www', hojas[0]), 'utf8');

const obligatorios = [
  ['token de fondo', '--f-bg:'],
  ['tema oscuro', 'body.dark'],
  ['piel discreta', 'body.discreto'],
  ['papel del calendario', '--f-cal-paper'],
  ['teclas', '.f-key'],
  ['consola', '.f-console'],
  ['ticket', '.f-ticket'],
  ['marcador', '.roll-tile'],
  ['casillas', '.f-mcell'],
  ['sello', '@keyframes f-stamp'],
  ['movimiento reducido', 'prefers-reduced-motion'],
  ['Geist', 'font-family:Geist'],
];
for (const [que, texto] of obligatorios) {
  assert.ok(css.includes(texto), `falta ${que} (${texto}) en ${hojas[0]}`);
}
const fuentes = fs.existsSync('www/media') ? fs.readdirSync('www/media').filter((f) => f.endsWith('.woff2')) : [];
assert.ok(fuentes.some((f) => f.startsWith('geist-latin-')), 'faltan las fuentes Geist en www/media');
assert.ok(fuentes.some((f) => f.startsWith('geist-mono-latin-')), 'faltan las fuentes Geist Mono en www/media');
const ngsw = JSON.parse(fs.readFileSync('ngsw-config.json', 'utf8'));
assert.ok(ngsw.assetGroups.some((g) => g.resources.files.includes('/media/*.woff2')), 'ngsw-config.json no cachea /media/*.woff2');
console.log(`estilos: ok (${hojas[0]}, ${fuentes.length} fuentes woff2)`);
