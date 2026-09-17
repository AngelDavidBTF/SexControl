// Piezas comunes a las tres direcciones: marco de iPhone (assets/ios_frame.jsx de huashu-design,
// con fondo de pantalla configurable), escalado a móvil, datos reales de ejemplo y el estado de la demo.
// Lo visual de cada dirección vive en su propio fichero; aquí solo hay contenido y mecánica.
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useReducer } = React;

  /* ---------- IosFrame (huashu-design) ---------- */
  const iosFrameStyles = {
    wrapper: { display: 'inline-block', padding: 12, background: '#000', borderRadius: 60, boxShadow: '0 0 0 2px #1f2937, 0 20px 60px rgba(0,0,0,0.3)', position: 'relative' },
    screen: { position: 'relative', borderRadius: 48, overflow: 'hidden', background: '#fff' },
    statusBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px 0 32px', fontSize: 16, fontWeight: 600, fontFamily: '-apple-system, "SF Pro Text", sans-serif', zIndex: 20, pointerEvents: 'none' },
    dynamicIsland: { position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 124, height: 36, background: '#000', borderRadius: 999, zIndex: 30 },
    statusIcons: { display: 'flex', alignItems: 'center', gap: 6 },
    signalIcon: { display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 },
    signalBar: { width: 3, background: 'currentColor', borderRadius: 1 },
    batteryIcon: { width: 26, height: 12, border: '1.5px solid currentColor', borderRadius: 3, padding: 1, position: 'relative', opacity: 0.8 },
    batteryCap: { position: 'absolute', top: 3, right: -3, width: 2, height: 6, background: 'currentColor', borderRadius: '0 1px 1px 0' },
    content: { position: 'absolute', top: 54, left: 0, right: 0, bottom: 34, overflow: 'clip' },
    homeIndicator: { position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: 140, height: 5, background: 'rgba(0,0,0,0.3)', borderRadius: 999, zIndex: 10 },
    homeIndicatorDark: { background: 'rgba(255,255,255,0.5)' },
  };

  function IosFrame({ children, width = 393, height = 852, time = '23:41', battery = 64, darkMode = false, screenBg, overlay }) {
    const textColor = darkMode ? '#fff' : '#000';
    return (
      <div style={iosFrameStyles.wrapper}>
        <div style={{ ...iosFrameStyles.screen, width, height, background: screenBg || (darkMode ? '#000' : '#fff') }}>
          <div style={{ ...iosFrameStyles.statusBar, color: textColor }}>
            <span>{time}</span>
            <div style={iosFrameStyles.statusIcons}>
              <div style={iosFrameStyles.signalIcon}>
                <div style={{ ...iosFrameStyles.signalBar, height: 4 }} />
                <div style={{ ...iosFrameStyles.signalBar, height: 6 }} />
                <div style={{ ...iosFrameStyles.signalBar, height: 9 }} />
                <div style={{ ...iosFrameStyles.signalBar, height: 11 }} />
              </div>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" style={{ color: textColor }}>
                <path d="M8 11.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
                <path d="M3 7.5a7 7 0 0110 0" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                <path d="M1 4.5a11 11 0 0114 0" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
              </svg>
              <div style={iosFrameStyles.batteryIcon}>
                <div style={{ width: `${battery}%`, height: '100%', background: 'currentColor', borderRadius: 1, opacity: 0.9 }} />
                <div style={iosFrameStyles.batteryCap} />
              </div>
            </div>
          </div>
          <div style={iosFrameStyles.dynamicIsland} />
          <div style={iosFrameStyles.content}>{children}</div>
          {overlay}
          <div style={{ ...iosFrameStyles.homeIndicator, ...(darkMode ? iosFrameStyles.homeIndicatorDark : {}) }} />
        </div>
      </div>
    );
  }

  /* ---------- Escala el teléfono al ancho disponible (móvil) ---------- */
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
      <div ref={ref} className="fit" style={{ width: '100%', maxWidth: w }}>
        <div style={{ width: w * s, height: h * s }}>
          <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: '0 0' }}>{children}</div>
        </div>
      </div>
    );
  }

  /* ---------- Contenido real de ejemplo (spec-direcciones.md) ---------- */
  const PULLAS = [
    { id: 'vivo', emoji: '👀', text: '¿Sigues vivo?' },
    { id: 'jubilado', emoji: '👴', text: '¿Te has jubilado o qué?' },
    { id: 'floja', emoji: '😴', text: 'Semana floja, ¿eh?' },
    { id: 'polvo', emoji: '💨', text: 'Te como el polvo' },
    { id: 'alcanzo', emoji: '📈', text: 'Voy a por ti' },
    { id: 'adelanto', emoji: '🏃', text: 'Te estoy adelantando 😏' },
  ];

  // Septiembre de 2026 empieza en martes; hoy es jueves 17.
  const MONTH = { name: 'Septiembre', year: 2026, days: 30, offset: 1, today: 17, week: [14, 20] };
  const MONTH_LOGS = { 2: { c: 1, s: 0 }, 5: { c: 0, s: 1 }, 6: { c: 2, s: 0 }, 9: { c: 0, s: 1 }, 12: { c: 1, s: 0 }, 14: { c: 1, s: 0 }, 16: { c: 0, s: 1 }, 17: { c: 1, s: 0 } };
  const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const MEMBERS = [
    { id: 'marcos', name: 'Marcos', semana: 5, mes: 14, siempre: 212 },
    { id: 'alex', name: 'Álex', me: true, semana: 3, mes: 9, siempre: 147 },
    { id: 'lucia', name: 'Lucía', semana: 3, mes: 11, siempre: 180 },
    { id: 'javi', name: 'Javi', semana: 2, mes: 6, siempre: 98 },
    { id: 'nerea', name: 'Nerea', semana: 1, mes: 4, siempre: 77 },
    { id: 'irene', name: 'Irene', semana: 1, mes: 5, siempre: 120 },
    { id: 'sergio', name: 'Sergio', semana: 0, mes: 2, siempre: 64 },
  ];

  const TITLES = [
    { id: 'mvp', emoji: '🥇', title: 'MVP de la semana', who: 'Marcos', detail: '5 esta semana' },
    { id: 'constante', emoji: '🔥', title: 'El más constante', who: 'Lucía', detail: '4 días seguidos' },
    { id: 'desaparecido', emoji: '💤', title: 'Desaparecido', who: 'Sergio', detail: '9 días sin aparecer' },
    { id: 'farolillo', emoji: '🐢', title: 'Farolillo rojo', who: 'Sergio', detail: 'sin estrenar esta semana' },
  ];

  const FEED = [
    { id: 'f1', type: 'adelanta', who: 'Marcos', text: 'Marcos te ha adelantado esta semana', short: 'te adelanta', clock: '21:38', ago: 'hace 2 h' },
    { id: 'f2', type: 'racha', who: 'Lucía', text: 'Lucía lleva 4 días de racha', short: 'racha de 4 días', clock: '18:12', ago: 'hace 5 h' },
    { id: 'f3', type: 'pulla', who: 'Nerea', to: 'Sergio', emoji: '👴', text: '¿Te has jubilado o qué?', clock: 'ayer', ago: 'ayer' },
    { id: 'f4', type: 'sequia', who: 'Sergio', text: 'Sergio lleva 9 días de sequía', short: '9 días de sequía', clock: 'hoy', ago: 'hoy' },
  ];

  const GROUP = { name: 'Los del Pueblo', members: 7, season: 'Septiembre', left: 13, goal: 40, done: 27 };
  const BASE = { c: 2, s: 1, prevWeek: 2, streak: 2, month: 9, total: 147, goal: 4, rival: { name: 'Marcos', week: 5 }, duel: { vs: 'Javi', them: 2, left: 3 } };

  /* ---------- Estado de la demo ---------- */
  function rivalLine(total) {
    const lead = BASE.rival.week;
    if (total < lead - 1) return `Te faltan ${lead - total} para pillar a Marcos.`;
    if (total === lead - 1) return 'Te falta 1 para pillar a Marcos.';
    if (total === lead) return 'Empatas con Marcos. Ojo.';
    return 'Adelantas a Marcos. Que se vaya enterando.';
  }

  function reducer(state, action) {
    switch (action.type) {
      case 'log': {
        const k = action.kind;
        const logs = { ...state.logs, [MONTH.today]: { ...state.logs[MONTH.today], [k]: state.logs[MONTH.today][k] + 1 } };
        const week = state.c + state.s + 1;
        const seq = state.seq + 1;
        return {
          ...state, seq, logs,
          c: state.c + (k === 'c' ? 1 : 0),
          s: state.s + (k === 's' ? 1 : 0),
          history: [...state.history, k],
          lastLog: { kind: k, seq },
          toast: { kind: 'log', seq, logKind: k, week, goalHit: week === BASE.goal, rival: rivalLine(week) },
        };
      }
      case 'undo': {
        if (!state.history.length) return state;
        const k = state.history[state.history.length - 1];
        const logs = { ...state.logs, [MONTH.today]: { ...state.logs[MONTH.today], [k]: state.logs[MONTH.today][k] - 1 } };
        return { ...state, logs, c: state.c - (k === 'c' ? 1 : 0), s: state.s - (k === 's' ? 1 : 0), history: state.history.slice(0, -1), toast: null, lastLog: null };
      }
      case 'pulla': {
        const seq = state.seq + 1;
        const item = { id: 'p' + seq, type: 'pulla', who: 'Tú', to: action.to, emoji: action.pulla.emoji, text: action.pulla.text, clock: '23:41', ago: 'ahora', mine: true };
        return { ...state, seq, feed: [item, ...state.feed], toast: { kind: 'pulla', seq, to: action.to, pulla: action.pulla } };
      }
      case 'notice':
        return { ...state, seq: state.seq + 1, toast: { kind: 'notice', seq: state.seq + 1, text: action.text } };
      case 'hide':
        return state.toast && state.toast.seq === action.seq ? { ...state, toast: null } : state;
      default:
        return state;
    }
  }

  function useFollendario() {
    const [state, dispatch] = useReducer(reducer, null, () => ({
      c: BASE.c, s: BASE.s, seq: 0, logs: JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(MONTH_LOGS)))), history: [], feed: FEED, toast: null, lastLog: null,
    }));
    useEffect(() => {
      if (!state.toast) return undefined;
      const seq = state.toast.seq;
      const t = setTimeout(() => dispatch({ type: 'hide', seq }), state.toast.kind === 'log' ? 4200 : 2600);
      return () => clearTimeout(t);
    }, [state.toast && state.toast.seq]);

    const week = state.c + state.s;
    const added = week - (BASE.c + BASE.s);
    const members = MEMBERS.map((m) => (m.me ? { ...m, semana: m.semana + added, mes: m.mes + added, siempre: m.siempre + added } : m));
    const order = (m) => MEMBERS.findIndex((x) => x.id === m.id);
    const rank = (period) => [...members].sort((a, b) => b[period] - a[period] || order(a) - order(b));
    const weekDays = WEEKDAYS.map((d, i) => {
      const n = MONTH.week[0] + i;
      const l = state.logs[n] || { c: 0, s: 0 };
      return { d, n, c: l.c, s: l.s, today: n === MONTH.today, future: n > MONTH.today };
    });

    return {
      state, dispatch, week, weekDays, rank,
      month: BASE.month + added, total: BASE.total + added, goal: BASE.goal, prevWeek: BASE.prevWeek, streak: BASE.streak,
      duel: { ...BASE.duel, me: week },
      group: { ...GROUP, done: GROUP.done + added },
      log: (kind) => dispatch({ type: 'log', kind }),
      undo: () => dispatch({ type: 'undo' }),
      pulla: (to, pulla) => dispatch({ type: 'pulla', to, pulla }),
      notice: (text) => dispatch({ type: 'notice', text }),
    };
  }

  /* ---------- Número que rueda dígito a dígito ---------- */
  function RollNumber({ value, minDigits = 1, className = '' }) {
    const digits = String(Math.max(0, value)).padStart(minDigits, '0').split('');
    return (
      <span className={'roll ' + className} role="img" aria-label={String(value)}>
        {digits.map((d, i) => (
          <span className="roll-col" key={digits.length - i} aria-hidden="true">
            <span className="roll-strip" style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
              {'0123456789'.split('').map((n) => <span key={n}>{n}</span>)}
            </span>
          </span>
        ))}
      </span>
    );
  }

  /* ---------- FLIP: las filas se deslizan a su nuevo puesto ---------- */
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
        const dx = (prev.left - next.left) / scale;
        const dy = (prev.top - next.top) / scale;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 560, easing: 'cubic-bezier(0.34, 1.32, 0.64, 1)' }
        );
      });
    }, [orderKey]);
    return (key) => (el) => {
      if (el) nodes.current.set(key, el);
      else nodes.current.delete(key);
    };
  }

  /* ---------- Texto que se teclea (dirección A la usa; es genérico) ---------- */
  function useTyped(text, speed = 16) {
    const [n, setN] = useState(0);
    useEffect(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(text.length); return undefined; }
      setN(0);
      let i = 0;
      const t = setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(t); }, speed);
      return () => clearInterval(t);
    }, [text]);
    return text.slice(0, n);
  }

  function initials(name) { return name === 'Tú' ? 'T' : name.slice(0, 1); }

  window.FD = {
    IosFrame, Fit, useFollendario, RollNumber, useFlip, useTyped, initials,
    PULLAS, MONTH, WEEKDAYS, TITLES, GROUP,
    LOGO_SIMBOLO: '__SIMBOLO__', LOGO_LOGOTIPO: '__LOGOTIPO__',
  };
})();
