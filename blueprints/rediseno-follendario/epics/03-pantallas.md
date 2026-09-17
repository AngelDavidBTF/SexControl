# Epic 03: Resto de pantallas y barrido final

> Estadísticas, modales, acceso, invitaciones y ajustes llevan el diseño aprobado y no queda rastro de la marca ni la paleta de SexControl.

| | |
|---|---|
| **Epic id** | `03-pantallas` |
| **Tasks** | `E3-T1` … `E3-T6` |
| **Depends on** | `02-firma` |
| **Unlocks** | nada: es la última |
| **Parallel with** | nada: las tareas forman una cadena en una sola rama con una etiqueta por paso |

No necesitas ningún otro archivo para completar esta épica. Todo lo de abajo se repite aquí a propósito.

---

## Stack

Angular 19.2 (componentes standalone, `*ngIf`/`*ngFor` con `CommonModule`) · Ionic 8.8 · Capacitor 6.2 · Firebase 11.10 (Firestore, App Check) · date-fns 4 con locale `es` · SCSS · Karma/Jasmine · Playwright (solo scripts de prueba). Gestor de paquetes: `npm` con `package-lock.json`; Node 22 (el CI usa 22). Las versiones están en el lockfile: léelas, no las adivines. Shell de trabajo: **bash** (Git Bash en Windows).

| Tarea | Comando |
|---|---|
| Pruebas unitarias | `npm test` |
| Build de producción | `npm run build -- --configuration production` |
| Humo de la build (login visible, sin errores) | `node tests/ci/build-smoke.js` |
| Comprobaciones del diseño | `node tests/design/<nombre>.check.js` |
| Iconos desde el símbolo | `node scripts/iconos-follendario.js` |
| Linter / formateador | no existen en este repo (solo `.editorconfig`: 2 espacios, comillas simples en .ts) |

**Avisos de build que ya existían y no son fallos:** presupuesto inicial (~1,2 MB > 1 MB), `estadisticas.page.scss` > 4 kB (desaparece en el paso 13), `qrcode` no es ESM y los avisos de Sass por `@import`. Un paso pasa si sus comandos salen con 0.

**Gate:** los comandos `verify` de cada tarea salen con 0 antes de marcarla `done`; el de la tarea anterior sigue saliendo con 0.

Ninguna comprobación de esta épica necesita servicios externos: ni Firebase, ni cuentas, ni red (salvo `npm install` del paso 1).

## Directory subtree

Solo lo que toca esta épica:

```
src/app/components/fap-details/fap-details.modal.ts
src/app/components/friend-detail/friend-detail.modal.ts
src/app/components/lock-screen/lock-screen.component.ts
src/app/components/share-invite/share-invite.modal.ts
src/app/components/stats/bar-chart.component.ts
src/app/components/username/username.modal.ts
src/app/pages/add-friend/add-friend.page.html
src/app/pages/add-friend/add-friend.page.scss
src/app/pages/ajustes/ajustes.page.html
src/app/pages/ajustes/ajustes.page.scss
src/app/pages/create-group/create-group.page.html
src/app/pages/estadisticas/estadisticas.page.html
src/app/pages/estadisticas/estadisticas.page.scss
src/app/pages/estadisticas/estadisticas.page.ts
src/app/pages/forgot-password/forgot-password.page.html
src/app/pages/invite/invite.page.ts
src/app/pages/join-group/join-group.page.ts
src/app/pages/login/login.page.html
src/app/pages/login/login.page.scss
src/app/pages/register/register.page.html
src/app/pages/register/register.page.scss
src/app/pages/sumar/add-past-fap.modal.ts
src/app/pages/verify-email/verify-email.page.html
tests/design/acceso.check.js
tests/design/apunte.check.js
tests/design/enlaces.check.js
tests/design/estadisticas.check.js
tests/design/final.check.js
tests/design/modales.check.js
```

Los archivos de `blueprints/rediseno-follendario/archivos/` son copias exactas y probadas: se copian, no se reescriben. Si una tarea parece necesitar un archivo fuera de esta lista, para y avisa: el límite de la épica está mal.

## Data model touched here

Ninguno. Este rediseño no cambia colecciones, documentos, reglas ni índices de Firestore, ni las claves `sexcontrol.*` de localStorage. Los datos del calendario salen de `stats.days`, que la app ya descarga.

## Contracts

**Consumed** — ya existe, no lo reconstruyas:

