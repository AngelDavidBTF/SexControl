# Epic 01: Base visual y marca

> La app ya se llama Follendario, carga Geist sin conexión y todas las pantallas heredan la piel nueva (tokens, pieles discretas, teclas, calendario y movimiento) sin tocar aún ninguna plantilla.

| | |
|---|---|
| **Epic id** | `01-base` |
| **Tasks** | `E1-T1` … `E1-T6` |
| **Depends on** | nada: empieza aquí (después del Bootstrap de `blueprint.md` §10) |
| **Unlocks** | `02-firma` |
| **Parallel with** | nada: las tareas forman una cadena en una sola rama con una etiqueta por paso |

No necesitas ningún otro archivo para completar esta épica. Todo lo de abajo se repite aquí a propósito.

---

## Antes de la primera tarea

Una sola vez, desde la raíz del repo, con este paquete ya en `blueprints/rediseno-follendario/`. Es seguro repetirlo:

```bash
# Si una línea falla, para y avisa. Orden: raíz del repo → rama → ignorar ajustes locales → workspace sin pisar → commit del diseño y el plan → dependencias → navegador
cd "$(git rev-parse --show-toplevel)"                       # el repo ya existe (brownfield): no se hace git init
git merge-base --is-ancestor d788095 HEAD                  # el plan se escribió sobre d788095; si falla, para y avisa
git show-ref --verify --quiet refs/heads/rediseno/follendario || git branch rediseno/follendario
git switch rediseno/follendario
grep -qxF '.claude/settings.local.json' .gitignore || printf '\n# Permisos locales de Claude Code\n.claude/settings.local.json\n' >> .gitignore
cp -Rn blueprints/rediseno-follendario/workspace/. . 2>/dev/null || true   # -n no pisa lo que ya exista; algunas versiones de cp salen con 1 al saltar un archivo, y saltar es lo que se quiere
git add .gitignore diseno-follendario "POSIBLES LOGOS" FOLLENDARIO-DIRECCIONES.md blueprints CLAUDE.md AGENTS.md .claude
git diff --cached --quiet || git commit -m "chore: diseño aprobado de Follendario y plan de rediseño"
npm ci
npx playwright install chromium                             # lo usan build-smoke, iconos-follendario y acceso.check
```

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
capacitor.config.ts
ngsw-config.json
package-lock.json
package.json
public/*
scripts/iconos-follendario.js
src/app/core/reminders.service.ts
src/app/core/settings.service.spec.ts
src/app/core/settings.service.ts
src/app/shared/group-card.ts
src/app/shared/year-card.ts
src/assets/follendario/*.png
src/assets/icon/favicon.png
src/global.scss
src/index.html
src/styles.scss
src/theme/_componentes.scss
src/theme/_fonts.scss
src/theme/_ionic.scss
src/theme/_movimiento.scss
src/theme/_tokens.scss
src/theme/variables.scss
tests/design/contraste.check.js
tests/design/estilos.check.js
tests/design/marca.check.js
tests/design/nombre.check.js
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

**Produced** — lo que dependen las épicas siguientes:

| Export | Signature | Used by |
|---|---|---|
| `src/theme/_tokens.scss` | tokens `--f-*` en `body`, `body.dark`, `body.discreto:not(.dark)`, `body.dark.discreto` | `02-firma`, `03-pantallas` |
| `src/theme/_componentes.scss` | clases `f-card`, `f-key`, `f-btn`, `f-ghost`, `f-badge`, `f-console`, `f-line`, `f-section`, `f-label`, `f-paper`, `f-cal`, `f-legend`, `f-mcell`, `f-tiles` | `02-firma`, `03-pantallas` |
| `SettingsService` | clases `discreto` y `neutro` en `body` | `02-firma`, `03-pantallas` |

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

### `E1-T1` — Instalar Geist y cachearla sin conexión

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no un orden

Geist (texto) y Geist Mono (números, etiquetas) se sirven desde el propio build con @fontsource, nunca desde Google Fonts: la app es una PWA y debe verse igual sin red. El build de Angular copia los .woff2 a `www/media/`, y ese directorio no lo cacheaba el service worker, por eso se añade un grupo `fuentes` a `ngsw-config.json`. En este paso `src/styles.scss` solo gana la importación de fuentes; los tokens llegan en el paso 2.

Ejecuta, en este orden, desde la raíz del repo:

```bash
npm install --save-exact @fontsource/geist@5.3.0 @fontsource/geist-mono@5.3.0
mkdir -p src/theme && cp blueprints/rediseno-follendario/archivos/src/theme/_fonts.scss src/theme/_fonts.scss
git diff --quiet d788095 -- src/styles.scss   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- ngsw-config.json   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/styles.paso-01.scss src/styles.scss
cp blueprints/rediseno-follendario/archivos/ngsw-config.json ngsw-config.json
```

**Files**
- `package.json` — edita: dos dependencias fijadas a 5.3.0
- `package-lock.json` — lo regenera npm install
- `src/theme/_fonts.scss` — nuevo: importa geist latin 400/500/600 y geist-mono latin 400/500/700
- `src/styles.scss` — edita: importa theme/fonts antes que las variables
- `ngsw-config.json` — edita: grupo "fuentes" que precarga /media/*.woff2

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `npm run build -- --configuration production` runs THE SYSTEM SHALL exit 0 and emit a `.woff2` in `www/media/` for each face imported by `src/theme/_fonts.scss` (geist-latin 400, 500, 600 and geist-mono-latin 400, 500, 700).
2. WHEN the production build finishes THE SYSTEM SHALL list the Geist `.woff2` files under `/media/` in `www/ngsw.json`, so the service worker keeps them offline.
3. WHEN `package.json` is read THE SYSTEM SHALL pin `@fontsource/geist` and `@fontsource/geist-mono` to exactly `5.3.0` in `dependencies`.
4. WHEN `node tests/ci/build-smoke.js` serves the build THE SYSTEM SHALL exit 0 with the login screen visible and no JavaScript errors.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
npm run build -- --configuration production
node -e "const fs=require('fs');const media=fs.readdirSync('www/media');const caras=['geist-latin-400','geist-latin-500','geist-latin-600','geist-mono-latin-400','geist-mono-latin-500','geist-mono-latin-700'];const faltan=caras.filter(c=>!media.some(f=>f.startsWith(c+'-normal-')&&f.endsWith('.woff2')));const ngsw=fs.readFileSync('www/ngsw.json','utf8');if(faltan.length||!ngsw.includes('/media/geist-latin-400-normal-')){console.error('faltan fuentes',faltan);process.exit(1)}"
node -e "const p=require('./package.json');if(p.dependencies['@fontsource/geist']!=='5.3.0'||p.dependencies['@fontsource/geist-mono']!=='5.3.0'){console.error('versiones de fontsource');process.exit(1)}"
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T1: Instalar Geist y cachearla sin conexión"
git tag step-01-fuentes
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E1-T2` — Añadir tokens de color y las cuatro pieles

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Los tokens `--f-*` viven en `body` (no en `:root`) porque el tema y el modo discreto se aplican como clases de `body` (`dark`, `discreto`) y así cada piel redefine las mismas variables. `variables.scss` traduce los tokens a Ionic: **primary pasa a ser el rosa y secondary el cian**, al revés que en la app vieja. Eso cambia el color de los `color="secondary"` de las pantallas que aún no se han portado; es esperado y se corrige pantalla a pantalla en los pasos 10–18. El script de contraste es la garantía WCAG 2.2 AA de la paleta.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/theme/variables.scss   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/theme/_tokens.scss src/theme/_tokens.scss
cp blueprints/rediseno-follendario/archivos/src/theme/variables.scss src/theme/variables.scss
mkdir -p tests/design && cp blueprints/rediseno-follendario/archivos/tests/design/contraste.check.js tests/design/contraste.check.js
cp blueprints/rediseno-follendario/archivos/src/styles.scss src/styles.scss
```

**Files**
- `src/theme/_tokens.scss` — nuevo: tokens --f-* de body, body.dark, body.discreto:not(.dark) y body.dark.discreto
- `src/theme/variables.scss` — sustituye: paleta de Ionic apuntando a los tokens
- `tests/design/contraste.check.js` — nuevo: contraste de 15 pares en 4 pieles
- `src/styles.scss` — edita: fuentes → tokens → variables → global

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/contraste.check.js` runs THE SYSTEM SHALL exit 0 after asserting a contrast ratio of at least 4.5:1 for each of its 15 colour pairs in each of the 4 skins (claro, oscuro, discreto claro, discreto oscuro) read from `src/theme/_tokens.scss`.
2. WHEN `src/styles.scss` is compiled THE SYSTEM SHALL import, in this order, `theme/fonts`, `theme/tokens`, `theme/variables.scss` and `global.scss`.
3. WHEN `npm run build -- --configuration production` runs THE SYSTEM SHALL exit 0.
4. WHEN `node tests/ci/build-smoke.js` serves the build THE SYSTEM SHALL exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/contraste.check.js
node -e "const s=require('fs').readFileSync('src/styles.scss','utf8');const o=['theme/fonts','theme/tokens','theme/variables.scss','global.scss'].map(x=>s.indexOf(x));if(o.some((v,i)=>v<0||(i&&v<o[i-1]))){process.exit(1)}"
npm run build -- --configuration production
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T2: Añadir tokens de color y las cuatro pieles"
git tag step-02-tokens
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E1-T3` — Aplicar piel discreta, theme-color y nombre en ajustes

**Depends on:** `E1-T2` · **Priority:** p0 — metadato para recortes de alcance, no un orden

El servicio de ajustes ya ponía `body.dark` y `body.discreto-numeros`. Ahora además pone `body.discreto` (piel gris neutra: desde fuera no se nota qué app es), `body.neutro` (nombre e icono neutros: login y registro enseñan «Notas» solo con CSS), cambia `<meta name="theme-color">` según tema y piel, y usa `Follendario` como título. Los recordatorios se titulan `Follendario`. Las claves de localStorage `sexcontrol.*` no cambian: cambiarlas borraría los ajustes de quien ya usa la app.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/app/core/settings.service.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/core/reminders.service.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/app/core/settings.service.ts src/app/core/settings.service.ts
cp blueprints/rediseno-follendario/archivos/src/app/core/settings.service.spec.ts src/app/core/settings.service.spec.ts
cp blueprints/rediseno-follendario/archivos/src/app/core/reminders.service.ts src/app/core/reminders.service.ts
```

**Files**
- `src/app/core/settings.service.ts` — sustituye: efectos de body.discreto, body.neutro y theme-color; APP_TITLE Follendario
- `src/app/core/settings.service.spec.ts` — nuevo: 3 pruebas de la piel
- `src/app/core/reminders.service.ts` — sustituye: título 'Follendario' en la notificación

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN the discreet mode is enabled or disabled THE SYSTEM SHALL add or remove the `discreto` class on `body`, as asserted by `src/app/core/settings.service.spec.ts`.
2. WHEN the discreet mode and `neutralName` are both on THE SYSTEM SHALL add `neutro` to `body` and set `document.title` to `Notas`, and otherwise remove `neutro` and set it to `Follendario`.
3. WHEN the theme or the discreet mode changes THE SYSTEM SHALL set `meta[name="theme-color"]` to `#f4e6de` (claro), `#10081a` (oscuro), `#f2f1ee` (discreto claro) or `#151618` (discreto oscuro).
4. WHEN `src/app/core/reminders.service.ts` is read THE SYSTEM SHALL title the reminder `'Notas' : 'Follendario'`.
5. WHEN `npm test` runs THE SYSTEM SHALL exit 0 with 0 failed specs.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
npm test
node -e "const t=require('fs').readFileSync('src/app/core/reminders.service.ts','utf8');if(!t.includes(\"'Notas' : 'Follendario'\")){process.exit(1)}"
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T3: Aplicar piel discreta, theme-color y nombre en ajustes"
git tag step-03-piel
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E1-T4` — Añadir piezas globales, Ionic y movimiento

**Depends on:** `E1-T3` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Toda la personalidad compartida vive en tres parciales globales que las plantillas usan por clase: `_componentes.scss` (f-card, f-key, f-console, f-ticket, f-cal, f-tiles, f-mcell, f-badge…), `_ionic.scss` (los componentes de Ionic solo mediante variables CSS y `::part`, nunca cambiando su marcado) y `_movimiento.scss` (solo transform y opacity; todo se apaga con `prefers-reduced-motion`). `global.scss` pierde las reglas `.red` (sin uso) y la de números difuminados, que pasa a `_componentes.scss`.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/global.scss   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/theme/_componentes.scss src/theme/_componentes.scss
cp blueprints/rediseno-follendario/archivos/src/theme/_ionic.scss src/theme/_ionic.scss
cp blueprints/rediseno-follendario/archivos/src/theme/_movimiento.scss src/theme/_movimiento.scss
cp blueprints/rediseno-follendario/archivos/src/global.scss src/global.scss
cp blueprints/rediseno-follendario/archivos/tests/design/estilos.check.js tests/design/estilos.check.js
```

**Files**
- `src/theme/_componentes.scss` — nuevo: piezas de Follendario
- `src/theme/_ionic.scss` — nuevo: Ionic con la piel de Follendario
- `src/theme/_movimiento.scss` — nuevo: keyframes y movimiento reducido
- `src/global.scss` — sustituye: importa los tres parciales
- `tests/design/estilos.check.js` — nuevo: comprueba la hoja de estilos del build

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `npm run build -- --configuration production` runs THE SYSTEM SHALL exit 0 and produce exactly one `www/styles-*.css`.
2. WHEN `node tests/design/estilos.check.js` reads that stylesheet THE SYSTEM SHALL find `--f-bg:`, `body.dark`, `body.discreto`, `--f-cal-paper`, `.f-key`, `.f-console`, `.f-ticket`, `.roll-tile`, `.f-mcell`, `@keyframes f-stamp`, `prefers-reduced-motion` and `font-family:Geist`, and exit 0.
3. WHEN `node tests/ci/build-smoke.js` serves the build THE SYSTEM SHALL exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
npm run build -- --configuration production
node tests/design/estilos.check.js
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T4: Añadir piezas globales, Ionic y movimiento"
git tag step-04-estilos
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E1-T5` — Poner logos, iconos y manifiesto de Follendario

**Depends on:** `E1-T4` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Los logos aprobados están en `diseno-follendario/assets/` (el símbolo del calendario con la berenjena, el logotipo crema para oscuro y el de tinta para claro). Los iconos de la app no se dibujan a mano: los genera `scripts/iconos-follendario.js` pintando el símbolo sobre ciruela con el Chromium de Playwright, incluido el maskable con margen y el favicon.ico. El manifiesto cambia nombre, descripción y colores; el `appId` y el dominio no se tocan.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- public/manifest.webmanifest   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
mkdir -p src/assets/follendario scripts
cp diseno-follendario/assets/follendario-simbolo.png src/assets/follendario/simbolo.png
cp diseno-follendario/assets/follendario-logotipo.png src/assets/follendario/logotipo.png
cp diseno-follendario/assets/follendario-logotipo-tinta.png src/assets/follendario/logotipo-tinta.png
cp blueprints/rediseno-follendario/archivos/scripts/iconos-follendario.js scripts/iconos-follendario.js
node scripts/iconos-follendario.js
cp blueprints/rediseno-follendario/archivos/public/manifest.webmanifest public/manifest.webmanifest
cp blueprints/rediseno-follendario/archivos/tests/design/marca.check.js tests/design/marca.check.js
```

**Files**
- `scripts/iconos-follendario.js` — nuevo: genera los iconos
- `src/assets/follendario/*.png` — nuevo: simbolo, logotipo y logotipo-tinta
- `src/assets/icon/favicon.png` — regenerado
- `public/*` — regenerados icon-192, icon-512, icon-512-maskable y favicon.ico; manifest.webmanifest sustituido
- `tests/design/marca.check.js` — nuevo

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/marca.check.js` runs THE SYSTEM SHALL find `simbolo.png`, `logotipo.png` and `logotipo-tinta.png` in `src/assets/follendario/` as valid PNG files and exit 0.
2. WHEN the generated icons are read THE SYSTEM SHALL measure 192×192 for `public/icon-192.png` and 512×512 for `public/icon-512.png`, `public/icon-512-maskable.png` and `src/assets/icon/favicon.png`, with `public/favicon.ico` a valid icon file.
3. WHEN `public/manifest.webmanifest` is parsed THE SYSTEM SHALL have `name` and `short_name` `Follendario`, `theme_color` `#10081a` and an icon `icon-512-maskable.png` with purpose `maskable`.
4. WHEN `npm run build -- --configuration production` runs THE SYSTEM SHALL exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/marca.check.js
npm run build -- --configuration production
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T5: Poner logos, iconos y manifiesto de Follendario"
git tag step-05-marca
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E1-T6` — Cambiar el nombre visible a Follendario

**Depends on:** `E1-T5` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Decisión del usuario: se cambia **solo lo visible**. Título y noscript de `index.html`, `appName` de Capacitor y la firma de las imágenes que se comparten (tarjeta de la semana y del año), que además pasan a Geist y a degradados ciruela → cian (semana) y ciruela → rosa (año). Se mantienen el `appId online.sexcontrol.app`, las claves `sexcontrol.*`, el proyecto de Firebase y el dominio.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/index.html   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/shared/group-card.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/shared/year-card.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- capacitor.config.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/index.html src/index.html
cp blueprints/rediseno-follendario/archivos/src/app/shared/group-card.ts src/app/shared/group-card.ts
cp blueprints/rediseno-follendario/archivos/src/app/shared/year-card.ts src/app/shared/year-card.ts
cp blueprints/rediseno-follendario/archivos/capacitor.config.ts capacitor.config.ts
cp blueprints/rediseno-follendario/archivos/tests/design/nombre.check.js tests/design/nombre.check.js
```

**Files**
- `src/index.html` — sustituye: título, theme-color, color-scheme, descripción y noscript
- `src/app/shared/group-card.ts` — sustituye: firma, fuente y degradado
- `src/app/shared/year-card.ts` — sustituye: firma, fuente y degradado
- `capacitor.config.ts` — sustituye: appName 'Follendario'
- `tests/design/nombre.check.js` — nuevo

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `src/index.html` is read THE SYSTEM SHALL contain `<title>Follendario</title>`, `<meta name="theme-color" content="#10081a">`, `<meta name="color-scheme" content="light dark">` and the noscript text `usar Follendario.`
2. WHEN `capacitor.config.ts` is read THE SYSTEM SHALL declare `appName: 'Follendario'` and keep `appId: 'online.sexcontrol.app'`.
3. WHEN the week and year share cards are drawn THE SYSTEM SHALL sign them `Follendario` in Geist over a gradient that starts at `#10081a`.
4. WHEN `node tests/design/nombre.check.js` runs THE SYSTEM SHALL find no `SexControl` in the five files it reads and keep the `sexcontrol.settings.v1` storage key, and exit 0.
5. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/nombre.check.js
npm test
npm run build -- --configuration production
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T6: Cambiar el nombre visible a Follendario"
git tag step-06-nombre
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

---

## Epic acceptance

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `npm run build -- --configuration production` runs after `E1-T6` **THE SYSTEM SHALL** exit 0 and `node tests/design/estilos.check.js`, `node tests/design/marca.check.js` and `node tests/design/nombre.check.js` SHALL each exit 0.
2. **WHEN** `node tests/ci/build-smoke.js` serves that build **THE SYSTEM SHALL** show the login screen with no JavaScript errors, even though no template has been ported yet.

```bash
npm test
npm run build -- --configuration production
node tests/design/contraste.check.js
node tests/design/estilos.check.js
node tests/design/marca.check.js
node tests/design/nombre.check.js
node tests/ci/build-smoke.js
```

Desde la raíz del proyecto. Ninguno espera a una persona ni a un servicio externo.

## Pitfalls

- **Pisar un archivo que ha cambiado.** Las tareas que sustituyen un archivo entero empiezan con `git diff --quiet d788095 -- <archivo>`. Si sale distinto de 0, el archivo cambió después de diseñar el plan: para y avisa, no copies encima.
- **Creer que un aviso de build es un fallo.** Los avisos listados en *Stack* ya existían. Lo que cuenta es el código de salida.
- **`color="secondary"` sigue compilando.** No da error: simplemente pinta cian donde antes era rosa. Por eso las comprobaciones lo buscan.
- **`fill="outline"` no es un atributo en el DOM.** Angular lo pasa como propiedad; para estilos globales Ionic pone la clase `input-fill-outline` en el host (ya resuelto en `_ionic.scss`).

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
