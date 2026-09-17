// Dirección B · Fiesta
(function () {
  const { useState, useMemo } = React;
  const { IosFrame, useFollendario, RollNumber, useFlip, PULLAS, TITLES, initials } = FD;

  const AVATAR = { marcos: '#fc2a6c', alex: '#52bd76', lucia: '#6fc8f1', javi: '#d9a6ec', nerea: '#fcf3ed', irene: '#ff9cbc', sergio: '#b3a2c4' };
  const REACTS = [['😂', 4], ['👀', 2], ['🔥', 1]];

  function Icon({ name }) {
    const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    const paths = {
      home: <path {...p} d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
      users: <g {...p}><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17.5 14.6c1.6.6 2.7 2 3 4.4" /></g>,
      plus: <path {...p} strokeWidth="2.6" d="M12 5v14M5 12h14" />,
      calendar: <g {...p}><rect x="4" y="5.5" width="16" height="14.5" rx="3" /><path d="M8 3.5v4M16 3.5v4M4 10h16" /></g>,
      user: <g {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" /></g>,
    };
    return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
  }

  function Avatar({ m, className = '' }) {
    return <span className={'fb-avatar ' + className} style={{ background: AVATAR[m.id] }} aria-hidden="true">{initials(m.name)}</span>;
  }

  function Rain({ drop }) {
    const drops = useMemo(() => {
      const set = drop.kind === 'c' ? ['❤️', '🍆', '💞', '❤️', '🔥'] : ['✨', '🍆', '💫', '✨', '🔥'];
      return Array.from({ length: drop.goalHit ? 34 : 22 }, (_, i) => ({
        e: set[i % set.length],
        x: Math.round(Math.random() * 92) + '%',
        s: 20 + Math.round(Math.random() * 18) + 'px',
        d: 1100 + Math.round(Math.random() * 700) + 'ms',
        delay: Math.round(Math.random() * 420) + 'ms',
        r: Math.round(Math.random() * 240 - 120) + 'deg',
      }));
    }, [drop.seq]);
    return (
      <div className="fb-rain" aria-hidden="true">
        {drops.map((d, i) => (
          <span key={i} className="fb-drop" style={{ '--x': d.x, '--s': d.s, '--d': d.d, '--delay': d.delay, '--r': d.r }}>{d.e}</span>
        ))}
      </div>
    );
  }

  function WeekPoster({ app }) {
    const { week, weekDays } = app;
    const done = week >= app.goal;
    return (
      <section className="fb-poster" aria-label="Tu semana">
        <div className="fb-poster-top"><span className="fb-pill">Semana 38</span><span>14–20 sep</span></div>
        <div className="fb-poster-main">
          <RollNumber value={week} className="fb-huge" />
          <div className="fb-poster-copy">
            <strong>esta semana</strong>
            <span>▲ {week - app.prevWeek} más que la pasada</span>
          </div>
        </div>
        <div className="fb-days">
          {weekDays.map((day) => {
            const n = day.c + day.s;
            const emoji = n === 0 ? '' : day.c >= day.s ? '❤️' : '✨';
            return (
              <div key={day.n} className={'fb-day' + (day.today ? ' today' : '') + (day.future ? ' future' : '')}>
                <span className="fb-day-dot">
                  {emoji && <span className="fb-day-emoji" key={day.c + '-' + day.s}>{emoji}</span>}
                  {n > 1 && <span className="fb-day-count">{n}</span>}
                </span>
                <span>{day.d}</span>
              </div>
            );
          })}
        </div>
        <span className="fb-sticker fb-sticker-1">🔥 {app.streak} días de racha</span>
        <span className={'fb-sticker fb-sticker-2' + (done ? ' done' : '')} key={done ? 'done' : 'todo'}>🎯 {done ? '¡Cumplido!' : `${week}/${app.goal}`}</span>
      </section>
    );
  }

  function Reacts() {
    const [mine, setMine] = useState({});
    return (
      <div className="fb-reacts">
        {REACTS.map(([e, base]) => {
          const on = !!mine[e];
          return (
            <button type="button" key={e} className={'fb-react' + (on ? ' on' : '')} aria-pressed={on} onClick={() => setMine({ ...mine, [e]: !on })}>
              {e} <span className="n" key={on ? 'on' : 'off'}>{base + (on ? 1 : 0)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function Home({ app, openLog, openPulla, setTab }) {
    const { week, duel } = app;
    const headline = week < 5 ? 'Marcos te ha adelantado 🏃' : week === 5 ? 'Empatas con Marcos 👀' : 'Has adelantado a Marcos 😎';
    return (
      <React.Fragment>
        <header className="fb-hello">
          <div>
            <p className="fb-kicker">Jueves, 23:41</p>
            <h1 className="display">Buenas noches, Álex</h1>
          </div>
          <Avatar m={{ id: 'alex', name: 'Álex' }} />
        </header>
        <WeekPoster app={app} />
        <button type="button" className="fb-cta" onClick={openLog}>
          <img src={FD.LOGO_SIMBOLO} alt="" />Apuntar uno
        </button>
        <div className="fb-section-head">
          <h2>En tus grupos</h2>
          <button type="button" className="fb-link" onClick={() => setTab('grupos')}>Ver grupo</button>
        </div>
        <article className="fb-event is-egg">
          <header><span className="fb-chip">Los del Pueblo</span><span className="fb-ago">hace 2 h</span></header>
          <h3>{headline}</h3>
          <div className="fb-score"><span>Marcos <b>5</b></span><span className="fb-vs">contra</span><span>Tú <b>{week}</b></span></div>
          <Reacts />
        </article>
        <article className="fb-event is-cream">
          <header><span className="fb-chip">⚔️ Duelo</span><span className="fb-ago">quedan {duel.left} días</span></header>
          <h3>Tú contra Javi</h3>
          <p>Quién suma más esta semana</p>
          <div className="fb-duel">
            <div><RollNumber value={duel.me} className="fb-num" /><small>Tú</small></div>
            <div className="fb-duel-bar" aria-hidden="true"><i style={{ transform: `scaleX(${duel.me / (duel.me + duel.them)})` }}></i></div>
            <div><span className="fb-num">{duel.them}</span><small>Javi</small></div>
          </div>
          <button type="button" className="fb-btn pink" onClick={() => openPulla('Javi')}>Pincharle 👉</button>
        </article>
        <article className="fb-event is-dark">
          <header><span className="fb-chip">Los del Pueblo</span><span className="fb-ago">hoy</span></header>
          <span className="fb-cactus" aria-hidden="true">🌵</span>
          <h3>Sergio lleva 9 días de sequía</h3>
          <p style={{ color: 'var(--muted)' }}>Alguien tendría que decirle algo.</p>
          <button type="button" className="fb-btn cream" onClick={() => openPulla('Sergio')}>Mandarle una pulla</button>
        </article>
      </React.Fragment>
    );
  }

  const PERIODS = [['semana', 'Semana'], ['mes', 'Mes'], ['siempre', 'Siempre']];

  function Group({ app, setTab }) {
    const [period, setPeriod] = useState('semana');
    const ranked = app.rank(period);
    const flip = useFlip(period + ranked.map((m) => m.id + m[period]).join());
    const podium = [ranked[1], ranked[0], ranked[2]];
    const mine = app.state.feed.filter((f) => f.mine).reverse();
    return (
      <React.Fragment>
        <div className="fb-top">
          <button type="button" className="fb-link" onClick={() => setTab('inicio')}>‹ Inicio</button>
          <button type="button" className="fb-btn cream" onClick={() => app.notice('Enlace de invitación copiado')}>Invitar</button>
        </div>
        <section className="fb-gposter">
          <img className="fb-gposter-art" src={FD.LOGO_SIMBOLO} alt="" />
          <p className="fb-kicker">Temporada de septiembre · quedan 13 días</p>
          <h1>Los del Pueblo</h1>
          <div className="fb-avatars">
            {ranked.map((m) => <Avatar key={m.id} m={m} />)}
            <span>7 miembros</span>
          </div>
        </section>
        <div className="fb-seg" role="tablist" aria-label="Periodo">
          <span className="fb-seg-ind" style={{ transform: `translateX(${PERIODS.findIndex(([p]) => p === period) * 100}%)` }} aria-hidden="true"></span>
          {PERIODS.map(([p, label]) => (
            <button type="button" role="tab" key={p} aria-selected={p === period} className={p === period ? 'on' : ''} onClick={() => setPeriod(p)}>{label}</button>
          ))}
        </div>
        <section className="fb-podium" aria-label="Podio">
          {podium.map((m, i) => {
            const place = i === 1 ? 1 : i === 0 ? 2 : 3;
            return (
              <div className="fb-place" key={m.id} ref={flip(m.id)}>
                <span style={{ position: 'relative' }}>
                  {place === 1 && <span className="fb-crown" aria-hidden="true">👑</span>}
                  <Avatar m={m} />
                </span>
                <span className="name">{m.me ? 'Tú' : m.name}</span>
                <span className={'fb-block p' + place}>{m[period]}</span>
              </div>
            );
          })}
        </section>
        <ol className="fb-list" start="4">
          {ranked.slice(3).map((m, i) => (
            <li key={m.id} ref={flip(m.id)}>
              <span className="pos">{i + 4}</span>
              <Avatar m={m} />
              <span>
                {m.me ? 'Tú' : m.name}
                {m.id === 'sergio' && period === 'semana' && <span className="tag">🐢 Farolillo rojo</span>}
              </span>
              <span className="val">{m[period]}</span>
            </li>
          ))}
        </ol>
        <div className="fb-section-head"><h2>Títulos de la semana</h2></div>
        <div className="fb-titles">
          {TITLES.map((t) => (
            <div className="fb-title" key={t.id}>
              <span className="e" aria-hidden="true">{t.emoji}</span>
              <strong>{t.title}</strong>
              <span>{t.who} · {t.detail}</span>
            </div>
          ))}
        </div>
        <div className="fb-section-head"><h2>Muro</h2></div>
        <section className="fb-wall" aria-label="Muro del grupo">
          <span className="fb-event-pill">🔥 Lucía lleva 4 días de racha</span>
          <div className="fb-bubble them"><small>Nerea para Sergio</small><p>👴 ¿Te has jubilado o qué?</p></div>
          <span className="fb-event-pill">🏃 Marcos ha adelantado a Álex</span>
          {mine.map((f) => (
            <div className="fb-bubble me" key={f.id}><small>Tú para {f.to}</small><p>{f.emoji} {f.text}</p></div>
          ))}
          <p className="fb-kicker" style={{ marginTop: 4 }}>Manda una pulla a Sergio</p>
          <div className="fb-composer">
            {PULLAS.map((p) => (
              <button type="button" key={p.id} className="fb-react" onClick={() => app.pulla('Sergio', p)}>{p.emoji} {p.text}</button>
            ))}
          </div>
        </section>
      </React.Fragment>
    );
  }

  function Toast({ app }) {
    const t = app.state.toast;
    if (!t) return null;
    if (t.kind === 'log') {
      return (
        <div className="fb-toast" key={t.seq} role="status">
          <span className="fb-toast-emoji" aria-hidden="true">{t.goalHit ? '🎯' : t.logKind === 'c' ? '❤️' : '✨'}</span>
          <div className="fb-toast-body">
            <strong>{t.goalHit ? '¡Semana cumplida!' : `¡Apuntado! Llevas ${t.week}`}</strong>
            <span>{t.rival}</span>
          </div>
          <button type="button" className="fb-undo" onClick={app.undo}>Deshacer</button>
        </div>
      );
    }
    const text = t.kind === 'pulla' ? `Pulla enviada a ${t.to}` : t.text;
    return (
      <div className="fb-toast" key={t.seq} role="status">
        <span className="fb-toast-emoji" aria-hidden="true">{t.kind === 'pulla' ? t.pulla.emoji : '📨'}</span>
        <div className="fb-toast-body"><strong>{text}</strong>{t.kind === 'pulla' && <span>«{t.pulla.text}»</span>}</div>
      </div>
    );
  }

  const TABS = [['inicio', 'Inicio', 'home'], ['grupos', 'Grupos', 'users'], ['plus', 'Apuntar', 'plus'], ['calendario', 'Calendario', 'calendar'], ['tu', 'Tú', 'user']];

  function App({ initial }) {
    const app = useFollendario();
    const [tab, setTab] = useState(initial);
    const [sheet, setSheet] = useState(null); // 'log' | {pulla: nombre}
    const [lastTo, setLastTo] = useState('Javi');
    const openPulla = (to) => { setLastTo(to); setSheet('pulla'); };
    const t = app.state.toast;
    const press = (id) => {
      if (id === 'plus') setSheet('log');
      else if (id === 'inicio' || id === 'grupos') setTab(id);
      else app.notice('Esta pantalla llega en el diseño completo');
    };
    const overlay = (
      <div className="fb" style={{ position: 'absolute', inset: 0, height: 'auto', pointerEvents: 'none', zIndex: 15 }}>
        {t && t.kind === 'log' && <Rain drop={{ seq: t.seq, kind: t.logKind, goalHit: t.goalHit }} key={t.seq} />}
        <div className={'fb-overlay' + (sheet === 'log' ? ' open' : '')} aria-hidden={sheet !== 'log'}>
          <div className="fb-backdrop" onClick={() => setSheet(null)}></div>
          <div className="fb-sheet" role="dialog" aria-label="Apuntar">
            <span className="fb-grab" aria-hidden="true"></span>
            <h3>¿Qué ha caído?</h3>
            <p>Un toque y listo. Los detalles, luego si quieres.</p>
            <div className="fb-tiles">
              <button type="button" className="fb-tile c" onClick={() => { app.log('c'); setSheet(null); }}><span className="e" aria-hidden="true">❤️</span><strong>En compañía</strong></button>
              <button type="button" className="fb-tile s" onClick={() => { app.log('s'); setSheet(null); }}><span className="e" aria-hidden="true">✨</span><strong>En solitario</strong></button>
            </div>
          </div>
        </div>
        <div className={'fb-overlay' + (sheet === 'pulla' ? ' open' : '')} aria-hidden={sheet !== 'pulla'}>
          <div className="fb-backdrop" onClick={() => setSheet(null)}></div>
          <div className="fb-sheet" role="dialog" aria-label={'Pulla para ' + lastTo}>
            <span className="fb-grab" aria-hidden="true"></span>
            <h3>Pulla para {lastTo}</h3>
            <div className="fb-pullas">
              {PULLAS.slice(0, 5).map((p) => (
                <button type="button" key={p.id} className="fb-pulla" onClick={() => { app.pulla(lastTo, p); setSheet(null); }}><span aria-hidden="true">{p.emoji}</span><span>{p.text}</span></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
    return (
      <IosFrame darkMode screenBg="#150a20" overlay={overlay}>
        <div className="fb">
          <div className="fb-screen">
            <main className="fb-main" key={tab}>
              {tab === 'inicio'
                ? <Home app={app} openLog={() => setSheet('log')} openPulla={openPulla} setTab={setTab} />
                : <Group app={app} setTab={setTab} />}
            </main>
            <Toast app={app} />
            <nav className="fb-tabs" aria-label="Secciones">
              {TABS.map(([id, label, icon]) =>
                id === 'plus' ? (
                  <button type="button" key={id} className="fb-plus" aria-label={label} onClick={() => press(id)}><Icon name={icon} /></button>
                ) : (
                  <button type="button" key={id} className={'fb-tab' + (tab === id ? ' on' : '')} aria-current={tab === id ? 'page' : undefined} onClick={() => press(id)}>
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

  window.DirB = { App };
})();
