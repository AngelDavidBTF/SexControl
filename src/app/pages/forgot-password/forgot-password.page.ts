import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [IonicModule, HeaderComponent],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPage {
  private authSvc = inject(AuthService);
  private router = inject(Router);

  async onResetPassword(email: string | number | null | undefined): Promise<void> {
    await this.authSvc.resetPassword(String(email ?? ''));
    this.router.navigate(['/login']);
  }
}
