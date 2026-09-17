// Follendario · las tres pestañas: Sumar, Amigos y Estadísticas.
(function () {
  const { useState, useMemo } = React;
  const { Icon, RollNumber, useFlip, DATA } = FD;
  const { Toolbar, TabBar, Seg, Avatar, Badges, Console, Bars, Search } = FC;

  const ProfileBtn = ({ app }) => (
    <button type="button" className="f-iconbtn" aria-label="Perfil y ajustes" onClick={() => app.push('ajustes')}><Icon name="profile" /></button>
  );

  /* ============================== SUMAR ============================== */
  // Firma visual: el calendario del logo (C) con el marcador de bloques (A). Apuntar sigue siendo un toque.
  const SUMAR_MONTH = { 2: [1, 0], 5: [0, 1], 6: [2, 0], 9: [0, 1], 12: [1, 0], 14: [1, 0], 16: [0, 1], 17: [1, 0] };

  function Sumar({ app }) {
    const su = app.sumar;
    const d = app.discreet;
    const total = su.c + su.s;
    const weekDone = DATA.goals.week.done + su.history.length;
    const monthDone = DATA.goals.month.done + su.history.length;
    const wTarget = DATA.goals.week.target;
    const mTarget = DATA.goals.month.target;
    const L = d ? { c: 'con alguien', s: 'por mi cuenta' } : { c: 'compañía', s: 'solitario' };
    const addedC = su.history.filter((k) => k === 'c').length;
    const addedS = su.history.length - addedC;
    return (
      <div className="f-screen">
        <Toolbar brand discreet={d} title="follendario" right={<ProfileBtn app={app} />} />
        <main className="f-content su-content">
          <p className="su-hello">{d ? 'Hola' : 'Buenas'}, {DATA.me.name}. <span>{d ? 'Tu resumen.' : '¿Qué ha caído?'}</span></p>

          <section className="f-cal su-cal" aria-label="Septiembre de 2026">
            <div className="f-cal-rings" aria-hidden="true"><i></i><i></i></div>
            <div className="f-cal-head"><strong>Septiembre</strong><span>sem 38 · 2026</span></div>
            <div className="f-cal-body">
              <div className="su-marcador">
                <div className="su-marcador-main">
                  <span className="f-label">en total</span>
                  <RollNumber value={total} minDigits={3} tiles className="f-tiles su-tiles-big dato total" />
                </div>
                <div className="su-marcador-side">
                  <div><span className="f-label">{L.c}</span><RollNumber value={su.c} tiles className="f-tiles c su-tiles dato" /></div>
                  <div><span className="f-label">{L.s}</span><RollNumber value={su.s} tiles className="f-tiles s su-tiles dato" /></div>
                </div>
              </div>

              <div className="su-grid-wrap">
                <div className="f-month-wd" aria-hidden="true">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((x, i) => <span key={i}>{x}</span>)}</div>
                <div className="f-month-grid su-grid">
                  <span aria-hidden="true"></span>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => {
                    const base = SUMAR_MONTH[n] || [0, 0];
                    const today = n === 17;
                    const c = base[0] + (today ? addedC : 0);
                    const s2 = base[1] + (today ? addedS : 0);
                    const t = c + s2;
                    const kind = n > 17 ? 'future' : c && s2 ? 'b' : c ? 'c' : s2 ? 's' : '';
                    const label = `${n} de septiembre: ${n > 17 ? 'aún no ha llegado' : t === 0 ? 'nada' : t === 1 ? '1 vez' : t + ' veces'}`;
                    return (
                      <span key={n} role="img" aria-label={label} className={['f-mcell su-cell', kind, today && 'today', n >= 14 && n <= 20 && 'week'].filter(Boolean).join(' ')}>
                        {n}{t > 1 && <span className="x dato">×{t}</span>}
                        {today && su.lastSeq > 0 && (
                          <React.Fragment key={su.lastSeq}>
                            <FC.CellCube kind={su.lastKind} />
                            <span className="f-stamp"><FC.Stamp kind={su.lastKind} discreet={d} /></span>
                            <span className="f-ripple"></span>
                          </React.Fragment>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="su-goals">
                <div className="su-goal">
                  <div className="su-goal-text"><span>Objetivo de la semana</span><strong className="mono dato">{Math.min(weekDone, wTarget)}/{wTarget}</strong></div>
                  <div className={'su-segs' + (weekDone >= wTarget ? ' done' : '')} style={{ gridTemplateColumns: `repeat(${wTarget}, 1fr)` }}>
                    {Array.from({ length: wTarget }, (_, i) => <i key={i} className={i < weekDone ? 'on' : ''}></i>)}
                  </div>
                </div>
                <div className="su-goal">
                  <div className="su-goal-text"><span>Objetivo del mes</span><strong className="mono dato">{Math.min(monthDone, mTarget)}/{mTarget}</strong></div>
                  <div className="su-bar"><i style={{ transform: `scaleX(${Math.min(1, monthDone / mTarget)})` }}></i></div>
                </div>
              </div>
            </div>
          </section>

          <div className="su-keys">
            <button type="button" className="f-key pink f-key-big" onClick={() => su.log('c')}>
              <span className="f-key-top"><span className="f-led" aria-hidden="true"></span><span>+1</span></span>
              <span>{d ? 'CON ALGUIEN' : 'EN COMPAÑÍA'}</span>
            </button>
            <button type="button" className="f-key solo f-key-big" onClick={() => su.log('s')}>
              <span className="f-key-top"><span className="f-led" aria-hidden="true"></span><span>+1</span></span>
              <span>{d ? 'POR MI CUENTA' : 'EN SOLITARIO'}</span>
            </button>
          </div>
          <div className="su-more">
            <button type="button" className="f-btn block sumar-olvidada" onClick={() => app.modal('olvidada')}><Icon name="clock" />¿Se te olvidó apuntar una?</button>
            <button type="button" className="f-ghost block" onClick={su.removeLast}>borrar la última</button>
          </div>
        </main>
        <TabBar active="sumar" onTab={app.tab} />
      </div>
    );
  }

  /* ============================== AMIGOS ============================== */
  function Liga() {
    const [period, setPeriod] = useState('semana');
    const rows = DATA.liga[period];
    const flip = useFlip(period);
    return (
      <section className="f-card am-liga" aria-label="Liga de amigos">
        <div className="f-card-head"><span className="f-label">liga de amigos</span></div>
        <Seg label="Periodo de la liga" value={period} onChange={setPeriod} options={[['semana', 'semana'], ['mes', 'mes'], ['total', 'total']]} />
        <ol className="am-rows">
          {rows.map(([name, value, delta], i) => (
            <li key={name} ref={flip(name)} className={'am-puesto' + (name === 'Tú' ? ' yo' : '')}>
              <span className={'am-pos mono p' + (i + 1)}>{String(i + 1).padStart(2, '0')}</span>
              <Avatar name={name} size="sm" />
              <span className="am-name">{name}</span>
              <span className={'am-delta mono ' + (delta > 0 ? 'f-up' : delta < 0 ? 'f-down' : '')}>{delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : ''}</span>
              <span className="am-val mono dato">{value}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="f-ghost">ver la clasificación completa</button>
        {period !== 'total' && <p className="am-note">Quien comparte solo su total no entra en esta clasificación.</p>}
      </section>
    );
  }

  function Amigos({ app, seg: initialSeg }) {
    const [seg, setSeg] = useState(initialSeg || 'amigos');
    const [retos, setRetos] = useState(DATA.retos);
    const [pullas, setPullas] = useState(DATA.pullas);
    return (
      <div className="f-screen">
        <Toolbar brand discreet={app.discreet} title="amigos" right={<ProfileBtn app={app} />} />
        <main className="f-content" key={seg}>
          <Seg label="Amigos o grupos" value={seg} onChange={setSeg} options={[['amigos', 'Amigos'], ['grupos', 'Grupos']]} />
          {seg === 'amigos' ? (
            <React.Fragment>
              <div className="am-actions">
                <button type="button" className="am-action" onClick={() => app.notice('Añadir amigo')}><Icon name="addUser" /><span>Añadir amigo</span></button>
                <button type="button" className="am-action invitar-amigo" onClick={() => app.modal('qr')}><Icon name="share" /><span>Invitar con enlace o QR</span></button>
                <button type="button" className="am-action" onClick={() => app.notice('Solicitudes de amistad')}><Icon name="inbox" /><span>Solicitudes</span><b className="f-count solicitudes-badge">2</b></button>
              </div>

              <Console title="~/novedades" live="desde tu última visita" label="Novedades">
                {DATA.novedades.map((n) => (
                  <div className="f-line" key={n.who + n.text}><span className="glyph">{n.glyph}</span><span><b className="who">{n.who}</b> {app.discreet && n.discreto ? n.discreto : n.text}</span><span></span></div>
                ))}
              </Console>

              {retos.map((r) => (
                <div className="f-card am-duelo duelo-aviso" key={r.who}>
                  <div className="am-duelo-text"><Icon name="swords" /><span><strong>{r.who}</strong> te reta: {r.text}</span></div>
                  <div className="am-duelo-acts">
                    <button type="button" className="f-key pink aceptar-reto" onClick={() => { setRetos([]); app.toast('Reto aceptado. Que empiece el pique.'); }}>Aceptar</button>
                    <button type="button" className="f-ghost rechazar-reto" onClick={() => setRetos([])}>no, gracias</button>
                  </div>
                </div>
              ))}

              {DATA.duelos.map((d) => (
                <div className="f-card am-duelo duelo-vivo" key={d.who}>
                  <div className="am-duelo-text"><Icon name="swords" /><span><strong>{d.who}</strong> <span className="f-muted">· {d.text}</span></span></div>
                  <span className="am-marcador duelo-marcador mono dato"><span className="gano">{d.mine}</span><span className="f-muted">–</span><span>{d.theirs}</span></span>
                </div>
              ))}

              {pullas.length > 0 && (
                <Console title="~/te-han-escrito" label="Pullas recibidas" action={<button type="button" className="f-ghost limpiar-reacciones" onClick={() => setPullas([])}>limpiar</button>}>
                  {pullas.map((p) => (
                    <div className="f-line" key={p.who}><span className="glyph">›</span><span className="reaccion-texto"><b className="who">{p.who}</b>: {p.label}</span><span className="when">{p.when}</span></div>
                  ))}
                </Console>
              )}

              <Liga />

              <div className="f-section"><span className="f-label">amigos agregados</span><span className="f-label">{DATA.amigos.length}</span></div>
              <Search placeholder="Buscar amigo…" />
              <ul className="f-list">
                {DATA.amigos.map((f) => (
                  <li key={f.name}>
                    <button type="button" className="f-row amigo" onClick={() => app.modal('ficha')}>
                      <Avatar name={f.name} />
                      <span>
                        <span className="f-row-title">{f.name}</span>
                        {f.veDeTi && <span className="f-row-sub ve-de-ti">Ve de ti: {f.veDeTi}</span>}
                        {f.hidden && <span className="f-row-sub">No comparte sus números</span>}
                      </span>
                      <Badges f={f} />
                    </button>
                  </li>
                ))}
              </ul>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button type="button" className="f-key pink block" onClick={() => app.notice('Crear grupo')}><Icon name="plus" />CREAR GRUPO</button>
              <div className="f-section"><span className="f-label">tus grupos</span><span className="f-label">{DATA.grupos.length}</span></div>
              <Search placeholder="Buscar grupo…" />
              <ul className="f-list">
                {DATA.grupos.map((g) => (
                  <li key={g.name}>
                    <button type="button" className="f-row grupo" onClick={() => app.push('grupo')}>
                      <span className="am-gtile" style={{ background: g.color }} aria-hidden="true">{g.name.split(' ').pop().slice(0, 1)}</span>
                      <span><span className="f-row-title">{g.name}</span><span className="f-row-sub">{g.members} miembros</span></span>
                      <Icon name="chevron" className="f-chev" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="am-note">¿Sin grupo con tu cuadrilla? Crea uno y que empiece el pique.</p>
            </React.Fragment>
          )}
        </main>
        <TabBar active="amigos" onTab={app.tab} />
      </div>
    );
  }

  /* ============================== ESTADÍSTICAS ============================== */
  const PERIOD_DATA = {
    semana: { title: 'Del 14 al 20 de sep', total: 3, active: 3, delta: '▲ +50 %', vs: 'la semana pasada', c: 2, s: 1, canNext: false,
      bars: [[1, 0], [0, 0], [0, 1], [1, 0], [0, 0], [0, 0], [0, 0]], labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] },
    mes: { title: 'Septiembre de 2026', total: 9, active: 7, delta: '▲ +29 %', vs: 'agosto', c: 6, s: 3, canNext: false,
      bars: Array.from({ length: 30 }, (_, i) => ({ 2: [1, 0], 5: [0, 1], 6: [2, 0], 9: [0, 1], 12: [1, 0], 14: [1, 0], 16: [0, 1], 17: [1, 0] }[i + 1] || [0, 0])),
      labels: ['1', '', '', '', '', '', '7', '', '', '', '', '', '', '14', '', '', '', '', '', '', '21', '', '', '', '', '', '', '28', '', ''] },
    anio: { title: '2026', total: 98, active: 71, delta: '▲ +12 %', vs: '2025', c: 57, s: 41, canNext: false,
      bars: [[5, 4], [6, 3], [7, 5], [6, 4], [5, 5], [8, 4], [9, 5], [5, 2], [6, 3], [0, 0], [0, 0], [0, 0]], labels: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] },
    siempre: { title: 'Desde marzo de 2025', total: 147, active: 108, delta: null, c: 86, s: 61, canNext: false,
      bars: [[4, 3], [3, 2], [5, 3], [4, 4], [6, 3], [5, 5], [7, 5], [6, 4], [5, 5], [8, 4], [9, 5], [11, 7]], labels: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  };

  function seededMonth(seed, days, offset, todayN) {
    let x = seed;
    const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
    return Array.from({ length: days }, (_, i) => {
      const n = i + 1;
      if (todayN && n > todayN) return { n, future: true };
      const r = rnd();
      if (r < 0.62) return { n, c: 0, s: 0 };
      if (r < 0.8) return { n, c: 1, s: 0 };
      if (r < 0.92) return { n, c: 0, s: 1 };
      if (r < 0.97) return { n, c: 2, s: 0 };
      return { n, c: 1, s: 1 };
    });
  }

  const SEPT = Array.from({ length: 30 }, (_, i) => {
    const n = i + 1;
    const m = { 2: [1, 0], 5: [0, 1], 6: [2, 0], 9: [0, 1], 12: [1, 0], 14: [1, 0], 16: [0, 1], 17: [1, 0] }[n];
    return n > 17 ? { n, future: true } : { n, c: m ? m[0] : 0, s: m ? m[1] : 0, today: n === 17 };
  });
  const MONTHS = [
    { name: 'Septiembre', year: 2026, offset: 1, days: SEPT },
    { name: 'Agosto', year: 2026, offset: 5, days: seededMonth(11, 31, 5) },
    { name: 'Julio', year: 2026, offset: 2, days: seededMonth(29, 31, 2) },
    { name: 'Junio', year: 2026, offset: 0, days: seededMonth(47, 30, 0) },
    { name: 'Mayo', year: 2026, offset: 4, days: seededMonth(83, 31, 4) },
    { name: 'Abril', year: 2026, offset: 2, days: seededMonth(5, 30, 2) },
  ];

  function Calendario({ discreet }) {
    const [sel, setSel] = useState(null);
    const rail = React.useRef(null);
    const step = (dir) => {
      const el = rail.current;
      if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    return (
      <section className="f-card f-paper es-calcard" aria-label="Tu calendario, últimos 6 meses">
        <div className="f-card-head"><span className="f-label">tu calendario · 6 meses</span><span className="es-cal-nav"><button type="button" className="f-iconbtn" aria-label="Mes más reciente" onClick={() => step(-1)}><Icon name="left" /></button><button type="button" className="f-iconbtn" aria-label="Mes anterior" onClick={() => step(1)}><Icon name="right" /></button></span></div>
        <p className="es-detail" aria-live="polite">{sel ? sel : <span className="f-muted">Toca un día para ver cuántas veces</span>}</p>
        <div className="f-months" ref={rail}>
          {MONTHS.map((m) => (
            <div className="f-month" key={m.name}>
              <div className="f-month-head"><strong>{m.name}</strong><span className="f-muted">{m.days.reduce((a, d) => a + (d.c || 0) + (d.s || 0), 0)} veces</span></div>
              <div className="f-month-wd" aria-hidden="true">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}</div>
              <div className="f-month-grid">
                {Array.from({ length: m.offset }, (_, i) => <span key={'o' + i}></span>)}
                {m.days.map((d) => {
                  const t = (d.c || 0) + (d.s || 0);
                  const kind = d.future ? 'future' : d.c && d.s ? 'b' : d.c ? 'c' : d.s ? 's' : '';
                  const label = `${d.n} de ${m.name.toLowerCase()}: ${d.future ? 'aún no ha llegado' : t === 0 ? 'nada' : t === 1 ? '1 vez' : t + ' veces'}`;
                  return (
                    <button type="button" key={d.n} disabled={d.future} className={['f-mcell', kind, d.today && 'today', sel === label && 'sel'].filter(Boolean).join(' ')} aria-label={label} onClick={() => setSel(label)}>
                      {d.n}{t > 1 && <span className="x">×{t}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="f-legend"><span><i className="c"></i>{discreet ? 'con alguien' : 'compañía'}</span><span><i className="s"></i>{discreet ? 'por mi cuenta' : 'solitario'}</span><span><i className="b"></i>los dos</span></div>
      </section>
    );
  }

  const LOGROS = [
    ['🎉', 'La primera', 'Registra la primera', 1], ['🔟', 'Diez', 'Llega a 10 en total', 1], ['💯', 'Centenario', 'Llega a 100 en total', 1],
    ['🏅', 'Leyenda', 'Llega a 500 en total', 147 / 500], ['🔥', 'En racha', '3 días seguidos', 1], ['🔥', 'Semana perfecta', '7 días seguidos', 6 / 7],
    ['🌋', 'Imparable', '30 días seguidos', 6 / 30], ['⚡', 'Día épico', '3 en un mismo día', 1], ['🌙', 'Noctámbulo', '10 de madrugada (0:00-6:00)', 1],
    ['☀️', 'Buenos días', '10 por la mañana (6:00-12:00)', 1], ['🗓️', 'Todos los días', 'Al menos una cada día de la semana', 1], ['🎯', 'Objetivo cumplido', 'Cumple tu objetivo semanal alguna semana', 1],
    ['🤝', 'Social', 'Ten 5 amigos', 1], ['👥', 'En grupo', 'Forma parte de un grupo', 1], ['⚔️', 'Duelista', 'Gana tu primer duelo', 1],
    ['🛡️', 'Invicto', 'Gana 5 duelos', 2 / 5], ['👑', 'Campeón', 'Gana el mes en un grupo', 0], ['🏆', 'Tricampeón', 'Gana el mes tres veces', 0], ['🎂', 'Un año', 'Un año desde tu primer registro', 0.51],
  ];

  function Estadisticas({ app }) {
    const [period, setPeriod] = useState('mes');
    const [historyOpen, setHistoryOpen] = useState(false);
    const d = PERIOD_DATA[period] || PERIOD_DATA.mes;
    const pct = Math.round((d.c / (d.c + d.s)) * 100);
    const unlocked = LOGROS.filter((l) => l[3] === 1).length;
    return (
      <div className="f-screen">
        <Toolbar brand discreet={app.discreet} title="estadísticas" right={<ProfileBtn app={app} />} />
        <main className="f-content">
          <Seg label="Periodo" value={period} onChange={setPeriod} options={[['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año'], ['siempre', 'Siempre'], ['rango', 'Rango']]} />
          {period === 'rango' ? (
            <div className="es-rango">
              <div className="f-field"><span className="f-field-label">Desde</span><input className="f-input" type="date" defaultValue="2026-08-01" aria-label="Desde" /></div>
              <div className="f-field"><span className="f-field-label">Hasta</span><input className="f-input" type="date" defaultValue="2026-09-17" aria-label="Hasta" /></div>
            </div>
          ) : (
            <div className="es-nav">
              <button type="button" className="f-iconbtn nav-prev" aria-label="Periodo anterior" disabled={period === 'siempre'}><Icon name="left" /></button>
              <h2 className="es-title">{d.title}</h2>
              <button type="button" className="f-iconbtn nav-next" aria-label="Periodo siguiente" disabled={!d.canNext}><Icon name="right" /></button>
            </div>
          )}

          <section className="f-card es-resumen" aria-label="Resumen del periodo" key={period}>
            <div className="es-hero">
              <RollNumber value={d.total} className="f-big es-total total-periodo dato" />
              <div className="es-hero-text"><span>{d.total === 1 ? 'vez' : 'veces'}</span><span className="f-muted">{d.active} días activos</span></div>
            </div>
            {d.delta && <p className="es-delta mono"><span className="f-up">{d.delta}</span> <span className="f-muted">vs {d.vs}</span></p>}
            <div className="es-reparto" role="img" aria-label={`${pct} % en compañía, ${100 - pct} % en solitario`}>
              <i className="c" style={{ flexGrow: d.c }}></i><i className="s" style={{ flexGrow: d.s }}></i>
            </div>
            <div className="es-leyenda mono">
              <span><i className="c"></i>{app.discreet ? 'con alguien' : 'compañía'} <strong className="f-num-c dato">{d.c}</strong> · {pct} %</span>
              <span><i className="s"></i>{app.discreet ? 'por mi cuenta' : 'solitario'} <strong className="f-num-s dato">{d.s}</strong> · {100 - pct} %</span>
            </div>
          </section>

          <section className="f-card" aria-label="Evolución">
            <span className="f-label">evolución</span>
            <Bars key={period} bars={(d.bars || []).map((b) => (Array.isArray(b) ? { c: b[0], s: b[1] } : b))} labels={d.labels} height={130} />
          </section>

          <div className="es-rachas">
            <section className="f-card"><Icon name="flame" className="es-ic f-num-c" /><span className="f-mid">2</span><span className="es-small">días de racha</span></section>
            <section className="f-card"><Icon name="star" className="es-ic f-num-s" /><span className="f-mid">6</span><span className="es-small">mejor racha</span></section>
            <section className="f-card"><Icon name="clock" className="es-ic" /><span className="f-mid">Hoy</span><span className="es-small">último registro</span></section>
          </div>

          <div className="f-section"><span className="f-label">curiosidades</span></div>
          <div className="es-curiosidades">
            {[['trophy', 'Récord en un día', '3', '6 de julio de 2026'], ['calendar', 'Día favorito', 'Sábado', 'El día de la semana con más'], ['moon', 'Franja favorita', 'Noche', 'De 20:00 a 24:00'], ['trend', 'Media semanal', '1,8', 'Desde tu primer registro']].map(([ic, label, value, detail]) => (
              <section className="f-card es-curio" key={label}>
                <Icon name={ic} className="es-ic" />
                <span className="es-small">{label}</span>
                <strong className="es-curio-val">{value}</strong>
                <span className="es-small">{detail}</span>
              </section>
            ))}
          </div>

          <section className="f-card es-share">
            <div><strong>Tu 2026 en una imagen</strong><span className="es-small">Racha, mejor mes, franja favorita… listo para presumir.</span></div>
            <button type="button" className="f-key pink compartir-anio" onClick={() => app.toast('Imagen de tu año lista para compartir')}><Icon name="share" />Crear</button>
          </section>

          <div className="f-section"><span className="f-label">logros · {unlocked}/{LOGROS.length}</span></div>
          <div className="es-logros">
            {LOGROS.map(([e, t, desc, p]) => (
              <div key={t} className={'es-logro' + (p < 1 ? ' bloqueado' : '')} aria-label={t + (p < 1 ? ', pendiente' : ', conseguido')}>
                <span className="es-logro-e" aria-hidden="true">{e}</span>
                <strong>{t}</strong>
                <span className="es-small">{desc}</span>
                {p < 1 && <div className="es-prog"><i style={{ transform: `scaleX(${p})` }}></i></div>}
              </div>
            ))}
          </div>

          <section className="f-card" aria-label="Valoración y etiquetas">
            <span className="f-label">valoración media</span>
            <div className="es-val"><span className="f-big">4,2</span><Icon name="star" className="es-star" /><span className="es-small">23 valoradas</span></div>
            {[[5, 10], [4, 8], [3, 3], [2, 1], [1, 1]].map(([st, n]) => (
              <div className="es-fila mono" key={st}><span>{st} ★</span><div className="es-barra"><i style={{ transform: `scaleX(${n / 10})` }}></i></div><span>{n}</span></div>
            ))}
            <span className="f-label es-sep">etiquetas</span>
            {[['pareja', 31], ['casa', 24], ['fin de semana', 12], ['viaje', 5], ['hotel', 3]].map(([t, n]) => (
              <div className="es-fila mono" key={t}><span>#{t}</span><div className="es-barra"><i style={{ transform: `scaleX(${n / 31})` }}></i></div><span>{n}</span></div>
            ))}
          </section>

          <Calendario discreet={app.discreet} />

          <section className="f-card" aria-label="Por día de la semana">
            <span className="f-label">por día de la semana</span>
            <Bars bars={[[8, 6], [9, 7], [11, 8], [12, 8], [15, 10], [19, 12], [12, 10]].map(([c, s]) => ({ c, s }))} labels={['L', 'M', 'X', 'J', 'V', 'S', 'D']} height={100} />
          </section>
          <section className="f-card" aria-label="Por franja horaria">
            <span className="f-label">por franja horaria</span>
            <Bars bars={[[7, 5], [12, 9], [29, 22], [38, 25]].map(([c, s]) => ({ c, s }))} labels={['madrugada', 'mañana', 'tarde', 'noche']} height={100} />
          </section>

          <section className="f-card historial" aria-label="Historial">
            <span className="f-label">historial</span>
            {!historyOpen ? (
              <React.Fragment>
                <p className="es-small es-hist-lead">Consulta tus registros uno a uno y borra los que quieras.</p>
                <button type="button" className="f-btn block ver-historial" onClick={() => setHistoryOpen(true)}>Ver historial</button>
              </React.Fragment>
            ) : (
              <ul className="es-hist">
                {[['c', 'Hoy, 23:12', '★★★★☆', ['pareja'], null], ['s', 'Ayer, 00:40', null, [], null], ['c', 'Lunes 14 de sep, 22:05', '★★★★★', ['casa'], 'repetimos'], ['s', 'Sábado 12 de sep, 18:30', null, [], null]].map(([k, when, stars, tags, nota]) => (
                  <li key={when}>
                    <button type="button" className="es-reg registro" onClick={() => app.modal('detalles')}>
                      <i className={'es-dot ' + k} aria-hidden="true"></i>
                      <span>
                        <span className="es-reg-t">{when}</span>
                        <span className="es-small">{k === 'c' ? 'En compañía' : 'En solitario'}{stars ? ' · ' + stars : ''}</span>
                        {(tags.length > 0 || nota) && <span className="es-small mono">{tags.map((t) => '#' + t).join(' ')}{nota ? ` “${nota}”` : ''}</span>}
                      </span>
                    </button>
                  </li>
                ))}
                <li className="es-small es-hint">Desliza un registro a la izquierda para borrarlo.</li>
              </ul>
            )}
          </section>
        </main>
        <TabBar active="estadisticas" onTab={app.tab} />
      </div>
    );
  }

  window.FS = Object.assign(window.FS || {}, { Sumar, Amigos, Estadisticas });
})();
