import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

const STORAGE_KEY = 'sexcontrol.settings.v1';

describe('SettingsService · piel visual', () => {
  let meta: HTMLMetaElement;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  });

  afterEach(() => {
    meta.remove();
    document.body.classList.remove('dark', 'discreto', 'discreto-numeros', 'neutro');
    localStorage.removeItem(STORAGE_KEY);
  });

  it('pone la clase discreto en body solo con el modo discreto activo', () => {
    const settings = TestBed.inject(SettingsService);
    TestBed.flushEffects();
    expect(document.body.classList.contains('discreto')).toBeFalse();

    settings.updateDiscreet({ enabled: true });
    TestBed.flushEffects();
    expect(document.body.classList.contains('discreto')).toBeTrue();

    settings.updateDiscreet({ enabled: false });
    TestBed.flushEffects();
    expect(document.body.classList.contains('discreto')).toBeFalse();
  });

  it('pone la clase neutro con nombre e icono neutros y el modo discreto activo', () => {
    const settings = TestBed.inject(SettingsService);
    settings.updateDiscreet({ enabled: false, neutralName: true });
    TestBed.flushEffects();
    expect(document.body.classList.contains('neutro')).toBeFalse();

    settings.updateDiscreet({ enabled: true });
    TestBed.flushEffects();
    expect(document.body.classList.contains('neutro')).toBeTrue();
    expect(document.title).toBe('Notas');

    settings.updateDiscreet({ neutralName: false });
    TestBed.flushEffects();
    expect(document.body.classList.contains('neutro')).toBeFalse();
    expect(document.title).toBe('Follendario');
  });

  it('ajusta theme-color al tema y al modo discreto', () => {
    const settings = TestBed.inject(SettingsService);

    settings.setTheme('oscuro');
    TestBed.flushEffects();
    expect(meta.getAttribute('content')).toBe('#10081a');

    settings.setTheme('claro');
    TestBed.flushEffects();
    expect(meta.getAttribute('content')).toBe('#f4e6de');

    settings.updateDiscreet({ enabled: true });
    TestBed.flushEffects();
    expect(meta.getAttribute('content')).toBe('#f2f1ee');

    settings.setTheme('oscuro');
    TestBed.flushEffects();
    expect(meta.getAttribute('content')).toBe('#151618');
  });
});
