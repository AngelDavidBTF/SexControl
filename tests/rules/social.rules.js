// Reglas de social/{uid}: pullas (mensajes predefinidos) y duelos entre amigos.
const { doc, setDoc, serverTimestamp, deleteField } = require('firebase/firestore');
const { signIn } = require('../helpers/firebase');
const { expectRule, title } = require('../helpers/report');

const entry = (name) => ({ displayName: name, email: null, photoURL: null });
const poke = (from, extra = {}) => ({ from, msg: 'jubilado', emoji: null, at: serverTimestamp(), ...extra });
const duel = (from) => ({
  from,
  kind: 'semana',
  week: '2026-09-14',
  target: null,
  status: 'pendiente',
  at: serverTimestamp(),
  winnerUid: null,
});

async function run() {
  title('Reglas · pullas y duelos (social/{uid})');
  const a = await signIn('a', 'rules-social-a');
  const b = await signIn('b', 'rules-social-b');
  const c = await signIn('c', 'rules-social-c');

  // A y B son amigos; C no lo es de A.
  await setDoc(doc(a.db, 'social', a.uid), { friends: { [b.uid]: entry('B') } }, { merge: true });
  await setDoc(doc(b.db, 'social', b.uid), { friends: { [a.uid]: entry('A') } }, { merge: true });
  const socialA = (db) => doc(db, 'social', a.uid);

  await expectRule('un amigo manda una pulla', true, () =>
    setDoc(socialA(b.db), { pokes: { [b.uid]: poke(b.uid) } }, { merge: true })
  );
  await expectRule('un amigo manda una reacción suelta', true, () =>
    setDoc(socialA(b.db), { pokes: { [b.uid]: poke(b.uid, { msg: null, emoji: '🔥' }) } }, { merge: true })
  );
  await expectRule('no se puede escribir en la entrada de otro', false, () =>
    setDoc(socialA(b.db), { pokes: { [c.uid]: poke(c.uid) } }, { merge: true })
  );
  await expectRule('el texto libre sigue rechazado', false, () =>
    setDoc(socialA(b.db), { pokes: { [b.uid]: poke(b.uid, { text: 'lo que me dé la gana' }) } }, { merge: true })
  );
  await expectRule('no se pueden tocar dos entradas a la vez', false, () =>
    setDoc(socialA(b.db), { pokes: { [b.uid]: poke(b.uid), [c.uid]: poke(c.uid) } }, { merge: true })
  );
  await expectRule('quien no es amigo no puede mandar pullas', false, () =>
    setDoc(socialA(c.db), { pokes: { [c.uid]: poke(c.uid) } }, { merge: true })
  );
  await expectRule('un amigo puede retirar su propia pulla', true, () =>
    setDoc(socialA(b.db), { pokes: { [b.uid]: deleteField() } }, { merge: true })
  );

  await expectRule('un amigo propone un duelo', true, () =>
    setDoc(socialA(b.db), { challenges: { [b.uid]: duel(b.uid) } }, { merge: true })
  );
  await expectRule('no se puede meter un duelo en la entrada de otro', false, () =>
    setDoc(socialA(b.db), { challenges: { [c.uid]: duel(b.uid) } }, { merge: true })
  );
  await expectRule('modalidad de duelo inventada rechazada', false, () =>
    setDoc(socialA(b.db), { challenges: { [b.uid]: { ...duel(b.uid), kind: 'anual' } } }, { merge: true })
  );
  await expectRule('estado de duelo inventado rechazado', false, () =>
    setDoc(socialA(b.db), { challenges: { [b.uid]: { ...duel(b.uid), status: 'ganado-por-mi' } } }, { merge: true })
  );
  await expectRule('meta desorbitada rechazada', false, () =>
    setDoc(socialA(b.db), { challenges: { [b.uid]: { ...duel(b.uid), kind: 'carrera', target: 5000 } } }, { merge: true })
  );
  await expectRule('campos de más en el duelo rechazados', false, () =>
    setDoc(socialA(b.db), { challenges: { [b.uid]: { ...duel(b.uid), trampa: true } } }, { merge: true })
  );
  await expectRule('nadie puede tocar mi marcador de duelos', false, () =>
    setDoc(socialA(b.db), { record: { [b.uid]: { wins: 99, losses: 0 } } }, { merge: true })
  );
  await expectRule('nadie puede subirme los duelos ganados', false, () => setDoc(socialA(b.db), { wins: 99 }, { merge: true }));
  await expectRule('su dueño sí lleva su marcador', true, () =>
    setDoc(socialA(a.db), { record: { [b.uid]: { wins: 1, losses: 0 } }, wins: 1 }, { merge: true })
  );

  // Limpieza.
  await setDoc(
    socialA(a.db),
    { pokes: deleteField(), challenges: deleteField(), record: deleteField(), wins: deleteField(), friends: {} },
    { merge: true }
  );
  await setDoc(doc(b.db, 'social', b.uid), { friends: {} }, { merge: true });
}

module.exports = { run };