| From | Interface | Guarantee |
|---|---|---|
| repo | `FapService.stats$(uid)` → `FapStats` con `days: DayBuckets` (`{ "yyyy-MM-dd": { c?, s? } }`) | una escucha de Firestore que ya existía |
| repo | `dayKey(date)`, `bucketTotal(bucket)` en `src/app/shared/stats.ts` | clave de día y total de un día |
| repo | `DatoDirective` (`[dato]`) | difumina el número con `body.discreto-numeros` |
| repo | `SettingsService.discreet()` → `{ enabled, hideNumbers, neutralName, … }` | ajustes locales del dispositivo |
| `01-base` | clases globales `f-*` y tokens `--f-*` | compiladas en `www/styles-*.css` (paso 4) |
| `01-base` | `body.discreto`, `body.neutro`, `body.dark` | los pone `SettingsService` (paso 3) |
| `01-base` | `src/assets/follendario/{simbolo,logotipo,logotipo-tinta}.png` | paso 5 |
| `02-firma` | `<app-calendario-mes>`, `<app-marca>`, `ultimosMeses(days, hoy, cuantos)` | pasos 7–9 |

**Produced** — lo que dependen las épicas siguientes:

| Export | Signature | Used by |
|---|---|---|
| `tests/design/final.check.js` | barrido de `src/app` | cierre del rediseño |

## Conventions that bite in this area

- **Solo aspecto.** No cambies lógica, servicios, rutas, observables ni llamadas a Firestore. Ninguna lectura ni escritura nueva: el proyecto vive en el plan gratuito de Firebase.
- **Los colores de Ionic están invertidos respecto a la app vieja.** Antes `secondary` era el rosa (compañía) y `primary` el cian (solitario); ahora `primary` es el rosa y `secondary` el cian. En las plantillas no quedan `color="secondary|tertiary|warning|light"`: usa `f-key pink` / `f-key solo`, `f-badge c|s|t`, `f-num-c` / `f-num-s`. Se permiten `color="primary"`, `color="medium"` y `color="danger"`.
- **Conserva los ganchos de las pruebas E2E** (`tests/e2e/*.js`): `ion-input[type="email"]`, `ion-input[type="password"]`, `ion-button[color="primary"]` con texto `Entrar`, `.total` en Sumar, `ion-searchbar` en Amigos, `ion-item.amigo`, `.accion-duelo`, `.accion-pulla`, `.duelo-aviso`, `.aceptar-reto`, `.duelo-vivo .duelo-marcador` (texto `1 – 4`), `.reaccion-texto`, `.invitar-amigo`, `.qr img`, `.enlace code`, el primer `ion-button` de la cabecera del modal de invitación, `.editar-grupo`, `.entrar-grupo`, `.miembro`, y los textos de hojas de acciones «Invitar con enlace», «Quién suma más esta semana», «Semana floja».
- **Estilos solo con tokens `--f-*`** (definidos en `src/theme/_tokens.scss`): nada de hexadecimales ni `--ion-color-*` en los `.scss` de páginas ni en estilos en línea. Lo común ya existe como clase global en `src/theme/_componentes.scss`; el `.scss` de cada página se queda por debajo de 4 kB.
- **Animaciones:** solo `transform` y `opacity`; todo se apaga con `prefers-reduced-motion` (ya lo hace `_movimiento.scss`). Nada de animar al teclear ni en listas largas.
- **Modo discreto:** los números llevan `dato` (se difuminan), las etiquetas pasan a «con alguien / por mi cuenta», y con nombre neutro no aparece el símbolo ni la palabra Follendario.
- **Segmentos** con `mode="ios"` (píldora). **Campos** con `fill="outline"` y `label`. **Filas** con `ion-item class="f-row …"`.
- **Tono pícaro con doble sentido** en los textos nuevos, en segunda persona («¿Se te olvidó apuntar una?»); nunca tono de app de salud.

### Piezas disponibles

| Pieza | Clase o componente | Dónde está |
|---|---|---|
| Tarjeta | `f-card` (`f-card-head`, `f-label`) | `_componentes.scss` |
| Tecla | `ion-button class="f-key pink|solo|neutral"`, grande `f-key-big` con `f-key-body`/`f-key-top`/`f-led` | `_componentes.scss` |
| Botón secundario / enlace | `ion-button class="f-btn"` · `ion-button fill="clear" class="f-ghost"` (`f-ghost danger`) | `_componentes.scss` |
| Insignia de contador | `ion-badge class="f-badge c|s|t"` | `_componentes.scss` |
| Consola de eventos | `f-console` > `f-console-head` + `f-line` (`glyph`, `who`, `when`) | `_componentes.scss` |
| Números | `f-big`, `f-mid`, `f-num-c`, `f-num-s`, `mono`, `f-up`, `f-down` | `_componentes.scss` |
| Sección | `f-section` con `f-label` | `_componentes.scss` |
| Papel del calendario | `f-paper`, `f-cal` (`f-cal-rings`, `f-cal-head`, `f-cal-body`), `f-legend` | `_componentes.scss` |
| Filas de lista | `ion-item class="f-row"` | `_ionic.scss` |
| Calendario de un mes | `<app-calendario-mes [mes] [ultimoApunte] [discreto] (diaElegido)>` | paso 8 |
| Marcador | `<app-marcador [valor] [minDigitos] [tono] [etiqueta]>` | paso 7 |
| Ticket | `<app-ticket [grupo] [semana] [filas] [pie]>` | paso 8 |
| Marca de pestaña | `<app-marca titulo="…">` | paso 9 |

