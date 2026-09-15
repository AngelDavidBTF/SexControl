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

// social/{uid}: un único documento por usuario.
//  - friends:   amigos aceptados.
//  - requests:  solicitudes recibidas (clave = remitente).
//  - sent:      solicitudes enviadas (clave = destinatario).
//  - reactions: última reacción recibida de cada amigo.
//  - privacy:   qué ve cada amigo de mí (por defecto "todo"). Solo lo lee el dueño.
//  - paused:    no compartir nada con nadie (amigos y grupos).
export interface SocialDoc {
  friends?: Record<string, SocialEntry>;
  requests?: Record<string, SocialEntry>;
  sent?: Record<string, SocialEntry>;
  reactions?: Record<string, Reaction>;
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

export interface Social {
  friends: Friend[];
  requests: Friend[];
  sent: Friend[];
  reactions: ReceivedReaction[];
  privacy: Record<string, PrivacyLevel>;
  paused: boolean;
}
