import { Timestamp } from '@angular/fire/firestore';

// Debe coincidir con el tope de isValidGroup en firestore.rules.
export const MAX_GROUP_MEMBERS = 15;

// groups/{groupId}. Las estadísticas del grupo son los faps totales de cada miembro,
// igual que en la versión anterior (no hay faps "de grupo").
export interface Group {
  id?: string;
  name: string;
  // Imagen reducida como data URL (ver shared/image.ts); null usa el icono por defecto.
  imageUrl: string | null;
  ownerUid: string;
  memberUids: string[];
  createdAt?: Timestamp;
}
