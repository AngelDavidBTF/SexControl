import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideIonicAngular } from '@ionic/angular/standalone';
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideIonicAngular(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    // App Check: solo peticiones desde la app real llegan a Firebase (protege de abusos y de
    // costes inesperados). Se activa al poner la clave de reCAPTCHA Enterprise en environment.
    ...(environment.appCheckSiteKey
      ? [
          provideAppCheck(() =>
            initializeAppCheck(getApp(), {
              provider: new ReCaptchaEnterpriseProvider(environment.appCheckSiteKey),
              isTokenAutoRefreshEnabled: true,
            })
          ),
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
