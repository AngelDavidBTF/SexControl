import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { FapService } from '../../core/fap.service';
import { GroupsService } from '../../core/groups.service';
import { ProfileService } from '../../core/profile.service';
import { UiService } from '../../core/ui.service';
import { HeaderComponent } from '../../components/header/header.component';
import { GroupInvite } from '../../shared/group.model';

// Destino del enlace de invitación a un grupo (/unirse/{code}). Avisa de lo que se comparte antes
// de entrar, porque en un grupo pueden estar personas que no son amigas tuyas.
@Component({
  selector: 'app-join-group',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, RouterLink],
  template: `
    <app-header titulo="Unirse a un grupo"></app-header>

    <ion-content class="ion-padding">
      <div class="invitacion" *ngIf="invite; else cargando">
        <span class="icono" aria-hidden="true">👥</span>
        <h2>{{ invite.groupName }}</h2>
        <p class="muted">Te han invitado a este grupo</p>

        <div class="aviso-privacidad">
          <strong>Antes de entrar</strong>
          <p>
            Los miembros del grupo verán tu nombre, tu foto y tus números (total, mes y semana),
            aunque no sean amigos tuyos. Puedes dejar de compartirlos desde Ajustes o salir del
            grupo cuando quieras.
          </p>
        </div>

        <ion-button expand="block" (click)="join()" [disabled]="joining" class="entrar-grupo">Entrar en el grupo</ion-button>
        <ion-button expand="block" fill="clear" color="medium" routerLink="/tabs/amigos">Ahora no</ion-button>
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
      .icono {
        font-size: 3rem;
        display: block;
        margin: 24px 0 8px;
      }
      .muted {
        color: var(--ion-color-medium);
      }
      .aviso-privacidad {
        text-align: left;
        background: var(--ion-color-step-100, rgba(0, 0, 0, 0.05));
        border-radius: 12px;
        padding: 12px;
        margin: 20px 0;
        font-size: 0.85rem;
      }
      .aviso-privacidad p {
        margin: 6px 0 0;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class JoinGroupPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private groupsService = inject(GroupsService);
  private profiles = inject(ProfileService);
  private fapService = inject(FapService);
  private ui = inject(UiService);

  invite: GroupInvite | null = null;
  error: string | null = null;
  joining = false;

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.error = 'La invitación no es válida';
      return;
    }
    try {
      this.invite = await firstValueFrom(this.groupsService.invite$(code));
      this.error = this.invite ? null : 'Esta invitación ya no sirve. Pide una nueva al creador del grupo.';
    } catch (error) {
      console.error('No se pudo leer la invitación al grupo', error);
      this.error = 'No se pudo abrir la invitación';
    }
  }

  async join(): Promise<void> {
    const uid = this.authService.currentUid();
    const code = this.route.snapshot.paramMap.get('code');
    if (!uid || !code) {
      return;
    }
    this.joining = true;
    try {
      const [profile, stats] = await Promise.all([this.profiles.current(uid), firstValueFrom(this.fapService.stats$(uid))]);
      const groupId = await this.groupsService.joinWithInvite(code, {
        uid,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        counts: { solitario: stats.solitario, compania: stats.compania },
      });
      await this.ui.toast(`Ya estás en "${this.invite?.groupName ?? 'el grupo'}"`);
      await this.router.navigate(['/group', groupId], { replaceUrl: true });
    } catch (error) {
      console.error('No se pudo entrar en el grupo', error);
      await this.ui.toast('No se pudo entrar en el grupo');
    } finally {
      this.joining = false;
    }
  }
}
