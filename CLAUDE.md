# Follendario — rediseño visual

App de amigos para llevar la cuenta de las veces (en compañía o en solitario), picarse en grupos y ver tu historial como un calendario. Antes se llamaba SexControl. Este repo está en mitad de un **rediseño solo visual**: mismas pantallas, rutas y funciones, aspecto nuevo.

**Plan de trabajo:** `blueprints/rediseno-follendario/` — `tasks.json` dice qué toca, `epics/*.md` cómo hacerlo. No muevas esa carpeta: sus comandos se ejecutan desde esta raíz.

## Comandos

| Tarea | Comando |
|---|---|
| Pruebas unitarias (Karma, Chrome headless) | `npm test` |
| Build de producción → `www/` | `npm run build -- --configuration production` |
| Humo de la build (login visible, sin errores JS) | `node tests/ci/build-smoke.js` |
| Comprobaciones del diseño | `node tests/design/<nombre>.check.js` |
| Iconos de la app desde el símbolo | `node scripts/iconos-follendario.js` |
| Reglas de Firestore / E2E contra el proyecto real | `npm run test:rules` / `npm run test:e2e` — **no** los lances: necesitan secretos y los ejecuta el usuario |

No hay linter ni formateador; `.editorconfig`: 2 espacios, comillas simples en TypeScript, salto de línea final. Shell: bash.

Avisos de build que ya existían y no son fallos: presupuesto inicial (~1,2 MB), `estadisticas.page.scss` > 4 kB (hasta el paso 13), `qrcode` no ESM, deprecaciones de Sass por `@import`.

## Dominios y Hosting

Dos sitios de Firebase Hosting en el mismo proyecto: `app` → `www/` (sitio `sexcontrol-6c000`, dominio `app.follendario.com`) y `landing` → `landing/` (sitio `follendario-web`, dominios `follendario.com`; `www` y `.es` redirigen ahí). La landing es HTML estático sin Firebase SDK y comparte cuota de transferencia con la app: mantenla ligera. Si añades un dominio de la app, súmalo a `APP_HOSTS` en `app.config.ts` o el login con Google falla en Safari.

## Stack

Angular 19.2 standalone (`CommonModule`, `*ngIf`/`*ngFor`) · Ionic 8.8 · Capacitor 6.2 · Firebase 11.10 (Firestore + App Check) · date-fns 4 (`es`) · SCSS · Karma/Jasmine · Playwright para scripts.

## Cómo encaja el diseño

- `src/styles.scss` importa, en este orden: `theme/fonts` (Geist) → `theme/tokens` (`--f-*` en `body`) → `theme/variables.scss` (paleta de Ionic apuntando a los tokens) → `global.scss` (Ionic CSS + `theme/ionic`, `theme/componentes`, `theme/movimiento`).
- `SettingsService` pone en `body` las clases `dark`, `discreto` (piel gris), `discreto-numeros` (números difuminados) y `neutro` (nombre «Notas»). Los tokens cambian por esas clases; las pantallas no preguntan el tema.
- Piezas propias en `src/app/components/ui/`: `app-marcador`, `app-calendario-mes`, `app-ticket`, `app-marca`. Datos del calendario en `src/app/shared/calendario.ts`, calculados con `stats.days` ya descargado.
- El diseño aprobado se abre en `diseno-follendario/diseno-de-follendario.html`; su código por pantalla está en `diseno-follendario/diseno-final/src/`.

## Paleta (tokens, no literales)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--f-bg` | `#f4e6de` papel crema | `#10081a` ciruela | fondo |
| `--f-pink` | `#fc2a6c` | `#fc2a6c` | compañía, acción principal |
| `--f-solo` | `#6fc8f1` | `#6fc8f1` | solitario |
| `--f-pink-text` / `--f-solo-text` | `#c8124f` / `#0a6c9b` | `#ff5c8d` / `#6fc8f1` | texto rosa o cian legible |
| `--f-text` / `--f-muted` | `#10081a` / `#6e5e78` | `#fcf3ed` / `#a597b3` | texto |

Ionic: `primary` = rosa, `secondary` = cian. **Es al revés que en la app vieja.**

## Reglas

1. **Solo aspecto.** No cambies lógica, servicios, rutas ni datos. Ninguna lectura o escritura nueva de Firestore (plan gratuito). No cambies `appId`, claves `sexcontrol.*` de localStorage, ni proyecto de Firebase. Dominios: la app en `app.follendario.com` (y sigue en `sexcontrol-6c000.web.app`), la landing en `follendario.com`.
2. **No uses `color="secondary"`, `"tertiary"`, `"warning"` ni `"light"` en plantillas.** Usa `f-key pink|solo|neutral`, `f-btn`, `f-ghost`, `f-badge c|s|t`, `f-num-c|s`. Permitidos: `primary`, `medium`, `danger`.
3. **Conserva los ganchos E2E:** `ion-input[type="email"|"password"]`, `ion-button[color="primary"]` con texto `Entrar`, `.total` en Sumar, `ion-searchbar` en Amigos, `ion-item.amigo`, `.accion-duelo`, `.accion-pulla`, `.duelo-aviso`, `.aceptar-reto`, `.duelo-vivo .duelo-marcador` (lee `1 – 4`), `.reaccion-texto`, `.invitar-amigo`, `.qr img`, `.enlace code`, primer `ion-button` de la cabecera del modal de invitación (cierra), `.editar-grupo`, `.entrar-grupo`, `.miembro`; y los textos «Invitar con enlace», «Quién suma más esta semana», «Semana floja».
4. **Estilos solo con tokens `--f-*`**: sin hexadecimales ni `--ion-color-*` en `.scss` de páginas ni estilos en línea. Cada `.scss` de página < 4 kB; lo común va en `src/theme/_componentes.scss`.
5. **Animación:** solo `transform`/`opacity`, < 300 ms en interfaz, todo desactivado con `prefers-reduced-motion`.
6. **Modo discreto es prioritario:** números con `dato`; etiquetas «con alguien / por mi cuenta»; con nombre neutro nunca se ve el símbolo ni «Follendario».
7. **Segmentos `mode="ios"`, campos `fill="outline"` con `label`, filas `ion-item class="f-row"`.**
8. **Tono:** pícaro con doble sentido, segunda persona, para reírse con amigos; nunca de app de salud.
9. **Git:** un commit por tarea (`E1-T1: …`) y su etiqueta `step-NN-slug`. Nunca `git push`, `firebase deploy` ni reescribir historia: publicar lo hace el usuario.
10. **Archivos de `blueprints/rediseno-follendario/archivos/` se copian tal cual** (skill `aplicar-archivo-literal`). Las pantallas sin archivo literal se portan con la skill `portar-pantalla` y su comprobación `tests/design/*.check.js` no se edita.
