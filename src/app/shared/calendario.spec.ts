import { mesCalendario, ultimosMeses } from './calendario';

// Jueves 17 de septiembre de 2026. Septiembre de 2026 empieza en martes.
const HOY = new Date(2026, 8, 17);
const DIAS = {
  '2026-09-02': { c: 1 },
  '2026-09-05': { s: 1 },
  '2026-09-06': { c: 2 },
  '2026-09-17': { c: 1, s: 1 },
};

describe('calendario', () => {
  it('coloca el día 1 tras el hueco de una semana que empieza en lunes', () => {
    const mes = mesCalendario(DIAS, HOY, HOY);
    expect(mes.nombre).toBe('Septiembre');
    expect(mes.anio).toBe(2026);
    expect(mes.hueco).toBe(1);
    expect(mes.celdas.length).toBe(30);
  });

  it('colorea cada casilla por tipo y cuenta el total del mes', () => {
    const mes = mesCalendario(DIAS, HOY, HOY);
    expect(mes.celdas[1].tipo).toBe('c');
    expect(mes.celdas[4].tipo).toBe('s');
    expect(mes.celdas[5]).toEqual(jasmine.objectContaining({ dia: 6, total: 2, tipo: 'c', etiqueta: '6 de septiembre: 2 veces' }));
    expect(mes.celdas[16]).toEqual(jasmine.objectContaining({ dia: 17, tipo: 'b', hoy: true, futuro: false }));
    expect(mes.total).toBe(6);
  });

  it('marca como futuros los días que aún no han llegado', () => {
    const mes = mesCalendario(DIAS, HOY, HOY);
    expect(mes.celdas[17]).toEqual(jasmine.objectContaining({ dia: 18, futuro: true, tipo: '', etiqueta: '18 de septiembre: aún no ha llegado' }));
    expect(mes.celdas[2].etiqueta).toBe('3 de septiembre: nada');
  });

  it('devuelve los últimos meses del más reciente al más antiguo', () => {
    const meses = ultimosMeses(DIAS, HOY, 6);
    expect(meses.map((mes) => mes.nombre)).toEqual(['Septiembre', 'Agosto', 'Julio', 'Junio', 'Mayo', 'Abril']);
    expect(meses[1].hueco).toBe(5);
    expect(meses[1].celdas.every((celda) => !celda.futuro)).toBeTrue();
  });
});
