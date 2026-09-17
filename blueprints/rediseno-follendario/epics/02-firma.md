# Epic 02: La firma: calendario, marcador y pestañas

> Existen las piezas propias de Follendario (calendario del logo, marcador de bloques, ticket, marca) y las pestañas Sumar, Amigos y el grupo ya las usan.

| | |
|---|---|
| **Epic id** | `02-firma` |
| **Tasks** | `E2-T1` … `E2-T6` |
| **Depends on** | `01-base` |
| **Unlocks** | `03-pantallas` |
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
src/app/components/friends-league/friends-league.component.ts
src/app/components/header/header.component.ts
src/app/components/ui/calendario-mes.component.spec.ts
src/app/components/ui/calendario-mes.component.ts
src/app/components/ui/marca.component.spec.ts
src/app/components/ui/marca.component.ts
src/app/components/ui/marcador.component.spec.ts
src/app/components/ui/marcador.component.ts
src/app/components/ui/ticket.component.spec.ts
src/app/components/ui/ticket.component.ts
src/app/core/ui.service.ts
src/app/pages/amigos/amigos.page.html
src/app/pages/amigos/amigos.page.scss
src/app/pages/amigos/amigos.page.ts
src/app/pages/group/add-members.modal.ts
src/app/pages/group/group.page.html
src/app/pages/group/group.page.scss
src/app/pages/group/group.page.ts
src/app/pages/sumar/sumar.page.html
src/app/pages/sumar/sumar.page.scss
src/app/pages/sumar/sumar.page.ts
src/app/shared/calendario.spec.ts
src/app/shared/calendario.ts
src/app/tabs/tabs.page.html
tests/design/amigos.check.js
tests/design/grupo.check.js
tests/design/pestanas.check.js
tests/design/sumar.check.js
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

**Produced** — lo que dependen las épicas siguientes:

| Export | Signature | Used by |
|---|---|---|
| `src/app/shared/calendario.ts` → `mesCalendario` | `(days: DayBuckets, mes: Date, hoy: Date) => MesCalendario` | Sumar, `03-pantallas` |
| `src/app/shared/calendario.ts` → `ultimosMeses` | `(days: DayBuckets, hoy: Date, cuantos: number) => MesCalendario[]` | `03-pantallas` (Estadísticas) |
| `CalendarioMesComponent` | `@Input() mes: MesCalendario; @Input() ultimoApunte: { tipo: "c" \| "s"; seq: number } \| null; @Input() discreto: boolean; @Output() diaElegido: EventEmitter<CeldaDia>` | Sumar, Estadísticas |
| `MarcaComponent` | `@Input() titulo: string` | Amigos, Estadísticas |
| `TicketComponent` | `@Input() grupo: string; @Input() semana: number; @Input() filas: { titulo: string; valor: string }[]; @Input() pie: string` | Grupo |

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

### `E2-T1` — Crear datos del calendario y el marcador

**Depends on:** `E1-T6` · **Priority:** p0 — metadato para recortes de alcance, no un orden

El calendario del logo se calcula en el dispositivo a partir de `stats.days`, que la app ya descarga: **cero lecturas nuevas de Firestore**. `mesCalendario()` devuelve un mes con semana empezando en lunes (hueco inicial), tipo de casilla (c, s, b o vacía), hoy, futuro y una etiqueta accesible («6 de septiembre: 2 veces»). El marcador es un componente de teclas que ruedan con `transform` y conserva la tecla de las unidades cuando aparece un dígito nuevo (99 → 100).

Ejecuta, en este orden, desde la raíz del repo:

```bash
mkdir -p src/app/components/ui
cp blueprints/rediseno-follendario/archivos/src/app/shared/calendario.ts src/app/shared/calendario.ts
cp blueprints/rediseno-follendario/archivos/src/app/shared/calendario.spec.ts src/app/shared/calendario.spec.ts
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/marcador.component.ts src/app/components/ui/marcador.component.ts
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/marcador.component.spec.ts src/app/components/ui/marcador.component.spec.ts
```

