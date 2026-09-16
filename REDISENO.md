# Rediseño visual de SexControl — especificación para revisión

> Documento autocontenido para un revisor externo que **no tiene acceso al repositorio**.
> Describe el estado actual, el diagnóstico, la dirección de diseño propuesta y el plan de
> ejecución. Fecha: 16 de septiembre de 2026.

---

## 1. Qué es la aplicación

SexControl es una app personal de recuento con una capa social competitiva. El usuario apunta
cada encuentro clasificándolo en **compañía** o **solitario**; la app guarda la marca de tiempo y,
opcionalmente, valoración (1–5 estrellas), etiquetas y una nota. A partir de ahí construye
estadísticas (rachas, récords, reparto por día de la semana y franja horaria, mapa de calor,
logros) y una capa social: amigos, grupos, una liga ordenable por semana/mes/total, duelos
("quien más sume esta semana"), pullas y un muro de grupo.

Tiene además un **modo discreto**: la app puede renombrarse a un nombre neutro, difuminar los
números y bloquearse con un PIN de 4 cifras.

### Stack

| Pieza | Versión / detalle |
|---|---|
| Framework | Angular 19 (standalone components, señales en partes, RxJS en otras) |
| UI kit | Ionic 8 (`@ionic/angular`), iconos `ionicons` 7 |
| Backend | Firebase / Firestore vía `@angular/fire` 19 |
| Empaquetado | PWA con service worker (`@angular/service-worker`) + Capacitor 6 (Android/iOS) |
| Estilos | SCSS; `src/theme/variables.scss` (variables CSS de Ionic) + `src/global.scss` |
| Tests | Karma/Jasmine unitarios, tests de reglas de Firestore, E2E con Playwright |

### Navegación

Tres pestañas inferiores: **Amigos**, **Sumar** (pestaña de entrada), **Estadísticas**.
Fuera de las pestañas: ajustes, añadir amigo, solicitudes, crear grupo, detalle de grupo,
login/registro/recuperar contraseña/verificar email, y dos rutas de invitación (enlace y QR).

---

## 2. Diagnóstico del diseño actual

### 2.1 No hay sistema de diseño; hay dos lenguajes visuales

Conviven dos estilos sin relación:

- **Estadísticas** y **Ajustes** ya usan un sistema de tarjetas razonable: clase `.tarjeta`,
  `border-radius: 16px`, `padding: 16px`, `margin: 12px 16px`,
  `box-shadow: 0 1px 3px rgba(0,0,0,.06)`, encabezados `h3` de 15px/600.
- **Sumar** y **Amigos** son listas `ion-item` crudas de plantilla Ionic, sin tarjetas.

Además el token de la tarjeta (`--tarjeta-fondo`) está **redefinido localmente dentro de cada
página**, no en el tema global. No hay una sola fuente de verdad.

### 2.2 Bugs de color verificables

En `src/theme/variables.scss`:

```scss
--ion-color-primary: #6fc8f1;
--ion-color-primary-rgb: 66,140,255;      /* ← no corresponde a #6fc8f1 */

--ion-color-secondary: #fc445f;
--ion-color-secondary-rgb: 61, 194, 255;  /* ← es el cian de la plantilla de Ionic */
```

Consecuencia real: cualquier regla que use `rgba(var(--ion-color-primary-rgb), .1)` —patrón
interno de varios componentes de Ionic para estados hover/activo y rellenos— pinta **azul**, no
el cian de marca. Lo mismo con secondary.

### 2.3 Contraste por debajo del mínimo WCAG

Los dos botones principales de la pantalla de Sumar son color de marca con texto blanco:

| Combinación | Ratio | AA texto normal (4,5:1) | AA texto grande / componentes (3:1) |
|---|---|---|---|
| Blanco sobre `#6fc8f1` (solitario) | **1,87:1** | ✗ | ✗ |
| Blanco sobre `#fc445f` (compañía) | **3,42:1** | ✗ | ✓ |

El botón "En solitario" es prácticamente ilegible en exteriores.

### 2.4 Tipografía inexistente

No hay una sola declaración `font-family` en todo el código de la app: hereda el stack del
sistema operativo (Roboto en Android, SF en iOS, lo que toque en escritorio). No hay escala:
los tamaños en uso son `50px`, `40px`, `34px`, `30px`, `28px`, `26px`, `22px`, `20px`, `17px`,
`15px`, `13px`, `12px`, `11px`, `10px`, `0.95rem`, `0.85rem`, `0.75rem`. Mezcla de `px` y `rem`
sin criterio.

