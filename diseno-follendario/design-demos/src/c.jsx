// Dirección C · Calendario vivo
(function () {
  const { useState, useEffect, useRef } = React;
  const { IosFrame, useFollendario, RollNumber, useFlip, PULLAS, MONTH, WEEKDAYS } = FD;

  function Icon({ name }) {
    const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const paths = {
      home: <path {...p} d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
      users: <g {...p}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4" /></g>,
      plus: <path {...p} strokeWidth="2.4" d="M12 5v14M5 12h14" />,
      calendar: <g {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="3" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></g>,
      user: <g {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" /></g>,
    };
    return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
  }

  const Heart = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="#10081a" /></svg>
  );
  const Spark = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.8 5 2.9 7.8 9.5 9.5-6.6 1.7-8.7 4.5-9.5 9.5-.8-5-2.9-7.8-9.5-9.5 6.6-1.7 8.7-4.5 9.5-9.5z" fill="#fdf7f2" /></svg>
  );

  function Calendar({ app }) {
    const last = app.state.lastLog;
    const cells = [];
    for (let i = 0; i < MONTH.offset; i++) cells.push(<span key={'b' + i} aria-hidden="true"></span>);
    for (let n = 1; n <= MONTH.days; n++) {
      const l = app.state.logs[n] || { c: 0, s: 0 };
      const count = l.c + l.s;
      const kind = l.c && l.s ? 'b' : l.c ? 'c' : l.s ? 's' : '';
      const today = n === MONTH.today;
      const future = n > MONTH.today;
      const label = `${n} de septiembre${count ? `: ${l.c} en compañía, ${l.s} en solitario` : ''}`;
      cells.push(
        <div key={n} className={['fc-cell', kind, today && 'today', future && 'future', today && last && 'thump'].filter(Boolean).join(' ')} role="img" aria-label={label} data-seq={today && last ? last.seq : undefined}>
          <span className="fc-n">{n}</span>
          {count > 1 && <span className="fc-x">×{count}</span>}
          {today && last && (
            <React.Fragment key={last.seq}>
              <span className="fc-stamp">{last.kind === 'c' ? <Heart /> : <Spark />}</span>
              <span className="fc-ripple"></span>
            </React.Fragment>
          )}
        </div>
      );
    }
    return (
      <section className="fc-cal" aria-label="Calendario de septiembre">
        <span className="fc-ring l" aria-hidden="true"></span>
        <span className="fc-ring r" aria-hidden="true"></span>
        <header className="fc-cal-head">
          <div className="fc-month display">Septiembre</div>
          <div className="fc-head-row">
            <div className="fc-bignum">
              <RollNumber value={app.week} className="display" />
              <span className="lbl">esta<br />semana</span>
            </div>
            <div className="fc-head-small">{app.month} este mes<br />{app.total} en total</div>
          </div>
        </header>
        <div className="fc-body">
          <div className="fc-wd" aria-hidden="true">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>
          <ThumpGrid seq={last ? last.seq : 0}>{cells}</ThumpGrid>
          <div className="fc-legend">
            <span><i className="c"></i>En compañía</span>
            <span><i className="s"></i>En solitario</span>
            <span><i className="b"></i>Los dos</span>
          </div>
        </div>
      </section>
    );
  }

  // Reinicia la animación del día de hoy en cada apunte (la clase se quita y se vuelve a poner).
  function ThumpGrid({ seq, children }) {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current && ref.current.querySelector('.fc-cell.thump');
      if (!el) return;
      el.classList.remove('thump');
      void el.offsetWidth;
      el.classList.add('thump');
    }, [seq]);
    return <div className="fc-grid" ref={ref}>{children}</div>;
  }

  function Home({ app, openPulla, setTab }) {
    const { week, duel } = app;
    const headline = week < 5 ? 'Marcos te ha adelantado' : week === 5 ? 'Empatas con Marcos' : 'Has adelantado a Marcos';
    return (
      <React.Fragment>
        <div className="fc-top">
          <p>Jueves 17 · Semana 38</p>
          <button type="button" className="fc-avatar" aria-label="Tu perfil">Á</button>
        </div>
        <Calendar app={app} />
        <div className="fc-section-head">
          <h2 className="display">En tus grupos</h2>
          <button type="button" className="fc-link" onClick={() => setTab('grupos')}>Ver grupo</button>
        </div>
        <div className="fc-rail" aria-label="Novedades de tus grupos">
          <article className="fc-card ink">
            <p className="eyebrow">Los del Pueblo · hace 2 h</p>
            <h3 className="display">{headline}</h3>
            <p className="foot">Marcos {5} · Tú {week}</p>
          </article>
          <article className="fc-card pink">
            <p className="eyebrow">Los del Pueblo · hoy</p>
            <h3 className="display">Sergio lleva 9 días de sequía</h3>
            <button type="button" className="fc-btn ink" onClick={() => openPulla('Sergio')}>Mandarle una pulla</button>
          </article>
          <article className="fc-card egg">
            <p className="eyebrow">Duelo · quedan {duel.left} días</p>
            <h3 className="display">Tú {duel.me} – Javi {duel.them}</h3>
            <p className="foot">Quién suma más esta semana</p>
          </article>
        </div>
      </React.Fragment>
    );
  }

  const PERIODS = [['semana', 'Semana'], ['mes', 'Mes'], ['siempre', 'Siempre']];
  const MARKS = { marcos: ['MVP', 'pink'], lucia: ['Constante', 'egg'], sergio: ['Farolillo rojo', 'mute'] };

  function Group({ app, setTab }) {
    const [period, setPeriod] = useState('semana');
    const ranked = app.rank(period);
    const flip = useFlip(period + ranked.map((m) => m.id + m[period]).join());
    const max = Math.max(...ranked.map((m) => m[period])) || 1;
    const g = app.group;
    const prevDone = useRef(g.done);
    useEffect(() => { prevDone.current = g.done; });
    const mine = app.state.feed.filter((f) => f.mine);
    return (
      <React.Fragment>
        <div className="fc-top">
          <button type="button" className="fc-link" onClick={() => setTab('inicio')}>‹ Inicio</button>
          <button type="button" className="fc-btn line" onClick={() => app.notice('Enlace de invitación copiado')}>Invitar</button>
        </div>
        <header className="fc-ghead">
          <h1 className="display">Los del<br />Pueblo</h1>
          <p>7 miembros · Temporada de septiembre · quedan 13 días</p>
        </header>
        <div className="fc-period" role="tablist" aria-label="Periodo">
          {PERIODS.map(([p, label]) => (
            <button type="button" role="tab" key={p} aria-selected={p === period} className={p === period ? 'on' : ''} onClick={() => setPeriod(p)}>{label}</button>
          ))}
          <span className="ind" style={{ transform: `translateX(${PERIODS.findIndex(([p]) => p === period) * 100}%)` }} aria-hidden="true"></span>
        </div>
        <ol className="fc-ladder">
          {ranked.map((m, i) => {
            const size = Math.round(22 + 40 * (m[period] / max));
            const mark = period === 'semana' && MARKS[m.id];
            return (
              <li key={m.id} ref={flip(m.id)} className={m.me ? 'me' : ''}>
                <span className="pos">{i + 1}</span>
                <span className="who">
                  <span className="name display" style={{ fontSize: size }}>{m.me ? 'Tú' : m.name}</span>
                  {mark && <span className={'fc-mark ' + mark[1]} style={{ animationDelay: 200 + i * 90 + 'ms' }}>{mark[0]}</span>}
                </span>
                <span className="val display">{m[period]}</span>
              </li>
            );
          })}
        </ol>
        <section className="fc-goal" aria-label="Objetivo del grupo">
          <div className="big display">{g.done} <small>de {g.goal}</small></div>
          <p>Objetivo del grupo para septiembre. Entre todos, que se puede.</p>
          <div className="fc-goal-grid">
            {Array.from({ length: g.goal }, (_, i) => <i key={i} className={(i < g.done ? 'on' : '') + (i >= prevDone.current && i < g.done ? ' new' : '')}></i>)}
          </div>
        </section>
        <div className="fc-section-head"><h2 className="display">El muro</h2></div>
        <section aria-label="Muro del grupo">
          {[...mine].map((f) => (
            <figure className="fc-quote mine" key={f.id}>
              <blockquote className="display">«{f.text}»</blockquote>
              <figcaption>Tú a {f.to} · ahora</figcaption>
            </figure>
          ))}
          <figure className="fc-quote">
            <blockquote className="display">«¿Te has jubilado o qué?»</blockquote>
            <figcaption>Nerea a Sergio · ayer</figcaption>
          </figure>
          <figure className="fc-quote">
            <blockquote className="display">Lucía lleva 4 días de racha</blockquote>
            <figcaption>Evento del grupo · hace 5 h</figcaption>
          </figure>
        </section>
        <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>Manda una pulla a Sergio</p>
        <div className="fc-chips">
          {PULLAS.map((p) => (
            <button type="button" key={p.id} className="fc-chip" onClick={() => app.pulla('Sergio', p)}>{p.emoji} {p.text}</button>
          ))}
        </div>
      </React.Fragment>
    );
  }

  function Toast({ app, tab }) {
    const t = app.state.toast;
    if (!t) return null;
    const high = tab !== 'inicio';
    if (t.kind === 'log') {
      return (
        <div className={'fc-toast' + (high ? ' high' : '')} key={t.seq} role="status">
          <div className="fc-toast-body">
            <strong className="display">{t.goalHit ? 'Semana cumplida' : `Llevas ${t.week} esta semana`}</strong>
            <span>{t.rival}</span>
          </div>
          <button type="button" className="fc-undo" onClick={app.undo}>Deshacer</button>
        </div>
      );
    }
    return (
      <div className={'fc-toast' + (high ? ' high' : '')} key={t.seq} role="status">
        <div className="fc-toast-body">
          <strong className="display">{t.kind === 'pulla' ? `Pulla a ${t.to}` : t.text}</strong>
          {t.kind === 'pulla' && <span>«{t.pulla.text}»</span>}
        </div>
      </div>
    );
  }

  function Dock({ onLog }) {
    return (
      <div className="fc-dock">
        <button type="button" className="fc-half c display" onClick={() => onLog('c')}><span className="plus" aria-hidden="true">+</span>Compañía</button>
        <button type="button" className="fc-half s display" onClick={() => onLog('s')}><span className="plus" aria-hidden="true">+</span>Solitario</button>
      </div>
    );
  }

  const TABS = [['inicio', 'Inicio', 'home'], ['grupos', 'Grupos', 'users'], ['plus', 'Apuntar', 'plus'], ['calendario', 'Calendario', 'calendar'], ['tu', 'Tú', 'user']];

  function App({ initial }) {
    const app = useFollendario();
    const [tab, setTab] = useState(initial);
    const [sheet, setSheet] = useState(null);
    const [to, setTo] = useState('Sergio');
    const openPulla = (name) => { setTo(name); setSheet('pulla'); };
    const press = (id) => {
      if (id === 'plus') setSheet('log');
      else if (id === 'inicio' || id === 'grupos') setTab(id);
      else app.notice('Llega en el diseño completo');
    };
    const overlay = (
      <div className="fc" style={{ position: 'absolute', inset: 0, height: 'auto', pointerEvents: 'none', zIndex: 15 }}>
        <div className={'fc-overlay' + (sheet === 'log' ? ' open' : '')} aria-hidden={sheet !== 'log'}>
          <div className="fc-backdrop" onClick={() => setSheet(null)}></div>
          <div className="fc-sheet" role="dialog" aria-label="Apuntar">
            <span className="fc-grab" aria-hidden="true"></span>
            <h3 className="display">¿Qué ha caído hoy?</h3>
            <Dock onLog={(k) => { app.log(k); setSheet(null); }} />
          </div>
        </div>
        <div className={'fc-overlay' + (sheet === 'pulla' ? ' open' : '')} aria-hidden={sheet !== 'pulla'}>
          <div className="fc-backdrop" onClick={() => setSheet(null)}></div>
          <div className="fc-sheet" role="dialog" aria-label={'Pulla para ' + to}>
            <span className="fc-grab" aria-hidden="true"></span>
            <h3 className="display">Pulla para {to}</h3>
            <ul className="fc-plist">
              {PULLAS.slice(0, 5).map((p) => (
                <li key={p.id}><button type="button" className="display" onClick={() => { app.pulla(to, p); setSheet(null); }}><span aria-hidden="true">{p.emoji}</span>{p.text}</button></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
    return (
      <IosFrame screenBg="#f4e6de" overlay={overlay}>
        <div className="fc">
          <div className="fc-screen">
            <main className="fc-main" key={tab}>
              {tab === 'inicio' ? <Home app={app} openPulla={openPulla} setTab={setTab} /> : <Group app={app} setTab={setTab} />}
            </main>
            <Toast app={app} tab={tab} />
            {tab === 'inicio' && <Dock onLog={app.log} />}
            <nav className="fc-tabs" aria-label="Secciones">
              {TABS.map(([id, label, icon]) =>
                id === 'plus' ? (
                  <button type="button" key={id} className="fc-plus" aria-label={label} onClick={() => press(id)}><Icon name={icon} /></button>
                ) : (
                  <button type="button" key={id} className={'fc-tab' + (tab === id ? ' on' : '')} aria-current={tab === id ? 'page' : undefined} onClick={() => press(id)}>
                    <Icon name={icon} />{label}
                  </button>
                )
              )}
            </nav>
          </div>
        </div>
      </IosFrame>
    );
  }

  window.DirC = { App };
})();
