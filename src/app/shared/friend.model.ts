import { Timestamp } from '@angular/fire/firestore';

// Recuento de un periodo concreto (semana 'yyyy-MM-dd' del lunes, mes 'yyyy-MM'). Si la clave
// no es la del periodo actual, el recuento es 0 (la persona no ha sumado en él).
export interface PeriodCount {
  key: string;
  s: number;
  c: number;
}

// Perfil y totales de otra persona tal como se guardan en social/{uid}. Los totales los
// propaga esa persona al sumar/borrar (fap.service.ts#fanOut) según lo que quiera compartir:
// con privacidad "total" solitario/compania van a null y solo se ve `total`; con "nada" o con
// la compartición en pausa, `hidden` es true.
export interface SocialEntry {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  solitario?: number | null;
  compania?: number | null;
  total?: number | null;
  hidden?: boolean;
  week?: PeriodCount | null;
  month?: PeriodCount | null;
  since?: Timestamp;
  // Datos para la ficha y la liga de amigos, publicados por su dueño junto con los totales
  // (ver sharing.service.ts). Con privacidad "solo el total" o "nada" van a null.
  //  - streak:    días seguidos de racha en curso.
  //  - lastDay:   último día con actividad, 'yyyy-MM-dd'.
  //  - badges:    cuántos logros lleva desbloqueados.
  //  - prevWeek:  recuento de la semana anterior (para las flechas de subida y bajada).
  //  - prevMonth: recuento del mes anterior (para cerrar las temporadas de grupo).
  //  - wins:      duelos ganados en total.
  streak?: number | null;
  lastDay?: string | null;
  badges?: number | null;
  prevWeek?: PeriodCount | null;
  prevMonth?: PeriodCount | null;
  wins?: number | null;
}

export type PrivacyLevel = 'todo' | 'total' | 'nada';

export const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  todo: 'Todo (compañía y solitario)',
  total: 'Solo el total',
  nada: 'Nada',
};

export interface Reaction {
  emoji: string;
  at: Timestamp | null;
}

export const REACTION_EMOJIS = ['🔥', '👏', '😏', '😂', '💪', '🍆', '👀', '🏆'];

// ---------------------------------------------------------------- pullas y toques

// Mensajes predefinidos (nada de texto libre, así no hay nada que moderar). El documento guarda
// solo el id, así que el texto se puede cambiar o traducir sin tocar los datos.
export interface Poke {
  from: string;
  // Id de POKE_MESSAGES o, si es una reacción suelta, solo el emoji.
  msg?: string | null;
  emoji?: string | null;
  at: Timestamp | null;
}

export interface PokeMessage {
  id: string;
  emoji: string;
  text: string;
  // Texto neutro para el modo discreto.
  discreto: string;
}

export const POKE_MESSAGES: PokeMessage[] = [
  { id: 'jubilado', emoji: '👴', text: '¿Te has jubilado o qué?', discreto: '¿Te has jubilado o qué?' },
  { id: 'floja', emoji: '😴', text: 'Semana floja, ¿eh?', discreto: 'Semana floja, ¿eh?' },
  { id: 'adelanto', emoji: '🏃', text: 'Te estoy adelantando 😏', discreto: 'Te estoy adelantando' },
  { id: 'polvo', emoji: '💨', text: 'Te como el polvo', discreto: 'Te como el polvo' },
  { id: 'vivo', emoji: '👀', text: '¿Sigues vivo?', discreto: '¿Sigues vivo?' },
  { id: 'animo', emoji: '💪', text: '¡Ánimo, que se puede!', discreto: '¡Ánimo, que se puede!' },
  { id: 'crack', emoji: '🏆', text: 'Eres un crack', discreto: 'Eres un crack' },
  { id: 'imitar', emoji: '🙇', text: 'Quiero ser como tú de mayor', discreto: 'Quiero ser como tú de mayor' },
  { id: 'racha', emoji: '🔥', text: 'Menuda racha llevas', discreto: 'Menuda racha llevas' },
  { id: 'alcanzo', emoji: '📈', text: 'Voy a por ti', discreto: 'Voy a por ti' },
  { id: 'descanso', emoji: '🛌', text: 'Descansa, que te va a dar algo', discreto: 'Descansa, que te va a dar algo' },
  { id: 'reto', emoji: '⚔️', text: '¿Te atreves con un duelo?', discreto: '¿Te atreves con un duelo?' },
];

