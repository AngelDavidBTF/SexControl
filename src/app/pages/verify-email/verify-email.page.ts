import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../core/analytics.service';
import { AuthService } from '../../core/auth.service';
import { ProfileService } from '../../core/profile.service';
import { UiService } from '../../core/ui.service';

// La app exige email verificado (authGuard). Aquí se espera a que el usuario pulse el enlace.
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
})
export class VerifyEmailPage {
  private authSvc = inject(AuthService);
  private router = inject(Router);
  private profiles = inject(ProfileService);
  private ui = inject(UiService);
  private analytics = inject(AnalyticsService);

  readonly user$ = this.authSvc.user$;
  checking = false;

  async onSendEmail(): Promise<void> {
    try {
      await this.authSvc.sendVerificationEmail();
      await this.ui.toast('Te hemos enviado otro email de verificación');
    } catch (error) {
      await this.ui.toast(this.authSvc.errorMessage(error));
    }
  }

  async onCheck(): Promise<void> {
    this.checking = true;
    try {
      const user = await this.authSvc.reloadUser();
      if (user?.emailVerified) {
        this.analytics.log('email_verificado');
        // Ya se le puede encontrar por su email.
        this.profiles.ensurePublic(user).catch((error) => console.warn('No se pudo publicar el perfil público', error));
        await this.router.navigate(['/tabs/sumar'], { replaceUrl: true });
      } else {
        await this.ui.toast('Todavía no está verificado. Revisa tu correo (y la carpeta de spam)');
      }
    } finally {
      this.checking = false;
    }
  }

  async onLogout(): Promise<void> {
    await this.authSvc.logout();
    await this.router.navigate(['/login'], { replaceUrl: true });
  }
}
