import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ProfileService } from '../../core/profile.service';
import { normalizeUsername, usernameProblem } from '../../shared/username';

type Status = 'invalido' | 'comprobando' | 'libre' | 'tuyo' | 'cogido' | 'error';

// Elegir o cambiar el @usuario, comprobando si está libre mientras se escribe (1 lectura por
// nombre probado). Devuelve el @usuario guardado con role 'confirm'.
@Component({
  selector: 'app-username-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start" *ngIf="allowLater">
          <ion-button (click)="later()" class="f-ghost usuario-mas-tarde">{{ current ? 'Cancelar' : 'Más tarde' }}</ion-button>
        </ion-buttons>
        <ion-title>{{ current ? 'Cambiar @usuario' : 'Elige tu @usuario' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding elegir-usuario">
      <p class="explica">
        Así te encuentran tus amigos: te buscan por tu &#64;usuario y te mandan una solicitud. Nadie ve tu email, y
        tus números solo los ve quien aceptes.
      </p>

      <ion-input
        fill="outline"
        label="@usuario"
        labelPlacement="stacked"
        [(ngModel)]="value"
        (ionInput)="onInput()"
        [maxlength]="21"
        autocapitalize="off"
        autocomplete="off"
        spellcheck="false"
        class="campo-usuario"
      >
        <span slot="start" class="arroba">&#64;</span>
      </ion-input>

      <p class="estado" [class.bien]="status === 'libre' || status === 'tuyo'" [class.mal]="status === 'invalido' || status === 'cogido' || status === 'error'">
        <ng-container [ngSwitch]="status">
          <span *ngSwitchCase="'comprobando'">Comprobando…</span>
          <span *ngSwitchCase="'libre'">&#64;{{ handle }} está libre</span>
          <span *ngSwitchCase="'tuyo'">&#64;{{ handle }} ya es tuyo</span>
          <span *ngSwitchCase="'cogido'">&#64;{{ handle }} ya lo tiene otra persona</span>
          <span *ngSwitchCase="'error'">No se pudo comprobar. Revisa la conexión</span>
          <span *ngSwitchDefault>{{ problem }}</span>
        </ng-container>
      </p>
      <p class="f-muted">Letras sin tilde, números y _, de 3 a 20. Podrás cambiarlo en Ajustes.</p>

      <ion-button expand="block" class="f-key pink guardar-usuario" (click)="save()" [disabled]="!canSave || saving">
        {{ saving ? 'Guardando…' : 'Guardar' }}
      </ion-button>
    </ion-content>
  `,
  styles: `
    .explica {
      margin-top: 0;
      line-height: 1.5;
    }
    .arroba {
      font-weight: 600;
      color: var(--f-muted);
      margin-right: 2px;
    }
    .estado {
      min-height: 20px;
      margin: 8px 2px 0;
      font-size: 14px;
      font-weight: 500;
    }
    .estado.bien {
      color: var(--f-up);
    }
    .estado.mal {
      color: var(--f-down);
    }
  `,
})
export class UsernameModal implements OnInit, OnDestroy {
  private modalController = inject(ModalController);
  private profiles = inject(ProfileService);

  @Input({ required: true }) uid!: string;
  @Input() current: string | null = null;
  @Input() suggestion = '';
  @Input() allowLater = true;

  value = '';
  status: Status = 'invalido';
  problem: string | null = null;
  saving = false;

  private timer?: ReturnType<typeof setTimeout>;
  private seq = 0;

  get handle(): string {
    return normalizeUsername(this.value);
  }

  get canSave(): boolean {
    return this.status === 'libre' || (this.status === 'tuyo' && this.handle !== this.current);
  }

  ngOnInit(): void {
    this.value = this.current ?? this.suggestion;
    this.onInput();
  }

  onInput(): void {
    clearTimeout(this.timer);
    const handle = this.handle;
    const seq = ++this.seq;
    this.problem = usernameProblem(handle);
    if (this.problem) {
      this.status = 'invalido';
      return;
    }
    this.status = 'comprobando';
    this.timer = setTimeout(async () => {
      try {
        const availability = await this.profiles.usernameAvailability(this.uid, handle);
        if (seq === this.seq) {
          this.status = availability;
        }
      } catch {
        if (seq === this.seq) {
          this.status = 'error';
        }
      }
    }, 400);
  }

  async save(): Promise<void> {
    const handle = this.handle;
    this.saving = true;
    try {
      await this.profiles.setUsername(this.uid, handle, this.current);
      await this.modalController.dismiss(handle, 'confirm');
    } catch (error) {
      console.error('No se pudo guardar el @usuario', error);
      // Lo más probable: otra persona lo ha cogido entre la comprobación y el guardado.
      this.status = (error as { code?: string }).code === 'permission-denied' ? 'cogido' : 'error';
    } finally {
      this.saving = false;
    }
  }

  later(): Promise<boolean> {
    return this.modalController.dismiss(null, 'cancel');
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
