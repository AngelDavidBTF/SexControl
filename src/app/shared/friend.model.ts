import { Timestamp } from '@angular/fire/firestore';

// Perfil y totales de otra persona tal como se guardan en social/{uid}. Los totales los
// propaga esa persona al sumar/borrar (fap.service.ts#fanOut).
export interface SocialEntry {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  solitario?: number;
  compania?: number;
  since?: Timestamp;
}

// social/{uid}: un único documento por usuario.
//  - friends:  amigos aceptados.
//  - requests: solicitudes recibidas (clave = remitente).
//  - sent:     solicitudes enviadas (clave = destinatario).
export interface SocialDoc {
  friends?: Record<string, SocialEntry>;
  requests?: Record<string, SocialEntry>;
  sent?: Record<string, SocialEntry>;
}

// Vista de una entrada con su uid, para listas en pantalla.
export interface Friend extends SocialEntry {
  uid: string;
}

export interface Social {
  friends: Friend[];
  requests: Friend[];
  sent: Friend[];
}
