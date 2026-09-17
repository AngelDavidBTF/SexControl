// Comprueba que Sumar usa la firma (calendario + marcador + teclas) y conserva lo que usan los E2E.
//   node tests/design/sumar.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('src/app/pages/sumar/sumar.page.html', 'utf8');
const ts = fs.readFileSync('src/app/pages/sumar/sumar.page.ts', 'utf8');

for (const pieza of ['<app-marca titulo="follendario">', 'class="f-cal su-cal"', 'class="f-cal-rings"', 'class="f-cal-head"', 'class="f-cal-body"', '<app-calendario-mes', 'class="f-key pink f-key-big sumar-compania"', 'class="f-key solo f-key-big sumar-solitario"', 'class="f-btn sumar-olvidada"', 'class="f-ghost borrar-ultima"']) {
  assert.ok(html.includes(pieza), `sumar.page.html: falta ${pieza}`);
}
// .total visible en /tabs/sumar (tests/e2e/smoke) y los números marcados como dato.
assert.match(html, /<app-marcador class="su-tiles-big total" dato /, 'el total debe ser <app-marcador class="su-tiles-big total" dato>');
assert.equal((html.match(/<app-marcador /g) || []).length, 3, 'tres marcadores: total, compañía y solitario');
assert.ok(!html.includes('logo-sexcontrol'), 'el logo viejo ya no se usa');
assert.ok(html.includes("'CON ALGUIEN' : 'EN COMPAÑÍA'") && html.includes("'POR MI CUENTA' : 'EN SOLITARIO'"), 'textos de las teclas con variante discreta');

assert.match(ts, /this\.ultimoApunte = \{ tipo: solitario \? 's' : 'c', seq: /, 'sumar() pone el sello antes de escribir');
assert.ok(ts.indexOf('this.ultimoApunte = {') < ts.indexOf('await this.fapService.addFap(uid, solitario)'), 'el sello va antes de addFap');
assert.match(ts, /this\.ui\.celebrate\(\);/, 'objetivo cumplido lanza la celebración');
assert.match(ts, /mesCalendario\(stats\.days, now, now\)/, 'el mes sale de stats.days (sin lecturas nuevas)');
assert.ok(!/\.get(Doc|Docs)\(|getDocs?\b/.test(ts), 'Sumar no añade lecturas de Firestore');
console.log('sumar: ok');
