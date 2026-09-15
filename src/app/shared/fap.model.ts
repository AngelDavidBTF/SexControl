import { Timestamp } from '@angular/fire/firestore';

// Detalles opcionales de un fap (solo los ve su dueño).
export interface FapDetails {
  nota?: string | null;
  // 1..5
  valoracion?: number | null;
  etiquetas?: string[] | null;
}

export interface Fap extends FapDetails {
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
// etiqueta → recuento.
export type TagBuckets = Record<string, StatsBucket>;
// '1'..'5' → recuento.
export type RatingBuckets = Record<string, StatsBucket>;

export interface Goals {
  semana?: number | null;
  mes?: number | null;
}

// Versión del formato de fapStats. Si el documento tiene otra, se reconstruye desde los faps.
export const STATS_VERSION = 3;

// fapStats/{uid}: totales, recuentos por día/hora/etiqueta/valoración y objetivos, solo legible
// por su dueño. Sumar y las estadísticas leen este único documento.
export interface FapStats extends FapCounts {
  days: DayBuckets;
  hours: HourBuckets;
  tags: TagBuckets;
  ratings: RatingBuckets;
  goals: Goals;
  v: number | null;
}

export const MAX_TAGS = 10;
export const MAX_NOTE = 280;

// Etiquetas sugeridas cuando el usuario aún no tiene las suyas.
export const DEFAULT_TAGS = ['pareja', 'rollo', 'casa', 'viaje', 'hotel', 'fin de semana'];

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 24);
}
