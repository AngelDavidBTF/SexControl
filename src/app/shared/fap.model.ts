import { Timestamp } from '@angular/fire/firestore';

export interface Fap {
  id?: string;
  uid: string;
  numero: number;
  fecha: Timestamp;
  solitario: boolean;
}

// fapStats/{uid}: totales de un usuario (ver fap.service.ts).
export interface FapCounts {
  solitario: number;
  compania: number;
}
