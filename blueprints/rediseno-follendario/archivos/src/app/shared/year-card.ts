import { differenceInCalendarDays, format, parseISO, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { FapStats } from './fap.model';
import { TIME_SLOTS, WEEKDAY_NAMES, bucketTotal, indexOfMax, sumRange, timeSlotTotals } from './stats';

export interface YearSummary {
  year: number;
  total: number;
  compania: number;
  solitario: number;
  activeDays: number;
  bestMonth: string | null;
  bestMonthTotal: number;
  bestStreak: number;
  favoriteWeekday: string | null;
  favoriteSlot: string | null;
  topTag: string | null;
  months: number[];
}

// Resumen de un año a partir de los recuentos por día.
export function yearSummary(stats: FapStats, year: number): YearSummary {
  const start = startOfYear(new Date(year, 0, 1));
  const end = startOfYear(new Date(year + 1, 0, 1));
  const totals = sumRange(stats.days, { start, end });
  const prefix = `${year}-`;
  const yearDays = Object.entries(stats.days).filter(([key, bucket]) => key.startsWith(prefix) && bucketTotal(bucket) > 0);

  const months = Array.from({ length: 12 }, () => 0);
  const weekdays = Array.from({ length: 7 }, () => 0);
  for (const [key, bucket] of yearDays) {
    const date = parseISO(key);
    months[date.getMonth()] += bucketTotal(bucket);
    weekdays[(date.getDay() + 6) % 7] += bucketTotal(bucket);
  }

  let bestStreak = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const [key] of yearDays.sort(([a], [b]) => a.localeCompare(b))) {
    const date = parseISO(key);
    run = previous && differenceInCalendarDays(date, previous) === 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = date;
  }

  const monthIndex = indexOfMax(months);
  const weekdayIndex = indexOfMax(weekdays);
  // Las horas y etiquetas se guardan acumuladas de toda la historia, no por año.
  const slotIndex = indexOfMax(timeSlotTotals(stats.hours));
  const topTag = Object.entries(stats.tags)
    .map(([tag, bucket]) => [tag, bucketTotal(bucket)] as const)
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    year,
    total: totals.total,
    compania: totals.compania,
    solitario: totals.solitario,
    activeDays: totals.activeDays,
    bestMonth: monthIndex !== null ? capitalize(format(new Date(year, monthIndex, 1), 'MMMM', { locale: es })) : null,
    bestMonthTotal: monthIndex !== null ? months[monthIndex] : 0,
    bestStreak,
    favoriteWeekday: weekdayIndex !== null ? capitalize(WEEKDAY_NAMES[weekdayIndex]) : null,
    favoriteSlot: slotIndex !== null ? `${TIME_SLOTS[slotIndex].emoji} ${TIME_SLOTS[slotIndex].label}` : null,
    topTag,
    months,
  };
}

const WIDTH = 1080;
const HEIGHT = 1350;

// Tarjeta vertical (formato historia/post) con el resumen del año, lista para compartir.
export async function drawYearCard(summary: YearSummary, name: string | null): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D no disponible');
  }
  const font = (size: number, weight = 400) => `${weight} ${size}px Geist, "Helvetica Neue", Arial, sans-serif`;

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#10081a');
  gradient.addColorStop(0.55, '#4a1740');
  gradient.addColorStop(1, '#fc2a6c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(44, 500);
  ctx.globalAlpha = 0.85;
  ctx.fillText(name ? `El ${summary.year} de ${name}` : `Mi ${summary.year}`, 80, 140);
  ctx.globalAlpha = 1;

  ctx.font = font(260, 800);
  ctx.fillText(String(summary.total), 72, 400);
  ctx.font = font(52, 500);
  ctx.fillText(summary.total === 1 ? 'vez este año' : 'veces este año', 84, 470);

  // Reparto compañía / solitario.
  const barY = 530;
  const barWidth = WIDTH - 160;
  const companiaWidth = summary.total ? (summary.compania / summary.total) * barWidth : barWidth / 2;
  roundRect(ctx, 80, barY, barWidth, 36, 18, 'rgba(255,255,255,0.25)');
  if (summary.total) {
    roundRect(ctx, 80, barY, Math.max(36, companiaWidth), 36, 18, '#ffffff');
  }
  ctx.font = font(34, 500);
  ctx.fillText(`${summary.compania} en compañía`, 80, barY + 90);
  const soloText = `${summary.solitario} en solitario`;
  ctx.fillText(soloText, WIDTH - 80 - ctx.measureText(soloText).width, barY + 90);

  // Datos destacados en rejilla 2x3.
  const facts: [string, string][] = [
    ['🔥 Mejor racha', `${summary.bestStreak} ${summary.bestStreak === 1 ? 'día' : 'días'}`],
    ['📅 Días activos', String(summary.activeDays)],
    ['🏆 Mejor mes', summary.bestMonth ? `${summary.bestMonth} (${summary.bestMonthTotal})` : '—'],
    ['❤️ Día favorito', summary.favoriteWeekday ?? '—'],
    ['🕒 Franja favorita', summary.favoriteSlot ?? '—'],
    ['🏷️ Etiqueta estrella', summary.topTag ?? '—'],
  ];
  facts.forEach(([label, value], i) => {
    const x = 80 + (i % 2) * ((WIDTH - 160) / 2 + 20);
    const y = 760 + Math.floor(i / 2) * 150;
    ctx.globalAlpha = 0.8;
    ctx.font = font(32, 400);
    ctx.fillText(label, x, y);
    ctx.globalAlpha = 1;
    ctx.font = font(46, 700);
    ctx.fillText(value, x, y + 58, (WIDTH - 200) / 2);
  });

  // Mini gráfica de meses.
  const chartTop = 1200;
  const chartHeight = 70;
  const max = Math.max(1, ...summary.months);
  const slot = (WIDTH - 160) / 12;
  summary.months.forEach((value, i) => {
    const h = Math.max(6, (value / max) * chartHeight);
    roundRect(ctx, 80 + i * slot + slot * 0.2, chartTop + chartHeight - h, slot * 0.6, h, 6, 'rgba(255,255,255,0.85)');
  });

  ctx.font = font(30, 500);
  ctx.globalAlpha = 0.75;
  ctx.fillText('Follendario', 80, HEIGHT - 40);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))), 'image/png')
  );
}

// La usa también la tarjeta semanal de grupo (group-card.ts).
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

