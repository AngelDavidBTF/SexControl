// Comprueba que los pares de color de src/theme/_tokens.scss cumplen WCAG 2.2 AA (4,5:1 para texto)
// en las cuatro pieles: claro, oscuro, discreto claro y discreto oscuro.
//   node tests/design/contraste.check.js   → sale con 0 si todo cumple
const fs = require('node:fs');
const assert = require('node:assert/strict');

const scss = fs.readFileSync('src/theme/_tokens.scss', 'utf8');

function bloque(selector) {
  const inicio = scss.indexOf(`${selector} {`);
  assert.notEqual(inicio, -1, `falta el bloque "${selector}" en _tokens.scss`);
  const fin = scss.indexOf('}', inicio);
  const vars = {};
  for (const [, nombre, hex] of scss.slice(inicio, fin).matchAll(/--f-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    vars[nombre] = hex.toLowerCase();
  }
  return vars;
}

function luminancia(hex) {
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const base = bloque('body');
const pieles = {
  claro: base,
  oscuro: { ...base, ...bloque('body.dark') },
  'discreto claro': { ...base, ...bloque('body.discreto:not(.dark)') },
  'discreto oscuro': { ...base, ...bloque('body.dark'), ...bloque('body.dark.discreto') },
};

const pares = [
  ['text', 'bg'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['muted', 'deep'],
  ['on-pink', 'pink'],
  ['on-solo', 'solo'],
  ['pink-text', 'surface'],
  ['solo-text', 'surface'],
  ['up', 'surface'],
  ['toast-ink', 'toast'],
  ['cal-ink', 'cal-paper'],
  ['cal-muted', 'cal-paper'],
  ['cal-muted', 'cal-cell'],
  ['cal-ink', 'cal-head'],
  ['tile-ink', 'tile'],
];

let fallos = 0;
for (const [piel, vars] of Object.entries(pieles)) {
  for (const [texto, fondo] of pares) {
    assert.ok(vars[texto] && vars[fondo], `${piel}: falta --f-${texto} o --f-${fondo}`);
    const ratio = contraste(vars[texto], vars[fondo]);
    if (ratio < 4.5) {
      fallos += 1;
      console.error(`${piel}: --f-${texto} sobre --f-${fondo} = ${ratio.toFixed(2)}:1 (mínimo 4,5:1)`);
    }
  }
}
assert.equal(fallos, 0, `${fallos} pares de color no llegan a 4,5:1`);
console.log(`contraste: ok (${Object.keys(pieles).length} pieles × ${pares.length} pares)`);
