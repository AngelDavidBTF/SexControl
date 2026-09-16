import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit {
  private authSvc = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Si el login con Google tuvo que hacerse por redirección, al volver se termina aquí.
  async ngOnInit(): Promise<void> {
    const user = await this.authSvc.completeGoogleRedirect();
    if (user) {
      this.redirectUser(this.authSvc.isEmailVerified(user));
    }
  }

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

  // Tras entrar se vuelve a donde se iba (una invitación abierta desde un enlace, por ejemplo).
  private redirectUser(isVerified: boolean): void {
    if (!isVerified) {
      this.router.navigate(['/verify-email']);
      return;
    }
    const volver = this.route.snapshot.queryParamMap.get('volver');
    this.router.navigateByUrl(volver && volver.startsWith('/') ? volver : '/tabs/sumar');
  }
}
