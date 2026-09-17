import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/settings.service';

// Marca de la barra superior: símbolo del calendario + nombre en mono. Con «Nombre e icono neutros»
// del modo discreto pasa a ser un icono de notas y, en Sumar, «notas»: no delata la app.
@Component({
  selector: 'app-marca',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; align-items: center; gap: 8px; padding-left: 12px; min-width: 0; }
    img, svg { width: 26px; height: auto; display: block; flex: none; }
    svg { color: var(--f-muted); }
    span { font-family: var(--f-mono); font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `,
  template: `
    <img *ngIf="!neutral()" src="assets/follendario/simbolo.png" width="26" height="25" alt="" />
    <svg *ngIf="neutral()" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></g>
    </svg>
    <span [attr.translate]="titulo === 'follendario' ? 'no' : null">{{ neutral() && titulo === 'follendario' ? 'notas' : titulo }}</span>
  `,
})
export class MarcaComponent {
  private settings = inject(SettingsService);
  @Input({ required: true }) titulo = '';
  readonly neutral = computed(() => this.settings.discreet().enabled && this.settings.discreet().neutralName);
}
