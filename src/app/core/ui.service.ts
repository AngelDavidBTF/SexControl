import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private alertController = inject(AlertController);

  async alertaInformativa(message: string): Promise<void> {
    const alert = await this.alertController.create({
      message,
      buttons: ['OK'],
    });

    await alert.present();
  }
}
