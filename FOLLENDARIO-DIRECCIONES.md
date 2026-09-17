# Follendario: tres direcciones de rediseño (para revisión)

> **Para el revisor (ChatGPT):** documento autocontenido; no tienes acceso al código ni a los prototipos.
> Lo ha escrito Claude el 17 de septiembre de 2026 tras leer el repositorio, los informes previos
> (`INFORME-PRODUCTO.md`, `REDISENO.md`) y los dos logos nuevos. Es la fase de **elegir dirección visual**:
> todavía no hay diseño completo ni plan de implementación. Lo marcado **[verificado]** está comprobado;
> lo marcado **[estimación]** no.
>
> **Lo que se te pide:** (1) opinar qué dirección encaja mejor con el objetivo, (2) señalar riesgos de cada una,
> (3) responder a las preguntas del final.

---

## 1. Contexto

- **La app:** antes SexControl, ahora **Follendario** (follar + calendario). PWA en español (Angular 19 +
  Ionic 8 + Firebase/Firestore, Capacitor para móvil). Sirve para apuntar con un toque cada vez que uno tiene
  sexo **en compañía** o **en solitario**, ver estadísticas y competir en broma con amigos y grupos.
- **Ya existe [verificado]:** objetivos, rachas, estadísticas con mapa de calor, 19 logros, amigos con liga,
  duelos, 12 pullas predefinidas, grupos de hasta 200 personas con clasificación, temporadas mensuales, títulos
  semanales (MVP, Remontada, El más constante, Desaparecido, Farolillo rojo), objetivo colectivo, muro con
  mensajes predefinidos, invitación por enlace y QR, y modo discreto (números ocultos, nombre neutro, PIN).
- **Objetivo del dueño:** que muchos grupos de amigos la usen «para echarse unas risas». Quiere un aspecto
  totalmente renovado y muy llamativo, con animaciones bonitas, manteniendo más o menos la línea de color.
- **Restricción de coste:** Firebase gratis o casi. Quiere notificaciones push, pero con coste 0 o muy bajo
  (necesitan Cloud Functions, que exigen el plan Blaze; Blaze mantiene la cuota gratuita).

### Decisiones ya tomadas por el dueño

1. **Inicio mixto:** arriba apuntar y «lo que llevas»; debajo, lo que pasa en tus grupos.
2. **Tono pícaro con doble sentido**, que se pueda disimular. Nada explícito en la interfaz.
3. **Alcance total:** estética, estructura y flujos, siempre con apuntar facilísimo.

### El logo nuevo [verificado, colores medidos sobre los PNG]

Un calendario con cabecera rosa, anillas crema y una casilla con corazón, más una berenjena morada; debajo, el
nombre en una sans redondeada muy gruesa, «Follen» en crema y «dario» en rosa. Fondo ciruela casi negro.

| Color | Hex |
|---|---|
| Ciruela noche (fondo) | `#10081A` |
| Rosa Follendario | `#FC2A6C` |
| Crema papel | `#FCF3ED` |
| Berenjena | `#681581` |
| Rosa polvo (casillas) | `#E2C5C9` |
| Hoja | `#52BD76` |

La marca anterior usaba coral `#FC445F` (compañía) y cian `#6FC8F1` (solitario). El cian no aparece en el logo
nuevo.

---

## 2. Estructura común propuesta (las tres direcciones la comparten)

Barra inferior: **Inicio · Grupos · (+ Apuntar) · Calendario · Tú**.

- **Inicio:** apuntar, tu semana y la actividad de tus grupos (adelantamientos, rachas, pullas, duelos).
- **Grupos:** grupos y amigos juntos (la liga de amigos pasa a ser un grupo más).
- **+:** apuntar desde cualquier pantalla.
- **Calendario:** las estadísticas actuales, con el calendario como vista principal.
- **Tú:** perfil, logros, ajustes y modo discreto.

Cada dirección se prototipó con dos pantallas que funcionan (inicio y ficha de un grupo), con contenido real de
la app: textos de pullas, títulos semanales y eventos del muro.

---

## 3. Las tres direcciones

Se generaron con tres lógicas distintas para no caer en lo de siempre.

### A · Marcador (lógica: estilo sorteado, «Terminal-Core Soft-Futurism»)

- **Idea:** la app como marcador de bolsillo. Fondo ciruela, texto crema, tipografía monoespaciada (Geist Mono)
  como protagonista, bloques tipo bento.
- **Apuntar:** dos teclas grandes con volumen (rosa = compañía, cian = solitario) que se hunden al pulsar.
- **Animación estrella:** cada vez que apuntas cae un **cubo isométrico** sobre el día de hoy; la semana es una
  fila de pilas de cubos. El número rueda dígito a dígito. La actividad de los grupos se lee como una
  **consola** que escribe sola («tú +1 en compañía → empatas con marcos. ojo.»).
