import { Timestamp } from '@angular/fire/firestore';
import { PeriodCount } from './friend.model';

// Debe coincidir con el tope de isValidGroup en firestore.rules.
export const MAX_GROUP_MEMBERS = 200;

// Entrada de cada miembro dentro del grupo. Los totales los propaga el propio miembro al
// sumar/borrar, así la página del grupo no necesita leer nada más que este documento.
export interface GroupMember {
  displayName: string | null;
  photoURL: string | null;
  solitario: number;
  compania: number;
  // Para los rankings por periodo (ver PeriodCount).
  week?: PeriodCount | null;
  month?: PeriodCount | null;
  // El miembro ha pausado la compartición: sus números no se muestran.
  hidden?: boolean;
  // Para los títulos semanales y las temporadas (ver friend.model.ts#SocialEntry).
  streak?: number | null;
  lastDay?: string | null;
  badges?: number | null;
  prevWeek?: PeriodCount | null;
  prevMonth?: PeriodCount | null;
}

// Temporada cerrada: el ranking de un mes que ya terminó. La escribe el primer miembro que abre
// el grupo con el mes nuevo empezado (ver group-awards.ts#seasonToClose); las reglas solo dejan
// crear claves que no existan, así que no se puede reescribir el pasado.
export interface Season {
  // 'yyyy-MM' del mes cerrado.
  winnerUid: string | null;
  winnerName: string | null;
  total: number;
}

// Objetivo colectivo que fija el dueño: entre todos, `target` veces en el periodo.
export interface GroupGoal {
  period: 'semana' | 'mes';
  target: number;
}

export const MAX_GROUP_GOAL = 9999;
// Temporadas guardadas en el documento del grupo (2 años); las más viejas se descartan.
export const MAX_SEASONS = 24;

// groups/{groupId}. Las estadísticas del grupo son los faps totales de cada miembro,
// igual que en la versión anterior (no hay faps "de grupo").
export interface Group {
  id?: string;
  name: string;
  // Imagen reducida como data URL (ver shared/image.ts); null usa el icono por defecto.
  imageUrl: string | null;
  ownerUid: string;
  // Duplica las claves de `members` para poder consultar con array-contains.
  memberUids: string[];
  members: Record<string, GroupMember>;
  // Miembros añadidos en la última escritura del dueño (lo exige firestore.rules).
  addedUids: string[];
  createdAt?: Timestamp;
  // Palmarés por mes ('yyyy-MM' → campeón) y objetivo colectivo en curso.
  seasons?: Record<string, Season>;
  goal?: GroupGoal | null;
  // Código del enlace de invitación (el id del documento groupInvites/{code}). Se puede renovar.
  inviteCode?: string | null;
  // Co-administradores: pueden añadir y quitar miembros, pero no tocar quién manda.
  admins?: string[];
}

// groupInvites/{code}: lo lee cualquiera que tenga el enlace, para saber a qué grupo lleva.
export interface GroupInvite {
  groupId: string;
  groupName: string;
  ownerUid: string;
}

// ---------------------------------------------------------------- muro del grupo

// groupFeed/{groupId}: una entrada por miembro, con lo último que ha escrito o lo último que le
// ha pasado. Al tener el uid como clave, las reglas pueden acotar quién escribe qué, y el muro
// cuesta 1 lectura al abrirlo por mucha gente que haya en el grupo.
export type FeedKind = 'mensaje' | 'adelanta' | 'racha' | 'campeon' | 'objetivo';

export interface FeedItem {
  from: string;
  kind: FeedKind;
  // Id de POKE_MESSAGES en los mensajes; en los eventos, el dato que los acompaña (un nombre o
  // un número), siempre generado por la app.
  msg?: string | null;
  at: Timestamp | null;
}

export interface GroupFeed {
  items?: Record<string, FeedItem>;
}

// Entrada del muro resuelta para pintarla.
export interface FeedEntry extends FeedItem {
  uid: string;
  name: string;
  photoURL: string | null;
  text: string;
  discreto: string;
}
