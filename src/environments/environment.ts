export const environment = {
  production: false,
  // true para conectar contra los emuladores locales de Firebase (firebase emulators:start)
  // en lugar del proyecto real. Útil en desarrollo para no ensuciar datos de producción.
  useEmulators: false,
  // Clave de sitio de reCAPTCHA Enterprise para Firebase App Check. Vacía = App Check desactivado.
  appCheckSiteKey: '',
};

export const firebaseConfig = {
  apiKey: 'AIzaSyBqZd-4qjannmt-HhNG6x0gzawNYNmwX_k',
  authDomain: 'sexcontrol-6c000.firebaseapp.com',
  databaseURL: 'https://sexcontrol-6c000-default-rtdb.firebaseio.com',
  projectId: 'sexcontrol-6c000',
  storageBucket: 'sexcontrol-6c000.appspot.com',
  messagingSenderId: '275373132188',
  appId: '1:275373132188:web:45d08dd98202852df2a059',
};
