import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UsernameModal } from '../components/username/username.modal';
import { suggestUsername } from '../shared/username';
import { ProfileService } from './profile.service';
import { UiService } from './ui.service';

// Si alguien pulsa "Más tarde", no se le vuelve a preguntar solo hasta pasados estos días (en este
// dispositivo). Siempre puede elegirlo desde Añadir amigo o Ajustes.
const LATER_DAYS = 7;

// Pedir el @usuario: sin él nadie puede encontrarte, así que se pregunta al entrar en la app.
@Injectable({
  providedIn: 'root',
})
export class UsernamePromptService {
  private modalController = inject(ModalController);
  private profiles = inject(ProfileService);
  private ui = inject(UiService);
  // Solo una vez por sesión, aunque se vuelva a pasar por las pestañas.
  private askedThisSession = new Set<string>();

  // Abre la ventana de elegir o cambiar el @usuario. Devuelve el nuevo, o null si se cancela.
  async choose(uid: string, allowLater = true): Promise<string | null> {
    const profile = await this.profiles.current(uid);
    const modal = await this.modalController.create({
      component: UsernameModal,
      componentProps: {
        uid,
        current: profile.username,
        suggestion: suggestUsername(profile.displayName),
        allowLater,
      },
    });
    await modal.present();
    const { data, role } = await modal.onWillDismiss<string>();
    if (role !== 'confirm' || !data) {
      return null;
    }
    await this.ui.toast(`Ya te pueden encontrar como @${data}`);
    return data;
  }

  // Al entrar en las pestañas, a quien aún no tiene @usuario.
  async promptIfMissing(uid: string): Promise<void> {
    if (this.askedThisSession.has(uid) || this.postponed(uid)) {
      return;
    }
    this.askedThisSession.add(uid);
    const profile = await this.profiles.current(uid);
    if (profile.username) {
      return;
    }
    const chosen = await this.choose(uid);
    if (!chosen) {
      this.postpone(uid);
    }
  }

  private key(uid: string): string {
    return `sexcontrol.usernameLater.${uid}`;
  }

  private postponed(uid: string): boolean {
    try {
      const at = Number(localStorage.getItem(this.key(uid)));
      return at > 0 && Date.now() - at < LATER_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }

  private postpone(uid: string): void {
    try {
      localStorage.setItem(this.key(uid), String(Date.now()));
    } catch {
      // Sin almacenamiento local se volverá a preguntar en la próxima sesión.
    }
  }
}
