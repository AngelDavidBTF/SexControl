// Genera las páginas de las direcciones a partir de src/.
//   node build.mjs  →  design-demos/A-marcador.html, B-fiesta.html, C-calendario-vivo.html
//                      y ../tres-follendarios.html (las tres juntas, la que se publica).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(here, 'src', f), 'utf8');
const asset = (f) => 'data:image/png;base64,' + readFileSync(join(here, '..', 'assets', f)).toString('base64');

const SCRIPTS = [
  ['https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js', 'sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z'],
  ['https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js', 'sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1'],
  ['https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.0/babel.min.js', 'sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y'],
];

const DIRS = [
  {
    letter: 'A', key: 'a', file: 'A-marcador.html', name: 'Marcador',
    logic: 'Lógica 1 · Ruleta de estilos: nº 16, Terminal-Core Soft-Futurism',
    fonts: ['Geist:wght@400;500;600;700', 'Geist+Mono:wght@400;500;700'],
    text: 'Follendario como un marcador de bolsillo. Cada vez que apuntas cae un cubo sobre el día de hoy y la semana crece en pilas. Las teclas se hunden como las de verdad, los números no bailan al cambiar y lo que pasa en tus grupos se escribe solo, como en una consola.',
    form: 'De dónde sale la forma: las casillas del calendario del logo convertidas en cubos que se apilan, y el recuento tratado como un marcador.',
    tryIt: [
      'Pulsa EN COMPAÑÍA o EN SOLITARIO: cae un cubo, rueda el número y la consola te contesta.',
      'Pulsa tres veces y ve a «grupos»: adelantas a Marcos y las filas se recolocan.',
      'En «grupos», cambia semana, mes y total, y manda una pulla a Sergio.',
    ],
  },
  {
    letter: 'B', key: 'b', file: 'B-fiesta.html', name: 'Fiesta',
    logic: 'Lógica 2 · Referente real: Partiful, mejor app de Google Play 2024',
    fonts: ['Fredoka:wght@500;600;700', 'Figtree:wght@400;500;600;700'],
    text: 'Cada grupo es un cartel de fiesta y apuntar es un pequeño momento de celebración: un botón, una hoja con dos opciones y una lluvia de corazones y berenjenas. Pegatinas, emoji y el tono de un grupo de WhatsApp.',
    form: 'De dónde sale la forma: la berenjena y el corazón del logo convertidos en pegatinas, y los grupos tratados como invitaciones a una fiesta.',
    tryIt: [
      'Toca «Apuntar uno» y elige una de las dos opciones.',
      'Reacciona a las tarjetas de tus grupos y pincha a Javi en el duelo.',
      'En «Grupos», mira el podio, los títulos de la semana y manda una pulla desde el muro.',
    ],
  },
  {
    letter: 'C', key: 'c', file: 'C-calendario-vivo.html', name: 'Calendario vivo',
    logic: 'Lógica 3 · El mejor estudio para el encargo: Collins',
    fonts: ['Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800', 'Instrument+Sans:wght@400;500;600;700'],
    text: 'El nombre manda: la pantalla principal es el calendario del logo en grande. Cada día que apuntas se sella en rosa o berenjena, la clasificación se compone con letras que crecen con el marcador y los títulos de la semana son sellos de tinta.',
    form: 'De dónde sale la forma: el calendario del logo (cabecera rosa, anillas, casillas) llevado a pantalla completa, sobre papel crema.',
    tryIt: [
      'Pulsa «+ Compañía» o «+ Solitario» abajo: el día de hoy recibe un sello.',
      'Desliza las tarjetas de tus grupos.',
      'En «Grupos», fíjate en que quien va primero tiene el nombre más grande, y apunta para crecer.',
    ],
  },
].filter((d) => existsSync(join(here, 'src', d.key + '.jsx')));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function section(d) {
  return `
  <section class="pg-dir" id="dir-${d.key}" aria-labelledby="t-${d.key}">
    <div class="pg-dir-head">
      <div>
        <p class="pg-logic">${esc(d.logic)}</p>
        <h2 id="t-${d.key}"><span>${d.letter}</span> · ${esc(d.name)}</h2>
      </div>
      <div>
        <p>${esc(d.text)}</p>
        <p>${esc(d.form)}</p>
        <ul class="pg-try">${d.tryIt.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="pg-phones">
      <figure class="pg-phone" style="margin:0"><div class="phone-slot" data-dir="${d.letter}" data-initial="inicio"><p class="pg-loading">Cargando el prototipo…</p></div><figcaption>Inicio: apuntar, tu semana y tus grupos</figcaption></figure>
      <figure class="pg-phone" style="margin:0"><div class="phone-slot" data-dir="${d.letter}" data-initial="grupos"><p class="pg-loading">Cargando el prototipo…</p></div><figcaption>Ficha del grupo «Los del Pueblo»</figcaption></figure>
    </div>
  </section>`;
}

