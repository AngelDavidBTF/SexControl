// Genera ../diseno-de-follendario.html (página única, lista para publicar) a partir de src/.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');
const asset = (f) => 'data:image/png;base64,' + readFileSync(join(here, '..', 'assets', f)).toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const SCRIPTS = [
  ['https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js', 'sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],
  ['https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js', 'sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1'],
  ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'sha384-mZT2gIty7ZDdOGkxfP6joZcYdMW1Jvj9dRlfpTmaJAKKXTqzygtB22k7FLe+KZC1'],
  ['https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.0/babel.min.js', 'sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y'],
];

const SECTIONS = [
  {
    id: 'pestanas', title: 'Las tres pestañas',
    text: 'Amigos, Sumar y Estadísticas, con la misma navegación de hoy. Sumar es la de entrada: el calendario del logo con el marcador encima.',
    phones: [
      [{ screen: 'sumar' }, 'Sumar', 'Pulsa EN COMPAÑÍA o EN SOLITARIO: ruedan los bloques del marcador, cae un cubo en el día de hoy y recibe su sello. La primera vez cumples el objetivo de la semana y sale confeti.'],
      [{ screen: 'amigos' }, 'Amigos', 'Novedades y pullas como consola, retos, duelo en vivo y la liga, que se reordena al cambiar el periodo. Toca un amigo para abrir su ficha.'],
      [{ screen: 'amigos', seg: 'grupos' }, 'Amigos · Grupos', 'Tus grupos. Toca «Los del Pueblo» para entrar.'],
      [{ screen: 'estadisticas' }, 'Estadísticas', 'Cambia el periodo. Más abajo, el mismo calendario en papel con los últimos 6 meses (desliza o usa las flechas y toca un día).'],
    ],
  },
  {
    id: 'grupo', title: 'Grupo y amigos',
    text: 'El ticket semanal sustituye a la lista de títulos y se imprime al entrar en el grupo. La ficha del amigo usa las mismas teclas de colores.',
    phones: [
      [{ screen: 'grupo' }, 'Grupo', 'Ticket semanal, objetivo con marcas, totales y muro. Cambia «Total / Este mes / Esta semana» y mira cómo se recolocan los miembros.'],
      [{ screen: 'amigos', modal: 'ficha' }, 'Ficha del amigo', 'Tú contra Marcos. «Retar a un duelo» y «Mandar una pulla» abren sus hojas de opciones.'],
      [{ screen: 'amigos', modal: 'ficha', sheet: 'pulla' }, 'Hoja de pullas', 'Las hojas de acciones de Ionic con el nuevo estilo.'],
    ],
  },
  {
    id: 'apuntar', title: 'Apuntar con detalle',
    text: 'Los dos modales que salen de Sumar: los detalles tras apuntar y la que se te olvidó.',
    phones: [
      [{ screen: 'sumar', modal: 'detalles' }, 'Detalles', 'Estrellas, etiquetas y nota.'],
      [{ screen: 'sumar', modal: 'olvidada' }, '¿Se te olvidó apuntar una?', 'Atajos, día y hora. La tecla cambia de color según compañía o solitario.'],
    ],
  },
  {
    id: 'cuenta', title: 'Cuenta y seguridad',
    text: 'La entrada, los ajustes y el bloqueo del modo discreto.',
    phones: [
      [{ screen: 'login' }, 'Login', 'El logo de verdad, sin encajarlo en una lista. Los botones conservan «Entrar» y su color primario, que usan las pruebas.'],
      [{ screen: 'ajustes' }, 'Perfil y ajustes', 'En «Apariencia» puedes cambiar entre oscuro y claro: afecta a todos los teléfonos.'],
      [{ screen: 'bloqueo' }, 'Bloqueo con PIN', 'Prueba 1234 para entrar o cualquier otro para ver el error.'],
    ],
  },
  {
    id: 'invitaciones', title: 'Invitaciones',
    text: 'Lo primero que ve quien recibe tu enlace.',
    phones: [
      [{ screen: 'invitacion' }, 'Invitación de amistad', 'Llega por enlace o QR.'],
      [{ screen: 'unirse' }, 'Unirse a un grupo', 'Con el aviso de privacidad antes de entrar.'],
      [{ screen: 'amigos', modal: 'qr' }, 'Compartir enlace o QR', 'QR real y escaneable, con el símbolo en el centro.'],
    ],
  },
];