### 2.5 Espaciado por números mágicos

Ejemplos literales del código actual:

```scss
.contenedorTotal { margin-top: -30px; margin-bottom: -10px; }
.letras          { margin-bottom: -10px; margin-top: 10px; }
ion-spinner      { margin-left: 38%; margin-right: 50%; margin-top: 80px; }  /* centrado a ojo */
ion-img          { left: 50%; transform: translateX(-50%); padding-left: 38px; }
.letrasTotal     { margin: 10px 23px -10px; }
```

### 2.6 La pantalla principal es la más débil

`Sumar` es la razón de existir de la app —un gesto, un botón— y hoy contiene, en este orden:
un saludo en `<h5>`, un logo SVG de 190px de alto, dos números en un flexbox, un tercer número
(total) subido con margen negativo, barras de objetivo, y **cuatro botones apilados dentro de un
`ion-grid`**:

1. "En compañía" (secondary, relleno)
2. "En solitario" (primary, relleno)
3. "Añadir una olvidada" (outline, medium)
4. "Borrar último" (tertiary, relleno)

El cuarto es una acción destructiva con el mismo peso visual que la acción principal, y además
es redundante: el servicio de UI ya muestra un toast con "Deshacer" tras sumar.

### 2.7 Pantallas de entrada sin identidad

`login.page.html` usa `<ion-item>` como contenedor de layout para meter una imagen, y
`<ion-label position="floating">`, patrón obsoleto desde Ionic 7 (lo sustituye
`<ion-input label labelPlacement="floating">`). No hay ninguna marca más allá del logo.

### 2.8 Movimiento prácticamente ausente

En toda la app: un `@keyframes` (el temblor del PIN erróneo) y tres `transition`. Es un producto
de rachas, duelos, récords, medallas y ligas —un juego— y se siente como un formulario.

### 2.9 Modo oscuro de plantilla

`variables.scss` contiene el bloque de modo oscuro por defecto de `ionic start`, con los colores
de marca copiados sin adaptar. El modo discreto es un `filter: blur(9px)` sobre los números.

### 2.10 Emoji como sistema de iconos

Logros, rachas, curiosidades, duelos, medallas y avisos usan emoji (`🔥 ⭐ 🎯 ⚔️ 🥇 🙈 📊 🥷 🛡️`).
Renderizan distinto en cada plataforma, no se pueden recolorear y desentonan con cualquier
dirección visual seria.

---

## 3. Dirección propuesta

### 3.1 Concepto: "marcador de bolsillo"

No un panel de bienestar ni un dashboard SaaS. El objeto central del producto es **un número que
solo sube**, compartido con una liga de amigos. Así que el número deja de ser un dato dentro de
una tarjeta y pasa a ser la composición de la pantalla.

Decisión con base de uso, no estética: **el modo oscuro pasa a ser el modo primario**. Esta app
se abre de noche, en privado. El modo claro existe y está resuelto, pero el oscuro es el que se
diseña primero.

### 3.2 Color — seis tokens base

| Token | Valor | Papel |
|---|---|---|
| `ink` | `#171320` | Fondo en oscuro. Ciruela‑tinta, no un negro tintado tipo `#111` |
| `surface` | `#221C2E` | Tarjetas sobre oscuro |
| `paper` | `#F4F3F7` | Fondo en claro. Frío con matiz violeta, deliberadamente **no** crema |
| `compania` | `#FF4F6B` | Coral de marca, corregido |
| `solitario` | `#4FB6E8` | Cian de marca, oscurecido para funcionar también sobre `paper` |
| `racha` | `#FFD84D` | Ámbar. Exclusivo de rachas, récords, objetivos y logros |

Derivados: `surface-2 #2C2439` (elevación y separadores), `text #F2EFF7`, `text-muted #9A93AB`,
`text-dim #6B6480`; en claro `text #171320`, `text-muted #6B6480`, `border #E2DFE9`.

Dos colores semánticos más, para los deltas de la liga y de los periodos: `sube #7BE8A4` y
`baja #FF8095`. Y dos superficies tintadas de dato en oscuro, para los azulejos de Sumar y las
cápsulas de la lista de amigos: `#251A24` (compañía) y `#1B2330` (solitario).

**Variantes de texto** (los colores de dato no tienen suficiente contraste como texto sobre
`paper`, así que el sistema define un par para cada uno):

