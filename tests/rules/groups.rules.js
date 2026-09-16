// Reglas de groups/{id}: cerrar temporadas, objetivo colectivo y co-administradores.
const { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } = require('firebase/firestore');
const { signIn } = require('../helpers/firebase');
const { expectRule, title } = require('../helpers/report');

const SEASON = '2026-08';
const member = (name) => ({ displayName: name, photoURL: null, solitario: 0, compania: 0, week: null, month: null, hidden: false });

async function run() {
  title('Reglas · temporadas, objetivo y administradores (groups/{id})');
  const a = await signIn('a', 'rules-groups-a');
  const b = await signIn('b', 'rules-groups-b');
  const c = await signIn('c', 'rules-groups-c');

  // Para que el dueño pueda añadir a B, B debe tenerle entre sus amigos.
  await setDoc(doc(b.db, 'social', b.uid), { friends: { [a.uid]: { displayName: 'A', email: null, photoURL: null } } }, { merge: true });

  const groupId = `test-groups-${Date.now()}`;
  const g = (db) => doc(db, 'groups', groupId);
  await setDoc(g(a.db), {
    name: 'Pruebas', imageUrl: null, ownerUid: a.uid,
    memberUids: [a.uid, b.uid], members: { [a.uid]: member('A'), [b.uid]: member('B') },
    addedUids: [b.uid], admins: [], createdAt: serverTimestamp(),
  });

  await expectRule('un miembro cierra el mes que terminó', true, () =>
    updateDoc(g(b.db), { [`seasons.${SEASON}`]: { winnerUid: b.uid, winnerName: 'B', total: 7 } })
  );
  await expectRule('el palmarés no se puede reescribir', false, () =>
    updateDoc(g(b.db), { [`seasons.${SEASON}`]: { winnerUid: b.uid, winnerName: 'B', total: 999 } })
  );
  await expectRule('no se pueden cerrar dos meses de golpe', false, () =>
    updateDoc(g(b.db), {
      'seasons.2026-06': { winnerUid: b.uid, winnerName: 'B', total: 1 },
      'seasons.2026-07': { winnerUid: b.uid, winnerName: 'B', total: 1 },
    })
  );
  await expectRule('el palmarés no se puede borrar', false, () => updateDoc(g(b.db), { seasons: {} }));
  await expectRule('no se pueden colar otros campos al cerrar', false, () =>
    updateDoc(g(b.db), { 'seasons.2026-05': { winnerUid: b.uid, winnerName: 'B', total: 1 }, name: 'Secuestrado' })
  );

  await expectRule('un miembro raso no pone el objetivo', false, () =>
    updateDoc(g(b.db), { goal: { period: 'mes', target: 10 } })
  );
  await expectRule('el dueño pone el objetivo', true, () => updateDoc(g(a.db), { goal: { period: 'mes', target: 50 }, addedUids: [] }));
  await expectRule('el dueño quita el objetivo', true, () => updateDoc(g(a.db), { goal: null, addedUids: [] }));
  await expectRule('periodo de objetivo inventado rechazado', false, () =>
    updateDoc(g(a.db), { goal: { period: 'anio', target: 5 }, addedUids: [] })
  );
  await expectRule('objetivo de 0 rechazado', false, () => updateDoc(g(a.db), { goal: { period: 'mes', target: 0 }, addedUids: [] }));
  await expectRule('objetivo desorbitado rechazado', false, () =>
    updateDoc(g(a.db), { goal: { period: 'mes', target: 100000 }, addedUids: [] })
  );

  await expectRule('un miembro raso no nombra administradores', false, () => updateDoc(g(b.db), { admins: [b.uid], addedUids: [] }));
  await expectRule('el dueño nombra administrador', true, () => updateDoc(g(a.db), { admins: [b.uid], addedUids: [] }));
  await expectRule('el administrador edita el grupo', true, () => updateDoc(g(b.db), { name: 'Pruebas (editado)', addedUids: [] }));
  await expectRule('el administrador no se queda con el mando', false, () => updateDoc(g(b.db), { ownerUid: b.uid, addedUids: [] }));
  await expectRule('el administrador no nombra a más administradores', false, () =>
    updateDoc(g(b.db), { admins: [b.uid, c.uid], addedUids: [] })
  );

  await deleteDoc(g(a.db));
  await setDoc(doc(b.db, 'social', b.uid), { friends: {} }, { merge: true });
}

module.exports = { run };
