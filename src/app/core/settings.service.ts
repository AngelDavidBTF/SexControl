import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'sistema' | 'claro' | 'oscuro';

export interface DiscreetSettings {
  enabled: boolean;
  // Bloqueo con PIN al abrir la app y al volver tras un rato en segundo plano.
  lock: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  // Números difuminados hasta tocarlos.
  hideNumbers: boolean;
  // Título de pestaña e icono neutros.
  neutralName: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  // Avisar si pasan estos días sin registrar nada.
  days: number;
  hour: number;
}

interface StoredSettings {
  theme: ThemeMode;
  discreet: DiscreetSettings;
  reminders: ReminderSettings;
}

const STORAGE_KEY = 'sexcontrol.settings.v1';

const DEFAULTS: StoredSettings = {
  theme: 'sistema',
  discreet: { enabled: false, lock: false, pinHash: null, pinSalt: null, hideNumbers: true, neutralName: true },
  reminders: { enabled: false, days: 3, hour: 21 },
};

const NEUTRAL_TITLE = 'Notas';
const APP_TITLE = 'Follendario';

// Color de la barra del navegador (<meta name="theme-color">): el fondo de cada piel de _tokens.scss.
const THEME_COLOR = {
  claro: { normal: '#f4e6de', discreto: '#f2f1ee' },
  oscuro: { normal: '#10081a', discreto: '#151618' },
} as const;

// Ajustes propios de cada dispositivo (localStorage): tema, modo discreto y recordatorios.
// Objetivos y privacidad viajan con la cuenta (Firestore), no aquí.
@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly state = signal<StoredSettings>(load());
  private readonly systemDark = signal(matchMedia('(prefers-color-scheme: dark)').matches);

  readonly theme = computed(() => this.state().theme);
  readonly discreet = computed(() => this.state().discreet);
  readonly reminders = computed(() => this.state().reminders);
  readonly isDark = computed(() => (this.theme() === 'sistema' ? this.systemDark() : this.theme() === 'oscuro'));
  // Modo discreto activo con cada opción concreta.
  readonly hideNumbers = computed(() => this.discreet().enabled && this.discreet().hideNumbers);
  readonly lockEnabled = computed(() => this.discreet().enabled && this.discreet().lock && !!this.discreet().pinHash);

  constructor() {
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => this.systemDark.set(event.matches));

    effect(() => document.body.classList.toggle('dark', this.isDark()));
    effect(() => document.body.classList.toggle('discreto-numeros', this.hideNumbers()));
    // Piel neutra del modo discreto (tokens de body.discreto en src/theme/_tokens.scss).
    effect(() => document.body.classList.toggle('discreto', this.discreet().enabled));
    effect(() => {
      const piel = THEME_COLOR[this.isDark() ? 'oscuro' : 'claro'];
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', this.discreet().enabled ? piel.discreto : piel.normal);
    });
    effect(() => {
      const neutral = this.discreet().enabled && this.discreet().neutralName;
      // body.neutro: las pantallas sin sesión (login, registro) cambian la marca por «Notas» solo con CSS.
      document.body.classList.toggle('neutro', neutral);
      document.title = neutral ? NEUTRAL_TITLE : APP_TITLE;
      const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (icon) {
        icon.href = neutral ? 'assets/icon/neutral.svg' : 'assets/icon/favicon.png';
      }
    });
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch {
        // Sin almacenamiento local los ajustes duran hasta cerrar la app.
      }
    });
  }

  setTheme(theme: ThemeMode): void {
    this.state.update((s) => ({ ...s, theme }));
  }

  updateDiscreet(changes: Partial<DiscreetSettings>): void {
    this.state.update((s) => ({ ...s, discreet: { ...s.discreet, ...changes } }));
  }

  updateReminders(changes: Partial<ReminderSettings>): void {
    this.state.update((s) => ({ ...s, reminders: { ...s.reminders, ...changes } }));
  }

  async setPin(pin: string): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '');
    this.updateDiscreet({ pinSalt: salt, pinHash: await hashPin(pin, salt), lock: true });
  }

  async checkPin(pin: string): Promise<boolean> {
    const { pinHash, pinSalt } = this.discreet();
    return !!pinHash && !!pinSalt && (await hashPin(pin, pinSalt)) === pinHash;
  }

  removePin(): void {
    this.updateDiscreet({ pinHash: null, pinSalt: null, lock: false });
  }
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function load(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULTS;
    }
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      theme: parsed.theme ?? DEFAULTS.theme,
      discreet: { ...DEFAULTS.discreet, ...parsed.discreet },
      reminders: { ...DEFAULTS.reminders, ...parsed.reminders },
    };
  } catch {
    return DEFAULTS;
  }
}
