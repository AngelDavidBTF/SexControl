// Datos que las cuentas de prueba necesitan para usar la app sin interrupciones.
const { doc, getDoc, writeBatch } = require('firebase/firestore');
const { signIn } = require('./firebase');

// @usuario y nombre de cada cuenta de prueba. Sin @usuario, la app abre al entrar la ventana de
// elegirlo y taparía los clics de los E2E.
const FIXTURE_USERNAMES = { a: 'prueba_sc_a', b: 'prueba_sc_b' };
const FIXTURE_NAMES = { a: 'Cuenta de prueba A', b: 'Cuenta de prueba B' };

// Entrada del buscador (usernames/{handle}), igual que la escribe la app (profile.service.ts).
function directoryEntry(session, handle, overrides = {}) {
  const displayName = overrides.displayName ?? null;
  return {
    uid: session.uid,
    handle,
    displayName,
    nameLower: displayName ? displayName.toLowerCase() : null,
    photoURL: null,
    visible: true,
    ...overrides,
  };
}

// Deja a la sesión con ese @usuario, como ProfileService.setUsername: reservar el nuevo, liberar el
// anterior y apuntarlo en la cuenta y el perfil, todo en la misma escritura.
async function ensureUsername(session, handle, displayName = null) {
  const account = await getDoc(doc(session.db, 'users', session.uid));
  const previous = account.exists() ? (account.data().username ?? null) : null;
  const batch = writeBatch(session.db);
  batch.set(doc(session.db, 'usernames', handle), directoryEntry(session, handle, { displayName }));
  if (previous && previous !== handle) {
    batch.delete(doc(session.db, 'usernames', previous));
  }
  batch.set(doc(session.db, 'users', session.uid), { username: handle }, { merge: true });
  batch.set(doc(session.db, 'profiles', session.uid), { username: handle }, { merge: true });
  await batch.commit();
}

async function ensureFixtureUsernames() {
  for (const [which, handle] of Object.entries(FIXTURE_USERNAMES)) {
    await ensureUsername(await signIn(which, `fixture-username-${which}`), handle, FIXTURE_NAMES[which]);
  }
}

module.exports = { FIXTURE_USERNAMES, FIXTURE_NAMES, directoryEntry, ensureUsername, ensureFixtureUsernames };
