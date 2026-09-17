import { Injectable, inject } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  async loading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({ message });
    await loading.present();
    return loading;
  }

  // Aviso con botones de acción (p. ej. "Deshacer"). Devuelve el rol del botón pulsado, o null si
  // se cerró solo.
  async actionToast(message: string, actions: { text: string; role: string }[], duration = 5000): Promise<string | null> {
    const toast = await this.toastController.create({
      message,
      duration,
      buttons: actions.map((action) => ({ text: action.text, role: action.role })),
    });
    await toast.present();
    const { role } = await toast.onDidDismiss();
    return role && actions.some((action) => action.role === role) ? role : null;
  }

  async alertaInformativa(message: string): Promise<void> {
    const alert = await this.alertController.create({
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }

  // Celebración breve: confeti dibujado en un canvas encima de todo y, si el dispositivo lo
  // admite, una vibración corta. Se limpia solo. En el modo discreto no se lanza: llama la
  // atención, que es justo lo contrario de lo que busca ese modo.
  celebrate(): void {
    try {
      navigator.vibrate?.([12, 40, 18]);
    } catch {
      // Sin vibración no pasa nada.
    }
    if (document.body.classList.contains('discreto-numeros')) {
      return;
    }
    confetti();
  }

  async toast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
    });

    await toast.present();
  }
}

// Confeti en un canvas a pantalla completa, sin librerías: unas cuantas piezas que caen girando
// durante poco más de un segundo y medio. El canvas se quita al terminar.
const CONFETTI_COLORS = ['#fc2a6c', '#6fc8f1', '#fcf3ed', '#ffd166', '#6fdc95'];
const CONFETTI_MS = 1600;

function confetti(): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  document.body.appendChild(canvas);

  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    size: 6 + Math.random() * 6,
    speed: 2.5 + Math.random() * 3.5,
    drift: -1 + Math.random() * 2,
    angle: Math.random() * Math.PI,
    spin: -0.2 + Math.random() * 0.4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));

  const start = performance.now();
  const frame = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Se desvanece al final para que no desaparezca de golpe.
    ctx.globalAlpha = Math.max(0, Math.min(1, (CONFETTI_MS - elapsed) / 400));
    for (const piece of pieces) {
      piece.y += piece.speed;
      piece.x += piece.drift;
      piece.angle += piece.spin;
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.angle);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      ctx.restore();
    }
    if (elapsed < CONFETTI_MS) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(frame);
}
