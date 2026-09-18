import { Injectable, computed, effect, signal } from '@angular/core';
import { getApp } from '@angular/fire/app';
import { environment, firebaseConfig } from '../../environments/environment';

export type AnalyticsConsent = 'pendiente' | 'concedido' | 'rechazado';

// Catálogo cerrado de eventos. Si no está aquí, no se envía: así nadie añade por descuido una
// medición que delate la actividad sexual de nadie.
//
// REGLA INNEGOCIABLE: ningún evento puede indicar que alguien ha registrado un polvo o una
// paja, ni cuántos lleva. Nada de `sumar`, `solitario`, `compania`, totales, rachas, fechas,
// etiquetas ni valoraciones. Lo que se mide es si la app se propaga y si la gente vuelve.
export type AnalyticsEvent =
  // Pantallas (la ruta va sin identificadores; ver rutaAnonima()).
  | 'page_view'
  // Embudo de alta
  | 'registro_iniciado'
  | 'registro_creado'
  | 'email_verificado'
  | 'sesion_iniciada'
  | 'activacion'
  // Bucle viral
  | 'invitacion_creada'
  | 'invitacion_compartida'
  | 'invitacion_abierta'
  | 'invitacion_aceptada'
  | 'amigo_aceptado'
  | 'grupo_creado'
  // Enganche social
  | 'duelo_creado'
  | 'duelo_aceptado'
  | 'pulla_enviada'
  | 'reaccion_enviada'
  | 'tarjeta_compartida';

// Solo valores de un conjunto conocido, nunca texto escrito por la persona ni números suyos.
export type AnalyticsParams = Record<string, string | number | boolean>;

const STORAGE_KEY = 'sexcontrol.analytics.v1';
// Marca de "ya se ha medido la activación": el evento se manda una sola vez en la vida.
const ACTIVATED_KEY = 'sexcontrol.analytics.activado';

interface StoredConsent {
  consent: AnalyticsConsent;
  // Fecha en que se decidió, por si algún día hay que volver a preguntar.
  fecha: string | null;
}

// Medición de producto con Firebase Analytics (GA4). No toca Firestore: ni una lectura ni una
// escritura, así que no gasta de la capa gratuita.
//
// El SDK de Analytics no se carga hasta que la persona acepta: sin consentimiento no se
// descarga, no se ejecuta y no deja ni una cookie. Por eso la importación es dinámica.
@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly state = signal<StoredConsent>(load());
  private analytics: unknown = null;
  private loading = false;
  // Eventos ocurridos mientras el SDK todavía se estaba cargando.
  private readonly pending: { name: AnalyticsEvent; params: AnalyticsParams }[] = [];

  readonly consent = computed(() => this.state().consent);
  // Sin measurementId (entorno de desarrollo, o proyecto sin Analytics activado) no hay medición:
  // ni se pregunta, ni se enseña el interruptor en Ajustes, ni se envía nada.
  readonly available = !!firebaseConfig.measurementId;
  readonly shouldAsk = computed(() => this.available && this.consent() === 'pendiente');

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch {
        // Sin almacenamiento local la decisión dura hasta cerrar la app; se volverá a preguntar.
      }
    });

    if (this.consent() === 'concedido') {
      void this.start();
    }
  }

  grant(): void {
    this.state.set({ consent: 'concedido', fecha: new Date().toISOString() });
    void this.start();
  }

  deny(): void {
    this.state.set({ consent: 'rechazado', fecha: new Date().toISOString() });
    this.pending.length = 0;
    void this.stop();
  }

  setEnabled(enabled: boolean): void {
    if (enabled) {
      this.grant();
    } else {
      this.deny();
    }
  }

  // Envía un evento del catálogo. Sin consentimiento no hace nada, ni guarda ni encola.
  log(name: AnalyticsEvent, params: AnalyticsParams = {}): void {
    if (!this.available || this.consent() !== 'concedido') {
      return;
    }
    if (!this.analytics) {
      this.pending.push({ name, params });
      void this.start();
      return;
    }
    void this.send(name, params);
  }

  // Vista de pantalla con la ruta ya limpia de identificadores.
  page(url: string, titulo?: string): void {
    this.log('page_view', { page_path: rutaAnonima(url), ...(titulo ? { page_title: titulo } : {}) });
  }

  // Marca la activación (primer uso completado) una sola vez en la vida de la instalación.
  activacion(): void {
    try {
      if (localStorage.getItem(ACTIVATED_KEY)) {
        return;
      }
      localStorage.setItem(ACTIVATED_KEY, '1');
    } catch {
      // Sin almacenamiento local se podría repetir; es preferible a perder el dato.
    }
    this.log('activacion');
  }

  private async start(): Promise<void> {
    if (!this.available || this.analytics || this.loading || this.consent() !== 'concedido') {
      return;
    }
    this.loading = true;
    try {
      const { getAnalytics, isSupported, setAnalyticsCollectionEnabled } = await import('firebase/analytics');
      if (!(await isSupported())) {
        return;
      }
      const analytics = getAnalytics(getApp());
      setAnalyticsCollectionEnabled(analytics, true);
      this.analytics = analytics;
      const cola = this.pending.splice(0, this.pending.length);
      for (const evento of cola) {
        await this.send(evento.name, evento.params);
      }
    } catch (error) {
      if (!environment.production) {
        console.warn('No se pudo iniciar la medición', error);
      }
    } finally {
      this.loading = false;
    }
  }

  private async stop(): Promise<void> {
    if (!this.analytics) {
      return;
    }
    try {
      const { setAnalyticsCollectionEnabled } = await import('firebase/analytics');
      setAnalyticsCollectionEnabled(this.analytics as never, false);
    } catch {
      // Si falla, deja de enviarse igualmente: log() ya comprueba el consentimiento.
    }
  }

  private async send(name: AnalyticsEvent, params: AnalyticsParams): Promise<void> {
    try {
      const { logEvent } = await import('firebase/analytics');
      // El tipado de logEvent separa los nombres reservados de GA4 (page_view entre ellos) de los
      // propios, cada uno con sus parámetros. Aquí el catálogo ya está acotado por AnalyticsEvent.
      const enviar = logEvent as unknown as (analytics: unknown, name: string, params: AnalyticsParams) => void;
      enviar(this.analytics, name, params);
    } catch (error) {
      if (!environment.production) {
        console.warn('No se pudo enviar el evento', name, error);
      }
    }
  }
}

// Las rutas llevan identificadores (/invitar/{uid}, /unirse/{code}, /group/{id}) que señalan a una
// persona o a un grupo concreto. Se sustituyen por el nombre del parámetro antes de medir nada.
export function rutaAnonima(url: string): string {
  const path = url.split('?')[0].split('#')[0];
  return path
    .replace(/^\/invitar\/.+$/, '/invitar/:uid')
    .replace(/^\/unirse\/.+$/, '/unirse/:code')
    .replace(/^\/group\/[^/]+(.*)$/, '/group/:id$1');
}

function load(): StoredConsent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { consent: 'pendiente', fecha: null };
    }
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    const consent = parsed.consent;
    return {
      consent: consent === 'concedido' || consent === 'rechazado' ? consent : 'pendiente',
      fecha: parsed.fecha ?? null,
    };
  } catch {
    return { consent: 'pendiente', fecha: null };
  }
}
