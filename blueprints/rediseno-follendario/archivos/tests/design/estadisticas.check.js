// Comprueba Estadísticas rediseñada: el calendario de 6 meses sustituye al mapa de calor.
//   node tests/design/estadisticas.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');
const tiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(leer(ruta).includes(pieza), `${ruta}: falta ${pieza}`));
const noTiene = (ruta, piezas) => piezas.forEach((pieza) => assert.ok(!leer(ruta).includes(pieza), `${ruta}: sobra ${pieza}`));
const COLORES_VIEJOS = ['color="secondary"', 'color="tertiary"', 'color="warning"', 'color="light"'];

const HTML = 'src/app/pages/estadisticas/estadisticas.page.html';
// Clases que ya existían y se conservan.
tiene(HTML, ['nav-prev', 'nav-next', 'rango-desde', 'rango-hasta', 'total-periodo', 'reparto-compania', 'reparto-solitario', 'racha-actual', 'racha-mejor', 'dias-ultimo', 'compartir-anio', 'ver-historial', 'borrar-registro', 'cargar-mas', 'historial']);
assert.match(leer(HTML), /<ion-item[^>]*class="[^"]*\bregistro\b/, `${HTML}: el historial sigue siendo <ion-item class="… registro">`);
// Piezas nuevas.
tiene(HTML, ['<app-marca titulo="estadísticas">', 'mode="ios"', '<app-calendario-mes', 'f-paper', 'f-legend', 'f-card', 'f-big', 'f-section', 'f-num-c', 'f-num-s']);
noTiene(HTML, [...COLORES_VIEJOS, '<app-heat-map', 'mode="md"', '[translucent]']);

const TS = 'src/app/pages/estadisticas/estadisticas.page.ts';
tiene(TS, ['CalendarioMesComponent', 'MarcaComponent', 'ultimosMeses(stats.days, now, 6)']);
noTiene(TS, ['HeatMapComponent', 'heatMap(']);

const SCSS = 'src/app/pages/estadisticas/estadisticas.page.scss';
const css = leer(SCSS);
assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css), `${SCSS}: colores en hexadecimal; usa los tokens --f-*`);
assert.ok(!css.includes('--ion-color-'), `${SCSS}: usa los tokens --f-*, no --ion-color-*`);
assert.ok(Buffer.byteLength(css) < 4000, `${SCSS}: pasa de 4 kB (antes daba aviso de presupuesto)`);

const BARRAS = 'src/app/components/stats/bar-chart.component.ts';
tiene(BARRAS, ['--compania: var(--f-pink)', '--solitario: var(--f-solo)']);
noTiene(BARRAS, ['#fc445f', '#1e94cf', '--ion-color-']);
console.log('estadísticas: ok');