**Files**
- `src/app/shared/calendario.ts` — nuevo: mesCalendario() y ultimosMeses()
- `src/app/shared/calendario.spec.ts` — nuevo: 4 pruebas
- `src/app/components/ui/marcador.component.ts` — nuevo: <app-marcador>
- `src/app/components/ui/marcador.component.spec.ts` — nuevo: 3 pruebas

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `mesCalendario(days, new Date(2026, 8, 1), hoy)` is called THE SYSTEM SHALL return `hueco` 1 and 30 cells, because September 2026 starts on a Tuesday in a Monday-first week.
2. WHEN a day has companion and solo entries THE SYSTEM SHALL mark its cell `tipo` `b`, and days after `hoy` SHALL be `futuro` with the label `aún no ha llegado`.
3. WHEN `ultimosMeses(days, hoy, 6)` is called THE SYSTEM SHALL return 6 months, the current one first.
4. WHEN `<app-marcador>` renders `valor` 7 with `minDigitos` 3 THE SYSTEM SHALL draw three `.roll-tile` keys showing 0, 0 and 7 and an accessible label with the value.
5. WHEN `npm test` runs THE SYSTEM SHALL exit 0 with 0 failed specs.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T1: Crear datos del calendario y el marcador"
git tag step-07-calendario
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E2-T2` — Crear el calendario del mes y el ticket

**Depends on:** `E2-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`<app-calendario-mes>` pinta las casillas y, cuando recibe un `ultimoApunte` nuevo (su `seq` sube), deja caer un cubo en la casilla de hoy, estampa un sello (corazón rosa o destello cian; un círculo neutro en modo discreto) y lanza una onda. `<app-ticket>` imprime los títulos de la semana del grupo como un tique de caja, en mayúsculas y mono: es la pieza que al usuario le encantó de la dirección C.

Ejecuta, en este orden, desde la raíz del repo:

```bash
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/calendario-mes.component.ts src/app/components/ui/calendario-mes.component.ts
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/calendario-mes.component.spec.ts src/app/components/ui/calendario-mes.component.spec.ts
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/ticket.component.ts src/app/components/ui/ticket.component.ts
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/ticket.component.spec.ts src/app/components/ui/ticket.component.spec.ts
```

**Files**
- `src/app/components/ui/calendario-mes.component.ts` — nuevo: <app-calendario-mes>
- `src/app/components/ui/calendario-mes.component.spec.ts` — nuevo: 4 pruebas
- `src/app/components/ui/ticket.component.ts` — nuevo: <app-ticket>
- `src/app/components/ui/ticket.component.spec.ts` — nuevo: 2 pruebas

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `<app-calendario-mes>` renders a month THE SYSTEM SHALL draw one empty span per `hueco` and one `button.f-mcell` per day with the day type as class and the day label as `aria-label`.
2. WHEN `ultimoApunte` is set THE SYSTEM SHALL draw `.f-cellcube`, `.f-stamp` and `.f-ripple` only inside the cell marked `today`, with a neutral circle stamp when `discreto` is true.
3. WHEN a day cell is clicked THE SYSTEM SHALL emit that `CeldaDia` through `diaElegido` and mark the cell `sel`.
4. WHEN `<app-ticket>` renders rows THE SYSTEM SHALL print one `.f-tline` per row in upper case, the subtitle `grupo · sem N` in lower case, and omit `.foot` when `pie` is empty.
5. WHEN `npm test` runs THE SYSTEM SHALL exit 0 with 0 failed specs.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T2: Crear el calendario del mes y el ticket"
git tag step-08-calendario-mes
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E2-T3` — Rediseñar pestañas, cabecera y marca superior

**Depends on:** `E2-T2` · **Priority:** p0 — metadato para recortes de alcance, no un orden

La barra inferior conserva sus tres rutas y su orden, con Sumar convertida en la tecla rosa central (`.f-tab-key`) y el punto LED encima de la pestaña activa (ya en `_ionic.scss`). `<app-marca>` pone en la barra superior de las pestañas el símbolo y el nombre en mono; con «Nombre e icono neutros» cambia a un icono de notas y «notas». `<app-header>` (pantallas apiladas) queda con atrás accesible.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/app/tabs/tabs.page.html   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/components/header/header.component.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/marca.component.ts src/app/components/ui/marca.component.ts
cp blueprints/rediseno-follendario/archivos/src/app/components/ui/marca.component.spec.ts src/app/components/ui/marca.component.spec.ts
cp blueprints/rediseno-follendario/archivos/src/app/tabs/tabs.page.html src/app/tabs/tabs.page.html
cp blueprints/rediseno-follendario/archivos/src/app/components/header/header.component.ts src/app/components/header/header.component.ts
cp blueprints/rediseno-follendario/archivos/tests/design/pestanas.check.js tests/design/pestanas.check.js
```

