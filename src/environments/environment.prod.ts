export const environment = {
  production: true,
  useEmulators: false,
  // Clave de sitio de reCAPTCHA Enterprise para Firebase App Check. Vacía = App Check desactivado.
  appCheckSiteKey: '6Lex9LwtAAAAAFx7blOeQizAfHL4QPA8nHU8utwY',
};

export const firebaseConfig = {
  apiKey: 'AIzaSyBqZd-4qjannmt-HhNG6x0gzawNYNmwX_k',
  authDomain: 'sexcontrol-6c000.firebaseapp.com',
  databaseURL: 'https://sexcontrol-6c000-default-rtdb.firebaseio.com',
  projectId: 'sexcontrol-6c000',
  storageBucket: 'sexcontrol-6c000.appspot.com',
  messagingSenderId: '275373132188',
  appId: '1:275373132188:web:45d08dd98202852df2a059',
  // Firebase Analytics (GA4). Se saca de la consola de Firebase (Configuración del proyecto → Tus
  // apps → la app web) tras activar Google Analytics en el proyecto. Formato 'G-XXXXXXXXXX'.
  // Vacío = sin medición: no se pide consentimiento ni se carga el SDK.
  measurementId: 'G-G4VQPGCY34',
};
