import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { DEFAULT_TAGS, FapDetails, MAX_NOTE, MAX_TAGS, normalizeTag } from '../../shared/fap.model';

// Nota, valoración y etiquetas de un fap. Devuelve FapDetails al guardar.
@Component({
  selector: 'app-fap-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="close()">Cancelar</ion-button>
        </ion-buttons>
        <ion-title>Detalles</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" [strong]="true" class="guardar-detalles">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="f-muted" *ngIf="subtitle">{{ subtitle }}</p>

      <span class="f-label">¿qué tal fue?</span>
      <div class="estrellas" role="radiogroup" aria-label="Valoración">
        <button
          type="button"
          *ngFor="let star of stars"
          role="radio"
          [attr.aria-checked]="valoracion === star"
          [attr.aria-label]="star + (star === 1 ? ' estrella' : ' estrellas')"
          [class.activa]="(valoracion ?? 0) >= star"
          (click)="valoracion = valoracion === star ? null : star"
          class="estrella"
        >★</button>
      </div>

      <span class="f-label">etiquetas</span>
      <div class="etiquetas">
        <ion-chip *ngFor="let tag of suggestions" [outline]="!selected.has(tag)" (click)="toggle(tag)" [class.seleccionada]="selected.has(tag)" class="etiqueta">
          {{ tag }}
          <ion-icon *ngIf="selected.has(tag)" name="checkmark"></ion-icon>
        </ion-chip>
      </div>
      <ion-input
        fill="outline"
        placeholder="Nueva etiqueta y pulsa Intro"
        [(ngModel)]="newTag"
        (keyup.enter)="addTag()"
        [maxlength]="24"
        class="nueva-etiqueta"
      >
        <ion-button slot="end" fill="clear" (click)="addTag()" aria-label="Añadir etiqueta"><ion-icon slot="icon-only" name="add"></ion-icon></ion-button>
      </ion-input>

      <span class="f-label">nota</span>
      <ion-textarea
        fill="outline"
        [autoGrow]="true"
        [counter]="true"
        [maxlength]="maxNote"
        placeholder="Algo que quieras recordar (solo lo ves tú)"
        [(ngModel)]="nota"
        class="nota"
      ></ion-textarea>
    </ion-content>
  `,
  styles: `
    .f-muted {
      margin-top: 0;
    }
    .f-label {
      display: block;
      margin: 20px 0 8px;
    }
    .estrellas {
      display: flex;
      gap: 6px;
    }
    .estrella {
      background: none;
      border: 0;
      font-size: 36px;
      line-height: 1;
      color: var(--f-line);
      padding: 0 2px;
    }
    .estrella.activa {
      color: var(--f-pink-text);
    }
    .etiquetas {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-bottom: 8px;
    }
  `,
})
export class FapDetailsModal implements OnInit {
  private modalController = inject(ModalController);

  @Input() details: FapDetails = {};
  // Etiquetas que ya ha usado el usuario (de fapStats.tags), para sugerirlas.
  @Input() knownTags: string[] = [];
  @Input() subtitle = '';

  readonly stars = [1, 2, 3, 4, 5];
  readonly maxNote = MAX_NOTE;
  valoracion: number | null = null;
  nota = '';
  newTag = '';
  selected = new Set<string>();
  suggestions: string[] = [];

  ngOnInit(): void {
    this.valoracion = this.details.valoracion ?? null;
    this.nota = this.details.nota ?? '';
    this.selected = new Set(this.details.etiquetas ?? []);
    const base = this.knownTags.length ? this.knownTags : DEFAULT_TAGS;
    this.suggestions = [...new Set([...this.selected, ...base])];
  }

  toggle(tag: string): void {
    if (this.selected.has(tag)) {
      this.selected.delete(tag);
    } else if (this.selected.size < MAX_TAGS) {
      this.selected.add(tag);
    }
    this.selected = new Set(this.selected);
  }

  addTag(): void {
    const tag = normalizeTag(this.newTag);
    this.newTag = '';
    if (!tag) {
      return;
    }
    if (!this.suggestions.includes(tag)) {
      this.suggestions = [tag, ...this.suggestions];
    }
    if (!this.selected.has(tag)) {
      this.toggle(tag);
    }
  }

  save(): Promise<boolean> {
    const result: FapDetails = {
      valoracion: this.valoracion,
      nota: this.nota.trim() || null,
      etiquetas: [...this.selected],
    };
    return this.modalController.dismiss(result, 'confirm');
  }

  close(): Promise<boolean> {
    return this.modalController.dismiss(null, 'cancel');
  }
}
