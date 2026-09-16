// Reglas de las invitaciones a grupos: el código es el id del documento, y para entrar hay que
// dejar antes una marca bajo su ruta (eso demuestra conocerlo).
const { collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, limit, query, arrayUnion, serverTimestamp } = require('firebase/firestore');
const { signIn } = require('../helpers/firebase');
const { expectRule, title } = require('../helpers/report');

const member = (name) => ({ displayName: name, photoURL: null, solitario: 0, compania: 0, week: null, month: null, hidden: false });

async function run() {
  title('Reglas · invitaciones a grupos (groupInvites/{code})');
  const a = await signIn('a', 'rules-invites-a');
  const b = await signIn('b', 'rules-invites-b');
  const c = await signIn('c', 'rules-invites-c');

  const groupId = `test-invites-${Date.now()}`;
  const code = `codigo${Date.now().toString(36)}`;
  const g = (db) => doc(db, 'groups', groupId);

  await setDoc(g(a.db), {
    name: 'Grupo con invitación', imageUrl: null, ownerUid: a.uid,
    memberUids: [a.uid], members: { [a.uid]: member('A') }, addedUids: [],
    inviteCode: code, createdAt: serverTimestamp(),
  });
  await setDoc(doc(a.db, 'groupInvites', code), { groupId, groupName: 'Grupo con invitación', ownerUid: a.uid });

  await expectRule('con el enlace se ve a qué grupo lleva', true, async () => {
    const snap = await getDoc(doc(b.db, 'groupInvites', code));
    if (!snap.exists()) {
      throw new Error('la invitación no existe');
    }
  });
  // El id de la invitación ES el código secreto: si se pudieran listar, cualquiera entraría en
  // cualquier grupo con invitación activa.
  await expectRule('nadie puede listar las invitaciones', false, () =>
    getDocs(query(collection(c.db, 'groupInvites'), limit(5)))
  );
  await expectRule('sin dejar la marca no se entra', false, () =>
    updateDoc(g(b.db), { memberUids: arrayUnion(b.uid), [`members.${b.uid}`]: member('B') })
  );
  await expectRule('quien tiene el código deja su marca', true, () =>
    setDoc(doc(b.db, 'groupInvites', code, 'joins', b.uid), { at: serverTimestamp() })
  );
  await expectRule('con la marca sí entra', true, () =>
    updateDoc(g(b.db), { memberUids: arrayUnion(b.uid), [`members.${b.uid}`]: member('B') })
  );
  await expectRule('no se puede colar a otra persona de paso', false, () =>
    updateDoc(g(b.db), { memberUids: arrayUnion(c.uid), [`members.${c.uid}`]: member('C') })
  );
  await expectRule('con un código inventado no se entra', false, async () => {
    await setDoc(doc(c.db, 'groupInvites', 'codigo-inventado', 'joins', c.uid), { at: serverTimestamp() });
    await updateDoc(g(c.db), { memberUids: arrayUnion(c.uid), [`members.${c.uid}`]: member('C') });
  });
  await expectRule('al entrar no se puede tocar el grupo', false, () => updateDoc(g(b.db), { name: 'Secuestrado' }));
  await expectRule('no se puede borrar la invitación de otro', false, () => deleteDoc(doc(c.db, 'groupInvites', code)));
  await expectRule('el dueño renueva su invitación', true, () =>
    setDoc(doc(a.db, 'groupInvites', code), { groupId, groupName: 'Grupo con invitación', ownerUid: a.uid })
  );

  await deleteDoc(doc(b.db, 'groupInvites', code, 'joins', b.uid)).catch(() => undefined);
  await deleteDoc(doc(c.db, 'groupInvites', 'codigo-inventado', 'joins', c.uid)).catch(() => undefined);
  await deleteDoc(doc(a.db, 'groupInvites', code)).catch(() => undefined);
  await deleteDoc(g(a.db));
}

module.exports = { run };
