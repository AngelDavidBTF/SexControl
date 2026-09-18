import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/analytics.service';
import { AuthService } from '../../core/auth.service';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, RouterLink, HeaderComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private authSvc = inject(AuthService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private analytics = inject(AnalyticsService);

  registerForm: FormGroup = this.formBuilder.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(6)]],
      repeatPass: [''],
    },
    { validators: this.checkPasswords }
  );

  private checkPasswords(group: FormGroup): ValidationErrors | null {
    const pass = group.controls['pass'].value;
    const confirmPass = group.controls['repeatPass'].value;
    return pass === confirmPass ? null : { notSame: true };
  }

  async onRegister(): Promise<void> {
    const { email, pass, name } = this.registerForm.controls;
    this.analytics.log('registro_iniciado');
    const user = await this.authSvc.register(email.value, pass.value, name.value);
    if (user) {
      this.analytics.log('registro_creado', { metodo: 'email' });
      this.redirectUser(this.authSvc.isEmailVerified(user));
    }
  }

  private redirectUser(isVerified: boolean): void {
    this.router.navigate([isVerified ? '/tabs/sumar' : '/verify-email']);
  }
}
