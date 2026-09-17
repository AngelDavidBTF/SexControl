// Dirección A · Marcador
(function () {
  const { useState, useEffect, useRef } = React;
  const { IosFrame, useFollendario, RollNumber, useFlip, useTyped, PULLAS, TITLES } = FD;

  const CUBE = { c: ['#ff76a0', '#fc2a6c', '#b3164a'], s: ['#bfe7f9', '#6fc8f1', '#3a8fbb'] };
  const NICK = { Marcos: '#fc2a6c', Lucía: '#6fc8f1', Nerea: '#6fdc95', Sergio: '#a597b3', Javi: '#d39be8', Tú: '#fcf3ed' };

  function Cube({ kind, index, animate, delay }) {
    const [top, left, right] = CUBE[kind];
    return (
      <svg className={'fa-cube' + (animate ? ' drop' : '')} style={{ bottom: index * 16, animationDelay: delay + 'ms' }} width="30" height="31" viewBox="0 0 30 31" aria-hidden="true">
        <polygon points="15,0 30,7.5 15,15 0,7.5" fill={top} />
        <polygon points="0,7.5 15,15 15,31 0,23.5" fill={left} />
        <polygon points="30,7.5 15,15 15,31 30,23.5" fill={right} />
        <polyline points="0.5,7.5 15,14.8 29.5,7.5" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="0.8" />
      </svg>
    );
  }

  function WeekStacks({ app }) {
    const first = useRef(true);
    useEffect(() => { first.current = false; }, []);
    const base = { c: 1, s: 0 }; // lo que había hoy antes de tocar nada
    return (
      <section className="fa-cell fa-week" aria-label="Tu semana, un cubo por cada vez">
        <div className="fa-week-head">
          <span className="fa-label mono">semana 38</span>
          <span className="fa-dim mono">un cubo por cada vez</span>
        </div>
        <div className="fa-stacks">
          {app.weekDays.map((day, di) => {
            const seq = day.today
              ? [...Array(base.c).fill('c'), ...Array(base.s).fill('s'), ...app.state.history]
              : [...Array(day.c).fill('c'), ...Array(day.s).fill('s')];
            return (
              <div className="fa-col" key={day.n}>
                <svg className="fa-plate" width="30" height="15" viewBox="0 0 30 15" aria-hidden="true">
                  <polygon points="15,0.5 29.5,7.5 15,14.5 0.5,7.5" fill={day.today ? 'rgba(252,42,108,.18)' : 'none'} stroke={day.today ? '#fc2a6c' : '#3a2d4d'} strokeDasharray={day.future ? '2 2' : ''} />
                </svg>
                {seq.map((kind, i) => (
                  <Cube key={i} kind={kind} index={i} animate delay={first.current ? 120 + di * 70 + i * 60 : 0} />
                ))}
              </div>
            );
          })}
        </div>
        <div className="fa-days mono">
          {app.weekDays.map((day) => (
            <span key={day.n} className={day.today ? 'today' : day.future ? 'future' : ''}>{day.d}</span>
          ))}
        </div>
      </section>
    );
  }

  function Key({ kind, onPress }) {
    return (
      <button type="button" className={'fa-key fa-key-' + kind} onClick={() => onPress(kind)}>
        <span className="fa-key-top mono"><span className="fa-led" aria-hidden="true"></span><span>+1</span></span>
        <span className="fa-key-label mono">{kind === 'c' ? 'EN COMPAÑÍA' : 'EN SOLITARIO'}</span>
      </button>
    );
  }

  function Typed({ text }) {
    const shown = useTyped(text, 22);
    return <span className="fa-msg">{shown}{shown.length < text.length && <span className="fa-caret" aria-hidden="true"></span>}</span>;
  }

  function FeedLine({ item, week, fresh }) {
    const nick = item.who === 'Tú' ? 'tú' : item.who.toLowerCase();
    let msg;
    if (item.type === 'adelanta') msg = <span className="fa-msg">te adelanta ▲ 5–{week}</span>;
    else if (item.type === 'racha') msg = <span className="fa-msg">racha ×4</span>;
    else if (item.type === 'sequia') msg = <span className="fa-msg">9 días de sequía</span>;
    else if (fresh) msg = <Typed text={`→ ${item.to.toLowerCase()} «${item.text}»`} />;
    else msg = <span className="fa-msg">→ {item.to.toLowerCase()} <q>{item.text}</q></span>;
    return (
      <div className="fa-line mono">
        <span className="fa-time">{item.clock}</span>
        <span className="fa-nick" style={{ color: NICK[item.who] }}>{nick}</span>
        {msg}
      </div>
    );
  }

  function Console({ app }) {
    const t = app.state.toast;
    const d = app.duel;
    const filled = Math.round((d.me / (d.me + d.them)) * 10);
    return (
      <section className="fa-console" aria-label="Actividad de tus grupos" aria-live="polite">
        <header className="fa-console-head mono"><span>~/tus-grupos</span><span className="fa-live">en vivo</span></header>
        {t && t.kind === 'log' && (
          <div className="fa-out" key={t.seq}>
            <div className="fa-line mono">
              <span className="fa-time">23:41</span>
              <span className="fa-nick">tú</span>
              <Typed text={t.logKind === 'c' ? '+1 en compañía' : '+1 en solitario'} />
            </div>
            <div className="fa-line fa-reply mono">
              <span className="fa-time">→</span>
              <span className="fa-msg">{(t.goalHit ? 'objetivo cumplido. ' : '') + t.rival.toLowerCase()}</span>
              <button type="button" className="fa-undo mono" onClick={app.undo}>[deshacer]</button>
            </div>
          </div>
        )}
        {app.state.feed.map((item, i) => <FeedLine key={item.id} item={item} week={app.week} fresh={item.mine && i === 0} />)}
        <div className="fa-line mono">
          <span className="fa-time">dom</span>
          <span className="fa-nick" style={{ color: NICK.Javi }}>duelo</span>
          <span className="fa-msg">javi <span className="fa-bar">{'■'.repeat(filled)}<span>{'■'.repeat(10 - filled)}</span></span> {d.me}–{d.them} · quedan {d.left}d</span>
        </div>
        <div className="fa-line mono"><span className="fa-time"></span><span><span className="fa-cursor" aria-hidden="true"></span></span></div>
      </section>
    );
  }

  function Home({ app }) {
    const { state, week } = app;
    const done = week >= app.goal;
    return (
      <React.Fragment>
        <div className="fa-top">
          <div className="fa-brand"><img src={FD.LOGO_SIMBOLO} alt="" /><span className="mono">follendario</span></div>
          <span className="fa-dim mono">sem 38 · jue 17 sep</span>
        </div>
        <div className="fa-bento">
          <section className="fa-cell fa-hero" aria-label="Esta semana">
            <span className="fa-label mono">esta semana</span>
            <div>
              <RollNumber value={week} minDigits={2} className="fa-big mono" />
              <div className="fa-delta mono">▲ {week - app.prevWeek} vs semana pasada</div>
            </div>
            <div>
              <div className="fa-split" aria-hidden="true"><i className="c" style={{ flexGrow: state.c }}></i><i className="s" style={{ flexGrow: state.s }}></i></div>
              <div className="fa-legend mono" style={{ marginTop: 8 }}>
                <span><b className="c"></b>{state.c} compañía</span>
                <span><b className="s"></b>{state.s} solitario</span>
              </div>
            </div>
          </section>
          <section className="fa-cell" aria-label="Racha">
            <span className="fa-label mono">racha</span>
            <span className="fa-mid mono">{app.streak}<small>días</small></span>
            <span className="fa-note mono">no aflojes</span>
          </section>
          <section className="fa-cell" aria-label="Objetivo semanal">
            <span className="fa-label mono">{done ? 'cumplido' : 'objetivo'}</span>
            <span className="fa-mid mono">{Math.min(week, app.goal)}<small>/{app.goal}</small></span>
            <div className={'fa-segs' + (done ? ' done' : '')}>
              {Array.from({ length: app.goal }, (_, i) => <i key={i} className={i < week ? 'on' : ''}></i>)}
            </div>
          </section>
        </div>
        <WeekStacks app={app} />
        <div className="fa-keys">
          <Key kind="c" onPress={app.log} />
          <Key kind="s" onPress={app.log} />
        </div>
        <Console app={app} />
      </React.Fragment>
    );
  }

  function Ticket() {
    const rows = [
      ['MVP', 'MARCOS · 5'],
      ['CONSTANTE', 'LUCÍA · 4d'],
      ['DESAPARECIDO', 'SERGIO · 9d'],
      ['FAROLILLO ROJO', 'SERGIO · 0'],
    ];
    return (
      <div className="fa-ticket-slot" aria-label="Títulos de la semana">
        <div className="fa-ticket mono">
          <h3>TICKET SEMANAL</h3>
          <p className="sub">los del pueblo · sem 38</p>
          <hr />
          {rows.map(([k, v]) => (
            <div className="fa-tline" key={k}><span>{k}</span><span></span><span>{v}</span></div>
          ))}
          <hr />
          <p className="foot">sergio, ¿sigues vivo?</p>
        </div>
      </div>
    );
  }

  function Group({ app, setTab }) {
    const [period, setPeriod] = useState('semana');
    const ranked = app.rank(period);
    const flip = useFlip(period + ranked.map((m) => m.id + m[period]).join());
    const max = Math.max(...ranked.map((m) => m[period])) || 1;
    const g = app.group;
    const prevDone = useRef(g.done);
    useEffect(() => { prevDone.current = g.done; });
    return (
      <React.Fragment>
        <div className="fa-top">
          <button type="button" className="fa-back mono" onClick={() => setTab('inicio')}>‹ inicio</button>
          <button type="button" className="fa-link mono" onClick={() => app.notice('enlace de invitación copiado')}>invitar ↗</button>
        </div>
        <header className="fa-ghead">
          <h2>Los del Pueblo</h2>
          <p className="fa-dim mono">7 miembros · temporada sep · quedan 13 d</p>
        </header>
        <section className="fa-cell" aria-label="Clasificación">
          <div className="fa-rank-head">
            <span className="fa-label mono">clasificación</span>
            <div className="fa-seg mono" role="tablist">
              {['semana', 'mes', 'siempre'].map((p) => (
                <button type="button" role="tab" key={p} aria-selected={p === period} className={p === period ? 'on' : ''} onClick={() => setPeriod(p)}>{p === 'siempre' ? 'total' : p}</button>
              ))}
            </div>
          </div>
          <ol className="fa-rows">
            {ranked.map((m, i) => (
              <li ref={flip(m.id)} key={m.id} className={'fa-row' + (m.me ? ' is-me' : '')}>
                <span className="fa-pos mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="fa-name">{m.name}{m.me && <em className="mono">tú</em>}</span>
                <span className="fa-blocks" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, b) => <i key={b} className={b < Math.round((m[period] / max) * 10) ? 'on' : ''}></i>)}
                </span>
                <span className="fa-val mono">{m[period]}</span>
              </li>
            ))}
          </ol>
        </section>
        <Ticket />
        <section className="fa-cell" aria-label="Objetivo del grupo">
          <div className="fa-goal-head"><span className="fa-label mono">objetivo del grupo</span><span className="mono">{g.done}<span className="fa-dim">/{g.goal}</span></span></div>
          <div className="fa-ticks">
            {Array.from({ length: g.goal }, (_, i) => <i key={i} className={(i < g.done ? 'on' : '') + (i >= prevDone.current && i < g.done ? ' new' : '')}></i>)}
          </div>
        </section>
        <section className="fa-cell" aria-label="Mandar una pulla">
          <span className="fa-label mono">pulla para sergio</span>
          <div className="fa-chips">
            {PULLAS.map((p) => (
              <button type="button" key={p.id} className="fa-chip mono" onClick={() => app.pulla('Sergio', p)}>{p.text.toLowerCase()}</button>
            ))}
          </div>
        </section>
      </React.Fragment>
    );
  }

  function Status({ app, tab }) {
    const t = app.state.toast;
    if (!t || (t.kind === 'log' && tab === 'inicio')) return null;
    let text;
    if (t.kind === 'log') text = `> +1 ${t.logKind === 'c' ? 'compañía' : 'solitario'}. ${t.rival.toLowerCase()}`;
    else if (t.kind === 'pulla') text = `> enviada a ${t.to.toLowerCase()}: «${t.pulla.text}»`;
    else text = `> ${t.text}`;
    return (
      <div className="fa-status mono" key={t.seq} role="status">
        <span>{text}</span>
        {t.kind === 'log' && <button type="button" className="fa-undo mono" onClick={app.undo}>[deshacer]</button>}
      </div>
    );
  }

  const TABS = [['inicio', 'inicio'], ['grupos', 'grupos'], ['plus', ''], ['calendario', 'calend.'], ['tu', 'tú']];

  function App({ initial }) {
    const app = useFollendario();
    const [tab, setTab] = useState(initial);
    const [sheet, setSheet] = useState(false);
    const press = (id) => {
      if (id === 'plus') setSheet(true);
      else if (id === 'inicio' || id === 'grupos') setTab(id);
      else app.notice('esta pantalla llega en el diseño completo');
    };
    const overlay = (
      <div className={'fa fa-overlay' + (sheet ? ' open' : '')} aria-hidden={!sheet}>
        <div className="fa-backdrop" onClick={() => setSheet(false)}></div>
        <div className="fa-sheet" role="dialog" aria-label="Apuntar">
          <div className="fa-sheet-head">
            <h3 className="mono">¿qué ha caído?</h3>
            <button type="button" className="fa-back mono" onClick={() => setSheet(false)}>cerrar</button>
          </div>
          <div className="fa-keys">
            <Key kind="c" onPress={(k) => { app.log(k); setSheet(false); }} />
            <Key kind="s" onPress={(k) => { app.log(k); setSheet(false); }} />
          </div>
        </div>
      </div>
    );
    return (
      <IosFrame darkMode screenBg="#10081a" overlay={overlay}>
        <div className="fa">
          <div className="fa-screen">
            <main className="fa-main" key={tab}>
              {tab === 'inicio' ? <Home app={app} /> : <Group app={app} setTab={setTab} />}
            </main>
            <Status app={app} tab={tab} />
            <nav className="fa-tabs" aria-label="Secciones">
              {TABS.map(([id, label]) =>
                id === 'plus' ? (
                  <button type="button" key={id} className="fa-plus mono" aria-label="Apuntar" onClick={() => press(id)}>+</button>
                ) : (
                  <button type="button" key={id} className={'fa-tab mono' + (tab === id ? ' on' : '')} aria-current={tab === id ? 'page' : undefined} onClick={() => press(id)}>{label}</button>
                )
              )}
            </nav>
          </div>
        </div>
      </IosFrame>
    );
  }

  window.DirA = { App };
})();
