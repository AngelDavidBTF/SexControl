import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { FriendsService } from '../../core/friends.service';
import { ProfileService } from '../../core/profile.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { User } from '../../shared/user.model';

// Destino del enlace de invitación de un amigo (/invitar/{uid}): enseña quién invita y manda la
// solicitud. Cuesta 1 lectura del perfil público.
@Component({
  selector: 'app-invite',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent],
  template: `
    <app-header titulo="Invitación"></app-header>

    <ion-content class="ion-padding">
      <div class="invitacion" *ngIf="user; else cargando">
        <ion-avatar>
          <img [src]="user.photoURL || 'assets/icon-user.svg'" alt="" />
        </ion-avatar>
        <h2>{{ user.displayName || user.email }}</h2>
        <p class="muted">quiere ser tu amigo en SexControl</p>

        <ion-button expand="block" (click)="accept()" [disabled]="sending" class="aceptar-invitacion">
          Enviar solicitud de amistad
        </ion-button>
        <ion-button expand="block" fill="clear" color="medium" routerLink="/tabs/amigos">Ahora no</ion-button>

        <p class="muted aviso">
          Solo compartirás tus números cuando acepte la solicitud, y puedes elegir qué ve de ti en cualquier momento.
        </p>
      </div>

      <ng-template #cargando>
        <div class="ion-text-center ion-margin">
          <ion-spinner *ngIf="!error" name="circular"></ion-spinner>
          <h5 *ngIf="error">{{ error }}</h5>
          <ion-button *ngIf="error" fill="clear" routerLink="/tabs/amigos">Ir a Amigos</ion-button>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: [
    `
      .invitacion {
        text-align: center;
      }
      .invitacion ion-avatar {
        width: 96px;
        height: 96px;
        margin: 24px auto 12px;
      }
      .muted {
        color: var(--ion-color-medium);
      }
      .aviso {
        font-size: 0.8rem;
        margin-top: 20px;
      }
    `,
  ],
})
export class InvitePage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private friendsService = inject(FriendsService);
  private profiles = inject(ProfileService);
  private fapService = inject(FapService);
  private ui = inject(UiService);

  user: User | null = null;
  error: string | null = null;
  sending = false;

  async ngOnInit(): Promise<void> {
    const uid = this.route.snapshot.paramMap.get('uid');
    const myUid = this.authService.currentUid();
    if (!uid) {
      this.error = 'La invitación no es válida';
      return;
    }
    if (uid === myUid) {
      this.error = 'Esta es tu propia invitación: compártela con quien quieras.';
      return;
    }
    try {
      const data = await firstValueFrom(docData(doc(this.firestore, 'users', uid)));
      this.user = data ? ({ ...(data as User), uid }) : null;
      this.error = this.user ? null : 'Esa cuenta ya no existe';
    } catch (error) {
      console.error('No se pudo leer la invitación', error);
      this.error = 'No se pudo abrir la invitación';
    }
  }

  async accept(): Promise<void> {
    const uid = this.authService.currentUid();
    if (!uid || !this.user) {
      return;
    }
    this.sending = true;
    try {
      const [me, stats] = await Promise.all([this.profiles.current(uid), firstValueFrom(this.fapService.stats$(uid))]);
      await this.friendsService.sendRequest(me, { solitario: stats.solitario, compania: stats.compania }, this.user);
      await this.ui.toast('Solicitud enviada');
      await this.router.navigate(['/tabs/amigos'], { replaceUrl: true });
    } catch (error) {
      console.error('No se pudo enviar la solicitud', error);
      await this.ui.toast('No se pudo enviar la solicitud');
    } finally {
      this.sending = false;
    }
  }
}
