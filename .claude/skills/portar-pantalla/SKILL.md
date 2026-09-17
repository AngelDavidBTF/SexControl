---
name: portar-pantalla
description: Porta una pantalla o modal de Follendario al diseño aprobado cambiando solo plantilla y estilos. Úsala cuando una tarea diga «porta», «rediseña» una página o componente, o cite screens-tabs.jsx / screens-more.jsx del prototipo.
---

# Portar una pantalla al diseño de Follendario

## When to use
- Una tarea de `blueprints/rediseno-follendario/epics/` pide rediseñar una página o modal que no tiene archivo literal en `archivos/`.
- Hay que pasar marcado Ionic viejo (`ion-text color=…`, `ion-item-divider`, `.tarjeta`) al lenguaje de Follendario.

## Steps
1. Copia primero la comprobación de la tarea (`cp blueprints/rediseno-follendario/archivos/tests/design/<x>.check.js tests/design/`) y léela: es la lista exacta de lo que debe quedar y lo que no.
2. Abre la pantalla en `diseno-follendario/diseno-de-follendario.html` y su función en `diseno-follendario/diseno-final/src/screens-*.jsx` (las líneas vienen en la tarea). Copia estructura y clases, nunca el JavaScript de React.
3. Anota los ganchos que ya tiene la plantilla (clases, `*ngIf`, `(click)`, `[dato]`, `trackBy`) y consérvalos todos.
4. Sustituye según esta tabla:

| Antes | Después |
|---|---|
| `<ion-title>` en una pestaña | `<ion-buttons slot="start"><app-marca titulo="…"></app-marca></ion-buttons>` (importa `MarcaComponent`) |
| `ion-segment mode="md" color="…"` | `ion-segment mode="ios"` sin `color` |
| `ion-item-divider` / `h3.seccion` | `<div class="f-section"><span class="f-label">…</span></div>` |
| `.tarjeta` / bloque con fondo | `<section class="f-card">` |
| `ion-item button` de lista | `<ion-item button class="f-row …">` |
| número grande de compañía / solitario | `<span class="f-mid f-num-c" dato>` / `f-num-s`; total `f-big` |
| `ion-badge color="secondary"` (compañía) | `<ion-badge class="f-badge c" dato>` |
| `ion-badge color="primary"` (solitario) | `f-badge s`; total `f-badge t` |
| acción principal | `<ion-button class="f-key pink">` (cian si es de solitario o pulla: `f-key solo`) |
| acción secundaria | `<ion-button class="f-btn">` |
| acción discreta o destructiva | `<ion-button fill="clear" class="f-ghost">` / `f-ghost danger` |
| lista de eventos (novedades, pullas, muro) | `f-console` > `f-console-head` (`~/nombre`) + `f-line` (`glyph`, `<b class="who">`, `when`) |
| `ion-input` con `ion-label position="floating"` | `<ion-input fill="outline" label="…" labelPlacement="stacked">` |
| emoji como icono de sección | `ion-icon` de contorno (los emojis que vienen de datos se quedan) |
| `ion-spinner color="danger"` | `ion-spinner` sin color |
| `ion-fab` de confirmar | `<ion-button expand="block" class="f-key pink …">` al final |

5. Reescribe el `.scss` de la página solo con tokens `--f-*` y reglas con el prefijo del prototipo (`am-`, `gr-`, `es-`…). Nada de hex ni `--ion-color-*`; < 4 kB.
6. En el `.ts` toca solo `imports` y, si la tarea lo pide, helpers de presentación. Nunca servicios ni observables.

## Verify
```bash
node tests/design/<x>.check.js                    # expect: exit 0
npm test                                          # expect: exit 0
npm run build -- --configuration production       # expect: exit 0
```

## Do not
- No borres ni renombres una clase que use un E2E o la comprobación.
- No edites la comprobación para que pase.
- No añadas lecturas de Firestore ni cambies la lógica «de paso».
- No uses `color="secondary"`: ahora es cian, no rosa.
