import { Challenge, ChallengeKind, Friend, POKE_MESSAGES, Poke, ReceivedPoke } from './friend.model';
import { MyEntry, periodValue } from './social';
import { weekKey } from './stats';

// Duelos entre dos amigos. El resultado se calcula en el dispositivo con los recuentos que ambos
// ya comparten (social/{uid}), así que no hace falta servidor ni lecturas extra.

export interface ChallengeScore {
  mine: number;
  theirs: number;
  // null mientras no se pueda decidir (duelo de la semana en curso) o si hay empate al cerrar.
  winnerUid: string | null;
  // El duelo ya se puede cerrar: terminó la semana, o alguien llegó a la meta.
  finished: boolean;
}

export function challengeLabel(challenge: Challenge): string {
  return challenge.kind === 'semana' ? 'Quién suma más esta semana' : `El primero en llegar a ${challenge.target ?? 0}`;
}

export function newChallenge(from: string, kind: ChallengeKind, target: number | null, today: Date): Omit<Challenge, 'at'> {
  return {
    from,
    kind,
    week: weekKey(today),
    target: kind === 'carrera' ? target : null,
    status: 'pendiente',
    winnerUid: null,
  };
}

// Marcador del duelo. `me` y `friend` son las entradas con los recuentos publicados.
export function challengeScore(challenge: Challenge, me: MyEntry, friend: Friend, today: Date): ChallengeScore | null {
  const mine = periodValue(me, 'semana', today);
  const theirs = periodValue(friend, 'semana', today);
  // Si el amigo deja de compartir la semana (pausa o "solo el total"), el duelo no se puede medir.
  if (mine === null || theirs === null) {
    return null;
  }
  // El duelo se juega en su semana: si ya estamos en otra, lo que cuenta es lo que quedó.
  const sameWeek = challenge.week === weekKey(today);
  if (challenge.kind === 'carrera') {
    const target = challenge.target ?? 0;
    const finished = mine >= target || theirs >= target;
    return { mine, theirs, finished, winnerUid: finished ? winner(challenge, me.uid, friend.uid, mine, theirs) : null };
  }
  return {
    mine,
    theirs,
    finished: !sameWeek,
    winnerUid: !sameWeek ? winner(challenge, me.uid, friend.uid, mine, theirs) : null,
  };
}

function winner(challenge: Challenge, myUid: string, friendUid: string, mine: number, theirs: number): string | null {
  if (mine === theirs) {
    return null;
  }
  return mine > theirs ? myUid : friendUid;
}

// Duelos en juego (propuestos o aceptados) con ese amigo.
export function activeChallenge(challenges: Record<string, Challenge> | undefined, friendUid: string): Challenge | null {
  const challenge = challenges?.[friendUid];
  return challenge && (challenge.status === 'pendiente' || challenge.status === 'aceptado') ? challenge : null;
}

// ---------------------------------------------------------------- pullas

const POKES_BY_ID = new Map(POKE_MESSAGES.map((message) => [message.id, message]));

// Resuelve el texto de una pulla recibida. Los mensajes viven en el código (el documento solo
// guarda el id), así que se pueden cambiar sin migrar nada.
export function pokeLabels(poke: Poke): { label: string; discreto: string } {
  const message = poke.msg ? POKES_BY_ID.get(poke.msg) : undefined;
  if (message) {
    return { label: `${message.emoji} ${message.text}`, discreto: message.discreto };
  }
  if (poke.emoji) {
    return { label: poke.emoji, discreto: 'te ha reaccionado' };
  }
  // Mensaje de una versión más nueva de la app: se muestra algo neutro en lugar de un hueco.
  return { label: '👋 Te ha dado un toque', discreto: 'Te ha dado un toque' };
}

// De más reciente a más antigua, quedándose con las `max` últimas.
export function sortPokes(pokes: ReceivedPoke[], max: number): ReceivedPoke[] {
  return [...pokes].sort((a, b) => (b.at?.toMillis() ?? 0) - (a.at?.toMillis() ?? 0)).slice(0, max);
}
