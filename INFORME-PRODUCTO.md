# SexControl — informe de producto, seguridad y crecimiento

> **Para el revisor (ChatGPT):** este documento es autocontenido; no tienes acceso al código.
> Lo ha escrito Claude tras leer el repositorio completo (≈9.200 líneas: modelos, servicios,
> páginas, reglas de Firestore y tests) y ponerse en la piel de un usuario real. Todos los
> hallazgos marcados como **[verificado]** están comprobados en el código o en las reglas; las
> ideas y estimaciones están marcadas como tales.
>
> **Lo que se te pide:** (1) cuestionar el diagnóstico y las prioridades, (2) señalar ideas que
> falten o que sobren, (3) detectar riesgos que no se hayan visto, (4) responder a las preguntas
> abiertas de la sección 10. Hay un documento previo, `REDISENO.md`, sobre el rediseño visual;
> ese trabajo está **aparcado** por decisión del dueño y no es objeto de esta revisión.
>
> Fecha: 16 de septiembre de 2026. Mercado inicial: España, en español.

---

## 1. Qué es la app hoy

**SexControl** es una app (PWA + Android/iOS con Capacitor) para apuntar cada relación sexual
o masturbación con un toque, clasificada en **"en compañía"** o **"en solitario"**, y competir
con amigos. Objetivo del dueño: **convertirla en una red social y que se haga viral.**

### Funcionalidades existentes

| Área | Qué hay |
|---|---|
| **Sumar** (pestaña de entrada) | Dos botones (compañía / solitario), "Añadir una olvidada" con fecha y hora pasadas, "Borrar último", totales, objetivos semanal y mensual con barra de progreso. Tras sumar sale 5 s un aviso con "Deshacer" y "Detalles". |
| **Detalles de un registro** | Valoración 1–5, hasta 10 etiquetas (sugeridas: pareja, rollo, casa, viaje, hotel, fin de semana), nota privada de 280 caracteres. Solo accesibles desde ese aviso de 5 s o desde el historial. |
| **Estadísticas** | Periodos semana/mes/año/siempre/rango; total, días activos, delta vs periodo anterior, reparto compañía/solitario, evolución, rachas (actual, mejor, días desde el último), curiosidades, mapa de calor de 6 meses, por día de la semana y franja horaria, valoración media, etiquetas, 19 logros, historial paginado con borrado, tarjeta-imagen "Tu año" para compartir. |
| **Amigos** | Búsqueda por prefijo de nombre o email (mín. 3 letras), solicitudes, invitación por enlace y QR, privacidad por amigo (todo / solo el total / nada), pausa global, liga semanal/mensual/total con flechas de subida y bajada, ficha "tú vs él", **duelos** (quién suma más esta semana, o carrera a 3/5/10), **pullas** (12 mensajes predefinidos, sin texto libre), reacciones con emoji, "novedades desde tu última visita". |
| **Grupos** | Hasta 200 miembros, dueño + hasta 10 co-administradores, invitación por enlace/QR, clasificación total/mes/semana, totales y medias, **temporadas mensuales** con campeón y palmarés, **títulos semanales** (MVP, Remontada, El más constante, Desaparecido, Farolillo rojo), objetivo colectivo, **muro** (solo mensajes predefinidos y eventos automáticos: adelantamientos, rachas, campeón), tarjeta-imagen "Compartir semana", privacidad por grupo. |
| **Ajustes** | Perfil con foto, objetivos, pausa de compartición, recordatorio local "llevas N días sin apuntar", **modo discreto** (números difuminados, nombre "Notas" en la pestaña del navegador, bloqueo con PIN de 4 cifras), tema claro/oscuro, instalar PWA, cerrar sesión, borrar cuenta. |

### Arquitectura relevante para las decisiones

- **Sin backend propio.** Todo es cliente + Firestore + Firebase Auth. No hay Cloud Functions.
- **Restricción económica del dueño:** mantenerse en la capa gratuita de Firebase (Spark:
  50.000 lecturas, 20.000 escrituras y 20.000 borrados al día) mientras no haya muchos usuarios.
  Todo el modelo de datos está desnormalizado para ahorrar lecturas:
  - `faps/{id}`: cada registro (solo lo lee su dueño).
  - `fapStats/{uid}`: totales y recuentos por día/hora/etiqueta/valoración en un único documento.
  - `social/{uid}`: **un único documento** con amigos (y sus totales), solicitudes, pullas,
    duelos, privacidad.
  - `groups/{id}`: incluye los totales de todos los miembros dentro del documento.
