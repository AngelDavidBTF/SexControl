import { addMonths, format, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayBuckets } from './fap.model';
import { bucketTotal, dayKey } from './stats';

// Datos del calendario del logo: un mes con sus casillas coloreadas por tipo. Se calcula en el
// dispositivo con stats.days (ya cargado), sin lecturas nuevas de Firestore.

export type TipoCelda = '' | 'c' | 's' | 'b';

export interface CeldaDia {
  dia: number;
  clave: string;
  compania: number;
  solitario: number;
  total: number;
  tipo: TipoCelda;
  hoy: boolean;
  futuro: boolean;
  etiqueta: string;
}

export interface MesCalendario {
  clave: string;
  nombre: string;
  anio: number;
  // Casillas vacías antes del día 1 en una semana que empieza en lunes.
  hueco: number;
  celdas: CeldaDia[];
  total: number;
}

export function mesCalendario(days: DayBuckets, mes: Date, hoy: Date): MesCalendario {
  const inicio = startOfMonth(mes);
  const nombreMes = format(inicio, 'LLLL', { locale: es });
  const claveHoy = dayKey(hoy);
  const celdas: CeldaDia[] = [];
  for (let dia = 1; dia <= getDaysInMonth(inicio); dia++) {
    const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), dia);
    const clave = dayKey(fecha);
    const compania = days[clave]?.c ?? 0;
    const solitario = days[clave]?.s ?? 0;
    const total = bucketTotal(days[clave]);
    const futuro = clave > claveHoy;
    const tipo: TipoCelda = compania && solitario ? 'b' : compania ? 'c' : solitario ? 's' : '';
    const veces = futuro ? 'aún no ha llegado' : total === 0 ? 'nada' : total === 1 ? '1 vez' : `${total} veces`;
    celdas.push({ dia, clave, compania, solitario, total, tipo, hoy: clave === claveHoy, futuro, etiqueta: `${dia} de ${nombreMes}: ${veces}` });
  }
  return {
    clave: format(inicio, 'yyyy-MM'),
    nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
    anio: inicio.getFullYear(),
    hueco: (inicio.getDay() + 6) % 7,
    celdas,
    total: celdas.reduce((suma, celda) => suma + celda.total, 0),
  };
}

// Los últimos `cuantos` meses, el más reciente primero.
export function ultimosMeses(days: DayBuckets, hoy: Date, cuantos: number): MesCalendario[] {
  return Array.from({ length: cuantos }, (_, i) => mesCalendario(days, addMonths(hoy, -i), hoy));
}
