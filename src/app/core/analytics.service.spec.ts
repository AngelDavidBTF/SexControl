import { TestBed } from '@angular/core/testing';
import { AnalyticsService, rutaAnonima } from './analytics.service';

const STORAGE_KEY = 'sexcontrol.analytics.v1';

describe('AnalyticsService', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('parte sin decisión tomada', () => {
    expect(TestBed.inject(AnalyticsService).consent()).toBe('pendiente');
  });

  it('guarda el «sí» y el «no» para el siguiente arranque', () => {
    const service = TestBed.inject(AnalyticsService);

    service.deny();
    TestBed.flushEffects();
    expect(service.consent()).toBe('rechazado');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('rechazado');

    service.grant();
    TestBed.flushEffects();
    expect(service.consent()).toBe('concedido');
    expect(localStorage.getItem(STORAGE_KEY)).toContain('concedido');
  });

  it('no pregunta si no hay medición configurada', () => {
    // environment.ts de desarrollo va sin measurementId: la hoja no debe salir.
    expect(TestBed.inject(AnalyticsService).shouldAsk()).toBe(false);
  });
});

describe('rutaAnonima', () => {
  it('quita los identificadores de las rutas antes de medirlas', () => {
    expect(rutaAnonima('/invitar/abc123')).toBe('/invitar/:uid');
    expect(rutaAnonima('/unirse/XK42?ref=wa')).toBe('/unirse/:code');
    expect(rutaAnonima('/group/g7')).toBe('/group/:id');
  });

  it('deja intactas las rutas que no llevan identificadores', () => {
    expect(rutaAnonima('/tabs/sumar')).toBe('/tabs/sumar');
    expect(rutaAnonima('/tabs/amigos#top')).toBe('/tabs/amigos');
  });
});