### Dónde está el diseño

El diseño aprobado se puede abrir en un navegador: `diseno-follendario/diseno-de-follendario.html` (15 teléfonos interactivos, con interruptores de tema y modo discreto). Su código fuente, pantalla por pantalla, está en `diseno-follendario/diseno-final/src/`: `screens-tabs.jsx` (Sumar, Amigos, Estadísticas), `screens-more.jsx` (Grupo, Ficha, Detalles, Olvidada, Ajustes, Login, Bloqueo, Invitación, Unirse, Compartir QR), `components.jsx` y los estilos `screens.css` (prefijos `su-`, `am-`, `es-`, `gr-`, `fi-`, `de-`, `ol-`, `aj-`, `lo-`, `bl-`, `in-`, `qr-`). Es React de prototipo: copia la estructura y las clases, **no** el JavaScript. Las decisiones del usuario están en `diseno-follendario/direction-approved.md` y la auditoría Vercel en `diseno-follendario/AUDITORIA-VERCEL.md`.

Reglas completas del proyecto: `CLAUDE.md`. Reglas por zona: `.claude/rules/estilos.md` y `.claude/rules/plantillas.md`. Procedimientos: `.claude/skills/portar-pantalla/SKILL.md` y `.claude/skills/aplicar-archivo-literal/SKILL.md`. Todos están en la raíz del proyecto desde el Bootstrap.

---

## Tasks

En el mismo orden que `tasks.json`. Ese orden es el de construcción: de arriba abajo, sin reordenar por prioridad.

### `E3-T1` — Rediseñar Estadísticas con el calendario de 6 meses