- **Propagación en escritura ("fan-out"):** al sumar, el propio cliente escribe sus totales en
  el documento `social` de **cada amigo** y en **cada grupo** al que pertenece. Las reglas solo
  le dejan tocar su propia entrada.
- Toda la lógica social (liga, duelos, títulos, temporadas, logros, novedades) se calcula en el
  dispositivo con datos ya cargados.
- Tests: unitarios, pruebas de reglas de Firestore, E2E con Playwright contra el proyecto real.

---

## 2. Hallazgos urgentes: seguridad y privacidad [verificado]

Para una app que guarda datos sobre la vida sexual de las personas, estos puntos van **antes**
que cualquier crecimiento. Una filtración aquí no es un incidente técnico: es el fin del
producto.

### 2.1 Cualquier usuario registrado puede descargar la lista completa de usuarios con sus emails

Regla actual:

```
match /users/{uid} {
  allow read: if isSignedIn();
```

`read` incluye `list`. La colección `users/` guarda `email`, `emailLower`, `displayName`,
`photoURL`. Cualquiera con una cuenta puede listar la colección entera desde la consola del
navegador y obtener **quién usa una app de seguimiento sexual, con nombre y email**.

**Corrección propuesta:** `allow get` (no `list`) o sacar el email del documento público; hacer
la búsqueda por coincidencia exacta de un identificador (alias único o hash del email), no por
prefijo; y añadir un ajuste "no aparecer en búsquedas".

### 2.2 Cualquier usuario registrado puede entrar en cualquier grupo que tenga invitación activa

Regla actual:

```
match /groupInvites/{code} {
  allow read: if isSignedIn();
```

El **id del documento es el código secreto** de la invitación. Con `list` permitido, cualquiera
lista todos los códigos, crea su marca en `groupInvites/{code}/joins/{uid}` y se añade al grupo
(la regla `isJoinWithInvite` solo exige esa marca). Una vez dentro ve los totales, rachas y
actividad de todos los miembros.

**Corrección propuesta:** `allow get` en lugar de `read`.

### 2.3 Los emails se muestran a otros usuarios

- En los resultados de búsqueda de "Añadir amigo" aparece el email completo de cada persona.
- En la lista de amigos y en la pantalla de invitación, si no hay nombre se muestra el email.
- La búsqueda por prefijo de nombre permite escribir "Mar" y ver a todas las Martas, Marcos y
  Marías que usan la app. No hay forma de no ser encontrable.

### 2.4 No hay bloqueo ni denuncia

Las reglas impiden mandar una solicitud a quien ya es tu amigo, pero **no hay lista de
bloqueados**: alguien a quien eliminas o rechazas puede volver a enviarte solicitudes
indefinidamente. Tampoco hay denuncia. En una red social esto es imprescindible.

### 2.5 Las puntuaciones se pueden falsear sin esfuerzo

- `fapStats` lo escribe el propio cliente; las reglas validan tipos y que no sea negativo, no
  la plausibilidad.
- El fan-out a amigos y grupos solo valida **qué campos** cambian, no **qué valores**: desde la
  consola se puede publicar `total: 9999` en la liga, los duelos y las temporadas de grupo.
- Desde la propia interfaz se puede pulsar 50 veces o añadir registros retroactivos ilimitados,
  y cuentan para la liga y los duelos.

En una app competitiva con datos autodeclarados, las trampas son inevitables; la pregunta es
cuánto importan (ver 7.4).

### 2.6 Falta la base legal para tratar estos datos

- Los datos sobre la **vida sexual** son **categoría especial** en el RGPD (art. 9): requieren
  **consentimiento explícito**, información clara, y muy probablemente una evaluación de impacto
  si se tratan a escala. [Afirmación jurídica general, a confirmar con un profesional.]
- El registro **no tiene** aceptación de política de privacidad ni de condiciones, ni
  consentimiento explícito para estos datos. [verificado]
- **No hay control de edad.** Una app de contenido sexual con funciones sociales tiene que ser
  para mayores de 18. [verificado: no existe]
- **No hay exportación de datos** (derecho de portabilidad); solo borrado. [verificado]

### 2.7 El modo discreto no oculta lo más visible

