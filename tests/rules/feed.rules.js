// Reglas del muro del grupo (groupFeed/{groupId}): quién lee, quién escribe y quién modera.
const { doc, setDoc, getDoc, deleteDoc, deleteField, serverTimestamp } = require('firebase/firestore');
const { signIn } = require('../helpers/firebase');
const { expectRule, title } = require('../helpers/report');

const member = (name) => ({ displayName: name, photoURL: null, solitario: 0, compania: 0, week: null, month: null, hidden: false });
const item = (from, extra = {}) => ({ from, kind: 'mensaje', msg: 'floja', at: serverTimestamp(), ...extra });

async function run() {
  title('Reglas · muro del grupo (groupFeed/{groupId})');
  const a = await signIn('a', 'rules-feed-a');
  const b = await signIn('b', 'rules-feed-b');
  const c = await signIn('c', 'rules-feed-c');

  await setDoc(doc(b.db, 'social', b.uid), { friends: { [a.uid]: { displayName: 'A', email: null, photoURL: null } } }, { merge: true });

  const groupId = `test-feed-${Date.now()}`;
  const g = (db) => doc(db, 'groups', groupId);
  const feed = (db) => doc(db, 'groupFeed', groupId);
  await setDoc(g(a.db), {
    name: 'Grupo con muro', imageUrl: null, ownerUid: a.uid,
    memberUids: [a.uid, b.uid], members: { [a.uid]: member('A'), [b.uid]: member('B') },
    addedUids: [b.uid], admins: [], createdAt: serverTimestamp(),
  });

  await expectRule('un miembro escribe en el muro', true, () => setDoc(feed(b.db), { items: { [b.uid]: item(b.uid) } }, { merge: true }));
  await expectRule('un miembro lee el muro', true, async () => {
    const snap = await getDoc(feed(a.db));
    if (!snap.exists()) {
      throw new Error('el muro está vacío');
    }
  });
  await expectRule('quien no es del grupo no lee el muro', false, () => getDoc(feed(c.db)));
  await expectRule('quien no es del grupo no escribe', false, () => setDoc(feed(c.db), { items: { [c.uid]: item(c.uid) } }, { merge: true }));
  await expectRule('no se escribe en nombre de otro', false, () => setDoc(feed(b.db), { items: { [a.uid]: item(a.uid) } }, { merge: true }));
  await expectRule('tipo de entrada inventado rechazado', false, () =>
    setDoc(feed(b.db), { items: { [b.uid]: item(b.uid, { kind: 'lo-que-sea' }) } }, { merge: true })
  );
  await expectRule('texto libre en el muro rechazado', false, () =>
    setDoc(feed(b.db), { items: { [b.uid]: { ...item(b.uid), texto: 'lo que quiera' } } }, { merge: true })
  );
  await expectRule('cada uno retira su entrada', true, () => setDoc(feed(b.db), { items: { [b.uid]: deleteField() } }, { merge: true }));
  await expectRule('el dueño modera el muro', true, async () => {
    await setDoc(feed(b.db), { items: { [b.uid]: item(b.uid) } }, { merge: true });
    await setDoc(feed(a.db), { items: { [b.uid]: deleteField() } }, { merge: true });
  });

  await deleteDoc(feed(a.db)).catch(() => undefined);
  await deleteDoc(g(a.db));
  await setDoc(doc(b.db, 'social', b.uid), { friends: {} }, { merge: true });
}

module.exports = { run };
