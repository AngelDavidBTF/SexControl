import { TestBed } from '@angular/core/testing';
import { CalendarioMesComponent } from './calendario-mes.component';
import { mesCalendario } from '../../shared/calendario';

const HOY = new Date(2026, 8, 17);
const MES = mesCalendario({ '2026-09-06': { c: 2 }, '2026-09-16': { s: 1 }, '2026-09-17': { c: 1, s: 1 } }, HOY, HOY);

describe('CalendarioMesComponent', () => {
  function crear(extra: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(CalendarioMesComponent);
    fixture.componentRef.setInput('mes', MES);
    for (const [clave, dato] of Object.entries(extra)) {
      fixture.componentRef.setInput(clave, dato);
    }
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('pinta el hueco y una casilla por día con su tipo', () => {
    const { el } = crear();
    expect(el.querySelectorAll('.f-month-grid > span').length).toBe(1);
    const casillas = el.querySelectorAll<HTMLButtonElement>('.f-mcell');
    expect(casillas.length).toBe(30);
    expect(casillas[5].classList.contains('c')).toBeTrue();
    expect(casillas[15].classList.contains('s')).toBeTrue();
    expect(casillas[16].classList.contains('b')).toBeTrue();
    expect(casillas[16].classList.contains('today')).toBeTrue();
    expect(casillas[17].disabled).toBeTrue();
  });

  it('muestra el recuento cuando hay más de uno', () => {
    const casillas = crear().el.querySelectorAll('.f-mcell');
    expect(casillas[5].querySelector('.x')?.textContent).toBe('×2');
    expect(casillas[15].querySelector('.x')).toBeNull();
  });

  it('solo dibuja cubo y sello en hoy cuando hay un apunte, y el sello es neutro en discreto', () => {
    expect(crear().el.querySelector('.f-stamp')).toBeNull();

    const hoy = crear({ ultimoApunte: { tipo: 'c', seq: 1 } }).el.querySelectorAll('.f-mcell')[16];
    expect(hoy.querySelector('.f-cellcube.c')).not.toBeNull();
    expect(hoy.querySelector('.f-stamp path')).not.toBeNull();

    const discreto = crear({ ultimoApunte: { tipo: 's', seq: 2 }, discreto: true }).el;
    expect(discreto.querySelector('.f-stamp circle')).not.toBeNull();
    expect(discreto.querySelector('.f-stamp path')).toBeNull();
  });

  it('avisa del día elegido', () => {
    const { fixture, el } = crear();
    let elegido = '';
    fixture.componentInstance.diaElegido.subscribe((celda) => (elegido = celda.etiqueta));
    el.querySelectorAll<HTMLButtonElement>('.f-mcell')[5].click();
    expect(elegido).toBe('6 de septiembre: 2 veces');
  });
});
