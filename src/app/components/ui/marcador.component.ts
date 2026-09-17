import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Marcador de bloques: cada dígito en su tecla, rodando hasta su valor con transform (CSS en
// src/theme/_componentes.scss: .f-tiles, .roll-tile, .roll-col, .roll-strip).
@Component({
  selector: 'app-marcador',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="f-tiles" [class.c]="tono === 'c'" [class.s]="tono === 's'" role="img" [attr.aria-label]="etiqueta ? etiqueta + ': ' + valor : '' + valor">
      <span class="roll-tile" *ngFor="let digito of digitos; trackBy: porPosicion" aria-hidden="true">
        <span class="roll-col">
          <span class="roll-strip" [style.transform]="'translateY(' + digito * -10 + '%)'">
            <span *ngFor="let n of numeros">{{ n }}</span>
          </span>
        </span>
      </span>
    </span>
  `,
})
export class MarcadorComponent {
  @Input({ required: true }) valor = 0;
  @Input() minDigitos = 1;
  @Input() tono: 'total' | 'c' | 's' = 'total';
  @Input() etiqueta = '';

  readonly numeros = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  get digitos(): number[] {
    return String(Math.max(0, Math.floor(this.valor))).padStart(this.minDigitos, '0').split('').map(Number);
  }

  // Las unidades conservan su tecla aunque aparezca un dígito nuevo a la izquierda (99 → 100).
  porPosicion = (index: number): number => this.digitos.length - index;
}
