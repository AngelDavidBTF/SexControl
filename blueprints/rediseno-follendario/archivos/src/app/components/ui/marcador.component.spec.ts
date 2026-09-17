import { TestBed } from '@angular/core/testing';
import { MarcadorComponent } from './marcador.component';

describe('MarcadorComponent', () => {
  function crear(valor: number, extra: Record<string, unknown> = {}): HTMLElement {
    const fixture = TestBed.createComponent(MarcadorComponent);
    fixture.componentRef.setInput('valor', valor);
    for (const [clave, dato] of Object.entries(extra)) {
      fixture.componentRef.setInput(clave, dato);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function tiras(el: HTMLElement): string[] {
    return Array.from(el.querySelectorAll<HTMLElement>('.roll-strip')).map((tira) => tira.style.transform);
  }

  it('pinta una tecla por dígito, con ceros a la izquierda', () => {
    const el = crear(7, { minDigitos: 3 });
    expect(el.querySelectorAll('.roll-tile').length).toBe(3);
    expect(tiras(el)).toEqual(['translateY(0%)', 'translateY(0%)', 'translateY(-70%)']);
  });

  it('rueda cada dígito hasta su valor', () => {
    expect(tiras(crear(147))).toEqual(['translateY(-10%)', 'translateY(-40%)', 'translateY(-70%)']);
  });

  it('aplica el tono y la etiqueta accesible', () => {
    const caja = crear(61, { tono: 's', etiqueta: 'En solitario' }).querySelector('.f-tiles');
    expect(caja?.classList.contains('s')).toBeTrue();
    expect(caja?.getAttribute('aria-label')).toBe('En solitario: 61');
  });
});
