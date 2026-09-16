// Invitaciones: el dueño saca el enlace con QR de un grupo y una segunda cuenta entra con él.
const { chromium } = require('playwright');
const { doc, setDoc, getDoc, deleteDoc, serverTimestamp } = require('firebase/firestore');
const { signIn } = require('../helpers/firebase');
const { expectTrue, expectEqual, title } = require('../helpers/report');
const { signInApp, shot, BASE_URL } = require('./app');

async function run() {
  title('E2E · invitaciones por enlace y QR');
  const a = await signIn('a', 'e2e-invites-a');
  const groupId = `e2e-invites-${Date.now()}`;
  await setDoc(doc(a.db, 'groups', groupId), {
    name: 'Grupo abierto', imageUrl: null, ownerUid: a.uid,
    memberUids: [a.uid],
    members: { [a.uid]: { displayName: 'Cuenta A', photoURL: null, solitario: 2, compania: 1, week: null, month: null, hidden: false } },
    addedUids: [], createdAt: serverTimestamp(),
  });

  const browser = await chromium.launch();
  try {
    const pageA = await signInApp(browser, 'a');

    // Invitación de amistad: enlace y QR.
    await pageA.goto(`${BASE_URL}/tabs/amigos`, { waitUntil: 'load' });
    await pageA.waitForSelector('.invitar-amigo', { timeout: 30000 });
    await pageA.locator('.invitar-amigo').click();
    await pageA.waitForSelector('app-share-invite-modal .qr img', { timeout: 20000 });
    const enlaceAmigo = await pageA.locator('app-share-invite-modal .enlace code').innerText();
    expectTrue('el enlace de amistad lleva a mi perfil', enlaceAmigo.includes(`/invitar/${a.uid}`));
    await shot(pageA, 'invites-amigo');
    await pageA.locator('app-share-invite-modal ion-header ion-button').click();

    // Invitación al grupo.
    await pageA.goto(`${BASE_URL}/group/${groupId}`, { waitUntil: 'load' });
    await pageA.waitForSelector('.editar-grupo', { timeout: 30000 });
    await pageA.locator('.editar-grupo').click();
    await pageA.locator('ion-action-sheet button:has-text("Invitar con enlace")').click();
    await pageA.waitForSelector('app-share-invite-modal .qr img', { timeout: 30000 });
    const enlaceGrupo = await pageA.locator('app-share-invite-modal .enlace code').innerText();
    expectTrue('el enlace del grupo lleva a /unirse', enlaceGrupo.includes('/unirse/'));
    await shot(pageA, 'invites-grupo');

    // B entra con el enlace.
    const pageB = await signInApp(browser, 'b');
    await pageB.goto(enlaceGrupo, { waitUntil: 'load' });
    await pageB.waitForSelector('.entrar-grupo', { timeout: 30000 });
    await shot(pageB, 'invites-unirse');
    await pageB.locator('.entrar-grupo').click();
    await pageB.waitForSelector('.miembro', { timeout: 30000 });
    await pageB.waitForTimeout(1500);

    const snap = await getDoc(doc(a.db, 'groups', groupId));
    expectEqual('el grupo pasa a tener dos miembros', snap.data().memberUids.length, 2);
    expectTrue('quien entra ve la lista de miembros', (await pageB.locator('.miembro').count()) === 2);
  } finally {
    await browser.close();
    const snap = await getDoc(doc(a.db, 'groups', groupId)).catch(() => null);
    const code = snap?.data()?.inviteCode;
    if (code) {
      await deleteDoc(doc(a.db, 'groupInvites', code)).catch(() => undefined);
    }
    await deleteDoc(doc(a.db, 'groups', groupId)).catch(() => undefined);
    await deleteDoc(doc(a.db, 'groupFeed', groupId)).catch(() => undefined);
  }
}

module.exports = { run };