| Uso | Oscuro | Claro |
|---|---|---|
| Número/texto "compañía" | `#FF6E85` | `#D62F4C` (4,81:1 sobre blanco) |
| Número/texto "solitario" | `#6EC4F0` | `#0E7BAE` (4,73:1 sobre blanco) |
| Texto "racha" | `#FFD84D` | `#8A6A00` |

### 3.3 La regla que arregla el contraste

**Se prohíbe el texto blanco sobre color de marca.** Coral, cian y ámbar pasan a ser colores de
*dato* (barras, insignias, gráficas, rellenos) y de *texto sobre fondo oscuro*. Todo botón
relleno de color lleva la etiqueta en `ink`:

| Combinación | Ratio |
|---|---|
| `ink #171320` sobre `compania #FF4F6B` | **5,79:1** ✓ |
| `ink #171320` sobre `solitario #4FB6E8` | **8,01:1** ✓ |

La misma regla en ambos modos, así los dos botones de Sumar se reconocen igual de noche que de
día.

### 3.4 Tipografía — dos familias con papeles distintos

- **Display y todo número: Bricolage Grotesque** (variable, con `opsz`). Se usa para el total
  gigante, los títulos de pantalla y cualquier cifra. Va con `font-variant-numeric: tabular-nums`
  para que el número no baile al incrementar, y `letter-spacing` negativo en los tamaños grandes
  (−0,045em a 88px, −0,03em a 32px).
- **Texto y UI: Instrument Sans** (400/500/600).

Ninguna de las dos es Inter, Roboto ni Arial. Ambas están en Google Fonts y se **autoalojan
subseteadas en woff2**: la PWA tiene service worker y no puede depender de una petición externa
para pintar texto sin conexión.

**Escala fija** (sustituye a los 17 tamaños actuales):

```
88  display     — el total en Sumar
52  hero        — el total del periodo en Estadísticas
32  título      — cifras de tarjeta
28  pantalla    — "Amigos", "Estadísticas"
22  —
17  subtítulo / etiqueta de botón
15  cuerpo
13  secundario
11  pestañas y pies
```

### 3.5 Forma y ritmo

- Radios: `12` (chips), `14` (píldoras de segmento), `16` (filas de lista), `20` (tarjetas), `22` (botones grandes).
- Espaciado: `4 · 8 · 12 · 16 · 20 · 22 · 26`. Margen lateral de página: `20`.
- Altura mínima de zona pulsable: `44`, incluidos los segmentos de periodo (píldora de 36 más
  4 de relleno arriba y abajo). Botones principales de Sumar: `64`.
- Sin `margin` negativo en ninguna parte.

### 3.6 Iconos

Se retiran los emoji de la interfaz funcional y se sustituyen por **SVG de trazo, rejilla de 24,
grosor 1,7** (1,9 en estado activo), una sola familia visual: personas, más‑en‑círculo, barras,
llama, estrella, reloj, diana, ojo tachado y persona‑en‑círculo (la ruta se llama «Perfil y
ajustes», así que el acceso no es un engranaje). Los emoji pueden quedarse en contenido
generado por el usuario (notas), no en la interfaz.

---

## 4. Especificación por pantalla

### 4.1 Sumar (pantalla de entrada)

```
┌───────────────────────────────┐
│  Ángel                     ⚙  │   nombre 15/500 muted · engranaje 24
│                               │
│         1 4 7                 │   Bricolage 88/800, tracking −0,045em
│         ▁▁▁▁ ▁▁▁▁▁▁           │   regla de 3px partida 62/85 en coral/cian
│         en total              │   13/500 muted
│                               │
│   ┌───────────┬───────────┐   │   dos azulejos, radio 4/4/20/20,
│   │    62     │    85     │   │   borde superior de 2px en su color
│   │ compañía  │ solitario │   │   cifra 32/700 en la variante de texto
│   └───────────┴───────────┘   │
│                               │
│   Objetivo de la semana  4/6  │   barra de 6px, relleno ámbar
│   ▓▓▓▓▓▓▓▓░░░░                │
│                               │
│            (espacio)          │
│                               │
│   ╭─────────────────────────╮ │   64px, radio 22, coral, etiqueta ink
│   │   +   En compañía       │ │
│   ╰─────────────────────────╯ │
│   ╭─────────────────────────╮ │   64px, radio 22, cian, etiqueta ink
│   │   +   En solitario      │ │
│   ╰─────────────────────────╯ │
│                               │
│     Añadir una olvidada       │   enlace de texto subrayado, 15/500
├───────────────────────────────┤
│   Amigos    Sumar    Stats    │
└───────────────────────────────┘
```

