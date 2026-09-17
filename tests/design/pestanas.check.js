// Comprueba la barra de pestañas (tecla rosa de Sumar), la cabecera y la marca de la barra superior.
//   node tests/design/pestanas.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');

const tabs = leer('src/app/tabs/tabs.page.html');
for (const pestana of ['amigos', 'sumar', 'estadisticas']) {
  assert.match(tabs, new RegExp(`<ion-tab-button tab="${pestana}" href="/tabs/${pestana}">`), `falta la pestaña ${pestana}`);
}
assert.match(tabs, /<span class="f-tab-key" aria-hidden="true"><ion-icon name="add"><\/ion-icon><\/span>/, 'Sumar debe ser la tecla rosa .f-tab-key');
assert.equal((tabs.match(/<ion-tab-button /g) || []).length, 3, 'las pestañas siguen siendo tres');

const cabecera = leer('src/app/components/header/header.component.ts');
assert.match(cabecera, /<ion-back-button defaultHref="\/" text="" aria-label="Volver"><\/ion-back-button>/);

assert.ok(fs.existsSync('src/app/components/ui/marca.component.ts'), 'falta app-marca');
assert.match(leer('src/app/components/ui/marca.component.ts'), /selector: 'app-marca'/);
console.log('pestañas: ok');
