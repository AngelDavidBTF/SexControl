import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, HeaderComponent],
  templateUrl: './verify-email.page.html',
  styleUrl: './verify-email.page.scss',
})
export class VerifyEmailPage implements OnDestroy {
  private authSvc = inject(AuthService);

  readonly user$ = this.authSvc.user$;

  async onSendEmail(): Promise<void> {
    await this.authSvc.sendVerificationEmail();
  }

  ngOnDestroy(): void {
    this.authSvc.logout();
  }
}
