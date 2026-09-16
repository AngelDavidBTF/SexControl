// Configuración común de las pruebas automáticas.
//
// Las pruebas corren contra el proyecto REAL de Firebase (sexcontrol-6c000), no contra los
// emuladores. Por eso necesitan dos cosas que no viven en el repositorio:
//
//  1. Un token de depuración de App Check registrado en Firebase Console
//     (App Check → Apps → app web → Gestionar tokens de depuración). Se lee de la variable de
//     entorno SEXCONTROL_APPCHECK_DEBUG_TOKEN o del archivo tests/app-check.local.json, que está
//     fuera del control de versiones.
//  2. Cuentas de prueba ya verificadas. Las de por defecto usan buzones públicos de Mailinator.
//
// Ver tests/README.md.

const fs = require('fs');
const path = require('path');

const firebaseConfig = {
  apiKey: 'AIzaSyBqZd-4qjannmt-HhNG6x0gzawNYNmwX_k',
  authDomain: 'sexcontrol-6c000.firebaseapp.com',
  projectId: 'sexcontrol-6c000',
  appId: '1:275373132188:web:45d08dd98202852df2a059',
};

// Dirección donde se sirve la build de producción durante las pruebas (tests/helpers/serve-www.js).
const BASE_URL = process.env.SEXCONTROL_TEST_URL || 'http://localhost:8200';
const PORT = Number(new URL(BASE_URL).port || 80);

// Cuentas de prueba. La contraseña es la misma para todas; se puede cambiar por entorno.
const PASSWORD = process.env.SEXCONTROL_TEST_PASSWORD || 'Test1234!';
const accounts = {
  a: process.env.SEXCONTROL_TEST_A || 'sexcontrol.smoketest.stats.sstats.1789469408551@mailinator.com',
  b: process.env.SEXCONTROL_TEST_B || 'sexcontrol.smoketest.gui.gtres.1789467188316@mailinator.com',
  // Tercera cuenta, para comprobar lo que NO puede hacer quien no es amigo ni miembro. No hace
  // falta que tenga el email verificado: solo se usa desde Node, nunca entra por la interfaz.
  c: process.env.SEXCONTROL_TEST_C || 'sexcontrol.smoketest.alfa.1789467146219@mailinator.com',
};

function debugToken() {
  if (process.env.SEXCONTROL_APPCHECK_DEBUG_TOKEN) {
    return process.env.SEXCONTROL_APPCHECK_DEBUG_TOKEN;
  }
  const file = path.join(__dirname, '..', 'app-check.local.json');
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8')).debugToken;
  }
  throw new Error(
    'Falta el token de depuración de App Check.\n' +
      'Pon SEXCONTROL_APPCHECK_DEBUG_TOKEN en el entorno, o crea tests/app-check.local.json con { "debugToken": "..." }.\n' +
      'El token se registra en Firebase Console → App Check → Apps → app web → Gestionar tokens de depuración.'
  );
}

module.exports = { firebaseConfig, accounts, PASSWORD, BASE_URL, PORT, debugToken };