**Cambios de comportamiento, no solo de piel:**

1. "Borrar último" **desaparece como botón**. Deshacer vive en el toast que ya aparece tras
   sumar; borrar un registro cualquiera vive en el historial de Estadísticas (ya existe, con
   deslizamiento lateral). Hoy hay tres formas de borrar y la más prominente es la peor.
2. Los dos botones de sumar se mueven al **tercio inferior**, dentro del arco del pulgar, y
   pasan de altura por defecto de Ionic a 64px.
3. Desaparece el logo de 190px: la marca es el número.
4. El saludo "Hola, {nombre}, este es tu resumen general" se reduce a el nombre a secas.

### 4.2 Amigos

- Cabecera con el título de pantalla (28/800) y el engranaje.
- Segmento Amigos / Grupos como píldora sobre `surface`, no el `ion-segment` de Material.
- **Aviso de duelo** como tarjeta coral a sangre con la etiqueta en `ink` y el marcador en una
  cápsula oscura; el número que va ganando en verde.
- **Liga de amigos** como tarjeta: puesto, avatar de 30px, nombre, delta (▲/▼ en verde/coral),
  valor en Bricolage 17/700 alineado a la derecha. La fila propia se marca con fondo
  `surface-2` y radio 12, no con un color de acento.
- **Lista de amigos** en filas‑tarjeta de radio 16 sobre `surface`, con las insignias de
  compañía/solitario como cápsulas tintadas. Quien comparte solo el total muestra una cápsula
  neutra; quien no comparte nada, un icono de ojo tachado (hoy es el emoji 🙈).
- "Añadir" pasa de ser un `ion-item` de lista a una acción en la cabecera de la sección.

### 4.3 Estadísticas

La estructura actual es buena; se reconstruye sobre los tokens y se ajusta la jerarquía.

- Selector de periodo como píldora de 4–5 opciones (hoy es un `ion-segment` que se aprieta a
  390px con `min-width: 0` y `font-size: 13px` como parche).
- Navegación del periodo con chevrones SVG; el chevron deshabilitado usa `surface-2`, no opacidad.
- **Tarjeta de resumen**: total en 52/800, "veces" y "N días activos" a su lado, delta contra el
  periodo anterior alineado a la derecha en verde/coral, y debajo la barra de reparto
  compañía/cian con leyenda.
- **Evolución**: barras apiladas (coral abajo, cian arriba), radio 5 arriba y abajo del tramo
  correspondiente, con etiquetas de rango debajo.
- **Rachas**: tres columnas con icono SVG en ámbar, cifra 26/700 y etiqueta de 11px.
- **Resumen anual compartible** como fila de acción sobre `surface-2`.
- Logros, etiquetas, valoración, mapa de calor e historial mantienen su sitio, recoloreados y con
  los emoji sustituidos por SVG.

### 4.4 Pantallas de entrada y bloqueo

Login, registro, recuperar contraseña y verificar email se reconstruyen sobre el mismo sistema:
fondo `ink`, campos `ion-input` con `fill="outline"` y `labelPlacement="stacked"` (se retira el
patrón obsoleto de `ion-label position="floating"`), botón primario con la regla de contraste, y
el logo a un tamaño razonable. La pantalla de bloqueo del PIN usa la misma tipografía y el mismo
teclado, con los puntos en `racha` cuando aciertan y en `compania` cuando fallan.

### 4.5 Modo discreto

Hoy es `filter: blur(9px)`. Pasa a ser **una segunda piel**: intercambia el set de tokens por uno
gris neutro (sin coral ni cian), usa el nombre e icono neutros que ya existen en el código,
desactiva la celebración y presenta las pantallas como una app de notas. El objetivo es que
alguien mirando por encima del hombro no vea una app borrosa —que llama la atención— sino otra
app.

---

## 5. Movimiento

La audacia se gasta en un solo sitio: **el incremento**.

| Momento | Tratamiento |
|---|---|
| Sumar | El total rueda dígito a dígito con un muelle (~320 ms), el azulejo correspondiente da un latido de escala 1→1,04→1, y salta el confeti que ya existe en el código |
| Pulsación | Escala 0,97 con `transition` de 120 ms en los botones de 64px |
| Barras de Estadísticas | Entrada de altura escalonada, 40 ms de retardo entre barras |
| Cambio de pestaña | Se mantiene la transición nativa de Ionic |
| Todo lo demás | Quieto |

