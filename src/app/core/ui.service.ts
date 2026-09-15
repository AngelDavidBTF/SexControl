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

  async toast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
    });

    await toast.present();
  }
}