**Files**
- `src/app/components/ui/marca.component.ts` — nuevo: <app-marca>
- `src/app/components/ui/marca.component.spec.ts` — nuevo: 3 pruebas
- `src/app/tabs/tabs.page.html` — sustituye: tecla rosa de Sumar
- `src/app/components/header/header.component.ts` — sustituye: botón atrás con aria-label
- `tests/design/pestanas.check.js` — nuevo

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/pestanas.check.js` runs THE SYSTEM SHALL find exactly three `ion-tab-button` (amigos, sumar, estadisticas with their `/tabs/…` hrefs) and the Sumar tab wrapped in `.f-tab-key`, and exit 0.
2. WHEN `<app-marca titulo="follendario">` renders without neutral name THE SYSTEM SHALL show `assets/follendario/simbolo.png` and the text `follendario` with `translate="no"`.
3. WHEN the discreet mode and neutral name are on THE SYSTEM SHALL render no image in `<app-marca>`, an svg notes icon, and `notas` instead of `follendario`.
4. WHEN `npm test` runs THE SYSTEM SHALL exit 0 with 0 failed specs.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/pestanas.check.js
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T3: Rediseñar pestañas, cabecera y marca superior"
git tag step-09-pestanas
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E2-T4` — Rediseñar Sumar con calendario y marcador

**Depends on:** `E2-T3` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Sumar es la firma: abres la app y en un segundo ves tu mes. Dentro del calendario del logo va el marcador (total grande y compañía/solitario), las casillas del mes y los objetivos; debajo, las dos teclas grandes. **Apuntar sigue siendo un toque**: `sumar()` pone `ultimoApunte` antes de escribir en Firestore, así el sello cae al instante, y el número llega por la escucha de `stats$` que ya existía. Al cruzar un objetivo se lanza `ui.celebrate()` además del aviso. El confeti usa la paleta nueva. No se añade ninguna lectura.

Ejecuta, en este orden, desde la raíz del repo:

```bash
git diff --quiet d788095 -- src/app/pages/sumar/sumar.page.html   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/pages/sumar/sumar.page.scss   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/pages/sumar/sumar.page.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
git diff --quiet d788095 -- src/app/core/ui.service.ts   # debe salir 0: si no, el archivo cambió después de diseñar el plan → para y avisa
cp blueprints/rediseno-follendario/archivos/src/app/pages/sumar/sumar.page.html src/app/pages/sumar/sumar.page.html
cp blueprints/rediseno-follendario/archivos/src/app/pages/sumar/sumar.page.scss src/app/pages/sumar/sumar.page.scss
cp blueprints/rediseno-follendario/archivos/src/app/pages/sumar/sumar.page.ts src/app/pages/sumar/sumar.page.ts
cp blueprints/rediseno-follendario/archivos/src/app/core/ui.service.ts src/app/core/ui.service.ts
cp blueprints/rediseno-follendario/archivos/tests/design/sumar.check.js tests/design/sumar.check.js
```

**Files**
- `src/app/pages/sumar/sumar.page.html` — sustituye
- `src/app/pages/sumar/sumar.page.scss` — sustituye
- `src/app/pages/sumar/sumar.page.ts` — sustituye: mes, semana, ultimoApunte, celebrate
- `src/app/core/ui.service.ts` — sustituye: colores del confeti
- `tests/design/sumar.check.js` — nuevo

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/sumar.check.js` runs THE SYSTEM SHALL find in `sumar.page.html` the `f-cal` calendar with rings, head and body, `<app-calendario-mes>`, three `<app-marcador>` and the keys `f-key pink f-key-big sumar-compania` and `f-key solo f-key-big sumar-solitario`, and exit 0.
2. WHEN Sumar renders THE SYSTEM SHALL keep a visible `.total` element (`<app-marcador class="su-tiles-big total" dato>`), the selector `tests/e2e/smoke.e2e.js` waits for.
3. WHEN a key is pressed THE SYSTEM SHALL assign `ultimoApunte` before awaiting `fapService.addFap`, as `sumar.check.js` asserts by source order.
4. WHEN a goal is crossed during the session THE SYSTEM SHALL call `this.ui.celebrate()` and show the goal toast.
5. WHEN `sumar.page.ts` is read THE SYSTEM SHALL build the month with `mesCalendario(stats.days, now, now)` and call no Firestore `getDoc`/`getDocs`.
6. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/sumar.check.js
npm test
npm run build -- --configuration production
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T4: Rediseñar Sumar con calendario y marcador"
git tag step-10-sumar
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E2-T5` — Rediseñar Amigos y la liga