export const MAX_POKES = 10;

// ---------------------------------------------------------------- duelos

export type ChallengeKind = 'semana' | 'carrera';
export type ChallengeStatus = 'pendiente' | 'aceptado' | 'rechazado' | 'terminado';

// Un duelo entre dos amigos. Cada uno guarda su copia (en su documento, con la clave del otro) y
// escribe la del contrario, igual que las pullas. El resultado lo calcula cada dispositivo con
// los recuentos que ya se comparten, así que no hace falta servidor.
export interface Challenge {
  // Quién lo propuso.
  from: string;
  kind: ChallengeKind;
  // Semana en la que se disputa ('yyyy-MM-dd' del lunes).
  week: string;
  // Meta de la carrera ("el primero que llegue a N"); null en el duelo semanal.
  target?: number | null;
  status: ChallengeStatus;
  at: Timestamp | null;
  // Se rellena al cerrarlo: uid del ganador, o null si hubo empate.
  winnerUid?: string | null;
}

export const CHALLENGE_TARGETS = [3, 5, 10];

// Duelos ganados y perdidos con cada amigo (solo lo ve su dueño).
export interface DuelRecord {
  wins: number;
  losses: number;
}

// social/{uid}: un único documento por usuario.
//  - friends:   amigos aceptados.
//  - requests:  solicitudes recibidas (clave = remitente).
//  - sent:      solicitudes enviadas (clave = destinatario).
//  - reactions: última reacción recibida de cada amigo.
//  - privacy:   qué ve cada amigo de mí (por defecto "todo"). Solo lo lee el dueño.
//  - paused:    no compartir nada con nadie (amigos y grupos).
//  - pokes:      pullas y reacciones recibidas (clave aleatoria, se conservan las últimas).
//  - challenges: duelos con cada amigo (clave = el otro).
//  - record:     duelos ganados y perdidos con cada amigo. Solo lo escribe su dueño.
//  - wins:       duelos ganados en total (se publica a los amigos).
export interface SocialDoc {
  friends?: Record<string, SocialEntry>;
  requests?: Record<string, SocialEntry>;
  sent?: Record<string, SocialEntry>;
  reactions?: Record<string, Reaction>;
  pokes?: Record<string, Poke>;
  challenges?: Record<string, Challenge>;
  record?: Record<string, DuelRecord>;
  wins?: number;
  privacy?: Record<string, PrivacyLevel>;
  paused?: boolean;
}

// Vista de una entrada con su uid, para listas en pantalla.
export interface Friend extends SocialEntry {
  uid: string;
}

export interface ReceivedReaction extends Reaction {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

// Una pulla recibida, ya resuelta con el nombre y la foto de quien la manda.
export interface ReceivedPoke extends Poke {
  id: string;
  displayName: string | null;
  photoURL: string | null;
  // Texto ya resuelto desde POKE_MESSAGES (o el propio emoji).
  label: string;
  discreto: string;
}

// Un duelo con el amigo al que corresponde, para las listas.
export interface FriendChallenge extends Challenge {
  uid: string;
  friend: Friend | null;
}

export interface Social {
  friends: Friend[];
  requests: Friend[];
  sent: Friend[];
  reactions: ReceivedReaction[];
  pokes: ReceivedPoke[];
  challenges: FriendChallenge[];
  record: Record<string, DuelRecord>;
  wins: number;
  privacy: Record<string, PrivacyLevel>;
  paused: boolean;
}
