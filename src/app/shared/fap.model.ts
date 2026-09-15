import { Timestamp } from '@angular/fire/firestore';

export interface Fap {
  id?: string;
  uid: string;
  numero: number;
  fecha: Timestamp;
  solitario: boolean;
}

// Totales de un usuario.
export interface FapCounts {
  solitario: number;
  compania: number;
}

// Recuento de un día u hora: s = solitario, c = compañía (claves cortas: el documento crece con
// un registro por día con actividad).
export interface StatsBucket {
  s?: number;
  c?: number;
}

// 'yyyy-MM-dd' (hora local) → recuento.
export type DayBuckets = Record<string, StatsBucket>;
// '0'..'23' → recuento acumulado de toda la historia.
export type HourBuckets = Record<string, StatsBucket>;

// Versión del formato de fapStats. Si el documento tiene otra, se reconstruye desde los faps.
export const STATS_VERSION = 3;

// fapStats/{uid}: totales y recuentos por día/hora, solo legible por su dueño. Sumar y las
// estadísticas leen este único documento.
export interface FapStats extends FapCounts {
  days: DayBuckets;
  hours: HourBuckets;
  v: number | null;
}
