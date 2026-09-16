import { WeekSummary } from './group-awards';
import { roundRect } from './year-card';

const WIDTH = 1080;
const HEIGHT = 1350;

// Tarjeta vertical con el resumen semanal de un grupo (campeón, total, títulos y clasificación),
// lista para compartir. Mismo formato que la del resumen anual.
export async function drawWeekCard(summary: WeekSummary): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D no disponible');
  }
  const font = (size: number, weight = 400) => `${weight} ${size}px Roboto, "Helvetica Neue", Arial, sans-serif`;

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#12233f');
  gradient.addColorStop(0.55, '#1f5c7a');
  gradient.addColorStop(1, '#44c8fc');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(52, 700);
  ctx.fillText(cut(ctx, summary.groupName, WIDTH - 160), 80, 140);
  ctx.globalAlpha = 0.8;
  ctx.font = font(36, 400);
  ctx.fillText(summary.weekLabel, 80, 200);
  ctx.globalAlpha = 1;

  ctx.font = font(220, 800);
  ctx.fillText(String(summary.total), 72, 430);
  ctx.font = font(48, 500);
  ctx.fillText(summary.total === 1 ? 'vez entre todos' : 'veces entre todos', 84, 500);

  // Campeón de la semana.
  let y = 600;
  if (summary.champion) {
    roundRect(ctx, 80, y, WIDTH - 160, 130, 24, 'rgba(255,255,255,0.18)');
    ctx.fillStyle = '#ffffff';
    ctx.font = font(60, 400);
    ctx.fillText('🥇', 120, y + 88);
    ctx.font = font(30, 400);
    ctx.globalAlpha = 0.8;
    ctx.fillText('MVP de la semana', 210, y + 58);
    ctx.globalAlpha = 1;
    ctx.font = font(44, 700);
    ctx.fillText(cut(ctx, `${summary.champion.name} · ${summary.champion.value}`, WIDTH - 400), 210, y + 106);
    y += 170;
  }

  // Reparto del espacio que queda hasta el pie: primero se recortan filas de la clasificación
  // y, si aún no cabe, títulos. Así nunca se pisan entre ellos.
  const rowHeight = 78;
  const titleHeight = 110;
  const footerTop = HEIGHT - 150;
  const available = footerTop - y;
  const titlesAvailable = summary.titles.filter((title) => title.id !== 'mvp');
  let titleCount = Math.min(3, titlesAvailable.length);
  let rowCount = Math.min(5, summary.ranking.length);
  const fits = () => titleCount * titleHeight + 70 + rowCount * rowHeight <= available;
  while (!fits() && rowCount > 2) {
    rowCount--;
  }
  while (!fits() && titleCount > 0) {
    titleCount--;
  }

  // Títulos repartidos (sin repetir el MVP, que ya sale arriba).
  for (const title of titlesAvailable.slice(0, titleCount)) {
    ctx.font = font(44, 400);
    ctx.fillText(title.emoji, 90, y + 44);
    ctx.font = font(34, 700);
    ctx.fillText(cut(ctx, title.title, 340), 160, y + 30);
    ctx.globalAlpha = 0.8;
    ctx.font = font(30, 400);
    ctx.fillText(cut(ctx, `${title.name} · ${title.detail}`, WIDTH - 340), 160, y + 72);
    ctx.globalAlpha = 1;
    y += 110;
  }

  // Clasificación de la semana, pegada al pie para que la tarjeta quede equilibrada.
  const rows = summary.ranking.slice(0, rowCount);
  y = Math.max(y + 40, footerTop - rows.length * rowHeight);
  ctx.font = font(36, 700);
  ctx.fillText('Clasificación', 80, y);
  const max = Math.max(1, ...rows.map((row) => row.value));
  for (const row of rows) {
    y += rowHeight;
    ctx.font = font(32, 500);
    ctx.fillText(cut(ctx, row.name, 300), 80, y + 26);
    const barX = 400;
    const barWidth = WIDTH - barX - 160;
    roundRect(ctx, barX, y, barWidth, 34, 17, 'rgba(255,255,255,0.22)');
    roundRect(ctx, barX, y, Math.max(34, (row.value / max) * barWidth), 34, 17, '#ffffff');
    ctx.fillStyle = '#ffffff';
    ctx.font = font(32, 700);
    ctx.fillText(String(row.value), WIDTH - 140, y + 28);
  }

  ctx.font = font(30, 500);
  ctx.globalAlpha = 0.75;
  ctx.fillText('SexControl', 80, HEIGHT - 40);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo generar la imagen'))), 'image/png')
  );
}

// Recorta con puntos suspensivos para que un nombre largo no se salga de la tarjeta.
function cut(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}
