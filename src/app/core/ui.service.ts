import { Injectable, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

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