function page({ title, h1, lead, dirs }) {
  const fonts = ['Schibsted+Grotesk:wght@400;500;700', ...dirs.flatMap((d) => d.fonts)];
  const shared = src('shared.jsx').replace('__SIMBOLO__', asset('follendario-simbolo.png')).replace('__LOGOTIPO__', asset('follendario-logotipo.png'));
  const mount = `
document.querySelectorAll('.phone-slot').forEach(function (slot) {
  var Dir = window['Dir' + slot.dataset.dir];
  ReactDOM.createRoot(slot).render(<FD.Fit><Dir.App initial={slot.dataset.initial} /></FD.Fit>);
});`;
  return `<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts.map((f) => 'family=' + f).join('&')}&display=swap">
<style>
${src('chrome.css')}
${dirs.map((d) => src(d.key + '.css')).join('\n')}
</style>
<div class="pg">
  <header class="pg-head">
    <p class="pg-eyebrow"><img src="${asset('follendario-simbolo.png')}" alt="">Follendario · rediseño</p>
    <h1>${esc(h1)}</h1>
    <p class="pg-lead">${esc(lead)}</p>
  </header>
  ${dirs.length > 1 ? `<nav class="pg-nav" aria-label="Direcciones">${dirs.map((d) => `<a href="#dir-${d.key}"><b>${d.letter}</b>${esc(d.name)}</a>`).join('')}</nav>` : ''}
  ${dirs.map(section).join('\n')}
  ${dirs.length > 1 ? `<aside class="pg-foot"><h2>¿Cuál te quedas?</h2><p>Dime A, B o C, o qué mezclarías (por ejemplo: «el inicio de C con las teclas de A»). Con eso hago el diseño completo de todas las pantallas, la auditoría y el documento para implementarlo.</p></aside>` : ''}
</div>
${SCRIPTS.map(([url, sri]) => `<script src="${url}" integrity="${sri}" crossorigin="anonymous"></script>`).join('\n')}
<script type="text/babel" data-presets="react">
${shared}
</script>
${dirs.map((d) => `<script type="text/babel" data-presets="react">\n${src(d.key + '.jsx')}\n</script>`).join('\n')}
<script type="text/babel" data-presets="react">${mount}
</script>
`;
}

for (const d of DIRS) {
  writeFileSync(join(here, d.file), page({
    title: `Follendario ${d.name}`,
    h1: `Dirección ${d.letter}: ${d.name}`,
    lead: 'Prototipo interactivo con el logo, los colores y los textos reales de la app. Cada teléfono funciona: apunta, cambia de pestaña y manda pullas.',
    dirs: [d],
  }));
}
if (DIRS.length) {
  writeFileSync(join(here, '..', 'tres-follendarios.html'), page({
    title: 'Tres Follendarios',
    h1: 'Tres Follendarios para elegir',
    lead: 'Tres direcciones para el rediseño, todas con tu logo, tus colores y los textos reales de la app. No son capturas: cada teléfono funciona. Apunta, cambia de pestaña y manda pullas para ver las animaciones. Después dime cuál te gusta, o qué mezclarías.',
    dirs: DIRS,
  }));
}
console.log('Generadas:', DIRS.map((d) => d.file).join(', '), DIRS.length ? '+ tres-follendarios.html' : '');
