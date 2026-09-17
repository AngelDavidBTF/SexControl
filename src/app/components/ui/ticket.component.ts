import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FilaTicket {
  titulo: string;
  valor: string;
}

// Los títulos de la semana del grupo como un ticket de caja que se imprime al entrar
// (CSS en src/theme/_componentes.scss: .f-ticket-slot, .f-ticket, .f-tline).
@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="f-ticket-slot" role="group" aria-label="Títulos de la semana">
      <div class="f-ticket">
        <h3>TICKET SEMANAL</h3>
        <p class="sub">{{ grupo.toLowerCase() }} · sem {{ semana }}</p>
        <hr />
        <div class="f-tline" *ngFor="let fila of filas">
          <span>{{ fila.titulo.toUpperCase() }}</span><span aria-hidden="true"></span><span>{{ fila.valor.toUpperCase() }}</span>
        </div>
        <hr />
        <p class="foot" *ngIf="pie">{{ pie }}</p>
      </div>
    </div>
  `,
})
export class TicketComponent {
  @Input({ required: true }) grupo = '';
  @Input({ required: true }) semana: number | string = '';
  @Input({ required: true }) filas: FilaTicket[] = [];
  @Input() pie = '';
}
