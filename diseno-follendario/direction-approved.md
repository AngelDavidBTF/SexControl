# Dirección aprobada · Follendario

**Fecha:** 17 de septiembre de 2026

## Qué se mostró

Tres direcciones interactivas (`design-demos/A-marcador.html`, `B-fiesta.html`, `C-calendario-vivo.html`;
capturas en `design-demos/capturas/lamina-A|B|C.png`; página conjunta `tres-follendarios.html`, publicada en
https://claude.ai/artifact/SMghhLA8WJepEJ6AwoRg3W):

- **A · Marcador** — ruleta, estilo nº 16 Terminal-Core Soft-Futurism.
- **B · Fiesta** — referente real, Partiful.
- **C · Calendario vivo** — mejor estudio, Collins.

## Elección del dueño (palabras literales)

> «Me gusta la verdad el que más el diseño a pero también el C podríamos combinar cosas? De momento solo quiero
> darle un cambio al diseño al aspecto, funcionalmente no lo vamos a tocar de momento, cuando el aspecto visual
> esté renovado, montamos el plan para montar tambien las nuevas funcionalidades, pero todavía no»

## Mezcla confirmada (respuestas del dueño a la pregunta de qué traer de C)

- De C, elementos grandes: **modo claro papel crema** (el oscuro es el de A), **berenjena para «solitario»**
  (sustituye al cian), **calendario con casillas** (el mapa de actividad de Estadísticas).
- De C, detalles: **cabecera de calendario** (rosa con anillas) y **sello al apuntar** (además del cubo de A).
- Textos: **nombre Follendario y tono pícaro**, sin cambiar botones ni acciones.
- No elegidos de C (se queda lo de A): nombre que crece en la clasificación, titulares Bricolage, sellos de
  títulos semanales (se queda el ticket).

## Consecuencias

- **Base: A**, con los elementos de **C** de arriba.
- **Alcance cambiado: solo aspecto visual.** Se mantienen las pantallas, la navegación actual (Amigos · Sumar ·
  Estadísticas + páginas sueltas) y todas las funciones tal cual. Queda aparcado para una fase posterior: inicio
  mixto, nueva barra de pestañas, fusión de amigos y grupos, notificaciones push y funciones nuevas.
- El diseño completo se hace sobre las pantallas reales del código, no sobre la estructura propuesta en los
  prototipos.

## Ajuste tras ver la mezcla (palabras del dueño, 17-09-2026)

> «C = identidad: calendario, concepto de Follendario, estructura visual y sensación de marca. A =
> personalidad/interacción: marcador, números dinámicos, bloques, microanimaciones y sensación de
> "juego". Paleta: fuera el cyan de A; que encaje con el rosa/berenjena del logo. UX: mantener el apuntar
> en 1 toque. El rediseño no debe convertirlo en una app más lenta. Social: que siga pareciendo una app
> para echarse unas risas con amigos, no una app de salud. Discreto: importantísimo; que desde fuera no
> sea evidente qué aplicación es. De hecho, el calendario + el marcador pueden convertirse en la firma
> visual de Follendario: que abras la app y en 1 segundo sepas que estás viendo tu historial, mientras que
> las animaciones le dan ese punto de juego. Y quiero un azulito cian como antes para el solitario»

Aplicado en `diseno-de-follendario.html` (versión 2 publicada):

- Sumar = tarjeta-calendario del logo (papel crema, cabecera rosa, anillas, casillas rosa polvo) con el
  marcador de dígitos en bloques que ruedan; al apuntar cae un cubo en la casilla de hoy y recibe el sello.
  Sustituye a la semana en cubos.
- Solitario = cian de siempre (`#6FC8F1`) solo como color de dato; el cian no se usa como acento de interfaz.
  Rosa y berenjena/ciruela siguen siendo la marca.
- Modo discreto con piel propia (grises neutros, «notas», sin símbolo ni corazón, textos que no delatan,
  números difuminados, sin confeti).
- Rename: solo lo visible. Formato del documento: bundle de architect.
