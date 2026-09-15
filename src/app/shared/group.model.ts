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
}

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
}
