# Landing de follendario.com

Web estática que se publica en el sitio de Hosting `follendario-web` (destino `landing` en `firebase.json`). Aparte de la app, que vive en `app.follendario.com` (sitio `sexcontrol-6c000`).

- Publicar: `firebase deploy --only hosting:landing` (lo hace el usuario).
- Sin frameworks ni Firebase SDK: comparte cuota de transferencia de Hosting con la app, así que cada visita debe pesar menos de ~400 KB.
- `index.html` es provisional hasta que se diseñe la landing definitiva.