El "nombre e icono neutros" cambia el título de la **pestaña del navegador** y el favicon. El
icono y el nombre de la app **instalada** (manifiesto de la PWA y app nativa) siguen diciendo
"SexControl" en la pantalla de inicio. [verificado] Es justo lo que ve quien coge tu móvil.

---

## 3. Bugs de producto que frenan el crecimiento [verificado]

### 3.1 La invitación se pierde para los usuarios nuevos que se registran con email

Flujo real de alguien que recibe un enlace `/invitar/{uid}` o `/unirse/{código}` sin cuenta:

1. El enlace exige sesión → pantalla de **login** directamente, sin explicar qué es la app ni
   quién le invita.
2. Pulsa "Registrarse" → el parámetro de retorno **no se pasa** a la pantalla de registro.
3. Se registra → pantalla de verificar email → al verificar va a `/tabs/sumar`.
4. **La invitación ha desaparecido.** Tiene que pedir el enlace otra vez.

Solo funciona para quien ya tenía cuenta o entra con Google desde la pantalla de login. Es
decir: **el bucle viral está roto justo para los usuarios nuevos.**

### 3.2 Sin notificaciones push

No hay FCM ni ningún servidor que las envíe. Los retos, pullas, solicitudes de amistad,
adelantamientos y campeonatos de grupo **solo se ven si abres la app**. El recordatorio "llevas
N días sin apuntar" es local, y en la versión web solo funciona con la pestaña abierta.

### 3.3 "Borrar último" borra el más reciente por fecha, no el último que añadiste

Si añades una "olvidada" de la semana pasada y pulsas "Borrar último" para quitarla, se borra
**el registro real de hoy**. [verificado: ordena por `fecha desc`]

### 3.4 Los detalles casi nunca se rellenan

Valoración, etiquetas y nota solo se ofrecen en un aviso que desaparece a los 5 segundos. Eso
empobrece las estadísticas, que son lo que da valor a largo plazo.

### 3.5 El muro del grupo no es un muro

Guarda **una sola entrada por miembro** (la última). No hay historial ni conversación, solo
mensajes predefinidos. Es barato en lecturas, pero no genera vida en el grupo.

### 3.6 Borrar la cuenta siendo dueño de un grupo borra el grupo para todos

No hay traspaso de propiedad.

### 3.7 Sin onboarding ni analítica

- El primer arranque es una pantalla con `0 · 0 · 0`. No se explica la privacidad, el modo
  discreto ni la parte social.
- No hay ninguna medición: es imposible saber cuántas invitaciones se envían, cuántas se
  aceptan o dónde abandona la gente. **Sin esto no se puede trabajar la viralidad.**

---

## 4. Uso como usuario real: tres recorridos

### Álex, 27 años, recibe un enlace en el grupo de WhatsApp de su pueblo

Toca el enlace → pantalla de login sin contexto → no sabe qué es ni si alguien verá sus datos
→ se registra por curiosidad → tiene que ir a su correo a verificar → vuelve y aterriza en una
pantalla con tres ceros → **el grupo al que le invitaban no aparece**. Lo más probable: la
desinstala esa misma noche.

### Marta, 31 años, soltera desde hace poco

Usa la app sobre todo en privado, para conocerse. La liga le hace sentirse evaluada, y le llega
de una amiga la pulla "¿Te has jubilado o qué?" en plena ruptura. Lo que querría es entender sus
propios patrones —si hay relación con su ciclo, con el estrés, con el fin de semana— y que la
competición fuera algo que ella elige, no el centro de la app.

### Dani y Laura, pareja

Los dos tienen cuenta. Cada vez que están juntos, **cada uno tiene que apuntarlo por su lado**.
No hay nada que los una: ni racha de pareja, ni "nuestro mes", ni forma de que el registro de
uno confirme el del otro.

**Conclusión como usuario:** lo más divertido de la app ya existe (grupos, títulos semanales,
temporadas, duelos), pero **está escondido detrás de un embudo de entrada roto y de un silencio
total fuera de la app** (sin push). Y la pantalla principal es un contador, cuando podría ser un
diario útil.

---

## 5. El nombre

**"SexControl"** analizado como usuario y como estrategia:

