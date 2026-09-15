import { Directive, HostBinding, HostListener, OnDestroy } from '@angular/core';

const REVEAL_MS = 4000;

// Marca un número sensible. Con el modo discreto y "ocultar números" activos se difumina
// (estilo global en global.scss) y se revela unos segundos al tocarlo.
@Directive({
  selector: '[dato]',
  standalone: true,
})
export class DatoDirective implements OnDestroy {
  @HostBinding('class.dato') readonly dato = true;
  @HostBinding('class.revelado') revealed = false;
  private timer?: ReturnType<typeof setTimeout>;

  @HostListener('click', ['$event'])
  reveal(event: Event): void {
    if (!document.body.classList.contains('discreto-numeros') || this.revealed) {
      return;
    }
    // El primer toque solo revela; no activa la acción del elemento padre (p. ej. una barra).
    event.stopPropagation();
    this.revealed = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => (this.revealed = false), REVEAL_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
