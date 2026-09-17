import { TestBed } from '@angular/core/testing';
import { TicketComponent } from './ticket.component';

describe('TicketComponent', () => {
  it('imprime una línea por título con el grupo y la semana', () => {
    const fixture = TestBed.createComponent(TicketComponent);
    fixture.componentRef.setInput('grupo', 'Los del Pueblo');
    fixture.componentRef.setInput('semana', 38);
    fixture.componentRef.setInput('filas', [
      { titulo: 'MVP de la semana', valor: 'Marcos · 5' },
      { titulo: 'Farolillo rojo', valor: 'Sergio · 0' },
    ]);
    fixture.componentRef.setInput('pie', 'sergio, ¿sigues vivo?');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.sub')?.textContent).toBe('los del pueblo · sem 38');
    const lineas = Array.from(el.querySelectorAll('.f-tline')).map((linea) => {
      const partes = linea.querySelectorAll('span');
      return [partes[0].textContent, partes[2].textContent];
    });
    expect(lineas).toEqual([
      ['MVP DE LA SEMANA', 'MARCOS · 5'],
      ['FAROLILLO ROJO', 'SERGIO · 0'],
    ]);
    expect(el.querySelector('.foot')?.textContent).toBe('sergio, ¿sigues vivo?');
  });

  it('omite el pie si no hay', () => {
    const fixture = TestBed.createComponent(TicketComponent);
    fixture.componentRef.setInput('grupo', 'Piso');
    fixture.componentRef.setInput('semana', 1);
    fixture.componentRef.setInput('filas', []);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.foot')).toBeNull();
  });
});
