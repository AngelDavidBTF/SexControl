// Barrido final del rediseño: ajustes y añadir amigo, y ningún resto de la marca o la paleta viejas.
//   node tests/design/final.check.js
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];
const estiloLimpio = (ruta) => {
  const css = leer(ruta);
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${ruta}: colores en hexadecimal; usa los tokens --f-*`);
  assert.ok(!css.includes('--ion-color-'), `${ruta}: usa los tokens --f-*, no --ion-color-*`);
};

const AJUSTES = 'src/app/pages/ajustes/ajustes.page.html';
tiene(AJUSTES, ['guardar-perfil', 'guardar-objetivos', 'cambiar-usuario', 'mi-usuario', 'pausar', 'buscable', 'recordatorios', 'discreto', 'ocultar-numeros', 'nombre-neutro', 'bloqueo-pin', 'tema', 'cerrar-sesion', 'borrar-cuenta', 'f-card', 'f-section', 'f-label', 'mode="ios"', 'f-ghost danger']);
assert.match(leer(AJUSTES), /class="[^"]*\bf-key pink\b[^"]*\bguardar-perfil\b/, `${AJUSTES}: guardar perfil es la tecla rosa`);
noTiene(AJUSTES, COLORES_VIEJOS);
estiloLimpio('src/app/pages/ajustes/ajustes.page.scss');

const ANADIR = 'src/app/pages/add-friend/add-friend.page.html';
tiene(ANADIR, ['anadir-amigo', 'buscar-amigo', 'elegir-mi-usuario', 'invitar-enlace', 'mi-handle', 'f-row', 'f-card']);
noTiene(ANADIR, COLORES_VIEJOS);
estiloLimpio('src/app/pages/add-friend/add-friend.page.scss');

// Barrido de todo src/app (sin contar las pruebas unitarias).
function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? archivos(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const fuentes = archivos('src/app').filter((f) => /\.(html|ts|scss)$/.test(f) && !f.endsWith('.spec.ts'));
const PALETA_VIEJA = ['#fc445f', '#44c8fc', '#6c5ce7', '#5260ff', '#1e94cf', '#12233f', '#1f5c7a', '#2b1055', '#7a1f5c', '#06d6a0'];
for (const f of fuentes) {
  const texto = leer(f);
  const ruta = f.split(path.sep).join('/');
  assert.ok(!texto.includes('SexControl'), `${ruta}: todavía dice SexControl`);
  assert.ok(!texto.includes('logo-sexcontrol'), `${ruta}: usa el logo viejo`);
  assert.ok(!texto.includes('<app-heat-map'), `${ruta}: el mapa de calor lo sustituye el calendario`);
  for (const color of PALETA_VIEJA) {
    // heat-map.component.ts queda sin usar (decisión: se borra en la fase de funciones).
    if (!ruta.endsWith('heat-map.component.ts')) assert.ok(!texto.toLowerCase().includes(color), `${ruta}: color de la paleta vieja ${color}`);
  }
  if (/\.(html|ts)$/.test(f)) {
    for (const color of COLORES_VIEJOS) assert.ok(!texto.includes(color), `${ruta}: ${color} (secondary ahora es cian; usa clases f-key / f-badge)`);
    assert.ok(!texto.includes('mode="md"'), `${ruta}: los segmentos van con mode="ios"`);
  }
}
console.log(`final: ok (${fuentes.length} archivos revisados)`);
