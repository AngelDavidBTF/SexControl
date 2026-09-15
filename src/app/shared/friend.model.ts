import { Timestamp } from '@angular/fire/firestore';

// users/{uid}/friends/{friendUid}: doc espejo creado en ambos usuarios al aceptar una solicitud.
export interface Friend {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: Timestamp;
}

// friendRequests/{fromUid}_{toUid}: su mera existencia significa "pendiente".
// Al aceptar o rechazar se borra.
export interface FriendRequest {
  id?: string;
  fromUid: string;
  fromDisplayName: string | null;
  fromEmail: string | null;
  fromPhotoURL: string | null;
  toUid: string;
  createdAt?: Timestamp;
}

export interface FapCounts {
  solitario: number;
  compania: number;
}