| A favor | En contra |
|---|---|
| Directo: se entiende al instante | "Control" suena a controlar una adicción o a abstinencia, no a disfrutar ni a jugar |
| Memorable y con gancho en un grupo de amigos | Da vergüenza tenerlo en la pantalla de inicio, que lo vea tu madre o un compañero de trabajo → frena instalaciones |
| Ya existe marca y logo | Las plataformas publicitarias restringen anuncios de contenido sexual → casi imposible captar con anuncios de pago |
| | Las tiendas revisan con más cuidado apps con contenido sexual explícito en nombre, capturas y textos |
| | Compartir un enlace que dice "SexControl" es poco negable |

**Alternativas** (ideas; **no** se ha comprobado disponibilidad de marca, dominio ni nombre en
tiendas):

| Nombre | Idea | Riesgo |
|---|---|---|
| **Palotes** | Los palotes son las marcas para contar (‖‖‖‖). Y en España "echar un palo" es tener sexo. Doble sentido negable | "Estar palote" es también jerga de erección; puede sonar más masculino |
| **Muescas** | De "hacer muescas en el cabecero". Elegante y negable | La expresión tiene connotación de contar conquistas, un poco cosificadora |
| **Marcador** | Encaja con la liga, 100 % negable | Genérico: difícil de registrar y de encontrar |
| **Polvómetro** | Humor muy español, muy viral en redes | Nada negable; mismos problemas de tiendas y anuncios que SexControl |
| **Mantener SexControl** | Coste de cambio cero | Todo lo de la tabla anterior |

Idea complementaria: **nombre neutro de verdad para el icono instalado**, elegible por el
usuario (manifiesto dinámico en la PWA, iconos alternativos en la app nativa).

---

## 6. La pantalla Sumar: de contador a herramienta útil

Hoy muestra números acumulados y dos botones. Los totales históricos son el dato **menos útil**
del día a día: sube uno cada vez y no dice nada. Propuesta:

### 6.1 Que sumar siga siendo un toque, pero que el contexto sea un toque más

Tras pulsar, en lugar de un aviso de 5 segundos, una **tarjeta rápida** que se queda hasta que
la cierras, con chips de un toque y todo opcional:

- ★★★★★ valoración
- **Con quién** (solo en compañía): lista privada de apodos que tú creas ("Laura", "rollo",
  "nuevo"). Nunca se comparte.
- **Protección**: sí / no / no aplica
- **Dónde**: casa / su casa / hotel / otro
- "Como la última vez" para repetir los chips anteriores

Así las estadísticas se llenan sin esfuerzo y aparecen preguntas interesantes: con quién la
valoración media es más alta, qué porcentaje fue con protección, etc.

### 6.2 Mostrar lo que importa hoy, no el total de siempre

- "**4 esta semana** · 1 más que la pasada"
- "**Racha de 3 días**" (o "se rompe hoy a medianoche", con tono ligero)
- "Te faltan 2 para tu objetivo"
- Una línea social accionable: "**Marcos te ha adelantado** hace 2 h → Responder"

### 6.3 Sumar sin abrir la app

- **Accesos directos** del icono (atajos del manifiesto PWA / accesos rápidos nativos): "Sumar
  en compañía", "Sumar en solitario".
- **Widget** nativo en Android e iOS.
- Acción directa desde la notificación de recordatorio.

### 6.4 Una capa de salud opcional y siempre privada

Es lo que puede convertir una curiosidad en algo que la gente **conserva**:

- Recordatorio de anticonceptivo (pastilla, anillo, parche).
- Calendario de ciclo opcional para ver la actividad sobre él.
- Recordatorio amable de **prueba de ITS** cada X meses si hay parejas nuevas.
- Porcentaje con protección.

Riesgo: sube mucho la sensibilidad de los datos (ver sección 2.6). Nunca se comparte nada de
esta capa.

### 6.5 Arreglos

- "Borrar último" desaparece como botón; se deshace desde el aviso o desde el historial.
- Registros retroactivos de más de 24 h **no puntúan** en ligas ni duelos (ver 7.4).

---

## 7. Red social y viralidad

### 7.1 Tesis

Una app de datos sexuales **no se hace viral como Instagram** (perfiles públicos, desconocidos,
feed abierto): eso trae acoso, moderación imposible, problemas con las tiendas y miedo a la
exposición. Se hace viral como **BeReal, Locket o los clubes de Strava**: **círculos cerrados de
amigos**, con artefactos compartibles hacia fuera que **generan curiosidad sin exponer los
datos**, y con mecánicas de hábito tipo **Duolingo** (rachas, ligas, notificaciones). El
**grupo de amigos** es la unidad viral, no el individuo.

