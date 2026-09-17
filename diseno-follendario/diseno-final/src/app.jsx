// Follendario · cada teléfono es una mini app con su navegación, modales, hojas y avisos.
(function () {
  const { useState, useEffect, useRef } = React;
  const { IosFrame, Fit, confetti, DATA } = FD;
  const { Layer, ActionSheet, Toast } = FC;

  /* ---------- Tema compartido por toda la galería ---------- */
  const theme = {
    setting: 'oscuro',
    listeners: new Set(),
    effective() {
      if (this.setting === 'sistema') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return this.setting === 'oscuro' ? 'dark' : 'light';
    },
    set(v) {
      this.setting = v;
      const eff = this.effective();
      document.querySelectorAll('[data-fol-theme]').forEach((el) => el.setAttribute('data-fol-theme', eff));
      document.querySelectorAll('[data-set-theme]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === v)));
      this.listeners.forEach((l) => l(v));
    },
  };
  document.querySelectorAll('[data-set-theme]').forEach((b) => b.addEventListener('click', () => theme.set(b.dataset.setTheme)));

  const discreet = {
    on: false,
    listeners: new Set(),
    set(v) {
      this.on = v;
      document.querySelectorAll('[data-fol-theme]').forEach((el) => el.setAttribute('data-fol-discreet', v ? 'on' : 'off'));
      document.querySelectorAll('[data-set-discreet]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.setDiscreet === 'on') === v)));
      this.listeners.forEach((l) => l(v));
    },
  };
  document.querySelectorAll('[data-set-discreet]').forEach((b) => b.addEventListener('click', () => discreet.set(b.dataset.setDiscreet === 'on')));
  // DatoDirective: en modo discreto, tocar un número lo deja ver 3 segundos.
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-fol-discreet="on"] .dato');
    if (!el) return;
    el.classList.add('revelado');
    setTimeout(() => el.classList.remove('revelado'), 3000);
  }, true);

  function useDiscreet() {
    const [v, setV] = useState(discreet.on);
    useEffect(() => { discreet.listeners.add(setV); return () => discreet.listeners.delete(setV); }, []);
    return v;
  }

  function useThemeSetting() {
    const [v, setV] = useState(theme.setting);
    useEffect(() => { theme.listeners.add(setV); return () => theme.listeners.delete(setV); }, []);
    return [v, (x) => theme.set(x)];
  }

  const SCREENS = { sumar: 'Sumar', amigos: 'Amigos', estadisticas: 'Estadisticas', grupo: 'Grupo', ajustes: 'Ajustes', login: 'Login', bloqueo: 'Bloqueo', invitacion: 'Invitacion', unirse: 'Unirse' };
  const MODALS = { ficha: 'Ficha', detalles: 'Detalles', olvidada: 'Olvidada', qr: 'CompartirQR' };
  const MODAL_LABEL = { ficha: 'Ficha de Marcos', detalles: 'Detalles', olvidada: '¿Se te olvidó apuntar una?', qr: 'Invita a tus amigos' };

  function Phone({ start }) {
    const [stack, setStack] = useState([start.screen]);
    const [modalType, setModalType] = useState(start.modal || null);
    const [modalOpen, setModalOpen] = useState(!!start.modal);
    const [sheet, setSheet] = useState(null);
    const [toast, setToast] = useState(null);
    const [su, setSu] = useState({ c: DATA.totals.c, s: DATA.totals.s, history: [], lastSeq: 0, lastKind: 'c' });
    const [themeSetting, setTheme] = useThemeSetting();
    const isDiscreet = useDiscreet();
    const seq = useRef(0);
    const onToastAction = useRef(null);
    const host = useRef(null);

    useEffect(() => {
      if (!toast) return undefined;
      const t = setTimeout(() => setToast(null), toast.actions ? 5000 : 2600);
      return () => clearTimeout(t);
    }, [toast && toast.seq]);

    const showToast = (text, actions, handler) => {
      seq.current += 1;
      onToastAction.current = handler || null;
      setToast({ seq: seq.current, text, actions });
    };

    const app = {
      tab: (id) => setStack([id]),
      push: (id) => setStack((s) => [...s, id]),
      back: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      modal: (m) => { setModalType(m); setModalOpen(true); },
      closeModal: () => setModalOpen(false),
      sheet: (sh) => setSheet(sh),
      toast: (text, actions) => showToast(text, actions, (role) => { if (role === 'details') { setModalType('detalles'); setModalOpen(true); } }),
      notice: (what) => showToast(`«${what}» conserva su pantalla, con este estilo`),
      themeSetting,
      setTheme,
      discreet: isDiscreet,
      sumar: {
        ...su,
        log(kind) {
          const next = { ...su, c: su.c + (kind === 'c' ? 1 : 0), s: su.s + (kind === 's' ? 1 : 0), history: [...su.history, kind], lastSeq: su.lastSeq + 1, lastKind: kind };
          setSu(next);
          const weekDone = DATA.goals.week.done + next.history.length;
          const goal = weekDone === DATA.goals.week.target;
          if (goal && !isDiscreet) setTimeout(() => confetti(host.current.querySelector('.fol').parentElement.parentElement), 450);
          try { navigator.vibrate && navigator.vibrate([12, 40, 18]); } catch (e) { /* sin vibración */ }
          showToast(isDiscreet ? `${goal ? 'Objetivo cumplido · ' : ''}Apuntado` : `${goal ? '🎯 ¡Semana cumplida! · ' : ''}Apuntada: en ${kind === 'c' ? 'compañía' : 'solitario'}`, [{ text: 'Detalles', role: 'details' }, { text: 'Deshacer', role: 'undo' }], (role) => {
            if (role === 'undo') {
              setSu((cur) => {
                if (!cur.history.length) return cur;
                const k = cur.history[cur.history.length - 1];
                return { ...cur, c: cur.c - (k === 'c' ? 1 : 0), s: cur.s - (k === 's' ? 1 : 0), history: cur.history.slice(0, -1) };
              });
              setTimeout(() => showToast('Deshecha. Aquí no ha pasado nada.'), 60);
            } else if (role === 'details') {
              setModalType('detalles');
              setModalOpen(true);
            }
          });
        },
        removeLast() {
          if (su.history.length) {
            const k = su.history[su.history.length - 1];
            setSu({ ...su, c: su.c - (k === 'c' ? 1 : 0), s: su.s - (k === 's' ? 1 : 0), history: su.history.slice(0, -1) });
          }
          showToast('Borrada la última');
        },
      },
    };

    useEffect(() => {
      if (start.sheet === 'pulla') {
        setSheet({ title: 'Pulla para Marcos', actions: DATA.pullasEnviables.map(([e, t]) => ({ text: `${e} ${t}`, onPick: () => showToast(`Pulla enviada: «${t}»`) })) });
      }
    }, []);

    const current = stack[stack.length - 1];
    const Screen = FS[SCREENS[current]];
    const ModalScreen = modalType ? FS[MODALS[modalType]] : null;

    const overlay = (
      <div className="fol" style={{ position: 'absolute', inset: 0, height: 'auto', pointerEvents: 'none', zIndex: 15 }}>
        <Layer open={modalOpen} onClose={app.closeModal} label={modalType ? MODAL_LABEL[modalType] : ''}>
          {ModalScreen && <ModalScreen app={app} key={modalType} />}
        </Layer>
        <ActionSheet sheet={sheet} onClose={() => setSheet(null)} />
        <Toast toast={toast} onAction={(role) => { setToast(null); onToastAction.current && onToastAction.current(role); }} />
      </div>
    );

    return (
      <div ref={host} style={{ position: 'relative' }}>
        <IosFrame overlay={overlay}>
          <div className="fol">
            <Screen app={app} key={current + stack.length} seg={stack.length === 1 ? start.seg : undefined} />
          </div>
        </IosFrame>
      </div>
    );
  }

  document.querySelectorAll('.phone-slot').forEach((slot) => {
    const start = JSON.parse(slot.dataset.start);
    ReactDOM.createRoot(slot).render(<Fit><Phone start={start} /></Fit>);
  });
})();
