// Comprueba que el nombre visible es Follendario y que los identificadores internos no cambian.
//   node tests/design/nombre.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

const leer = (ruta) => fs.readFileSync(ruta, 'utf8');

const index = leer('src/index.html');
assert.match(index, /<title>Follendario<\/title>/, 'index.html: <title>Follendario</title>');
assert.match(index, /<meta name="theme-color" content="#10081a">/, 'index.html: theme-color #10081a');
assert.match(index, /<meta name="color-scheme" content="light dark">/, 'index.html: color-scheme light dark');
assert.match(index, /usar Follendario\./, 'index.html: noscript con Follendario');

assert.match(leer('src/app/core/settings.service.ts'), /const APP_TITLE = 'Follendario';/);
assert.match(leer('src/app/core/settings.service.ts'), /const STORAGE_KEY = 'sexcontrol\.settings\.v1';/, 'la clave de localStorage no cambia');
assert.match(leer('src/app/core/reminders.service.ts'), /'Notas' : 'Follendario'/);
assert.match(leer('capacitor.config.ts'), /appName: 'Follendario'/, "capacitor.config.ts: appName: 'Follendario'");
assert.match(leer('capacitor.config.ts'), /appId: 'online\.sexcontrol\.app'/, 'el appId no cambia (decisión: solo el nombre visible)');

for (const tarjeta of ['src/app/shared/group-card.ts', 'src/app/shared/year-card.ts']) {
  const codigo = leer(tarjeta);
  assert.match(codigo, /fillText\('Follendario'/, `${tarjeta}: firma Follendario`);
  assert.match(codigo, /px Geist, /, `${tarjeta}: fuente Geist`);
  assert.match(codigo, /addColorStop\(0, '#10081a'\)/, `${tarjeta}: degradado desde ciruela #10081a`);
}

for (const ruta of ['src/index.html', 'src/app/core/settings.service.ts', 'src/app/core/reminders.service.ts', 'src/app/shared/group-card.ts', 'src/app/shared/year-card.ts']) {
  assert.ok(!leer(ruta).includes('SexControl'), `${ruta} todavía dice SexControl`);
}
console.log('nombre: ok');