### 7.2 Bucles de crecimiento, por prioridad

**A. Imprescindibles (sin ellos no hay bucle)**

1. **Invitación que funciona.** Página de destino sin login: "Marcos te invita a *Los del
   pueblo* · 7 miembros · nadie ve tus números si no quieres". Registro dentro del flujo con
   retorno garantizado. Mensaje prehecho para WhatsApp con gancho ("Te reto a una liga. Nadie
   ve tus números si no quieres").
2. **Onboarding con grupo.** Paso 1: crear o unirte a un grupo. La clasificación del grupo "se
   desbloquea" con 3 miembros → motivo real para invitar.
3. **Notificaciones push** con tono cuidado: "Te han retado", "Marcos te ha adelantado",
   "Tu grupo ha cerrado la semana: mira quién es el MVP", "Tu racha de 5 días termina hoy".
4. **Resumen del lunes del grupo** como evento semanal con push: MVP, Farolillo rojo, Remontada
   (ya se calculan). Es el contenido que se comenta en el WhatsApp del grupo.
5. **Analítica mínima y respetuosa**: invitaciones enviadas, aceptadas, retención D1/D7/D30,
   factor viral. Sin eventos que revelen actividad sexual.

**B. Contenido compartible hacia fuera**

6. **"Wrapped" anual y mensual** ("Tu 2026", "Tu septiembre"), en formato historia 9:16, con
   versión discreta sin números. Ya existe una tarjeta anual básica.
7. **Mosaico semanal tipo Wordle**: `🟥🟦⬛🟥⬛⬛🟥 · SexControl` — siete cuadros, uno por día
   (compañía / solitario / nada). Intriga, se entiende en el grupo, no revela cifras exactas.
   Es el tipo de artefacto que se comparte solo.
8. **Eventos de temporada**: San Valentín, verano, Nochevieja y "Noviembre" (con dos equipos,
   los que se abstienen y los que no, en tono de humor). Clasificaciones entre grupos. Excusa
   para notificaciones, redes y prensa.
9. **"¿Es normal?"**: comparativas **anónimas y agregadas** por edad y país ("Estás en la
   mitad más activa de tu franja de edad"), solo con consentimiento y mínimos de anonimato. Y
   un **informe anual público** con datos agregados, pensado para prensa y redes (patrón de los
   informes anuales de apps de citas). Requiere pedir edad y provincia de forma opcional.

**C. Profundidad y retención**

10. **Modo pareja**: vinculas a tu pareja (que tiene que aceptar); un registro "en compañía"
    propone el mismo registro al otro, que lo confirma con un toque. Racha de pareja, "nuestro
    mes", aniversario. Cada pareja son dos usuarios por invitación natural, y un registro
    **confirmado por los dos** es la mejor defensa contra trampas.
11. **Duelos con apuesta simbólica** predefinida: "el que pierda paga las cañas / la cena /
    elige la peli".
12. **Muro de grupo con historial** y reacciones a los eventos (sin texto libre, o con texto
    libre solo entre amigos confirmados y con denuncia).
13. **Recompensas por invitar**: logro "Celestina" (3 amigos entran por tu enlace), iconos
    alternativos o temas desbloqueables.

### 7.3 Lo que yo **no** haría

- **Perfiles públicos o descubrir desconocidos.** Convierte la app en una app de ligar sin
  serlo, con acoso y moderación que un proyecto pequeño no puede sostener.
- **Clasificación global por cantidad.** Premia mentir y presiona a quien pasa una mala racha.
- **Pullas humillantes en notificaciones push.** "¿Te has jubilado?" dentro de la app entre
  amigos tiene gracia; en la pantalla de bloqueo, vista por otros, no.
- **Identificar a la pareja con nombre real o cuenta sin su consentimiento.** Es un tercero
  cuyos datos sexuales se están registrando.

### 7.4 Trampas: rebajar el incentivo en vez de perseguirlas

- **Competir por constancia, no por volumen**: la liga principal por **días activos** en la
  semana (máximo 7) en lugar de por cantidad. Menos incentivo a inflar, menos presión.
- **Tope por día** para lo que puntúa (p. ej. 3), aunque se registre más.
- Registros retroactivos de más de 24 h **no puntúan**.
- Distintivo de **"confirmado en pareja"**.
- Validar en reglas que los valores publicados sean coherentes con el periodo (p. ej. semana
  ≤ 7 × tope diario).

---

## 8. El choque con la capa gratuita de Firebase

### 8.1 Coste de un "sumar" hoy

1 registro + 1 estadísticas + **1 escritura por amigo** + **1 por grupo** (+ muro si hay
adelantamiento). Con 15 amigos y 2 grupos ≈ **19 escrituras por toque**.

### 8.2 Estimación del techo gratuito [estimación, no medida]

1.000 usuarios activos al día × 0,7 registros al día × 19 escrituras ≈ **13.300 escrituras
diarias**, más pullas, duelos, perfiles y lecturas de listeners que se disparan cada vez que un
amigo suma. **El techo de 20.000 escrituras diarias se alcanza aproximadamente entre 1.000 y
1.500 usuarios activos diarios.** Con viralidad real, se supera en días.

### 8.3 Lo que no se puede hacer sin backend

Notificaciones push disparadas por eventos, validación antifraude en servidor, previsualización
dinámica de enlaces para WhatsApp, cierre de temporadas y resúmenes programados, agregados
anónimos para "¿Es normal?". Todo eso necesita **Cloud Functions**, que exige el **plan Blaze**.

Matiz importante: **Blaze incluye la misma cuota gratuita** que Spark; solo se paga lo que la
supera, y se pueden poner alertas de presupuesto. Pasar a Blaze no significa empezar a pagar,
pero sí dar una tarjeta. **Es una decisión del dueño** y condiciona toda la hoja de ruta.

### 8.4 Límite estructural

`social/{uid}` guarda a todos los amigos en **un solo documento** (límite de Firestore: 1 MiB).
Sirve para amigos cercanos (cientos), no para seguidores a escala de red social abierta — otra
razón para quedarse en círculos cerrados.

---

## 9. Hoja de ruta propuesta

| Fase | Contenido | Por qué en este orden |
|---|---|---|
| **0. Antes de invitar a nadie más** | Reglas `users` y `groupInvites` (`get`, no `list`); ocultar emails; bloquear y denunciar; control de edad 18+; política de privacidad y consentimiento explícito; exportar datos; retorno de invitación tras registro y verificación; arreglar "Borrar último"; traspaso de grupo al borrar cuenta | Crecer con 2.1 y 2.2 abiertos es exponer a cada nuevo usuario |
| **1. Bucle viral mínimo** | Página de invitación sin login, mensaje de WhatsApp, onboarding con grupo, push (requiere Blaze), analítica mínima, icono instalado neutro | Sin esto, cada invitación se pierde y nadie vuelve |
| **2. Contenido compartible** | Resumen del lunes con push, mosaico semanal, Wrapped mensual y anual, primer evento de temporada | Es lo que sale de la app y trae gente |
| **3. Profundidad** | Tarjeta rápida de detalles, pantalla Sumar con "hoy", modo pareja, liga por constancia, duelos con apuesta, muro con historial | Retención: que quien llega se quede |
| **4. Datos y prensa** | Capa de salud opcional, "¿Es normal?", informe anual público | Necesita volumen de usuarios y la base legal de la fase 0 |

El rediseño visual (documento `REDISENO.md`, aparcado) encajaría antes de la fase 1: es la
primera impresión de cada invitado.

---

## 10. Preguntas abiertas para el revisor

1. **Prioridad.** ¿Es correcto poner la fase 0 (seguridad y legal) antes de todo, o hay alguna
   pieza de crecimiento tan barata que merezca adelantarse?
2. **Nombre.** ¿Mantener "SexControl" o cambiar? ¿Qué alternativas faltan? ¿Cómo validarlo
   barato antes de decidir?
3. **Competir por constancia en vez de por volumen.** ¿Mata la gracia de la liga? ¿Hay un
   término medio?
4. **Capa de salud.** ¿Hace la app más valiosa o la saca de su tono lúdico y la complica
   legalmente?
5. **Círculos cerrados frente a red social abierta.** El dueño quiere "una red social". ¿Hay
   algún formato de descubrimiento o contenido público que sea seguro para esta categoría?
6. **Mosaico tipo Wordle.** ¿Se compartiría de verdad, o es demasiado críptico?
7. **Monetización.** No se ha tratado. ¿Qué modelo encaja sin romper la viralidad (premium con
   estadísticas avanzadas, iconos y temas, Wrapped extendido)?
8. **Riesgos no vistos.** ¿Qué se le escapa a este informe en tiendas de apps, legal, reputación
   o seguridad?
