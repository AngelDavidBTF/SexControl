import { TestBed } from '@angular/core/testing';
import { MarcaComponent } from './marca.component';
import { SettingsService } from '../../core/settings.service';

describe('MarcaComponent', () => {
  afterEach(() => localStorage.removeItem('sexcontrol.settings.v1'));

  function crear(titulo: string): HTMLElement {
    const fixture = TestBed.createComponent(MarcaComponent);
    fixture.componentRef.setInput('titulo', titulo);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra el símbolo y el nombre sin modo discreto', () => {
    localStorage.removeItem('sexcontrol.settings.v1');
    const el = crear('follendario');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('assets/follendario/simbolo.png');
    expect(el.querySelector('span')?.textContent?.trim()).toBe('follendario');
    expect(el.querySelector('span')?.getAttribute('translate')).toBe('no');
  });

  it('con nombre e icono neutros cambia a notas y no enseña el símbolo', () => {
    TestBed.inject(SettingsService).updateDiscreet({ enabled: true, neutralName: true });
    const el = crear('follendario');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.querySelector('span')?.textContent?.trim()).toBe('notas');
  });

  it('en el resto de pestañas deja su título', () => {
    TestBed.inject(SettingsService).updateDiscreet({ enabled: true, neutralName: true });
    expect(crear('amigos').querySelector('span')?.textContent?.trim()).toBe('amigos');
  });
});
