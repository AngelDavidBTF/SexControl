import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private authSvc = inject(AuthService);
  private router = inject(Router);

  async onLogin(email: string | number | null | undefined, password: string | number | null | undefined): Promise<void> {
    const user = await this.authSvc.login(String(email ?? ''), String(password ?? ''));
    if (user) {
      this.redirectUser(this.authSvc.isEmailVerified(user));
    }
  }

  async onLoginGoogle(): Promise<void> {
    const user = await this.authSvc.loginGoogle();
    if (user) {
      this.redirectUser(this.authSvc.isEmailVerified(user));
    }
  }

  private redirectUser(isVerified: boolean): void {
    this.router.navigate([isVerified ? '/tabs/sumar' : '/verify-email']);
  }
}
