import { ApplicationConfig, importProvidersFrom, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { IonicModule } from '@ionic/angular';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { ReCaptchaEnterpriseProvider, initializeAppCheck, provideAppCheck } from '@angular/fire/app-check';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  provideFirestore,
} from '@angular/fire/firestore';
import { routes } from './app.routes';
import { environment, firebaseConfig } from '../environments/environment';

// Solo en desarrollo: en localhost (y en las pruebas automáticas) reCAPTCHA no sirve para validar,
// así que App Check usa un token de depuración registrado en Firebase Console. El token no está en
// el código: se lee de localStorage ('sexcontrol.appCheckDebugToken'). Si no hay ninguno, el SDK
// genera uno y lo muestra en la consola del navegador para poder registrarlo.
// Ojo: AngularFire además activa el modo depuración siempre que la app se abra en localhost, aunque
// sea la build de producción; la validación real con reCAPTCHA solo se ve en el dominio publicado.
const APP_CHECK_DEBUG_TOKEN_KEY = 'sexcontrol.appCheckDebugToken';

function enableAppCheckDebugToken(): void {
  let token: string | null = null;
  try {
    token = localStorage.getItem(APP_CHECK_DEBUG_TOKEN_KEY);
  } catch {
    // Sin almacenamiento local se usa un token generado por el SDK.
  }
  (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = token || true;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Las páginas importan IonicModule (carga perezosa de componentes), así que Ionic se arranca con
    // IonicModule.forRoot(): es lo que registra los custom elements. provideIonicAngular() de
    // '@ionic/angular/standalone' no lo hace y la app se quedaba en blanco con la build de producción.
    importProvidersFrom(IonicModule.forRoot()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // App Check: solo peticiones desde la app real llegan a Firebase (protege de abusos y de
    // costes inesperados). Se activa al poner la clave de reCAPTCHA Enterprise en environment.
    ...(environment.appCheckSiteKey
      ? [
          provideAppCheck(() => {
            if (!environment.production) {
              enableAppCheckDebugToken();
            }
            return initializeAppCheck(getApp(), {
              provider: new ReCaptchaEnterpriseProvider(environment.appCheckSiteKey),
              isTokenAutoRefreshEnabled: true,
            });
          }),
        ]
      : []),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      }
      return auth;
    }),
    provideFirestore(() => {
      // Caché persistente en IndexedDB: la app funciona sin conexión y, al reabrirla, los
      // listeners parten de los datos locales en lugar de depender solo del servidor.
      const firestore = initializeFirestore(getApp(), {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      }
      return firestore;
    }),
    // PWA instalable y con funcionamiento sin conexión (solo en producción).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
