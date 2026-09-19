# Landing de follendario.com

Web estática que se publica en el sitio de Hosting `follendario-web` (destino `landing` en `firebase.json`). Aparte de la app, que vive en `app.follendario.com` (sitio `sexcontrol-6c000`).

- Publicar: `firebase deploy --only hosting:landing` (lo hace el usuario).
- Sin frameworks ni Firebase SDK: comparte cuota de transferencia de Hosting con la app. Una visita pesa ~135 KB (HTML ~40 KB, fuentes ~65 KB, logos ~23 KB); mantenla por debajo de ~400 KB.
- Estilo: `DESIGN.md` tipo Wizz adaptado a la marca. Blanco y tinta ciruela, el rosa `#fc2a6c` como único color; el degradado solo en la portada. Titulares en Archivo Black en mayúsculas, texto en Geist (la de la app).
- Las pantallas de la app están dibujadas en HTML/CSS, no son capturas. Si cambia la app, se retocan a mano en `index.html`.
- `fonts/`: Archivo Black y Geist/Geist Mono (OFL), autoalojadas; caché de un año en `firebase.json`. Si cambias una fuente, cámbiale el nombre al archivo.
- `img/og.jpg` es la imagen para compartir el enlace (1200×630, < 300 KB para que WhatsApp la muestre).
