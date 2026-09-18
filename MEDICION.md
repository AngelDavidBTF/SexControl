# Medición de Follendario

Firebase Analytics (GA4). No toca Firestore: ni una lectura ni una escritura, así que no gasta de
la capa gratuita. Todo vive en `src/app/core/analytics.service.ts`.

## La regla que manda sobre todas

**Ningún evento puede indicar que alguien ha registrado un polvo o una paja, ni cuántos lleva.**
Nada de `sumar`, `solitario`, `compania`, totales, rachas, fechas, etiquetas, valoraciones, notas
ni nombres. La app guarda datos de la vida sexual de las personas (categoría especial, art. 9
RGPD): lo que se mide es si la app se propaga y si la gente vuelve, nunca lo que hacen en ella.

El catálogo de eventos está cerrado en el tipo `AnalyticsEvent`. Si un evento no está ahí, no
compila: es el sitio donde se discute si algo se mide o no.

## Consentimiento

- Al primer arranque sale una hoja (`components/analytics-consent/`) con dos botones, **Aceptar**
  y **No, gracias**. Cerrarla tocando fuera cuenta como «no».
- Hasta que se acepta, **el SDK de Analytics ni se descarga** (la importación es dinámica): sin
  consentimiento no se ejecuta nada y no queda ni una cookie. El «no» es el estado de partida.
- La decisión se guarda en `localStorage`, clave `sexcontrol.analytics.v1`.
- Se puede cambiar siempre en **Ajustes → Privacidad → «Ayudar a mejorar la app»**.
- Los E2E arrancan con la decisión puesta en «rechazado» (`tests/helpers/firebase.js`), así que la
  hoja no tapa la app ni las pruebas ensucian los datos de producción.

## Encender la medición

Está desactivada hasta que haya `measurementId`:

1. En la consola de Firebase, activa Google Analytics en el proyecto.
2. Copia el identificador de Configuración del proyecto → Tus apps → app web (`G-XXXXXXXXXX`).
3. Pégalo en `measurementId` de `src/environments/environment.prod.ts`.

`environment.ts` (desarrollo) se deja vacío a propósito. Para probar con DebugView, pega ahí el
mismo identificador y quítalo al terminar.

Con `measurementId` vacío no se pregunta nada, no se envía nada y el interruptor de Ajustes ni
aparece.

## Eventos

| Evento | Cuándo | Parámetros |
|---|---|---|
| `page_view` | cada navegación | `page_path` sin identificadores (`/invitar/:uid`, `/unirse/:code`, `/group/:id`) |
| `registro_iniciado` | se envía el formulario de alta | — |
| `registro_creado` | la cuenta queda creada | `metodo` |
| `sesion_iniciada` | se entra con cuenta existente | `metodo`: `email` \| `google` |
| `email_verificado` | la verificación se confirma | — |
| `activacion` | primer uso completado; **una sola vez en la vida** de la instalación | — |
| `invitacion_creada` | se abre el modal de invitación | `tipo`: `amigo` \| `grupo` |
| `invitacion_compartida` | se comparte o se copia el enlace | `tipo`, `via`: `sistema` \| `enlace` |
| `invitacion_abierta` | alguien abre el enlace recibido | `tipo` |
| `invitacion_aceptada` | manda la solicitud o entra en el grupo | `tipo` |
| `amigo_aceptado` | se acepta una solicitud de amistad | — |
| `grupo_creado` | se crea un grupo | `miembros_invitados` |
| `duelo_creado` | se propone un duelo | `tipo`: `semana` \| `carrera` |
| `duelo_aceptado` | se responde a un duelo | `aceptado` |
| `pulla_enviada` | se manda una pulla | — |
| `reaccion_enviada` | se manda una reacción | — |
| `tarjeta_compartida` | se genera la tarjeta para compartir | `tipo`: `anual` \| `semana-grupo` |

`activacion` mide que esta instalación ha llegado a usar la app, nada más: ni el tipo, ni la
fecha, ni el número. La marca de «ya enviado» está en `sexcontrol.analytics.activado`.

Retención D1/D7/D30, usuarios activos y cohortes los calcula GA4 solo; no hay que mandar nada.

## Lo que falta antes de lanzar

- **Política de privacidad** que diga qué se mide, con qué base legal y cómo retirar el
  consentimiento. La hoja es el consentimiento, no la información completa.
- Si algún día se mide desde las apps nativas (Capacitor), hay que volver a mirar esto: el SDK
  web y el nativo no recogen lo mismo.
