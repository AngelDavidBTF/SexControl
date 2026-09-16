// Servidor estático mínimo para probar la build de producción (www/) con vuelta a index.html,
// como hace Firebase Hosting. Se usa desde los E2E; también se puede lanzar a mano:
//   node tests/helpers/serve-www.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PORT } = require('./config');

const ROOT = path.join(__dirname, '..', '..', 'www');
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

function createServer() {
  if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
    throw new Error('No hay build de producción en www/. Ejecuta antes: npm run build -- --configuration production');
  }
  return http.createServer((req, res) => {
    let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(ROOT, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

// Arranca el servidor y devuelve una función para pararlo. Si el puerto ya está ocupado se da por
// hecho que alguien sirve www/ (por ejemplo, este mismo script lanzado a mano) y se sigue.
async function serveWww() {
  const server = createServer();
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(PORT, resolve);
    });
  } catch (error) {
    if (error.code !== 'EADDRINUSE') {
      throw error;
    }
    console.log(`El puerto ${PORT} ya está ocupado: se usa lo que haya servido ahí.`);
    return () => Promise.resolve();
  }
  return () => new Promise((resolve) => server.close(resolve));
}

module.exports = { serveWww };

if (require.main === module) {
  serveWww().then(() => console.log(`www/ servido en http://localhost:${PORT}`));
}