Sin entradas fade‑and‑slide por sección ni transiciones de hover en cada tarjeta.
Se respeta `prefers-reduced-motion`: sin rodillo, sin latido, sin confeti.

---

## 6. Plan de ejecución

| Fase | Contenido | Ficheros principales | Riesgo |
|---|---|---|---|
| **1. Fundamentos** | `_tokens.scss` nuevo (color, tipografía, espaciado, radios, sombras). Corrección de los `-rgb` desalineados y del contraste. Fuentes autoalojadas. Primitivas globales `.card`, `.tile`, `.stack`, `.pill`. Modo oscuro reconstruido sobre tokens | `theme/variables.scss`, `global.scss`, `theme/_tokens.scss` | Bajo |
| **2. Sumar** | La pantalla de 4.1 completa, incluida la retirada del botón "Borrar último" | `pages/sumar/*` | Medio |
| **3. Amigos y Grupo** | Sustitución de las listas `ion-item` por tarjetas; liga, duelos y muro reconstruidos | `pages/amigos/*`, `pages/group/*`, `components/friends-league/*` | Medio |
| **4. Estadísticas** | Re‑skin sobre tokens; gráficas recoloreadas; emoji → SVG | `pages/estadisticas/*`, `components/stats/*` | Bajo |
| **5. Entrada** | Login, registro, recuperar, verificar email, pantalla de bloqueo | `pages/login/*`, `pages/register/*`, `pages/forgot-password/*`, `pages/verify-email/*`, `components/lock-screen/*` | Bajo |
| **6. Movimiento y pulido móvil** | Rodillo del número, feedback de pulsación, `env(safe-area-inset-*)`, `-webkit-tap-highlight-color: transparent`, tamaño de fuente ≥16px en inputs para evitar el zoom de iOS | transversal | Bajo |

### Restricciones que no se negocian

1. **Los tests E2E seleccionan por clases del marcado.** Playwright usa, entre otros:
   `.amigo`, `.miembro`, `.duelo-aviso`, `.duelo-marcador`, `.duelo-vivo`, `.invitar-amigo`,
   `.aceptar-reto`, `.reaccion-texto`, `.editar-grupo`, `.entrar-grupo`, `.enlace`, `.qr`,
   `.total`, `.accion-duelo`, `.accion-pulla`. Todas se conservan aunque cambie el CSS y el
   marcado alrededor. `npm run test:all` (unitarios + build de producción + reglas + E2E) debe
   seguir en verde al final de cada fase.
2. **Coste cero en Firebase.** El proyecto se mantiene deliberadamente en el plan gratuito. El
   rediseño es exclusivamente de cliente: ni una lectura ni una escritura nueva en Firestore, ni
   un campo nuevo en ningún documento.
3. **El modo discreto no puede perder capacidades.** Nombre neutro, bloqueo con PIN y ocultación
   de números siguen funcionando igual o mejor.

---

## 7. Preguntas abiertas para el revisor

1. **¿Es correcto hacer del oscuro el modo primario?** El argumento es de contexto de uso
   (nocturno, privado). El contraargumento es que el ajuste actual respeta la preferencia del
   sistema y la mayoría de usuarios de móvil siguen en claro.
2. **Bricolage Grotesque en display.** Tiene carácter, pero es una tipografía con personalidad
   marcada. ¿Aguanta bien a 88px en un número de tres cifras, y a 28px en un título de pantalla?
   ¿Hay un riesgo de que envejezca mal?
3. **Retirar "Borrar último" de Sumar.** Se apoya en que el toast de deshacer ya existe y en que
   el historial permite borrar cualquier registro. ¿Se pierde algo para el usuario que suma por
   error y descarta el toast?
4. **Coral y cian como los dos ejes de dato.** Son los colores del logo actual y codifican
   compañía/solitario en toda la app. ¿Es un problema que además sean los dos colores de acción?
   ¿Habría que introducir un tercer color neutro para acciones que no son "sumar"?
5. **El peso de la fase 2 y 3.** Reescriben plantillas completas, no solo hojas de estilo. ¿Merece
   la pena, o hay un camino intermedio que arregle el contraste y la tipografía sin tocar el
   marcado?
6. **Emoji fuera de la interfaz.** Los logros con emoji tienen un tono simpático que encaja con
   un producto lúdico. Sustituirlos por SVG monocromos gana coherencia pero puede perder
   carácter. ¿Compensa?
