import { Timestamp } from '@angular/fire/firestore';

export interface Fap {
  id?: string;
  uid: string;
  numero: number;
  fecha: Timestamp;
  solitario: boolean;
  groupId?: string;
}
