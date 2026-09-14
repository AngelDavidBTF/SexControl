import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  public registerForm: FormGroup;

  constructor(private authSvc: AuthService,
              private router: Router,
              private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      pass: ['', [Validators.required, Validators.minLength(6)]],
      repeatPass: ['']
    },{ validator: this.checkPasswords });
  }

  checkPasswords(group: FormGroup) { // here we have the 'passwords' group
    let pass = group.controls.pass.value;
    let confirmPass = group.controls.repeatPass.value;

    return pass === confirmPass ? null : { notSame: true }
  }

  async onRegister() {
    try {
      const user = await this.authSvc.register(this.registerForm.controls.email.value, this.registerForm.controls.pass.value, this.registerForm.controls.name.value );
      if (user) {
        const isVerified = this.authSvc.isEmailVerified(user);
        this.redirectUser(isVerified);
      }
    } catch (error) {
      console.log('Error', error);
    }
  }

  private redirectUser(isVerified: boolean): void {
    if (isVerified) {
      this.router.navigate(['/tabs/sumar']);
    } else {
      this.router.navigate(['verify-email']);
    }
  }
}
