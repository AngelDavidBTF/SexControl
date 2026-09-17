# Spec común de las tres direcciones · Follendario

> Entrada única para las tres direcciones. Cada una se construye solo desde este documento y
> `brand-spec.md`, sin mirar las otras. Fecha: 17 de septiembre de 2026.

## Qué es

Follendario (antes SexControl) es una PWA en español (Angular 19 + Ionic 8 + Firebase) para apuntar con un
toque cada vez que uno tiene sexo **en compañía** o **en solitario**, ver cómo va y competir en broma con
grupos de amigos. Ya existe: objetivos semanales y mensuales, rachas, estadísticas con mapa de calor,
19 logros, amigos con liga, duelos («quién suma más esta semana» o carrera a N), 12 pullas predefinidas,
grupos de hasta 200 con clasificación, temporadas mensuales con campeón, títulos semanales (MVP de la
semana, Remontada, El más constante, Desaparecido, Farolillo rojo), objetivo colectivo, muro con mensajes
predefinidos y eventos automáticos (adelantamientos, rachas, campeón), invitación por enlace y QR, y modo
discreto (números ocultos, nombre neutro, PIN).

## Público y contexto

Cuadrillas españolas de 20 a 35 años: el grupo del pueblo, el de la uni, las del piso. Se abre de noche,
en la cama o en el sofá, con una mano, a menudo con alguien cerca. Se comparte en el WhatsApp del grupo.
El objetivo del dueño: que muchos grupos de amigos la usen **para echarse unas risas**.

## Decisiones del dueño (no se discuten en las direcciones)

1. **Inicio mixto**: arriba, apuntar y «lo que llevas»; debajo, lo que pasa en tus grupos.
2. **Apuntar tiene que seguir siendo facilísimo**: un gesto desde el inicio, sin formularios.
3. **Tono pícaro con doble sentido**, negable. Nada de explícito en la interfaz.
4. **Misma línea de marca en color**: rosa del logo como protagonista, crema, ciruela; continuidad con el
   coral y el cian de SexControl.
5. Muy llamativa y con animaciones bonitas donde aporten.

## Estructura propuesta (común a las tres, cada una la dibuja a su manera)

Barra inferior: **Inicio · Grupos · (+ Apuntar) · Calendario · Tú**.
- *Inicio*: apuntar + tu semana + actividad de tus grupos y duelos.
- *Grupos*: tus grupos y amigos (la liga de amigos pasa a ser un «grupo» más: «Tus amigos»).
- *+*: apuntar desde cualquier pantalla.
- *Calendario*: las estadísticas actuales, con el calendario como vista principal (encaja con el nombre).
- *Tú*: perfil, logros, ajustes, modo discreto.

Los prototipos de dirección muestran **dos pantallas**: Inicio (interactiva, con la animación de apuntar)
y la ficha de un grupo. La barra de pestañas cambia entre ambas; las demás pestañas quedan visibles pero
no navegan todavía.

## Contenido real para los prototipos (el mismo en las tres)

- Usuario: **Álex**. Jueves 17 de septiembre de 2026, 23:41. Semana 38 (lun 14 – dom 20).
- Esta semana: **3** (2 en compañía, 1 en solitario). Semana pasada: 2. Racha: 2 días. Mes: 9.
  Objetivo semanal: 3 de 4. Total histórico: 147.
- Por día: lun 14 → 1 compañía · mar 15 → nada · mié 16 → 1 solitario · jue 17 (hoy) → 1 compañía ·
  vie–dom aún por llegar.
- Grupos: **Los del Pueblo** (7 miembros), **Piso Lavapiés** (4), **Las de la Uni** (5).
- Clasificación semanal de Los del Pueblo: Marcos 5 · **Álex 3** · Lucía 3 · Javi 2 · Nerea 1 · Irene 1 ·
  Sergio 0.
- Títulos de la semana: MVP de la semana → Marcos (5 esta semana); El más constante → Lucía (4 días
  seguidos); Desaparecido → Sergio (9 días sin aparecer); Farolillo rojo → Sergio (sin estrenar esta semana).
- Temporada: «Septiembre 2026», quedan 13 días. Objetivo colectivo del grupo: 40, van 27.
- Actividad: «Marcos te ha adelantado esta semana» (hace 2 h) · «Lucía lleva 4 días de racha» ·
  Nerea a Sergio: «👴 ¿Te has jubilado o qué?» · Duelo con Javi, quién suma más esta semana: 3–2, quedan
  3 días.
- Pullas disponibles (textos reales): «¿Te has jubilado o qué?», «Semana floja, ¿eh?», «Te estoy
  adelantando 😏», «Te como el polvo», «¿Sigues vivo?», «Voy a por ti», «Descansa, que te va a dar algo».

## Microcopia pícara (propuesta, reutilizable)

- Botones: «En compañía» / «En solitario» (se mantienen: son la semántica de los datos).
- Titular de apuntar: «¿Qué ha caído?» · tras apuntar: «¡Apuntado! Llevas 4 esta semana» y, si alcanza a
  alguien, «Empatas con Marcos. Ojo.».
- Sequía: «Sergio lleva 9 días de sequía».
- Objetivo: «Te falta 1 para cumplir». Cumplido: «Semana cumplida. Descansa (si puedes)».

## Salida y formato

- Un HTML autocontenido por dirección en `design-demos/`, React 18.3.1 + Babel en línea, marco de iPhone
  de `ios_frame.jsx` (393×852), dos teléfonos en paralelo que pasan a columna en pantallas estrechas y se
  escalan para caber en un móvil (visible también desde el teléfono del dueño).
- Scripts solo desde `cdn.jsdelivr.net/npm/`, fuentes de Google Fonts, imágenes en base64 (símbolo y
  logotipo recortados).
- Captura de 1440×1000 de cada una en `design-demos/capturas/`.

## Límites

- Accesibilidad mínima: cuerpo ≥ 14 px, etiquetas ≥ 12 px (salvo pestañas 11 px), contraste de cuerpo
  ≥ 4,5:1, zonas pulsables ≥ 44 px.
- Animaciones solo con `transform` y `opacity`; respeto de `prefers-reduced-motion`.
- El modo discreto no se dibuja en los prototipos, pero ninguna dirección puede depender de algo que el modo
  discreto no pueda ocultar.
- Nada que exija lecturas o escrituras nuevas en Firestore para pintarse: todo sale de datos que la app ya
  tiene en memoria.

## Tres lógicas

1. **Ruleta** (segundo 55 → estilo web nº 16): *Terminal-Core Soft-Futurism*. Monoespaciada protagonista,
   bento, cubos isométricos, crema sobre carbón, brillo contenido.
2. **Referente real**: **Partiful**, mejor app de Google Play 2024 (TechCrunch, 18-11-2024). App de
   invitaciones para grupos de amigos; carteles con tema, efectos a pantalla completa, emoji como reacción,
   tono joven y coloquial.
3. **Mejor estudio**: **Collins** (Brian Collins): identidades vivas, tipografía expresiva a gran escala,
   bloques de color y movimiento como parte de la marca.