**Depends on:** `E2-T6` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta la pestaña con `diseno-follendario/diseno-final/src/screens-tabs.jsx` (función `Estadisticas`, líneas 317–448, y `Calendario`, 271–306) y los estilos `es-*` de `screens.css`. El mapa de calor se sustituye por el calendario del logo: seis meses en un carril horizontal con scroll-snap, cada uno un `<app-calendario-mes>` sobre papel (`f-paper`), el detalle del día tocado en un `aria-live` y la leyenda `f-legend`. Los datos salen de `ultimosMeses(stats.days, now, 6)`: ninguna lectura nueva. La gráfica de barras usa los tokens rosa y cian.

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/estadisticas.check.js tests/design/estadisticas.check.js
```

Después haz esto:

1. Mira el teléfono «Estadísticas» en `diseno-follendario/diseno-de-follendario.html`.
2. Cabecera con `<app-marca titulo="estadísticas">`; el segmento de periodos baja a `ion-content` con `mode="ios"` y sin `color`.
3. En `estadisticas.page.ts`: quita `HeatMapComponent` de `imports` y de las importaciones, cambia `heat: HeatMap` por `meses: MesCalendario[]` en `StatsView` y `heat: heatMap(stats.days, now)` por `meses: ultimosMeses(stats.days, now, 6)`; añade `CalendarioMesComponent` y `MarcaComponent` a `imports` y un campo `diaCalendario = ""`. No borres `heat-map.component.ts` ni `heatMap()` de `stats.ts` (se retiran en la fase de funciones).
4. Resumen: `f-card` con `<span class="f-big total-periodo" dato>`, reparto con `f-num-c reparto-compania` y `f-num-s reparto-solitario`. Rachas y curiosidades en `f-card` con `f-mid`; iconos `ion-icon` de contorno en lugar de emojis de sección (los emojis de logros se quedan: son contenido).
5. Calendario: `<section class="f-card f-paper es-calcard">` con `<p class="es-detalle" aria-live="polite">{{ diaCalendario || "Toca un día para ver cuántas veces" }}</p>`, un carril `es-meses` (`display:flex; overflow-x:auto; scroll-snap-type:x mandatory`) con un bloque por mes (`f-month-head` con nombre y total) y `<app-calendario-mes [mes]="mes" [discreto]="…" (diaElegido)="diaCalendario = $event.etiqueta">`, y la leyenda `f-legend` (compañía/solitario/los dos; «con alguien/por mi cuenta» en discreto).
6. Secciones `h3.seccion` → `f-section` + `f-label`. Historial: `ion-item class="f-row registro"` conservando `ion-item-sliding`, `borrar-registro`, `ver-historial` (`f-btn`) y `cargar-mas` (`f-ghost`). `compartir-anio` como `f-key pink`. Vista previa: botones `f-key pink` y `f-ghost` (fuera `color="light"` y `color="secondary"`).
7. `bar-chart.component.ts`: `--compania: var(--f-pink)`, `--solitario: var(--f-solo)`, textos y rejilla con `--f-muted`/`--f-line`; ningún `--ion-color-`.
8. `estadisticas.page.scss`: reescríbelo solo con tokens y bajo 4 kB (hoy pasa de 4,79 kB y da aviso de presupuesto): lo común ya está en `_componentes.scss`.

**Files**
- `src/app/pages/estadisticas/estadisticas.page.html` — edita
- `src/app/pages/estadisticas/estadisticas.page.scss` — reescribe
- `src/app/pages/estadisticas/estadisticas.page.ts` — edita: meses en lugar de heat, imports
- `src/app/components/stats/bar-chart.component.ts` — edita: estilos con tokens
- `tests/design/estadisticas.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/estadisticas.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/estadisticas.check.js` runs THE SYSTEM SHALL find in `estadisticas.page.html` the hooks `nav-prev`, `nav-next`, `rango-desde`, `rango-hasta`, `total-periodo`, `reparto-compania`, `reparto-solitario`, `racha-actual`, `racha-mejor`, `dias-ultimo`, `compartir-anio`, `ver-historial`, `borrar-registro`, `cargar-mas` and `<ion-item … class="… registro">`, and exit 0.
2. WHEN Estadísticas renders THE SYSTEM SHALL show `<app-calendario-mes>` inside an `f-paper` card with an `f-legend`, and contain no `<app-heat-map`.
3. WHEN `estadisticas.page.ts` is read THE SYSTEM SHALL import `CalendarioMesComponent` and `MarcaComponent`, compute `ultimosMeses(stats.days, now, 6)`, and not reference `HeatMapComponent` or `heatMap(`.
4. WHEN `estadisticas.page.scss` is read THE SYSTEM SHALL contain no hex colour and no `--ion-color-` reference, and weigh under 4000 bytes.
5. WHEN `bar-chart.component.ts` is read THE SYSTEM SHALL declare `--compania: var(--f-pink)` and `--solitario: var(--f-solo)` and contain no `#fc445f`, `#1e94cf` or `--ion-color-`.
6. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0 with no budget warning for `estadisticas.page.scss`.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/estadisticas.check.js
npm test
npm run build -- --configuration production > /tmp/follendario-build-13.log 2>&1
grep -q 'estadisticas.page.scss exceeded maximum budget' /tmp/follendario-build-13.log; test $? -eq 1
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T1: Rediseñar Estadísticas con el calendario de 6 meses"
git tag step-13-estadisticas
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E3-T2` — Rediseñar ficha, QR, usuario y crear grupo

**Depends on:** `E3-T1` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta con `screens-more.jsx` (`Ficha`, líneas 118–160; `CompartirQR`, 431–457) y los estilos `fi-*` y `qr-*` de `screens.css`. La ficha del amigo lleva sus acciones como teclas: retar en rosa, pulla en cian, reacción y privacidad como `f-btn`, eliminar y bloquear como `f-ghost`. En compartir invitación **el QR sigue siendo una `<img>` dentro de `.qr`** (el E2E la espera) sobre fondo claro para que se lea, con el símbolo encima. Elegir @usuario y crear grupo usan campos `fill="outline"` y la tecla rosa.

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/modales.check.js tests/design/modales.check.js
```

Después haz esto:

1. Mira los teléfonos «Ficha» y «Compartir QR» en `diseno-follendario/diseno-de-follendario.html`.
2. `friend-detail.modal.ts`: perfil con `f-title`; insignias en `f-card` con `f-mid` e iconos de contorno; «Tú vs …» en `f-card` con `f-label`, barras con tokens y `f-legend` (`i.c` tú, `i.s` el amigo); duelo con `duelo-marcador`. Botones: `class="f-key pink accion-duelo"`, `class="f-key solo accion-pulla"`, `class="f-btn accion-reaccion"`, `class="f-btn accion-privacidad"`, `class="f-ghost danger accion-eliminar"`, `class="f-ghost accion-bloquear"`; `aceptar-duelo` como `f-key pink`. Estilos en línea solo con tokens.
3. `share-invite.modal.ts`: la cabecera sigue empezando por el `ion-button` que llama a `close()`. `<div class="qr">` con la `<img>` del QR y `<img class="qr-logo" src="assets/follendario/simbolo.png" alt="" width="48" height="46">` centrada encima; `<div class="enlace"><code>…</code></div>`; `class="f-key pink compartir-invitacion"`, `class="f-btn copiar-invitacion"`, `class="f-ghost renovar-invitacion"`.
4. `username.modal.ts`: `ion-input fill="outline"` con `campo-usuario`, `class="f-key pink guardar-usuario"`, `class="f-ghost usuario-mas-tarde"`.
5. `create-group.page.html`: `ion-input fill="outline"` con `nombre-grupo`, amigos como `ion-item class="f-row amigo-seleccionable"`, check con `color="primary"`, y el `ion-fab` sustituido por `<ion-button expand="block" class="f-key pink crear-grupo">` al final.

**Files**
- `src/app/components/friend-detail/friend-detail.modal.ts` — edita
- `src/app/components/share-invite/share-invite.modal.ts` — edita
- `src/app/components/username/username.modal.ts` — edita
- `src/app/pages/create-group/create-group.page.html` — edita
- `tests/design/modales.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/modales.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/modales.check.js` runs THE SYSTEM SHALL find in `friend-detail.modal.ts` the hooks `accion-duelo`, `accion-pulla`, `accion-reaccion`, `accion-privacidad`, `accion-eliminar`, `accion-bloquear`, `aceptar-duelo`, `rechazar-duelo`, `duelo-marcador` and `ve-de-ti`, with `f-key pink` on `accion-duelo` and `f-key solo` on `accion-pulla`, and exit 0.
2. WHEN the invite modal renders THE SYSTEM SHALL draw the QR as an `<img>` inside `.qr`, the link as `<code>` inside `.enlace`, and start its header with the `ion-button` that calls `close()`.
3. WHEN the invite modal renders THE SYSTEM SHALL show `assets/follendario/simbolo.png` over the QR and use `f-key pink` on `compartir-invitacion`.
4. WHEN `username.modal.ts` and `create-group.page.html` are read THE SYSTEM SHALL use `f-key pink` and keep `guardar-usuario`, `usuario-mas-tarde`, `campo-usuario`, `crear-grupo`, `nombre-grupo` and `amigo-seleccionable`, with no `<ion-fab`.
5. WHEN the four files are read THE SYSTEM SHALL contain no `color="secondary"`, `color="tertiary"`, `color="warning"` or `color="light"`.
6. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/modales.check.js
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T2: Rediseñar ficha, QR, usuario y crear grupo"
git tag step-14-modales-sociales
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E3-T3` — Rediseñar detalles, apunte olvidado y bloqueo

**Depends on:** `E3-T2` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta con `screens-more.jsx` (`Detalles` 163–200, `Olvidada` 203–236, `Bloqueo` 350–387) y los estilos `de-*`, `ol-*` y `bl-*` de `screens.css`. En «¿Se te olvidó apuntar una?» la fecha se sigue eligiendo con el `ion-datetime` actual (restilado sobre papel por `_ionic.scss`, dentro de `f-paper`), y la tecla de confirmar es rosa o cian según el tipo. La pantalla de bloqueo es un teclado de teclas neutras con puntos, dice `Follendario` (o `Notas`) y anuncia el estado del PIN a lectores de pantalla.

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/apunte.check.js tests/design/apunte.check.js
```

Después haz esto:

1. Mira los teléfonos «Detalles», «Se me olvidó» y «Bloqueo» en `diseno-follendario/diseno-de-follendario.html`.
2. `fap-details.modal.ts`: etiquetas de sección `<span class="f-label">¿qué tal fue?</span>`, estrellas conservando `estrella`/`estrellas` con color por token, chips `ion-chip` con `seleccionada` al elegir, `nueva-etiqueta` y `nota` como `fill="outline"`, `guardar-detalles` intacto. Sin `--ion-color-step-*`.
3. `add-past-fap.modal.ts`: título `¿Se te olvidó apuntar una?`; segmento `tipo` con `mode="ios"` (`tipo-compania`, `tipo-solitario`); `atajos` como `ion-chip`; `fecha` dentro de `<section class="f-card f-paper">`; `resumen` y `resumen-fecha` intactos; confirmar: `<ion-button expand="block" class="f-key confirmar" [class.pink]="!solitario" [class.solo]="solitario">AÑADIR</ion-button>` (usa el nombre real de la propiedad del tipo en ese componente).
4. `lock-screen.component.ts`: título `<h2 translate="no">{{ settings.discreet().neutralName ? 'Notas' : 'Follendario' }}</h2>`, candado como `ion-icon` (fuera el emoji), `<p class="f-lead" aria-live="polite">` con «Pon tu PIN» / «Ese no es. Otra vez.», puntos `puntos`, teclado `teclado` con botones de aspecto de tecla neutra (estilos en línea con `var(--f-surface-2)`, `var(--f-text)`, sombra inferior) y `olvidado` con el texto `¿has olvidado el PIN?`. Estilos solo con tokens `--f-*`, sin hex.

**Files**
- `src/app/components/fap-details/fap-details.modal.ts` — edita
- `src/app/pages/sumar/add-past-fap.modal.ts` — edita
- `src/app/components/lock-screen/lock-screen.component.ts` — edita
- `tests/design/apunte.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/apunte.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/apunte.check.js` runs THE SYSTEM SHALL find in `fap-details.modal.ts` the hooks `guardar-detalles`, `estrella`, `etiqueta`, `nueva-etiqueta`, `nota` and `seleccionada` plus `f-label` and `fill="outline"`, with no `--ion-color-step-250`, and exit 0.
2. WHEN the forgotten-entry modal renders THE SYSTEM SHALL title it `¿Se te olvidó apuntar una?`, use `mode="ios"` and `f-paper`, and keep `atajos`, `fecha`, `resumen`, `resumen-fecha`, `tipo-compania`, `tipo-solitario` and `confirmar`.
3. WHEN the entry type changes THE SYSTEM SHALL switch the `f-key confirmar` button between `[class.pink]` and `[class.solo]`.
4. WHEN the lock screen renders THE SYSTEM SHALL show `'Notas' : 'Follendario'` with `translate="no"`, announce the PIN state in an `aria-live="polite"` element and offer `¿has olvidado el PIN?`.
5. WHEN `lock-screen.component.ts` is read THE SYSTEM SHALL use `var(--f-` tokens and contain no hex colour, `SexControl`, `--ion-text-color`, `--ion-background-color`, `--ion-color-step` or `🔒`.
6. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/apunte.check.js
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T3: Rediseñar detalles, apunte olvidado y bloqueo"
git tag step-15-apunte-y-bloqueo
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E3-T4` — Rediseñar login y registro

**Depends on:** `E3-T3` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Login y registro son lo primero que se ve sin cuenta, y lo único que se puede comprobar en el navegador sin Firebase, así que aquí la comprobación mira la build real: fuente Geist, fondo papel crema en claro y ciruela en oscuro, Entrar en rosa y, con «Nombre e icono neutros», «Notas» en lugar de la marca (gracias a `body.neutro` del paso 3). Los campos usan `ion-input fill="outline"` con etiqueta; el botón `Entrar` conserva `color="primary"` y su texto porque el E2E entra con ese selector.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/app/pages/login/login.page.html   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/pages/login/login.page.scss   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/pages/register/register.page.html   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/pages/register/register.page.scss   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/app/pages/login/login.page.html src/app/pages/login/login.page.html
cp blueprints/rediseno-follendario/archivos/src/app/pages/login/login.page.scss src/app/pages/login/login.page.scss
cp blueprints/rediseno-follendario/archivos/src/app/pages/register/register.page.html src/app/pages/register/register.page.html
cp blueprints/rediseno-follendario/archivos/src/app/pages/register/register.page.scss src/app/pages/register/register.page.scss
cp blueprints/rediseno-follendario/archivos/tests/design/acceso.check.js tests/design/acceso.check.js
```

**Files**
- `src/app/pages/login/login.page.html` — sustituye
- `src/app/pages/login/login.page.scss` — sustituye
- `src/app/pages/register/register.page.html` — sustituye
- `src/app/pages/register/register.page.scss` — sustituye
- `tests/design/acceso.check.js` — nuevo: plantillas + navegador sobre la build

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/acceso.check.js` opens `/login` on the served production build with a light colour scheme THE SYSTEM SHALL compute a `Geist` body font, body background `rgb(244, 230, 222)`, an Entrar button background `rgb(252, 42, 108)` and an email field `--border-color` of `#e2c5c9`.
2. WHEN the same page opens with a dark colour scheme THE SYSTEM SHALL compute body background `rgb(16, 8, 26)` and show the cream logotype (`.lo-oscuro`) instead of the ink one.
3. WHEN the stored settings enable the discreet mode with neutral name THE SYSTEM SHALL show `.lo-notas` and hide `.lo-marca`, over body background `rgb(242, 241, 238)`.
4. WHEN the login template is read THE SYSTEM SHALL keep `type="email"`, `type="password"`, `color="primary"` and `>Entrar</ion-button>` and contain no `logo-sexcontrol`.
5. WHEN the page loads in any of the three cases THE SYSTEM SHALL raise no JavaScript error.
6. WHEN `node tests/ci/build-smoke.js` serves the build THE SYSTEM SHALL exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
npm run build -- --configuration production
node tests/design/acceso.check.js
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T4: Rediseñar login y registro"
git tag step-16-acceso
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E3-T5` — Rediseñar recuperar, verificar e invitaciones

**Depends on:** `E3-T4` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta con `screens-more.jsx` (`Invitacion` 390–408, `Unirse` 410–429) y los estilos `in-*` de `screens.css`. Son pantallas cortas de una sola acción: título grande `f-title`, texto `f-lead`, la acción como tecla rosa y «ahora no» como enlace discreto. Cambia el texto «quiere ser tu amigo en SexControl» por «quiere picarse contigo en Follendario» con el nombre marcado `translate="no"`. Recuperar contraseña y verificar email solo cambian su plantilla; sus .scss se quedan como están.

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/enlaces.check.js tests/design/enlaces.check.js
```

Después haz esto:

1. Mira los teléfonos «Invitación» y «Unirse» en `diseno-follendario/diseno-de-follendario.html`.
2. `forgot-password.page.html`: `ion-input type="email" fill="outline"` con etiqueta y la acción principal como `class="f-key pink"`.
3. `verify-email.page.html`: icono de contorno, título `class="f-title"`, la acción principal `class="f-key pink"` y `ya-verificado` conservado.
4. `invite.page.ts`: avatar, `<h2 class="f-title">`, @usuario en `f-lead mono`, `<p>quiere picarse contigo en <span translate="no">Follendario</span></p>`, `class="f-key pink aceptar-invitacion"`, «ahora no» como `f-ghost`.
5. `join-group.page.ts`: inicial del grupo en un bloque (fuera el emoji 👥), `<h2 class="f-title">`, `aviso-privacidad` dentro de `f-card` con `<span class="f-label">antes de entrar</span>`, `class="f-key pink entrar-grupo"`, «ahora no» como `f-ghost`.

**Files**
- `src/app/pages/forgot-password/forgot-password.page.html` — edita
- `src/app/pages/verify-email/verify-email.page.html` — edita
- `src/app/pages/invite/invite.page.ts` — edita
- `src/app/pages/join-group/join-group.page.ts` — edita
- `tests/design/enlaces.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/enlaces.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/enlaces.check.js` runs THE SYSTEM SHALL find `fill="outline"`, `type="email"` and `f-key pink` in `forgot-password.page.html`, and `ya-verificado`, `f-key pink` and `f-title` in `verify-email.page.html`, and exit 0.
2. WHEN the friend invite renders THE SYSTEM SHALL say `quiere picarse contigo en <span translate="no">Follendario</span>` and put `f-key pink` on `aceptar-invitacion`, with no `SexControl`.
3. WHEN the group invite renders THE SYSTEM SHALL keep `entrar-grupo` with `f-key pink` (the E2E presses it) and `aviso-privacidad` inside an `f-card` with an `f-label`, with no `👥`.
4. WHEN the four files are read THE SYSTEM SHALL contain no `color="secondary"`, `color="tertiary"`, `color="warning"` or `color="light"`.
5. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/enlaces.check.js
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T5: Rediseñar recuperar, verificar e invitaciones"
git tag step-17-enlaces
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E3-T6` — Rediseñar ajustes y añadir amigo; barrido final

**Depends on:** `E3-T5` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta con `screens-more.jsx` (`Ajustes`, líneas 239–317) y los estilos `aj-*` de `screens.css`: secciones `f-section` con tarjetas `f-card`, guardar perfil como tecla rosa, borrar cuenta como enlace rojo discreto. Añadir amigo sigue el mismo lenguaje. Cierra el rediseño con el barrido `final.check.js`, que recorre todo `src/app`: ni `SexControl`, ni el logo viejo, ni la paleta vieja, ni `color="secondary|tertiary|warning|light"`, ni `mode="md"`.

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/final.check.js tests/design/final.check.js
```

Después haz esto:

1. Mira el teléfono «Ajustes» en `diseno-follendario/diseno-de-follendario.html`.
2. `ajustes.page.html`: cada bloque (perfil, objetivos, privacidad, recordatorios, modo discreto, apariencia, instalar, cuenta) es `<div class="f-section"><span class="f-label">…</span></div>` + `<section class="f-card">`. Conserva todas sus clases (`guardar-perfil`, `guardar-objetivos`, `cambiar-usuario`, `mi-usuario`, `pausar`, `buscable`, `recordatorios`, `discreto`, `ocultar-numeros`, `nombre-neutro`, `bloqueo-pin`, `tema`, `cerrar-sesion`, `borrar-cuenta`). `class="f-key pink guardar-perfil"`, `guardar-objetivos` e instalar como `f-btn`, `tema` con `mode="ios"`, `borrar-cuenta` como `f-ghost danger`, `cerrar-sesion` como `f-btn`. Textos del prototipo: «Oscuro: ciruela y crema. Claro: papel crema.».
3. `ajustes.page.scss`: reescríbelo solo con tokens `--f-*`, sin hex ni `--ion-color-`.
4. `add-friend.page.html`: tu @usuario en `f-card` con `mi-handle` en mono, resultados como `ion-item class="f-row …"` (conserva `anadir-amigo`, `buscar-amigo`, `elegir-mi-usuario`, `invitar-enlace`), la acción de añadir con `f-key pink`, invitar con enlace como `f-btn`.
5. `add-friend.page.scss`: solo tokens, sin hex ni `--ion-color-`.
6. Ejecuta `node tests/design/final.check.js`; si señala un archivo fuera de este paso, **para y avisa**: significa que un paso anterior se cerró incompleto.

**Files**
- `src/app/pages/ajustes/ajustes.page.html` — edita
- `src/app/pages/ajustes/ajustes.page.scss` — reescribe
- `src/app/pages/add-friend/add-friend.page.html` — edita
- `src/app/pages/add-friend/add-friend.page.scss` — reescribe
- `tests/design/final.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/final.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/final.check.js` runs THE SYSTEM SHALL find in `ajustes.page.html` every existing settings hook plus `f-card`, `f-section`, `f-label`, `mode="ios"`, `f-ghost danger` and `f-key pink` on `guardar-perfil`, and exit 0.
2. WHEN `add-friend.page.html` is read THE SYSTEM SHALL keep `anadir-amigo`, `buscar-amigo`, `elegir-mi-usuario`, `invitar-enlace` and `mi-handle` and use `f-row` and `f-card`.
3. WHEN `ajustes.page.scss` and `add-friend.page.scss` are read THE SYSTEM SHALL contain no hex colour and no `--ion-color-` reference.
4. WHEN every `.html`, `.ts` (except `.spec.ts`) and `.scss` under `src/app` is scanned THE SYSTEM SHALL find no `SexControl`, `logo-sexcontrol`, `<app-heat-map` or old palette colour (`#fc445f`, `#44c8fc`, `#6c5ce7`, `#5260ff`, `#1e94cf`, `#12233f`, `#1f5c7a`, `#2b1055`, `#7a1f5c`, `#06d6a0`; `heat-map.component.ts` excepted), and in templates no `color="secondary|tertiary|warning|light"` or `mode="md"`.
5. WHEN every design check from steps 2–17 runs again after the production build THE SYSTEM SHALL exit 0 for each.
6. WHEN `npm test` and `node tests/ci/build-smoke.js` run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/final.check.js
npm test
npm run build -- --configuration production
node tests/design/contraste.check.js
node tests/design/estilos.check.js
node tests/design/marca.check.js
node tests/design/nombre.check.js
node tests/design/pestanas.check.js
node tests/design/sumar.check.js
node tests/design/amigos.check.js
node tests/design/grupo.check.js
node tests/design/estadisticas.check.js
node tests/design/modales.check.js
node tests/design/apunte.check.js
node tests/design/acceso.check.js
node tests/design/enlaces.check.js
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E3-T6: Rediseñar ajustes y añadir amigo; barrido final"
git tag step-18-ajustes-y-cierre
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

---

## Epic acceptance

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `node tests/design/final.check.js` runs after `E3-T6` **THE SYSTEM SHALL** exit 0 with no `SexControl`, old logo, old palette, heat map, legacy colour attribute or `mode="md"` left in `src/app`.
2. **WHEN** `node tests/design/acceso.check.js` opens the served build **THE SYSTEM SHALL** confirm the light, dark and discreet skins on the login screen.

```bash
node tests/design/final.check.js
npm test
npm run build -- --configuration production
node tests/design/contraste.check.js
node tests/design/estilos.check.js
node tests/design/marca.check.js
node tests/design/nombre.check.js
node tests/design/pestanas.check.js
node tests/design/sumar.check.js
node tests/design/amigos.check.js
node tests/design/grupo.check.js
node tests/design/estadisticas.check.js
node tests/design/modales.check.js
node tests/design/apunte.check.js
node tests/design/acceso.check.js
node tests/design/enlaces.check.js
node tests/ci/build-smoke.js
```

Desde la raíz del proyecto. Ninguno espera a una persona ni a un servicio externo.

## Pitfalls

- **Pisar un archivo que ha cambiado.** Las tareas que sustituyen un archivo entero empiezan con `git diff --quiet d788095 -- <archivo>`. Si sale distinto de 0, el archivo cambió después de diseñar el plan: para y avisa, no copies encima.
- **Creer que un aviso de build es un fallo.** Los avisos listados en *Stack* ya existían. Lo que cuenta es el código de salida.
- **`color="secondary"` sigue compilando.** No da error: simplemente pinta cian donde antes era rosa. Por eso las comprobaciones lo buscan.
- **`fill="outline"` no es un atributo en el DOM.** Angular lo pasa como propiedad; para estilos globales Ionic pone la clase `input-fill-outline` en el host (ya resuelto en `_ionic.scss`).
- **El QR como SVG.** El E2E busca `.qr img`: el QR se sigue pintando como `<img>`, sobre fondo claro para que se lea.
- **Borrar el mapa de calor.** No borres `heat-map.component.ts` ni `heatMap()`: se retiran en la fase de funciones. Solo deja de usarse.
- **Lectores de pantalla en el bloqueo.** El estado del PIN va en un `aria-live="polite"`; sin él, quien no ve la pantalla no sabe si ha fallado.

## Before moving on

- [ ] Todas las tareas de esta épica están `done` en `tasks.json`; ninguna queda `in_progress`.
- [ ] Pasaron todos los comandos `verify` de cada tarea, no solo el primero.
- [ ] No se editó ni se saltó ningún comando `verify`.
- [ ] Cada tarea tiene su etiqueta `checkpoint` en git (`git tag -l 'step-*'`).
- [ ] El gate de la épica pasa desde la raíz del proyecto.
- [ ] Existen los contratos *Produced* con la firma indicada.
- [ ] No se modificó ningún archivo fuera del subárbol.
- [ ] Este proyecto no usa variables de entorno nuevas: no hay nada que añadir a ningún `.env`.
- [ ] Un commit por tarea, con su id delante, y su etiqueta detrás.
