// Acceso a Firebase desde las pruebas: App Check con token de depuración, sesión con las cuentas
// de prueba y un contexto de navegador que también lleva el token.
const { initializeApp } = require('firebase/app');
const { initializeAppCheck, CustomProvider } = require('firebase/app-check');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, setLogLevel } = require('firebase/firestore');
const { firebaseConfig, accounts, PASSWORD, debugToken } = require('./config');

// Las pruebas de reglas provocan rechazos a propósito; sin esto el SDK llena la salida de
// avisos de 'permission denied' que no aportan nada. Con SEXCONTROL_TEST_VERBOSE=1 se ven.
setLogLevel(process.env.SEXCONTROL_TEST_VERBOSE ? 'debug' : 'silent');

// Cambia el token de depuración por uno real de App Check, que es lo que hace el SDK web en modo
// depuración, pero sin navegador.
async function exchangeDebugToken() {
  const url =
    `https://firebaseappcheck.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
    `/apps/${firebaseConfig.appId}:exchangeDebugToken?key=${firebaseConfig.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ debugToken: debugToken() }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`App Check rechazó el token de depuración (${res.status}): ${json.error?.message ?? JSON.stringify(json)}`);
  }
  const ttl = parseFloat(String(json.ttl).replace('s', '')) || 3600;
  return { token: json.token, expireTimeMillis: Date.now() + ttl * 1000 };
}

let seq = 0;
function initApp(name) {
  const app = initializeApp(firebaseConfig, name ?? `test-${Date.now()}-${seq++}`);
  initializeAppCheck(app, { provider: new CustomProvider({ getToken: exchangeDebugToken }), isTokenAutoRefreshEnabled: true });
  return app;
}

// Sesión de una de las cuentas de prueba ('a', 'b' o 'c'), con su uid y su Firestore.
async function signIn(which, tag) {
  const app = initApp(tag ?? `${which}-${Date.now()}`);
  const { user } = await signInWithEmailAndPassword(getAuth(app), accounts[which], PASSWORD);
  return { uid: user.uid, db: getFirestore(app), email: accounts[which] };
}

// Contexto de Playwright cuya app usará el token de depuración de App Check (lo lee app.config.ts
// de localStorage en desarrollo).
async function appContext(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  await context.addInitScript((token) => {
    try {
      localStorage.setItem('sexcontrol.appCheckDebugToken', token);
    } catch {
      // Páginas sin almacenamiento local (about:blank, por ejemplo).
    }
  }, debugToken());
  return context;
}

module.exports = { initApp, signIn, appContext, exchangeDebugToken };
