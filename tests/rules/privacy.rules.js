// Privacidad de las cuentas. users/ es privado; lo que ven los demás vive en profiles/ (nombre y
// foto) y emailIndex/ (búsqueda por email exacto), que se leen de uno en uno y nunca se listan.
// Antes cualquiera con sesión podía listar users/ y sacar el nombre y el email de todo el mundo.
const { createHash } = require('crypto');
const { collection, doc, getDoc, getDocs, setDoc, deleteDoc, limit, orderBy, query, where, writeBatch } = require('firebase/firestore');
const { signIn } = require('../helpers/firebase');
const { FIXTURE_NAMES, FIXTURE_USERNAMES, directoryEntry, ensureUsername } = require('../helpers/fixtures');
const { expectRule, title } = require('../helpers/report');

// Igual que src/app/shared/email-hash.ts y que firestore.rules.
const hash = (email) => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

async function mustExist(ref) {
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('no existe');
  }
}

async function run() {
  title('Reglas · privacidad de las cuentas (users, profiles, emailIndex)');
  const a = await signIn('a', 'rules-privacy-a');
  const b = await signIn('b', 'rules-privacy-b');
  // C no tiene el email verificado.
  const c = await signIn('c', 'rules-privacy-c');

  await expectRule('cada uno lee su propia cuenta', true, () => getDoc(doc(a.db, 'users', a.uid)));
  await expectRule('nadie lee la cuenta de otro', false, () => getDoc(doc(b.db, 'users', a.uid)));
  await expectRule('nadie puede listar los usuarios', false, () => getDocs(query(collection(b.db, 'users'), limit(5))));

  await expectRule('cada uno publica su perfil', true, () =>
    setDoc(doc(a.db, 'profiles', a.uid), { displayName: 'Cuenta de prueba A', photoURL: null })
  );
  await expectRule('el perfil público no admite el email', false, () =>
    setDoc(doc(a.db, 'profiles', a.uid), { displayName: 'Cuenta de prueba A', photoURL: null, email: a.email })
  );
  await expectRule('nadie publica el perfil de otro', false, () =>
    setDoc(doc(b.db, 'profiles', a.uid), { displayName: 'Suplantado', photoURL: null })
  );
  await expectRule('con el uid se ve el perfil de otro', true, () => mustExist(doc(b.db, 'profiles', a.uid)));
  await expectRule('nadie puede listar los perfiles', false, () => getDocs(query(collection(b.db, 'profiles'), limit(5))));

  const indexA = (db) => doc(db, 'emailIndex', hash(a.email));
  await expectRule('cada uno aparece en la búsqueda con su email', true, () => setDoc(indexA(a.db), { uid: a.uid }));
  await expectRule('nadie se apropia del email de otro', false, () => setDoc(indexA(b.db), { uid: b.uid }));
  await expectRule('nadie apunta su email a otra cuenta', false, () => setDoc(indexA(a.db), { uid: b.uid }));
  await expectRule('la entrada solo guarda el uid', false, () => setDoc(indexA(a.db), { uid: a.uid, email: a.email }));
  await expectRule('sin email verificado no se entra en la búsqueda', false, () =>
    setDoc(doc(c.db, 'emailIndex', hash(c.email)), { uid: c.uid })
  );
  await expectRule('con el email exacto se encuentra a alguien', true, () => mustExist(indexA(b.db)));
  await expectRule('nadie puede listar la búsqueda', false, () => getDocs(query(collection(b.db, 'emailIndex'), limit(5))));
  await expectRule('nadie borra la entrada de otro', false, () => deleteDoc(indexA(b.db)));
  await expectRule('borrar una entrada que no existe no falla', true, () =>
    deleteDoc(doc(b.db, 'emailIndex', hash('nadie-usa-este-email@ejemplo.com')))
  );
  // El perfil y la entrada de A se quedan: son los que la app publica para esa cuenta.

  // ---------------------------------------------------------------- @usuario y buscador
  const handleA = FIXTURE_USERNAMES.a;
  const nameRef = (db, handle) => doc(db, 'usernames', handle);
  const stamp = Date.now().toString(36);
  const suggestions = (db, field, prefix, extra = {}) =>
    getDocs(
      query(
        collection(db, 'usernames'),
        ...(extra.skipVisible ? [] : [where('visible', '==', true)]),
        where(field, '>=', prefix),
        where(field, '<=', prefix + '\uf8ff'),
        orderBy(field),
        limit(extra.limit ?? 10)
      )
    );

  await expectRule('cada uno reserva su @usuario', true, () => ensureUsername(a, handleA, FIXTURE_NAMES.a));
  await expectRule('nadie se queda el @usuario de otro', false, () =>
    setDoc(nameRef(b.db, handleA), directoryEntry(b, handleA))
  );
  await expectRule('nadie libera el @usuario de otro', false, () => deleteDoc(nameRef(b.db, handleA)));
  await expectRule('nadie se pone en su perfil el @usuario de otro', false, () =>
    setDoc(doc(b.db, 'profiles', b.uid), { username: handleA }, { merge: true })
  );
  await expectRule('la entrada del buscador no admite el email', false, () =>
    setDoc(nameRef(a.db, handleA), { ...directoryEntry(a, handleA, { displayName: FIXTURE_NAMES.a }), email: a.email })
  );

  await expectRule('se sugieren personas por el principio del @usuario', true, async () => {
    const snap = await suggestions(b.db, 'handle', 'prueba_sc');
    if (!snap.docs.some((d) => d.id === handleA)) {
      throw new Error('no sale la cuenta A');
    }
  });
  await expectRule('y por el principio del nombre, sin tildes', true, async () => {
    const snap = await suggestions(b.db, 'nameLower', 'cuenta de prueba');
    if (!snap.docs.some((d) => d.id === handleA)) {
      throw new Error('no sale la cuenta A');
    }
  });
  await expectRule('no se puede listar sin filtrar por quien quiere aparecer', false, () =>
    suggestions(b.db, 'handle', 'prueba_sc', { skipVisible: true })
  );
  await expectRule('no se pueden pedir más de 10 sugerencias', false, () =>
    suggestions(b.db, 'handle', 'prueba_sc', { limit: 50 })
  );

  await expectRule('cada uno puede dejar de aparecer en búsquedas', true, () =>
    setDoc(nameRef(a.db, handleA), directoryEntry(a, handleA, { displayName: FIXTURE_NAMES.a, visible: false }))
  );
  await expectRule('quien no aparece no se ve ni con su @usuario exacto', false, () => getDoc(nameRef(b.db, handleA)));
  await expectRule('pero su dueño sí', true, () => mustExist(nameRef(a.db, handleA)));
  await expectRule('y puede volver a aparecer', true, () =>
    setDoc(nameRef(a.db, handleA), directoryEntry(a, handleA, { displayName: FIXTURE_NAMES.a }))
  );

  await expectRule('no se acaparan @usuarios sin soltar el anterior', false, async () => {
    const batch = writeBatch(a.db);
    batch.set(nameRef(a.db, `extra_${stamp}`), directoryEntry(a, `extra_${stamp}`));
    batch.set(doc(a.db, 'users', a.uid), { username: `extra_${stamp}` }, { merge: true });
    await batch.commit();
  });
  await expectRule('no se reserva un @usuario sin apuntarlo en la cuenta', false, () =>
    setDoc(nameRef(a.db, `suelto_${stamp}`), directoryEntry(a, `suelto_${stamp}`))
  );
  await expectRule('un @usuario con mayúsculas o espacios se rechaza', false, async () => {
    const batch = writeBatch(a.db);
    batch.set(nameRef(a.db, 'Con Espacios'), directoryEntry(a, 'Con Espacios'));
    batch.set(doc(a.db, 'users', a.uid), { username: 'Con Espacios' }, { merge: true });
    await batch.commit();
  });
  await expectRule('se cambia de @usuario soltando el anterior', true, () => ensureUsername(a, `cambio_${stamp}`, FIXTURE_NAMES.a));
  await expectRule('y se puede volver al de antes', true, () => ensureUsername(a, handleA, FIXTURE_NAMES.a));
}

module.exports = { run };