- **Grupo:** clasificación en tabla con barras de bloques y los títulos de la semana impresos como un **ticket
  de caja** que sale al entrar.
- **Fuerte:** muy distinta, con personalidad, apunta en un toque, legible de noche.
- **Riesgo:** estética «techie» que puede sentirse fría o de nicho para un público general; conserva el cian,
  que el logo nuevo no tiene.

### B · Fiesta (lógica: referente real, Partiful, mejor app de Google Play 2024)

- **Idea:** cada grupo es un cartel de fiesta. Tarjetas de colores planos del logo, pegatinas giradas, emoji
  como reacción, tipografía redondeada (Fredoka, la más parecida al logotipo).
- **Apuntar:** un botón «Apuntar uno» que abre una hoja con dos opciones grandes. Son **dos toques** en vez de uno.
- **Animación estrella:** al apuntar cae una **lluvia de corazones, berenjenas y chispas**; la pegatina del
  objetivo se vuelve verde y se sacude al cumplirlo.
- **Grupo:** cartel del grupo con el logo, **podio** que se reordena con animación, títulos como pegatinas y un
  muro tipo chat con pullas.
- **Fuerte:** la más «de grupo de amigos» y la más viral; encaja con el tono y con la berenjena del logo.
- **Riesgo:** mucho emoji y color puede cansar a la larga; apuntar pasa de uno a dos toques; la lluvia debe
  desactivarse en modo discreto.

### C · Calendario vivo (lógica: el mejor estudio para el encargo, Collins)

- **Idea:** el nombre manda: la pantalla principal es **el calendario del logo en grande** (cabecera rosa con
  anillas, casillas). Fondo crema claro: es la única dirección clara. Tipografía estrecha y muy gruesa
  (Bricolage Grotesque) para titulares.
- **Apuntar:** barra doble fija abajo, «+ Compañía» (rosa) y «+ Solitario» (berenjena). Un toque.
- **Animación estrella:** el día de hoy recibe un **sello de tinta** (corazón o chispa) con onda expansiva; si
  hay de los dos tipos, la casilla queda partida en diagonal rosa y berenjena.
- **Grupo:** clasificación **tipográfica**: el nombre de cada persona es más grande cuanto más lleva; los títulos
  de la semana son sellos («MVP», «Constante», «Farolillo rojo»).
- **Fuerte:** la más coherente con el nombre y el logo; muy reconocible; sustituye el cian por la berenjena.
- **Riesgo:** fondo claro para una app que se usa mucho de noche (habría que diseñar el modo oscuro igual de
  bien); el calendario mensual ocupa mucho y empuja la actividad de los grupos hacia abajo.

---

## 4. Lo que se mantiene en cualquier dirección

- Coste Firebase: el rediseño visual no añade lecturas ni escrituras. [verificado en los prototipos: todo sale de
  datos que la app ya carga]
- Modo discreto: nombre neutro, PIN y números ocultos siguen igual o mejor.
- Accesibilidad: contraste de texto ≥ 4,5:1, zonas táctiles ≥ 44 px, respeto de «reducir movimiento».
- Los tests E2E actuales se apoyan en clases del HTML; la implementación tendrá que conservarlas o actualizarlas.

---

## 5. Próximos pasos (cuando el dueño elija)

1. Diseño completo de todas las pantallas en la dirección elegida (incluidas bienvenida, invitación sin
   registro, login, calendario y estadísticas, perfil, modo discreto, modo claro u oscuro).
2. Auditoría del diseño con las pautas de interfaz de Vercel (Web Interface Guidelines).
3. Documento de implementación paso a paso con criterios de aceptación, pensado para que lo ejecute un modelo
   menos avanzado.
4. Plan de notificaciones push de coste casi cero con Cloud Functions solo para eventos poco frecuentes.
   [estimación, a verificar con los precios actuales de Firebase]

---

## 6. Preguntas para el revisor

1. Para grupos de amigos de 20 a 35 años en España, ¿qué dirección tiene más opciones de engancharles y de que
   la compartan: A, B o C? ¿Por qué?
2. ¿Merece la pena que apuntar cueste dos toques (B) a cambio de una hoja con más gracia, o apuntar debe ser
   siempre un toque?
3. ¿Mantener el cian heredado (A) o pasar a rosa y berenjena, que son los colores del logo nuevo (B y C)?
4. C es clara por defecto. ¿Es un problema para una app que se abre sobre todo de noche?
5. ¿Qué mezcla harías? Por ejemplo, el calendario de C con la celebración de B.
6. ¿Ves algún riesgo con las tiendas de apps o con la imagen de marca en el tono pícaro (berenjena, «¿Qué ha
   caído?», «días de sequía»)?
