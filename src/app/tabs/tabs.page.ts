import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../core/auth.service';
import { UsernamePromptService } from '../core/username-prompt.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './tabs.page.html',
})
export class TabsPage implements OnInit {
  private authService = inject(AuthService);
  private usernamePrompt = inject(UsernamePromptService);

  ngOnInit(): void {
    // Las pestañas exigen email verificado (authGuard), así que aquí ya hay cuenta completa.
    const uid = this.authService.currentUid();
    if (uid) {
      this.usernamePrompt.promptIfMissing(uid).catch((error) => console.warn('No se pudo pedir el @usuario', error));
    }
  }
}
