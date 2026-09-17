// Follendario · diseño final (mezcla A + C). Piezas comunes: marco, escalado, iconos, datos y mecánica.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef } = React;

  /* ---------- IosFrame (huashu-design assets/ios_frame.jsx; colores desde los tokens) ---------- */
  const S = {
    wrapper: { display: 'inline-block', padding: 12, background: '#000', borderRadius: 60, boxShadow: '0 0 0 2px #1f2937, 0 20px 60px rgba(0,0,0,0.3)', position: 'relative' },
    screen: { position: 'relative', borderRadius: 48, overflow: 'hidden' },
    statusBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', fontSize: 16, fontWeight: 600, fontFamily: '-apple-system, "SF Pro Text", sans-serif', zIndex: 20, pointerEvents: 'none' },
    island: { position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 124, height: 36, background: '#000', borderRadius: 999, zIndex: 30 },
    icons: { display: 'flex', alignItems: 'center', gap: 6 },
    signal: { display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 },
    bar: { width: 3, background: 'currentColor', borderRadius: 1 },
    battery: { width: 26, height: 12, border: '1.5px solid currentColor', borderRadius: 3, padding: 1, position: 'relative', opacity: 0.8 },
    cap: { position: 'absolute', top: 3, right: -3, width: 2, height: 6, background: 'currentColor', borderRadius: '0 1px 1px 0' },
    content: { position: 'absolute', top: 54, left: 0, right: 0, bottom: 34, overflow: 'clip' },
    home: { position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 140, height: 5, borderRadius: 999, zIndex: 10 },
  };

  function IosFrame({ children, overlay }) {
    return (
      <div style={S.wrapper}>
        <div style={{ ...S.screen, width: 393, height: 852, background: 'var(--f-bg)' }}>
          <div style={{ ...S.statusBar, color: 'var(--f-status)' }}>
            <span>23:41</span>
            <div style={S.icons}>
              <div style={S.signal}>{[4, 6, 9, 11].map((h) => <div key={h} style={{ ...S.bar, height: h }} />)}</div>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M8 11.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
                <path d="M3 7.5a7 7 0 0110 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M1 4.5a11 11 0 0114 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
              </svg>
              <div style={S.battery}><div style={{ width: '64%', height: '100%', background: 'currentColor', borderRadius: 1 }} /><div style={S.cap} /></div>
            </div>
          </div>
          <div style={S.island} />
          <div style={S.content}>{children}</div>
          {overlay}
          <div style={{ ...S.home, background: 'var(--f-home)' }} />
        </div>
      </div>
    );
  }

  function Fit({ w = 417, h = 876, children }) {
    const ref = useRef(null);
    const [s, setS] = useState(1);
    useLayoutEffect(() => {
      const el = ref.current;
      const update = () => setS(Math.min(1, el.clientWidth / w));
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, [w]);
    return (
      <div ref={ref} style={{ width: '100%', maxWidth: w }}>
        <div style={{ width: w * s, height: h * s }}>
          <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: '0 0' }}>{children}</div>
        </div>
      </div>
    );
  }

  /* ---------- Iconos de trazo (sustituyen a los emoji de interfaz) ---------- */
  const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const ICONS = {
    users: <g {...P}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4" /></g>,
    plus: <path {...P} strokeWidth="2.4" d="M12 5v14M5 12h14" />,
    stats: <g {...P}><path d="M5 20V11M12 20V5M19 20v-6" /></g>,
    profile: <g {...P}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.2c1.2-2 3.1-3 5.5-3s4.3 1 5.5 3" /></g>,
    back: <path {...P} strokeWidth="2.2" d="M15 5l-7 7 7 7" />,
    close: <path {...P} strokeWidth="2" d="M6 6l12 12M18 6L6 18" />,
    chevron: <path {...P} d="M9 5l7 7-7 7" />,
    left: <path {...P} strokeWidth="2" d="M15 5l-7 7 7 7" />,
    right: <path {...P} strokeWidth="2" d="M9 5l7 7-7 7" />,
    share: <g {...P}><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></g>,
    addUser: <g {...P}><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5c.8-3.4 3.3-5.2 6.5-5.2 1.6 0 3 .4 4.1 1.2M18 14v6M15 17h6" /></g>,
    inbox: <g {...P}><path d="M4 13l2.5-7h11L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M4 13h4.5l1 2h5l1-2H20" /></g>,
    search: <g {...P}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></g>,
    eyeOff: <g {...P}><path d="M3 3l18 18" /><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.7 3.9M6.3 6.4A13 13 0 0 0 2.5 12c1 2.5 4.5 7 9.5 7a9.4 9.4 0 0 0 4.2-1" /><path d="M9.9 10a3 3 0 0 0 4.1 4.1" /></g>,
    eye: <g {...P}><path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z" /><circle cx="12" cy="12" r="3" /></g>,
    flame: <g {...P}><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.3 3.6-8.3.2-.6 1-.8 1.4-.2 1 1.4 1.5 3 1.5 4.5 1-.6 1.7-1.6 2-2.7.2-.6.9-.8 1.3-.3 1.3 1.6 3.2 4 3.2 7 0 3.6-2.6 6.2-6.5 6.2z" /></g>,
    star: <path {...P} d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />,
    clock: <g {...P}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></g>,
    trophy: <g {...P}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5v1.5A3.5 3.5 0 0 0 8.5 11M16 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 13v4M8.5 20h7M10 17h4" /></g>,
    calendar: <g {...P}><rect x="4" y="5.5" width="16" height="14.5" rx="3" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></g>,
    moon: <path {...P} d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
    trend: <g {...P}><path d="M4 17l5-5 4 3 7-8" /><path d="M15 7h5v5" /></g>,
    swords: <g {...P}><path d="M4 4l9 9M4 4h4M4 4v4M20 4l-9 9M20 4h-4M20 4v4" /><path d="M7 14l3 3M17 14l-3 3M5.5 18.5l2-2M18.5 18.5l-2-2" /></g>,
    hand: <g {...P}><path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 6.5-6 6.5-2.5 0-4-1.3-5.2-3.3L4 14.5a1.5 1.5 0 0 1 2.4-1.8L8 14.5" /></g>,
    smile: <g {...P}><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14c.8 1.3 2 2 3.5 2s2.7-.7 3.5-2M9 9.5h.01M15 9.5h.01" /></g>,
    userMinus: <g {...P}><circle cx="10" cy="8.5" r="3.5" /><path d="M3.5 19.5c.8-3.4 3.3-5.2 6.5-5.2s5.7 1.8 6.5 5.2M16 11h5" /></g>,
    ban: <g {...P}><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></g>,
    copy: <g {...P}><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></g>,
    camera: <g {...P}><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z" /><circle cx="12" cy="12.5" r="3.5" /></g>,
    backspace: <g {...P}><path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z" /><path d="M12 9.5l5 5M17 9.5l-5 5" /></g>,
    lock: <g {...P}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></g>,
    google: <g><path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z" fill="#4285F4" /><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" /><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2z" fill="#FBBC05" /><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 5.9 12 5.9z" fill="#EA4335" /></g>,
    note: <g {...P}><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></g>,
    download: <g {...P}><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 19h14" /></g>,
    check: <path {...P} strokeWidth="2.2" d="M5 12.5l4.5 4.5L19 7.5" />,
  };
  function Icon({ name, className = '' }) {
    return <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{ICONS[name]}</svg>;
  }

  /* ---------- Número que rueda ---------- */
  function RollNumber({ value, minDigits = 1, className = '', tiles = false }) {
    const digits = String(Math.max(0, value)).padStart(minDigits, '0').split('');
    return (
      <span className={'roll ' + className} role="img" aria-label={String(value)}>
        {digits.map((d, i) => (
          <Wrap key={digits.length - i} tiles={tiles}>
            <span className="roll-col" aria-hidden="true">
              <span className="roll-strip" style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
                {'0123456789'.split('').map((n) => <span key={n}>{n}</span>)}
              </span>
            </span>
          </Wrap>
        ))}
      </span>
    );
  }

  function Wrap({ tiles, children }) {
    return tiles ? <span className="roll-tile">{children}</span> : children;
  }

  /* ---------- FLIP para reordenaciones ---------- */
  function useFlip(orderKey) {
    const nodes = useRef(new Map());
    const rects = useRef(new Map());
    useLayoutEffect(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      nodes.current.forEach((el, key) => {
        const next = el.getBoundingClientRect();
        const prev = rects.current.get(key);
        rects.current.set(key, next);
        if (!prev || reduce || !el.offsetHeight) return;
        const scale = next.height / el.offsetHeight || 1;
        const dy = (prev.top - next.top) / scale;
        if (Math.abs(dy) < 1) return;
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 520, easing: 'cubic-bezier(0.34, 1.3, 0.64, 1)' });
      });
    }, [orderKey]);
    return (key) => (el) => { if (el) nodes.current.set(key, el); else nodes.current.delete(key); };
  }

  /* ---------- Confeti con los colores de la marca (UiService.celebrate) ---------- */
  function confetti(host) {
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas');
    const w = host.clientWidth, h = host.clientHeight;
    canvas.width = w; canvas.height = h;
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:40';
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const styles = getComputedStyle(host);
    const colors = ['#fc2a6c', styles.getPropertyValue('--f-solo').trim() || '#a033b9', '#fcf3ed', '#6fdc95', '#ff76a0'];
    const pieces = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: -20 - Math.random() * h * 0.4, size: 5 + Math.random() * 6, speed: 2.4 + Math.random() * 3.2, drift: -1 + Math.random() * 2, angle: Math.random() * Math.PI, spin: -0.2 + Math.random() * 0.4, color: colors[Math.floor(Math.random() * colors.length)] }));
    const start = performance.now();
    const frame = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, Math.min(1, (1600 - t) / 400));
      for (const p of pieces) {
        p.y += p.speed; p.x += p.drift; p.angle += p.spin;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore();
      }
      if (t < 1600) requestAnimationFrame(frame); else canvas.remove();
    };
    requestAnimationFrame(frame);
  }

  /* ---------- Contenido de ejemplo ---------- */
  const COLORS = { Marcos: '#fc2a6c', Álex: '#6fdc95', Tú: '#6fdc95', Lucía: '#ffb4c9', Javi: '#d39be8', Nerea: '#fcf3ed', Irene: '#ff9cbc', Sergio: '#b3a2c4', Carla: '#f6c6a8' };
  const avatarColor = (name) => COLORS[name] || '#e2c5c9';

  const WEEK = { base: { c: 1, s: 0 }, days: [{ d: 'L', c: 1, s: 0 }, { d: 'M', c: 0, s: 0 }, { d: 'X', c: 0, s: 1 }, { d: 'J', today: true }, { d: 'V', future: true }, { d: 'S', future: true }, { d: 'D', future: true }] };

  const DATA = {
    me: { name: 'Álex', username: 'alex_pueblo', email: 'alex@correo.es' },
    totals: { c: 86, s: 61 },
    goals: { week: { done: 3, target: 4 }, month: { done: 9, target: 12 } },
    novedades: [
      { glyph: '▲', who: 'Marcos', text: 'te ha adelantado esta semana' },
      { glyph: '✶', who: 'Lucía', text: 'lleva 4 días de racha' },
      { glyph: '◆', who: 'Irene', text: 'ha desbloqueado un logro' },
      { glyph: '+', who: 'Javi', text: 'ha sumado una', discreto: 'ha apuntado algo' },
    ],
    retos: [{ who: 'Javi', text: 'Quién suma más esta semana' }],
    duelos: [{ who: 'Lucía', text: 'El primero en llegar a 5', mine: 3, theirs: 2 }],
    pullas: [
      { who: 'Nerea', label: '👴 ¿Te has jubilado o qué?', when: 'hace 2 h' },
      { who: 'Marcos', label: '🏃 Te estoy adelantando 😏', when: 'ayer' },
    ],
    liga: {
      semana: [['Marcos', 5, 2], ['Tú', 3, 1], ['Lucía', 3, 0], ['Javi', 2, -1], ['Irene', 1, 0]],
      mes: [['Marcos', 14, 1], ['Lucía', 11, -1], ['Tú', 9, 0], ['Javi', 6, 0], ['Irene', 5, 0]],
      total: [['Marcos', 212, 0], ['Lucía', 180, 0], ['Tú', 147, 0], ['Irene', 120, 0], ['Javi', 98, 0]],
    },
    amigos: [
      { name: 'Marcos', c: 120, s: 92 },
      { name: 'Lucía', c: 101, s: 79 },
      { name: 'Irene', c: 70, s: 50 },
      { name: 'Javi', total: 98 },
      { name: 'Sergio', c: 40, s: 24, veDeTi: 'solo el total' },
      { name: 'Nerea', hidden: true },
    ],
    grupos: [
      { name: 'Los del Pueblo', members: 7, color: '#fc2a6c' },
      { name: 'Piso Lavapiés', members: 4, color: '#a033b9' },
      { name: 'Las de la Uni', members: 5, color: '#fcf3ed' },
    ],
    pullasEnviables: [
      ['👴', '¿Te has jubilado o qué?'], ['😴', 'Semana floja, ¿eh?'], ['🏃', 'Te estoy adelantando 😏'], ['💨', 'Te como el polvo'],
      ['👀', '¿Sigues vivo?'], ['💪', '¡Ánimo, que se puede!'], ['🏆', 'Eres un crack'], ['🔥', 'Menuda racha llevas'],
    ],
    retosEnviables: ['Quién suma más esta semana', 'El primero en llegar a 3', 'El primero en llegar a 5', 'El primero en llegar a 10'],
  };

  window.FD = { IosFrame, Fit, Icon, RollNumber, useFlip, confetti, avatarColor, WEEK, DATA,
    LOGO_SIMBOLO: '__SIMBOLO__', LOGO_LOGOTIPO: '__LOGOTIPO__', LOGO_LOGOTIPO_TINTA: '__LOGOTIPO_TINTA__' };
})();
