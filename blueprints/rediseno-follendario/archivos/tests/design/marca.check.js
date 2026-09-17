// Comprueba la marca instalable: logos en assets, iconos generados y manifiesto de Follendario.
//   node tests/design/marca.check.js
const fs = require('node:fs');
const assert = require('node:assert/strict');

function png(ruta) {
  assert.ok(fs.existsSync(ruta), `falta ${ruta}`);
  const datos = fs.readFileSync(ruta);
  assert.equal(datos.subarray(1, 4).toString('ascii'), 'PNG', `${ruta} no es un PNG`);
  return { ancho: datos.readUInt32BE(16), alto: datos.readUInt32BE(20) };
}

for (const logo of ['simbolo', 'logotipo', 'logotipo-tinta']) {
  png(`src/assets/follendario/${logo}.png`);
}
for (const [ruta, lado] of [['public/icon-192.png', 192], ['public/icon-512.png', 512], ['public/icon-512-maskable.png', 512], ['src/assets/icon/favicon.png', 512]]) {
  assert.deepEqual(png(ruta), { ancho: lado, alto: lado }, `${ruta} debe medir ${lado}×${lado}`);
}
const ico = fs.readFileSync('public/favicon.ico');
assert.equal(ico.readUInt16LE(2), 1, 'public/favicon.ico no es un icono');

const manifiesto = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));
assert.equal(manifiesto.name, 'Follendario');
assert.equal(manifiesto.short_name, 'Follendario');
assert.equal(manifiesto.theme_color, '#10081a');
assert.ok(manifiesto.icons.some((icono) => icono.purpose === 'maskable' && icono.src === 'icon-512-maskable.png'), 'falta el icono maskable');
console.log('marca: ok');
