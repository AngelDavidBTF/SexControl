import { Injectable, signal } from '@angular/core';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// "Instalar app" (PWA): el navegador avisa con beforeinstallprompt cuando se puede instalar.
@Injectable({
  providedIn: 'root',
})
export class InstallService {
  private deferred: InstallPromptEvent | null = null;
  readonly canInstall = signal(false);
  readonly installed = signal(matchMedia('(display-mode: standalone)').matches);

  constructor() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferred = event as InstallPromptEvent;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.canInstall.set(false);
    });
  }

  async install(): Promise<boolean> {
    if (!this.deferred) {
      return false;
    }
    await this.deferred.prompt();
    const { outcome } = await this.deferred.userChoice;
    this.deferred = null;
    this.canInstall.set(false);
    return outcome === 'accepted';
  }
}
