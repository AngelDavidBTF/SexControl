// Genera los iconos de la app a partir del símbolo del logo (calendario + berenjena) sobre ciruela.
//   node scripts/iconos-follendario.js
// Solo el símbolo: el nombre no se lee a tamaño de icono. Usa el Chromium de Playwright para pintar.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const SIMBOLO = 'src/assets/follendario/simbolo.png';
const CIRUELA = '#10081a';

// [destino, lado en px, proporción del lado que ocupa el símbolo]
const SALIDAS = [
  ['public/icon-192.png', 192, 0.72],
  ['public/icon-512.png', 512, 0.72],
  // Maskable: el sistema recorta hasta un círculo del 80 %, así que el símbolo va más pequeño.
  ['public/icon-512-maskable.png', 512, 0.56],
  ['src/assets/icon/favicon.png', 512, 0.8],
];

(async () => {
  const origen = 'data:image/png;base64,' + fs.readFileSync(SIMBOLO).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pintar = (lado, proporcion) =>
    page.evaluate(
      async ({ origen, lado, proporcion, fondo }) => {
        const img = new Image();
        img.src = origen;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = fondo;
        ctx.fillRect(0, 0, lado, lado);
        const ancho = lado * proporcion;
        const alto = (ancho * img.height) / img.width;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, (lado - ancho) / 2, (lado - alto) / 2, ancho, alto);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { origen, lado, proporcion, fondo: CIRUELA },
    );

  for (const [destino, lado, proporcion] of SALIDAS) {
    fs.writeFileSync(destino, Buffer.from(await pintar(lado, proporcion), 'base64'));
    console.log('escrito', destino);
  }

  // favicon.ico con una sola imagen PNG de 32 px dentro (formato ICO con PNG embebido).
  const png32 = Buffer.from(await pintar(32, 0.9), 'base64');
  const cabecera = Buffer.alloc(22);
  cabecera.writeUInt16LE(0, 0); // reservado
  cabecera.writeUInt16LE(1, 2); // tipo: icono
  cabecera.writeUInt16LE(1, 4); // una imagen
  cabecera.writeUInt8(32, 6); // ancho
  cabecera.writeUInt8(32, 7); // alto
  cabecera.writeUInt8(0, 8); // sin paleta
  cabecera.writeUInt8(0, 9); // reservado
  cabecera.writeUInt16LE(1, 10); // planos
  cabecera.writeUInt16LE(32, 12); // bits por píxel
  cabecera.writeUInt32LE(png32.length, 14); // tamaño de los datos
  cabecera.writeUInt32LE(22, 18); // desplazamiento de los datos
  fs.writeFileSync(path.join('public', 'favicon.ico'), Buffer.concat([cabecera, png32]));
  console.log('escrito public/favicon.ico');

  await browser.close();
})().catch((error) => {
  console.error('No se pudieron generar los iconos:', error.message);
  process.exit(1);
});