**Depends on:** `E2-T4` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta la pestaña siguiendo el prototipo `diseno-follendario/diseno-final/src/screens-tabs.jsx` (funciones `Amigos`, líneas 136–227, y `Liga`, 111–134) y sus estilos `am-*` de `diseno-follendario/diseno-final/src/screens.css`, con la skill `portar-pantalla`. No cambies lógica ni observables de `amigos.page.ts`: solo importa `MarcaComponent`. Novedades y pullas pasan a consolas (`f-console` con cabecera `~/novedades` y `~/te-han-escrito`, filas `f-line`), los retos y duelos a `f-card`, las acciones a filas `f-row`, los contadores a `f-badge c/s/t`. Conserva **todas** las clases que usa el E2E y el marcador «mine – theirs».

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/amigos.check.js tests/design/amigos.check.js
```

Después haz esto:

1. Abre el prototipo en un navegador para verlo en marcha: `diseno-follendario/diseno-de-follendario.html` (teléfono «Amigos»).
2. Cabecera: `<ion-buttons slot="start"><app-marca titulo="amigos"></app-marca></ion-buttons>`, sin `ion-title`; el segmento Amigos/Grupos con `mode="ios"` y sin `color`, dentro de `ion-content`.
3. Acciones (añadir, invitar con enlace o QR, solicitudes) como `<ion-item button class="f-row …">` conservando `invitar-amigo` y `solicitudes-badge` (este último con `class="f-badge c solicitudes-badge"`).
4. Novedades y pullas: `<section class="f-console">` + `<div class="f-console-head"><span>~/novedades</span>…</div>` + una `<div class="f-line">` por evento (`glyph`, texto con `<b class="who">`, `when`). La pulla conserva `<span class="reaccion-texto">` y el botón `limpiar-reacciones` pasa a `fill="clear" class="f-ghost limpiar-reacciones"`.
5. Retos: `<div class="f-card am-duelo duelo-aviso">` con `class="f-key pink aceptar-reto"` y `class="f-ghost rechazar-reto"`. Duelos: `<div class="f-card am-duelo duelo-vivo">` con `class="am-marcador duelo-marcador mono"` en el contenedor del marcador y dentro, sin cambios, sus tres `span`: `{{ duelo.mine }}` (con `dato` y `[class.gano]`), `–` y `{{ duelo.theirs }}` (con `dato` y `[class.gano]`).
6. Separadores `ion-item-divider` → `<div class="f-section"><span class="f-label">amigos agregados</span></div>`. Cada amigo: `<ion-item class="f-row amigo" button …>`; insignias `ion-badge class="f-badge c|s|t"` sin `color`. Grupos igual con `class="f-row grupo"`. Crear grupo: `<ion-button expand="block" class="f-key pink" routerLink="/create-group">`.
7. Liga (`friends-league.component.ts`): contenedor `f-card`, cabecera `<span class="f-label">liga de amigos</span>`, segmento `mode="ios"`, posición en mono con dos cifras, deltas con `f-up`/`f-down`; sus estilos en línea solo con tokens `--f-*`.
8. `amigos.page.scss`: reescríbelo con las reglas `am-*` necesarias, solo tokens `--f-*`, sin hex y por debajo de 4 kB.
9. Textos pícaros del prototipo: «Invitar con enlace o QR», «¿Sin grupo con tu cuadrilla? Crea uno y que empiece el pique.», «no, gracias».

**Files**
- `src/app/pages/amigos/amigos.page.html` — edita
- `src/app/pages/amigos/amigos.page.scss` — reescribe
- `src/app/pages/amigos/amigos.page.ts` — edita: solo imports (MarcaComponent)
- `src/app/components/friends-league/friends-league.component.ts` — edita: plantilla y estilos
- `tests/design/amigos.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/amigos.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/amigos.check.js` runs THE SYSTEM SHALL find in `amigos.page.html` the E2E hooks `invitar-amigo`, `ion-searchbar`, `duelo-aviso`, `aceptar-reto`, `duelo-vivo`, `duelo-marcador`, `reaccion-texto`, `solicitudes-badge`, `<ion-item … class="… amigo">` and `<ion-item … class="… grupo">`, and exit 0.
2. WHEN a live duel renders THE SYSTEM SHALL print its score as `{{ duelo.mine }}`, then `–`, then `{{ duelo.theirs }}` inside `.duelo-marcador`, so the E2E reads `1 – 4`.
3. WHEN `amigos.page.html` is read THE SYSTEM SHALL use `<app-marca titulo="amigos">`, `mode="ios"`, `f-console` with `~/novedades` and `~/te-han-escrito`, `f-line`, `f-row`, `f-badge c`, `f-badge s`, `f-badge t`, `f-key pink` and `f-section`, and contain no `color="secondary"`, `color="tertiary"`, `color="warning"`, `color="light"`, `ion-item-divider` or `mode="md"`.
4. WHEN `amigos.page.scss` is read THE SYSTEM SHALL contain no hex colour and no `--ion-color-` reference, and weigh under 4000 bytes.
5. WHEN `friends-league.component.ts` is read THE SYSTEM SHALL use `f-card`, `f-label` and `mode="ios"`, keep `ver-liga`, `periodo-liga` and `dato`, and reference no `--ion-color-`.
6. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/amigos.check.js
npm test
npm run build -- --configuration production
node tests/ci/build-smoke.js
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T5: Rediseñar Amigos y la liga"
git tag step-11-amigos
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

### `E2-T6` — Rediseñar el grupo con el ticket de la semana

**Depends on:** `E2-T5` · **Priority:** p1 — metadato para recortes de alcance, no un orden

Porta la pantalla con el prototipo `diseno-follendario/diseno-final/src/screens-more.jsx` (función `Grupo`, líneas 18–115) y los estilos `gr-*` de `screens.css`, con la skill `portar-pantalla`. Los títulos de la semana pasan a `<app-ticket>`; los totales a tarjetas con `f-big`, `f-num-c` y `f-num-s`; el muro a consola `~/muro`; los miembros a filas `f-row` con insignias `f-badge` y medallas de posición en mono (fuera los SVG `assets/groups/1.svg…`). La lógica no cambia: en el .ts solo se importa `TicketComponent` y se añaden los helpers de presentación `filasTicket()` y `semana`.

Primero copia la comprobación de este paso (es la vara de medir; no la edites):

```bash
cp blueprints/rediseno-follendario/archivos/tests/design/grupo.check.js tests/design/grupo.check.js
```

Después haz esto:

1. Mira el teléfono «Grupo» en `diseno-follendario/diseno-de-follendario.html`.
2. Cabecera: símbolo del grupo (imagen o inicial en `gr-tile`), nombre `f-title`, miembros `f-lead`. Acciones: `<ion-button class="f-key neutral editar-grupo">`, `<ion-button class="f-btn compartir-semana">`, `salir-grupo` como `f-ghost danger`.
3. Temporada en `f-card` con `ver-palmares` como `f-ghost`. Objetivo del grupo en `f-card` con `f-label` y barra con tokens.
4. En `group.page.ts` añade `TicketComponent` a `imports`, un getter `semana = getISOWeek(new Date())` (date-fns) y `filasTicket(titles: Title[]): { titulo: string; valor: string }[]` que devuelva `{ titulo: t.title, valor: t.name + " · " + t.detail }`. Plantilla: `<app-ticket *ngIf="vm.titles.length" [grupo]="vm.group.name" [semana]="semana" [filas]="filasTicket(vm.titles)"></app-ticket>`.
5. Segmento `periodo-ranking` con `mode="ios"`. Totales: `<section class="f-card">` con `<span class="f-big total-grupo" dato>`, `<span class="f-mid f-num-c total-compania" dato>`, `<span class="f-mid f-num-s total-solitario" dato>` y las medias en texto pequeño (se eliminan `ion-text` y `contenedorNumeros`).
6. Muro: `f-console` con cabecera `~/muro` y `escribir-muro` (`f-ghost`), cada entrada `f-line`, `quitar-muro` conservado. Privacidad: `ion-item` dentro de `f-card privacidad-grupo`, con `toggle-privacidad-grupo`.
7. Miembros: `<ion-item class="f-row miembro" …>` dentro del mismo `ion-item-sliding` (conserva `hacer-admin` y `quitar-miembro`, sin `color="secondary"`: usa `color="medium"`), posición 1–3 en `gr-medal mono`, insignias `f-badge c` / `f-badge s`.
8. `add-members.modal.ts`: filas `f-row`, `confirmar-miembros` como `<ion-button expand="block" class="f-key pink confirmar-miembros">` en lugar del `ion-fab`.
9. `group.page.scss`: solo tokens `--f-*`, sin hex, por debajo de 4 kB.

**Files**
- `src/app/pages/group/group.page.html` — edita
- `src/app/pages/group/group.page.scss` — reescribe
- `src/app/pages/group/group.page.ts` — edita: TicketComponent, semana y filasTicket()
- `src/app/pages/group/add-members.modal.ts` — edita: plantilla
- `tests/design/grupo.check.js` — nuevo: cp blueprints/rediseno-follendario/archivos/tests/design/grupo.check.js

**Acceptance**

Copiado literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un comando de abajo, en esta máquina, durante el build.

1. WHEN `node tests/design/grupo.check.js` runs THE SYSTEM SHALL find in `group.page.html` the hooks `editar-grupo`, `salir-grupo`, `compartir-semana`, `ver-palmares`, `periodo-ranking`, `total-grupo`, `total-compania`, `total-solitario`, `escribir-muro`, `quitar-muro`, `toggle-privacidad-grupo`, `hacer-admin`, `quitar-miembro` and `<ion-item … class="… miembro">`, and exit 0.
2. WHEN the group renders its weekly titles THE SYSTEM SHALL use `<app-ticket>` fed by `filasTicket()` declared in `group.page.ts` next to `TicketComponent`.
3. WHEN `group.page.html` is read THE SYSTEM SHALL use `f-console` with `~/muro`, `f-row`, `f-badge c`, `f-badge s`, `f-big`, `f-num-c`, `f-num-s`, `mode="ios"` and `f-key neutral`, and contain no `<ion-text`, `contenedorNumeros`, `assets/groups/1.svg` or old `color="secondary|tertiary|warning|light"` attributes.
4. WHEN `group.page.scss` is read THE SYSTEM SHALL contain no hex colour and no `--ion-color-` reference, and weigh under 4000 bytes.
5. WHEN `add-members.modal.ts` is read THE SYSTEM SHALL keep `confirmar-miembros`, use `f-row`, and contain no old colour attributes.
6. WHEN `npm test` and the production build run THE SYSTEM SHALL both exit 0.

**Verify** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale con 0 cuando la tarea está bien; la tarea está hecha cuando sale con 0 el último.

```bash
node tests/design/grupo.check.js
npm test
npm run build -- --configuration production
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T6: Rediseñar el grupo con el ticket de la semana"
git tag step-12-grupo
```

Ejecuta los dos después de que el último comando de Verify salga con 0 y antes de empezar la siguiente tarea. La etiqueta es el punto de vuelta atrás: si la siguiente tarea sale mal, `git reset --hard` a esta etiqueta en vez de depurar hacia delante. Copia la etiqueta del campo `checkpoint`, no la inventes.

---

## Epic acceptance

La épica está hecha cuando todas sus tareas están `done` **y**:

1. **WHEN** `npm test` runs after `E2-T6` **THE SYSTEM SHALL** exit 0 with the specs of `calendario`, `marcador`, `calendario-mes`, `ticket` and `marca` passing.
2. **WHEN** the design checks of steps 9–12 run after the production build **THE SYSTEM SHALL** each exit 0, so Sumar, Amigos and Grupo keep every E2E hook.

```bash
npm test
npm run build -- --configuration production
node tests/design/pestanas.check.js
node tests/design/sumar.check.js
node tests/design/amigos.check.js
node tests/design/grupo.check.js
node tests/ci/build-smoke.js
```

Desde la raíz del proyecto. Ninguno espera a una persona ni a un servicio externo.

## Pitfalls

- **Pisar un archivo que ha cambiado.** Las tareas que sustituyen un archivo entero empiezan con `git diff --quiet d788095 -- <archivo>`. Si sale distinto de 0, el archivo cambió después de diseñar el plan: para y avisa, no copies encima.
- **Creer que un aviso de build es un fallo.** Los avisos listados en *Stack* ya existían. Lo que cuenta es el código de salida.
- **`color="secondary"` sigue compilando.** No da error: simplemente pinta cian donde antes era rosa. Por eso las comprobaciones lo buscan.
- **`fill="outline"` no es un atributo en el DOM.** Angular lo pasa como propiedad; para estilos globales Ionic pone la clase `input-fill-outline` en el host (ya resuelto en `_ionic.scss`).
- **Sumar sin `.total`.** El E2E de humo espera un `.total` visible en `/tabs/sumar`: es la clase del marcador grande. No la quites.
- **El marcador del duelo.** El E2E lee `1 – 4` (con guion largo y espacios). Mantén `{{ duelo.mine }}`, `–` y `{{ duelo.theirs }}` en ese orden dentro de `.duelo-marcador`.
- **Emojis como iconos.** Los emojis de sección (⚔️, 🔥…) pasan a `ion-icon` de contorno; los que vienen de datos (pullas, logros, novedades) se quedan: son contenido.

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