const fonts = ['Schibsted+Grotesk:wght@400;500;600;700', 'Geist:wght@400;500;600;700', 'Geist+Mono:wght@400;500;700'];
const shared = src('shared.jsx')
  .replace('__SIMBOLO__', asset('follendario-simbolo.png'))
  .replace('__LOGOTIPO_TINTA__', asset('follendario-logotipo-tinta.png'))
  .replace('__LOGOTIPO__', asset('follendario-logotipo.png'));

const html = `<title>Diseño de Follendario</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts.map((f) => 'family=' + f).join('&')}&display=swap">
<style>
${src('chrome.css')}
${src('tokens.css')}
${src('base.css')}
${src('screens.css')}
</style>
<div class="pg">
  <header class="pg-head">
    <p class="pg-eyebrow"><img src="${asset('follendario-simbolo.png')}" alt="">Follendario · rediseño visual</p>
    <h1>Follendario: calendario y marcador</h1>
    <p class="pg-lead">Calendario y marcador como firma: abres la app y en un segundo ves tu historial, con animaciones que le dan punto de juego. Mismas funciones y navegación; apuntar sigue siendo un toque. Prueba el tema claro y el modo discreto arriba: todos los teléfonos se pueden tocar.</p>
    <ul class="pg-mix" aria-label="Qué lleva la mezcla">
      <li><b>C</b> identidad: el calendario del logo, en Sumar y en Estadísticas</li>
      <li><b>A</b> personalidad: marcador de bloques, números que ruedan, teclas y ticket</li>
      <li><b>Rosa</b> compañía · <b>cian</b> solitario · berenjena y ciruela de marca</li>
      <li><b>Modo discreto</b> con piel propia: parece una app de notas</li>
    </ul>
  </header>
  <div class="pg-bar">
    <div class="pg-theme" role="group" aria-label="Tema de los teléfonos">
      <button type="button" data-set-theme="oscuro" aria-pressed="true">Oscuro</button>
      <button type="button" data-set-theme="claro" aria-pressed="false">Claro</button>
    </div>
    <div class="pg-theme" role="group" aria-label="Modo discreto">
      <button type="button" data-set-discreet="off" aria-pressed="true">Normal</button>
      <button type="button" data-set-discreet="on" aria-pressed="false">Discreto</button>
    </div>
    <nav class="pg-nav" aria-label="Secciones">${SECTIONS.map((s) => `<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</nav>
  </div>
  <div data-fol-theme="dark" data-fol-discreet="off">
  ${SECTIONS.map((s) => `
  <section class="pg-sec" id="${s.id}" aria-labelledby="h-${s.id}">
    <h2 id="h-${s.id}">${esc(s.title)}</h2>
    <p>${esc(s.text)}</p>
    <div class="pg-phones">
      ${s.phones.map(([start, name, hint]) => `<figure class="pg-phone"><div class="phone-slot" data-start="${esc(JSON.stringify(start))}"><p class="pg-loading">Cargando…</p></div><figcaption><strong>${esc(name)}</strong>${esc(hint)}</figcaption></figure>`).join('\n      ')}
    </div>
  </section>`).join('\n')}
  </div>
  <aside class="pg-foot">
    <h2>Lo que no sale aquí</h2>
    <p>Registro, recuperar contraseña y verificar email usan el patrón del Login. Añadir amigo, solicitudes, crear grupo, añadir miembros y elegir @usuario usan las filas, campos y teclas de Amigos y Ajustes. Los avisos y diálogos de confirmación usan el aviso y la hoja de acciones que ves arriba.</p>
  </aside>
</div>
${SCRIPTS.map(([u, sri]) => `<script src="${u}" integrity="${sri}" crossorigin="anonymous"></script>`).join('\n')}
${[shared, src('components.jsx'), src('screens-tabs.jsx'), src('screens-more.jsx'), src('app.jsx')].map((code) => `<script type="text/babel" data-presets="react">\n${code}\n</script>`).join('\n')}
`;

writeFileSync(join(here, '..', 'diseno-de-follendario.html'), html);
console.log('Generada diseno-de-follendario.html', Math.round(html.length / 1024) + ' KB');
