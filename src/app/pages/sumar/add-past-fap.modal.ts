import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { format, parseISO, subHours } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PastFap {
  solitario: boolean;
  fecha: Date;
}

// Modal para apuntar un fap olvidado con su fecha y hora. Devuelve un PastFap al confirmar.
@Component({
  selector: 'app-add-past-fap-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()" aria-label="Cancelar">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>¿Se te olvidó apuntar una?</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-segment [value]="solitario ? 'solitario' : 'compania'" (ionChange)="solitario = $event.detail.value === 'solitario'" mode="ios" class="tipo">
        <ion-segment-button value="compania" class="tipo-compania">
          <ion-icon name="people"></ion-icon>
          <ion-label>En compañía</ion-label>
        </ion-segment-button>
        <ion-segment-button value="solitario" class="tipo-solitario">
          <ion-icon name="person"></ion-icon>
          <ion-label>En solitario</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div class="atajos">
        <ion-chip *ngFor="let shortcut of shortcuts" (click)="setValue(shortcut.value)" [outline]="value !== shortcut.value">
          {{ shortcut.label }}
        </ion-chip>
      </div>

      <section class="f-card f-paper">
        <ion-datetime
          class="fecha"
          presentation="date-time"
          locale="es-ES"
          [firstDayOfWeek]="1"
          hourCycle="h23"
          [max]="max"
          [value]="value"
          (ionChange)="onDateChange($event)"
        >
          <span slot="time-label">Hora</span>
        </ion-datetime>
      </section>

      <p class="resumen">
        {{ solitario ? 'En solitario' : 'En compañía' }} · <strong class="resumen-fecha">{{ summary }}</strong>
      </p>

      <ion-button expand="block" class="f-key confirmar" [class.pink]="!solitario" [class.solo]="solitario" (click)="confirm()">
        AÑADIR
      </ion-button>
    </ion-content>
  `,
  styles: `
    .tipo {
      margin-bottom: 12px;
    }
    .atajos {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }
    .fecha {
      margin: 0 auto;
    }
    .resumen {
      text-align: center;
      margin: 16px 0;
    }
  `,
})
export class AddPastFapModal {
  private modalController = inject(ModalController);

  solitario = false;
  readonly max = toLocalIso(new Date());
  value = toLocalIso(subHours(new Date(), 1));

  readonly shortcuts = [
    { label: 'Hace 1 hora', value: toLocalIso(subHours(new Date(), 1)) },
    { label: 'Anoche', value: toLocalIso(atTime(-1, 23)) },
    { label: 'Ayer por la tarde', value: toLocalIso(atTime(-1, 18)) },
    { label: 'Ayer por la mañana', value: toLocalIso(atTime(-1, 10)) },
  ];

  get summary(): string {
    const text = format(parseISO(this.value), "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  setValue(value: string): void {
    this.value = value;
  }

  onDateChange(event: CustomEvent): void {
    const value = event.detail.value;
    if (typeof value === 'string') {
      this.value = value;
    }
  }

  confirm(): Promise<boolean> {
    const fecha = parseISO(this.value);
    // Nunca en el futuro (también lo exigen las reglas).
    const result: PastFap = { solitario: this.solitario, fecha: fecha > new Date() ? new Date() : fecha };
    return this.modalController.dismiss(result, 'confirm');
  }

  close(): Promise<boolean> {
    return this.modalController.dismiss(null, 'cancel');
  }
}

// ion-datetime trabaja con ISO en hora local y sin zona: 'yyyy-MM-ddTHH:mm'.
function toLocalIso(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function atTime(dayOffset: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
}
