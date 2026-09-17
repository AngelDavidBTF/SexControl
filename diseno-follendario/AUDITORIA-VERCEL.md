# Auditoría del diseño · Vercel Web Interface Guidelines

> Reglas descargadas el 17-09-2026 de
> `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` (skill
> `web-design-guidelines`). Revisados: `diseno-final/src/*.jsx` y `diseno-final/src/*.css`.
>
> Estado de cada hallazgo:
> - **[corregido]** ya arreglado en el prototipo (las líneas son las de después del arreglo).
> - **[implementación]** no se ve en el prototipo, pero la app real tiene que hacerlo (va en
>   `IMPLEMENTACION.md`).
> - **[fase de funciones]** cambia comportamiento; queda anotado para después, como pidió el dueño.
> - **[no aplica]** regla revisada y descartada, con el motivo.

## diseno-final/src/components.jsx

components.jsx:210 - buscador sin nombre accesible (solo placeholder) → `aria-label`, `name`, `spellCheck={false}` [corregido]
components.jsx:69 - fondo del modal es un `<div onClick>` → `aria-hidden`; en Ionic el cierre con Escape y el foco atrapado los da `ion-modal` [corregido]
components.jsx:11 - `<img>` del símbolo sin `width`/`height`; «follendario» sin `translate="no"` [corregido]

## diseno-final/src/screens-tabs.jsx

screens-tabs.jsx:159,180 - placeholders sin `…` [corregido]
screens-tabs.jsx:73 - texto en primera persona «Se me olvidó apuntar una» → «¿Se te olvidó apuntar una?» [corregido]
screens-tabs.jsx:252 - meses del calendario solo accesibles deslizando → flechas anterior/siguiente [corregido]
screens-tabs.jsx:74 - «borrar la última» borra sin confirmar ni deshacer (así funciona hoy la app) → aviso con «Deshacer» [fase de funciones]
screens-tabs.jsx:299 - periodo de Estadísticas no está en la URL [fase de funciones]
screens-tabs.jsx:116 - segmento Amigos/Grupos no está en la URL [fase de funciones]
screens-tabs.jsx:396 - en la app real el historial solo se borra deslizando (`ion-item-sliding`) → botón «Borrar» dentro de Detalles [fase de funciones]

## diseno-final/src/screens-more.jsx

screens-more.jsx:191,195 - placeholders sin `…`; campos sin `name`/`autocomplete` [corregido]
screens-more.jsx:325-327,441 - `<img>` sin dimensiones; logotipo sin `translate="no"` [corregido]
screens-more.jsx:330 - email sin `name`, `inputmode`, `spellCheck={false}` [corregido]
screens-more.jsx:252 - nombre sin `name`/`autocomplete="nickname"` [corregido]
screens-more.jsx:363,393 - marca «Follendario» sin `translate="no"` [corregido]
screens-more.jsx:377 - primera persona «he olvidado el PIN» → «¿has olvidado el PIN?» [corregido]
screens-more.jsx:255 - «Guardar perfil» desactivado hasta que cambias algo (así funciona hoy); la regla pide dejarlo activo hasta enviar [fase de funciones]

## diseno-final/src/base.css

base.css:121 - `outline: none` en `.f-input:focus` → anillo en `:focus-visible` [corregido]
base.css:125 - `outline: none` en el input del buscador sin sustituto → `:focus-within` en el contenedor [corregido]
base.css:6 - falta `touch-action: manipulation` [corregido]
base.css:25,212 - falta `overscroll-behavior: contain` en contenido desplazable y carrusel [corregido]
base.css:175 - transición de `height` (layout) en la pila de cubos → quitada [corregido]
base.css:274 - aviso heredaba `pointer-events: none` de la capa: «Deshacer» y «Detalles» no se podían pulsar (encontrado en la prueba de clics) [corregido]
base.css:287 - sin estados `:hover` para ratón → bloque `@media (hover: hover) and (pointer: fine)` [corregido]
base.css:28 - títulos largos sin corte → `overflow-wrap: anywhere` [corregido]

## diseno-final/src/screens.css

screens.css:14,68 - transición de `flex-grow` (layout) en barras de reparto → quitada [corregido]
screens.css:185 - `<select>` nativo sin `color` explícito (modo oscuro en Windows) [corregido]
screens.css:190 - bucle infinito decorativo del logo en Login → 2 repeticiones; parado con movimiento reducido [corregido]
screens.css:112 - hijo flex sin `min-width: 0` en la cabecera del grupo [corregido]

## Para la implementación en Ionic (no visible en el prototipo)

index.html - `<meta name="theme-color">` fijo en `#fc445f` → debe seguir al tema: `#10081A` oscuro, `#F4E6DE` claro [implementación]
index.html - `color-scheme` en `<html>` según tema [implementación]
global.scss - fuentes Geist y Geist Mono autoalojadas (woff2) con `font-display: swap` y `preload` de las dos más usadas; la PWA debe pintar sin conexión [implementación]
tabs / toasts - márgenes con `env(safe-area-inset-bottom)` en barra de pestañas y avisos [implementación]
fechas y números - seguir usando `date-fns` con `es` y `toLocaleString('es-ES')`; nada de fechas escritas a mano [implementación]
lock-screen - estado de error anunciado con `aria-live="assertive"` [implementación]

## No aplica

- Title Case en títulos y botones: en español se escribe en mayúscula solo la primera palabra (RAE). Se
  mantiene. Las teclas principales van en versalitas por estilo (mono en mayúsculas), no por esta regla.
- Enlace para saltar al contenido: la app es una shell de Ionic con pestañas, sin cabecera de navegación
  larga que saltar.
- Virtualizar listas de más de 50 elementos: el calendario tiene unas 180 casillas en 6 meses, pero son
  rejillas cortas y fuera de pantalla; `content-visibility: auto` en cada mes basta si hiciera falta.
- `autoFocus`: no se usa en ningún sitio.
