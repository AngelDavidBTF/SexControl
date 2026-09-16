// Flujo social con dos cuentas: A reta a B, B acepta y manda una pulla, y A ve el duelo en juego
// y la pulla. Deja a las dos cuentas como amigas antes de empezar y lo limpia al terminar.
const { chromium } = require('playwright');
const { doc, setDoc, deleteField } = require('firebase/firestore');
const { format, startOfWeek } = require('date-fns');
const { signIn } = require('../helpers/firebase');
const { expectTrue, expectEqual, title } = require('../helpers/report');
const { signInApp, shot, BASE_URL } = require('./app');

const now = new Date();
const weekKey = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
const monthKey = format(now, 'yyyy-MM');

// Entrada de amigo con recuentos de esta semana, que es lo que miden los duelos.
const friendEntry = (name, week) => ({
  displayName: name,
  email: null,
  photoURL: null,
  solitario: week,
  compania: 0,
  total: week,
  hidden: false,
  week: { key: weekKey, s: week, c: 0 },
  month: { key: monthKey, s: week, c: 0 },
  streak: 2,
  lastDay: format(now, 'yyyy-MM-dd'),
  badges: 3,
});

async function run() {
  title('E2E · duelos y pullas entre dos cuentas');
  const a = await signIn('a', 'e2e-social-a');
  const b = await signIn('b', 'e2e-social-b');
  await setDoc(doc(a.db, 'social', a.uid), { friends: { [b.uid]: friendEntry('Cuenta B', 1) } }, { merge: true });
  await setDoc(doc(b.db, 'social', b.uid), { friends: { [a.uid]: friendEntry('Cuenta A', 4) } }, { merge: true });

  const browser = await chromium.launch();
  try {
    const pageA = await signInApp(browser, 'a');
    const pageB = await signInApp(browser, 'b');

    // A reta a B desde la ficha del amigo.
    await pageA.goto(`${BASE_URL}/tabs/amigos`, { waitUntil: 'load' });
    await pageA.waitForSelector('ion-item.amigo', { timeout: 30000 });
    await pageA.locator('ion-item.amigo').first().click();
    await pageA.waitForSelector('app-friend-detail-modal .accion-duelo', { timeout: 20000 });
    await shot(pageA, 'social-ficha');
    await pageA.locator('.accion-duelo').click();
    await pageA.locator('ion-action-sheet button:has-text("Quién suma más esta semana")').click();
    await pageA.waitForTimeout(2500);

    // B lo ve pendiente y lo acepta.
    await pageB.goto(`${BASE_URL}/tabs/amigos`, { waitUntil: 'load' });
    await pageB.waitForSelector('.duelo-aviso', { timeout: 30000 });
    expectTrue('a B le llega el reto', (await pageB.locator('.duelo-aviso').count()) === 1);
    await shot(pageB, 'social-reto-pendiente');
    await pageB.locator('.aceptar-reto').click();
    await pageB.waitForSelector('.duelo-vivo', { timeout: 20000 });
    const marcador = (await pageB.locator('.duelo-vivo .duelo-marcador').innerText()).replace(/\s+/g, ' ').trim();
    expectEqual('el marcador sale con los números de cada uno', marcador, '1 – 4');

    // B manda una pulla a A.
    await pageB.locator('ion-item.amigo').first().click();
    await pageB.waitForSelector('app-friend-detail-modal .accion-pulla', { timeout: 20000 });
    await pageB.locator('.accion-pulla').click();
    await pageB.locator('ion-action-sheet button:has-text("Semana floja")').click();
    await pageB.waitForTimeout(2500);

    // A ve el duelo en juego y la pulla.
    await pageA.goto(`${BASE_URL}/tabs/amigos`, { waitUntil: 'load' });
    await pageA.waitForSelector('.reaccion-texto', { timeout: 30000 });
    const pulla = await pageA.locator('.reaccion-texto').first().innerText();
    expectTrue('a A le llega la pulla', pulla.includes('Semana floja'));
    expectTrue('A ve el duelo en juego', (await pageA.locator('.duelo-vivo').count()) === 1);
    await shot(pageA, 'social-amigos');
  } finally {
    await browser.close();
    for (const who of [a, b]) {
      await setDoc(
        doc(who.db, 'social', who.uid),
        { friends: {}, pokes: deleteField(), challenges: deleteField(), record: deleteField(), wins: deleteField() },
        { merge: true }
      );
    }
  }
}

module.exports = { run };
