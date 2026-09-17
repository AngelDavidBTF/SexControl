// Follendario · pantallas fuera de las pestañas, modales y entrada.
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const { Icon, useFlip, DATA } = FD;
  const { Toolbar, Seg, Toggle, Avatar, Badges, Console, Ticket, Field, Search } = FC;

  /* ============================== GRUPO ============================== */
  const MEMBERS = [
    { name: 'Marcos', role: 'Creador del grupo', total: [120, 92], mes: [8, 6], semana: [3, 2] },
    { name: 'Tú', role: 'Administra el grupo', total: [86, 61], mes: [6, 3], semana: [2, 1] },
    { name: 'Lucía', total: [101, 79], mes: [7, 4], semana: [2, 1] },
    { name: 'Javi', total: [55, 43], mes: [3, 3], semana: [1, 1] },
    { name: 'Nerea', total: [44, 33], mes: [2, 2], semana: [1, 0], relation: 'Toca para pedirle amistad' },
    { name: 'Irene', total: [70, 50], mes: [3, 2], semana: [0, 1] },
    { name: 'Sergio', hidden: true },
  ];

  function Grupo({ app }) {
    const [period, setPeriod] = useState('semana');
    const [hidden, setHidden] = useState(false);
    const [muro, setMuro] = useState([
      { who: 'Nerea', text: '👴 ¿Te has jubilado o qué?', mine: false },
      { who: 'Marcos', text: '🏃 ha adelantado a Álex', mine: false },
      { who: 'Tú', text: '💪 ¡Ánimo, que se puede!', mine: true },
    ]);
    const visible = MEMBERS.filter((m) => !m.hidden).map((m) => ({ ...m, v: m[period], sum: m[period][0] + m[period][1] }));
    const ranked = [...visible].sort((a, b) => b.sum - a.sum).concat(MEMBERS.filter((m) => m.hidden));
    const flip = useFlip(period);
    const totC = visible.reduce((a, m) => a + m.v[0], 0);
    const totS = visible.reduce((a, m) => a + m.v[1], 0);
    const n = visible.length;
    const escribir = () => app.sheet({
      title: 'Escribir en el muro',
      actions: DATA.pullasEnviables.slice(4).map(([e, t]) => ({ text: `${e} ${t}`, onPick: () => setMuro((m) => [{ who: 'Tú', text: `${e} ${t}`, mine: true, fresh: true }, ...m.filter((x) => !x.mine)]) })),
    });
    return (
      <div className="f-screen">
        <Toolbar back onBack={app.back} title="" />
        <main className="f-content">
          <header className="gr-head">
            <span className="gr-tile" aria-hidden="true">P</span>
            <div>
              <h2 className="f-title">Los del Pueblo</h2>
              <p className="f-lead">7 miembros</p>
            </div>
          </header>
          <div className="gr-acts">
            <button type="button" className="f-key neutral editar-grupo" onClick={() => app.sheet({ title: 'Elige una opción', actions: [{ text: 'Invitar con enlace o QR', onPick: () => app.modal('qr') }, { text: 'Añadir miembros' }, { text: 'Cambiar nombre o imagen' }, { text: 'Borrar grupo', danger: true }] })}>Editar grupo</button>
            <button type="button" className="f-btn compartir-semana" onClick={() => app.toast('Tarjeta de la semana lista para compartir')}><Icon name="share" />Compartir semana</button>
          </div>

          <section className="f-card gr-season" aria-label="Temporada">
            <div className="gr-season-row"><Icon name="trophy" className="gr-trophy" /><span><strong>Lucía</strong> ganó agosto de 2026 <span className="f-muted mono">(38 en el grupo)</span></span></div>
            <button type="button" className="f-ghost ver-palmares">ver palmarés</button>
          </section>

          <section className="f-card" aria-label="Objetivo del grupo">
            <div className="f-card-head"><span className="f-label">objetivo del grupo</span><span className="mono gr-goal-num">27<span className="f-muted"> / 40</span></span></div>
            <div className="gr-ticks" aria-hidden="true">{Array.from({ length: 40 }, (_, i) => <i key={i} className={i < 27 ? 'on' : ''}></i>)}</div>
            <p className="es-small">Entre todos, este mes. Quedan 13 días.</p>
          </section>

          <Ticket group="los del pueblo" week="38" rows={[['MVP', 'MARCOS · 5'], ['REMONTADA', 'LUCÍA · +2'], ['CONSTANTE', 'LUCÍA · 4d'], ['DESAPARECIDO', 'SERGIO · 9d'], ['FAROLILLO ROJO', 'IRENE · 1']]} foot="sergio, ¿sigues vivo?" />

          <Seg label="Periodo de la clasificación" value={period} onChange={setPeriod} options={[['total', 'Total'], ['mes', 'Este mes'], ['semana', 'Esta semana']]} />

          <div className="gr-totals">
            <section className="f-card gr-total-hero">
              <span className="f-label">entre todos</span>
              <span className="f-big gr-total total-grupo dato">{totC + totS}</span>
              <span className="es-small">media por cabeza <strong className="mono">{Math.round((totC + totS) / n)}</strong></span>
            </section>
            <section className="f-card"><span className="f-label">compañía</span><span className="f-mid f-num-c total-compania dato">{totC}</span><span className="es-small">media {Math.round(totC / n)}</span></section>
            <section className="f-card"><span className="f-label">solitario</span><span className="f-mid f-num-s total-solitario dato">{totS}</span><span className="es-small">media {Math.round(totS / n)}</span></section>
          </div>

          <Console title="~/muro" label="Muro del grupo" action={<button type="button" className="f-ghost escribir-muro" onClick={escribir}>escribir</button>}>
            {muro.map((e) => (
              <div className={'f-line' + (e.fresh ? ' gr-fresh' : '')} key={e.who + e.text}>
                <span className="glyph">›</span>
                <span><b className="who">{e.who}</b> {e.text}</span>
                {e.mine ? <button type="button" className="gr-x quitar-muro" aria-label="Retirar del muro" onClick={() => setMuro((m) => m.filter((x) => x !== e))}><Icon name="close" /></button> : <span></span>}
              </div>
            ))}
          </Console>

          <section className="f-card privacidad-grupo">
            <Toggle title="Ocultar mis números aquí" sub="Sigues en el grupo, pero nadie ve tus cifras." on={hidden} onChange={setHidden} />
          </section>

          <div className="f-section"><span className="f-label">miembros</span><span className="f-label">{MEMBERS.length}</span></div>
          <Search placeholder="Buscar miembro…" />
          <ul className="f-list">
            {ranked.map((m, i) => (
              <li key={m.name} ref={flip(m.name)}>
                <button type="button" className="f-row miembro gr-member" onClick={() => m.name !== 'Tú' && app.sheet({ title: m.name, actions: [{ text: m.relation ? 'Pedir amistad' : 'Ver ficha', onPick: () => !m.relation && app.modal('ficha') }] })}>
                  <span className="gr-member-lead">
                    {!m.hidden && i < 3 ? <span className={'gr-medal mono p' + (i + 1)}>{i + 1}</span> : <span className="gr-medal empty"></span>}
                    <Avatar name={m.name} />
                  </span>
                  <span>
                    <span className="f-row-title">{m.name === 'Lucía' && <Icon name="trophy" className="gr-crown" />}{m.name}</span>
                    {m.role && <span className="f-row-sub">{m.role}</span>}
                    {m.hidden && <span className="f-row-sub">No comparte sus números</span>}
                    {m.relation && <span className="f-row-sub pedir-amistad">{m.relation}</span>}
                  </span>
                  {m.hidden ? <Icon name="eyeOff" className="f-hidden-ic" /> : <Badges f={{ c: m.v[0], s: m.v[1] }} />}
                </button>
              </li>
            ))}
          </ul>
        </main>
      </div>
    );
  }

  /* ============================== FICHA DEL AMIGO (modal) ============================== */
  function Ficha({ app }) {
    const rows = [['Esta semana', 3, 5], ['Este mes', 9, 14], ['Total', 147, 212]];
    return (
      <div className="f-screen">
        <Toolbar title="Marcos" center right={<span style={{ width: 44 }}></span>} back onBack={app.closeModal} />
        <main className="f-content">
          <div className="fi-perfil">
            <Avatar name="Marcos" size="lg" />
            <h2 className="f-title">Marcos</h2>
            <p className="f-lead mono">@marcos_88</p>
          </div>
          <div className="fi-insignias">
            <section className="f-card"><Icon name="flame" className="es-ic f-num-c" /><strong className="f-mid">5</strong><span className="es-small">días de racha</span></section>
            <section className="f-card"><Icon name="trophy" className="es-ic" /><strong className="f-mid">9</strong><span className="es-small">logros</span></section>
            <section className="f-card"><Icon name="clock" className="es-ic" /><strong className="f-mid">Hoy</strong><span className="es-small">última vez</span></section>
          </div>
          <section className="f-card" aria-label="Tú contra Marcos">
            <span className="f-label">tú vs marcos</span>
            {rows.map(([label, mine, theirs]) => (
              <div className="fi-fila" key={label}>
                <div className="fi-fila-top"><span>{label}</span><span className={'mono ' + (mine > theirs ? 'f-up' : mine < theirs ? 'f-down' : '')}>{mine === theirs ? 'empate' : mine > theirs ? `vas +${mine - theirs}` : `te saca ${theirs - mine}`}</span></div>
                <div className="fi-barras">
                  <span className="mono">{mine}</span>
                  <div className="fi-barra"><i className="mia" style={{ flexGrow: mine }}></i><i className="suya" style={{ flexGrow: theirs }}></i></div>
                  <span className="mono">{theirs}</span>
                </div>
              </div>
            ))}
            <p className="f-legend"><span><i className="c"></i>tú</span><span><i className="s"></i>marcos</span></p>
          </section>
          <p className="es-small mono fi-record">duelos: ganas 2 – 1 marcos</p>
          <div className="fi-acciones">
            <button type="button" className="f-key pink block accion-duelo" onClick={() => app.sheet({ title: 'Retar a Marcos', actions: DATA.retosEnviables.map((t) => ({ text: t, onPick: () => app.toast('Reto enviado a Marcos') })) })}><Icon name="swords" />RETAR A UN DUELO</button>
            <button type="button" className="f-key solo block accion-pulla" onClick={() => app.sheet({ title: 'Pulla para Marcos', actions: DATA.pullasEnviables.map(([e, t]) => ({ text: `${e} ${t}`, onPick: () => app.toast(`Pulla enviada: «${t}»`) })) })}><Icon name="hand" />MANDAR UNA PULLA</button>
            <button type="button" className="f-btn block accion-reaccion" onClick={() => app.sheet({ title: 'Reaccionar a Marcos', actions: ['🔥', '😂', '👏', '😱', '🫡'].map((e) => ({ text: e, onPick: () => app.toast(`Reacción enviada ${e}`) })) })}><Icon name="smile" />Mandar una reacción</button>
            <button type="button" className="f-btn block accion-privacidad" onClick={() => app.sheet({ title: '¿Qué ve Marcos de ti?', actions: [{ text: 'Todo' }, { text: 'Solo el total' }, { text: 'Nada' }] })}><Icon name="eye" />Qué ve de ti: todo</button>
            <button type="button" className="f-ghost danger block accion-eliminar">eliminar amistad</button>
            <button type="button" className="f-ghost block accion-bloquear">bloquear</button>
          </div>
        </main>
      </div>
    );
  }

  /* ============================== DETALLES (modal) ============================== */
  function Detalles({ app }) {
    const [stars, setStars] = useState(4);
    const [tags, setTags] = useState(new Set(['pareja', 'casa']));
    const [nota, setNota] = useState('');
    const all = ['pareja', 'rollo', 'casa', 'viaje', 'hotel', 'fin de semana'];
    const toggle = (t) => { const n = new Set(tags); n.has(t) ? n.delete(t) : n.add(t); setTags(n); };
    return (
      <div className="f-screen">
        <header className="f-toolbar">
          <button type="button" className="f-textbtn" onClick={app.closeModal}>Cancelar</button>
          <h1 className="f-toolbar-title center">Detalles</h1>
          <button type="button" className="f-textbtn strong guardar-detalles" onClick={() => { app.closeModal(); app.toast('Detalles guardados'); }}>Guardar</button>
        </header>
        <main className="f-content">
          <p className="f-lead">Jueves 17 de septiembre a las 23:41</p>
          <span className="f-label">¿qué tal fue?</span>
          <div className="de-stars" role="radiogroup" aria-label="Valoración">
            {[1, 2, 3, 4, 5].map((s) => (
              <button type="button" key={s} role="radio" aria-checked={stars === s} aria-label={s + (s === 1 ? ' estrella' : ' estrellas')} className={'de-star estrella' + (stars >= s ? ' activa' : '')} onClick={() => setStars(stars === s ? 0 : s)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8z" /></svg>
              </button>
            ))}
          </div>
          <span className="f-label">etiquetas</span>
          <div className="f-chips">
            {all.map((t) => <button type="button" key={t} aria-pressed={tags.has(t)} className={'f-chip etiqueta' + (tags.has(t) ? ' on seleccionada' : '')} onClick={() => toggle(t)}>{tags.has(t) && <Icon name="check" className="de-check" />}#{t}</button>)}
          </div>
          <div className="de-newtag">
            <input className="f-input nueva-etiqueta" name="etiqueta" placeholder="Nueva etiqueta y pulsa Intro…" aria-label="Nueva etiqueta" autoComplete="off" maxLength={24} />
            <button type="button" className="f-key neutral" aria-label="Añadir etiqueta"><Icon name="plus" /></button>
          </div>
          <span className="f-label">nota</span>
          <textarea className="f-input nota" rows="4" maxLength={280} name="nota" placeholder="Algo que quieras recordar (solo lo ves tú)…" aria-label="Nota" value={nota} onChange={(e) => setNota(e.target.value)}></textarea>
          <span className="es-small mono de-counter">{nota.length}/280</span>
        </main>
      </div>
    );
  }

  /* ============================== SE ME OLVIDÓ APUNTAR UNA (modal) ============================== */
  function Olvidada({ app }) {
    const [kind, setKind] = useState('c');
    const [day, setDay] = useState(16);
    const [hour, setHour] = useState('23:00');
    const shortcuts = [['Hace 1 hora', 17, '22:41'], ['Anoche', 16, '23:00'], ['Ayer por la tarde', 16, '18:00'], ['Ayer por la mañana', 16, '10:00']];
    const names = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const weekday = names[(day + 1) % 7];
    return (
      <div className="f-screen">
        <Toolbar back onBack={app.closeModal} title="¿Se te olvidó apuntar una?" />
        <main className="f-content">
          <Seg label="Tipo" value={kind} onChange={setKind} options={[['c', 'En compañía'], ['s', 'En solitario']]} />
          <div className="f-chips">
            {shortcuts.map(([label, d, h]) => (
              <button type="button" key={label} className={'f-chip' + (day === d && hour === h ? ' on' : '')} onClick={() => { setDay(d); setHour(h); }}>{label}</button>
            ))}
          </div>
          <section className="f-card f-paper fecha" aria-label="Fecha">
            <div className="f-month-head"><strong>Septiembre 2026</strong></div>
            <div className="f-month-wd" aria-hidden="true">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}</div>
            <div className="f-month-grid">
              <span></span>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <button type="button" key={d} disabled={d > 17} aria-pressed={d === day} className={'f-mcell ol-day' + (d > 17 ? ' future' : '') + (d === day ? (kind === 'c' ? ' c' : ' s') : '')} onClick={() => setDay(d)}>{d}</button>
              ))}
            </div>
            <div className="ol-hora"><span className="f-label">hora</span><input className="f-input mono" type="time" value={hour} onChange={(e) => setHour(e.target.value)} aria-label="Hora" /></div>
          </section>
          <p className="ol-resumen">{kind === 'c' ? 'En compañía' : 'En solitario'} · <strong className="resumen-fecha">{weekday.charAt(0).toUpperCase() + weekday.slice(1)} {day} de septiembre de 2026 a las {hour}</strong></p>
          <button type="button" className={'f-key block confirmar ' + (kind === 'c' ? 'pink' : 'solo')} onClick={() => { app.closeModal(); app.toast(`Añadida: ${weekday} ${day} de septiembre a las ${hour}`, [{ text: 'Detalles', role: 'details' }, { text: 'Deshacer', role: 'undo' }]); }}><Icon name="plus" />AÑADIR</button>
        </main>
      </div>
    );
  }

  /* ============================== AJUSTES ============================== */
  function Ajustes({ app }) {
    const [name, setName] = useState(DATA.me.name);
    const [t, setT] = useState({ pausar: false, buscable: true, recordatorios: true, discreto: true, numeros: true, neutro: true, pin: false });
    const set = (k) => (v) => setT({ ...t, [k]: v });
    return (
      <div className="f-screen">
        <Toolbar back onBack={app.back} title="Perfil y ajustes" />
        <main className="f-content">
          <section className="f-card aj-perfil">
            <div className="aj-avatar">
              <button type="button" className="aj-foto" aria-label="Cambiar foto"><Avatar name="Álex" size="lg" /><span className="aj-cam"><Icon name="camera" /></span></button>
              <button type="button" className="f-ghost">quitar foto</button>
            </div>
            <Field label="Nombre" name="nombre" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="f-input nombre" />
            <div className="aj-usuario"><span className="f-label">usuario</span><strong className="mono mi-usuario">@{DATA.me.username}</strong><button type="button" className="f-ghost cambiar-usuario">cambiar</button></div>
            <p className="es-small">{DATA.me.email} · solo lo ves tú</p>
            <button type="button" className="f-key pink block guardar-perfil" disabled={name === DATA.me.name}>GUARDAR PERFIL</button>
          </section>

          <div className="f-section"><span className="f-label">objetivos</span></div>
          <section className="f-card">
            <p className="es-small">Ponte una meta y verás tu progreso en Sumar. Déjalo vacío para ir por libre.</p>
            <div className="aj-2">
              <Field label="Por semana" type="number" defaultValue="4" min="1" max="999" inputMode="numeric" />
              <Field label="Por mes" type="number" defaultValue="12" min="1" max="999" inputMode="numeric" />
            </div>
            <button type="button" className="f-btn block guardar-objetivos">Guardar objetivos</button>
          </section>

          <div className="f-section"><span className="f-label">privacidad</span></div>
          <section className="f-card">
            <Toggle title="Pausar lo que compartes" sub="Tus amigos y grupos dejan de ver tus números hasta que lo reactives." on={t.pausar} onChange={set('pausar')} />
            <Toggle title="Aparecer en búsquedas" sub="Te encuentran por tu nombre, tu @usuario o tu email. Si lo apagas, solo podrán añadirte con tu enlace o desde un grupo." on={t.buscable} onChange={set('buscable')} />
            <p className="es-small">Para elegir qué ve cada amigo, tócalo en la pestaña Amigos.</p>
          </section>

          <div className="f-section"><span className="f-label">recordatorios</span></div>
          <section className="f-card">
            <Toggle title="Avisarme si no apunto nada" sub="Una notificación en este dispositivo." on={t.recordatorios} onChange={set('recordatorios')} />
            {t.recordatorios && (
              <div className="aj-2">
                <div className="f-field"><label htmlFor="aj-tras">Tras</label><select id="aj-tras" className="f-input" defaultValue="3">{[1, 2, 3, 5, 7].map((d) => <option key={d} value={d}>{d} {d === 1 ? 'día' : 'días'}</option>)}</select></div>
                <div className="f-field"><label htmlFor="aj-hora">A las</label><select id="aj-hora" className="f-input" defaultValue="21">{[9, 13, 18, 21, 23].map((h) => <option key={h} value={h}>{h}:00</option>)}</select></div>
              </div>
            )}
          </section>

          <div className="f-section"><span className="f-label">modo discreto</span></div>
          <section className="f-card">
            <Toggle title="Activar modo discreto" sub="Para usar la app sin que nadie cotillee." on={t.discreto} onChange={set('discreto')} />
            {t.discreto && (
              <React.Fragment>
                <Toggle title="Ocultar números" sub="Se ven difuminados; tócalos para verlos unos segundos." on={t.numeros} onChange={set('numeros')} />
                <Toggle title="Nombre e icono neutros" sub="La pestaña del navegador y las notificaciones se llaman «Notas»." on={t.neutro} onChange={set('neutro')} />
                <Toggle title="Bloquear con PIN" sub="Al abrir la app y al volver a ella tras 30 segundos." on={t.pin} onChange={set('pin')} />
              </React.Fragment>
            )}
          </section>

          <div className="f-section"><span className="f-label">apariencia</span></div>
          <section className="f-card">
            <Seg label="Tema" value={app.themeSetting} onChange={app.setTheme} options={[['sistema', 'Sistema'], ['claro', 'Claro'], ['oscuro', 'Oscuro']]} />
            <p className="es-small">Oscuro: ciruela y crema. Claro: papel crema. Prueba a cambiarlo: afecta a todos los teléfonos.</p>
          </section>

          <section className="f-card">
            <p className="es-small">Instala la app en tu móvil para abrirla como una app normal, incluso sin conexión.</p>
            <button type="button" className="f-btn block"><Icon name="download" />Instalar app</button>
          </section>

          <div className="f-section"><span className="f-label">cuenta</span></div>
          <section className="f-card">
            <button type="button" className="f-btn block cerrar-sesion">Cerrar sesión</button>
            <button type="button" className="f-ghost danger block borrar-cuenta">borrar mi cuenta</button>
          </section>
        </main>
      </div>
    );
  }

  /* ============================== LOGIN ============================== */
  function Login({ app }) {
    return (
      <div className="f-screen">
        <main className="f-content lo-content">
          {app.discreet ? (
            <div className="lo-brand">
              <span className="lo-note" aria-hidden="true"><Icon name="note" /></span>
              <h1 className="f-title">Notas</h1>
            </div>
          ) : (
            <div className="lo-brand">
              <img className="lo-simbolo" src={FD.LOGO_SIMBOLO} alt="" width="112" height="106" fetchpriority="high" />
              <img className="lo-logotipo dark-only" src={FD.LOGO_LOGOTIPO} alt="Follendario" translate="no" width="220" height="35" />
              <img className="lo-logotipo light-only" src={FD.LOGO_LOGOTIPO_TINTA} alt="Follendario" translate="no" width="220" height="35" />
              <p className="lo-tagline">Lleva la cuenta. Pícate con tus amigos.</p>
            </div>
          )}
          <Field label="Email" type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} placeholder="tu@correo.es" />
          <Field label="Contraseña" type="password" name="password" autoComplete="current-password" placeholder="Tu contraseña…" />
          <button type="button" className="f-ghost lo-forgot">¿has olvidado tu contraseña?</button>
          <button type="button" className="f-key pink block" data-ion-color="primary" onClick={() => app.toast('Entrando…')}>ENTRAR</button>
          <button type="button" className="f-btn block"><Icon name="google" />Entrar con Google</button>
          <div className="lo-div"><span>¿Aún no tienes cuenta?</span></div>
          <button type="button" className="f-btn block">Registrarse</button>
        </main>
      </div>
    );
  }

  /* ============================== BLOQUEO CON PIN ============================== */
  function Bloqueo({ app }) {
    const [pin, setPin] = useState('');
    const [state, setState] = useState('');
    const [errN, setErrN] = useState(0);
    const press = (k) => {
      if (state === 'ok') return;
      setState('');
      if (k === 'borrar') { setPin(pin.slice(0, -1)); return; }
      const next = (pin + k).slice(0, 4);
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === '1234') { setState('ok'); setTimeout(() => { setPin(''); setState(''); }, 1400); }
          else { setState('error'); setErrN((n) => n + 1); setPin(''); }
        }, 120);
      }
    };
    return (
      <div className="f-screen bl">
        <div className="bl-lock" aria-hidden="true"><Icon name="lock" /></div>
        <h2 className="bl-title" translate="no">{app.discreet ? 'Notas' : 'Follendario'}</h2>
        <p className="f-lead">{state === 'ok' ? 'Adelante' : state === 'error' ? 'Ese no es. Otra vez.' : 'Pon tu PIN'}</p>
        <div className={'bl-dots ' + state} aria-hidden="true" key={'dots' + errN}>
          {[0, 1, 2, 3].map((i) => <span key={i} className={i < pin.length || state === 'ok' ? 'lleno' : ''}></span>)}
        </div>
        <div className="bl-teclado">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'borrar'].map((k, i) => (
            k === '' ? <span key={i}></span> : (
              <button type="button" key={i} className="f-key neutral bl-key" aria-label={k === 'borrar' ? 'Borrar' : k} onClick={() => press(k)}>
                {k === 'borrar' ? <Icon name="backspace" /> : k}
              </button>
            )
          ))}
        </div>
        <button type="button" className="f-ghost olvidado">¿has olvidado el PIN?</button>
      </div>
    );
  }

  /* ============================== INVITACIONES ============================== */
  function Invitacion({ app }) {
    const [sent, setSent] = useState(false);
    return (
      <div className="f-screen">
        <Toolbar back onBack={app.back} title="Invitación" />
        <main className="f-content in-content">
          <div className="in-card">
            <Avatar name="Marcos" size="lg" />
            <h2 className="f-title">Marcos</h2>
            <p className="f-lead mono">@marcos_88</p>
            <p className="in-copy">quiere picarse contigo en <span translate="no">Follendario</span></p>
          </div>
          <button type="button" className="f-key pink block aceptar-invitacion" disabled={sent} onClick={() => { setSent(true); app.toast('Solicitud enviada a Marcos'); }}>{sent ? 'SOLICITUD ENVIADA' : 'ENVIAR SOLICITUD DE AMISTAD'}</button>
          <button type="button" className="f-ghost block">ahora no</button>
          <p className="es-small in-aviso">Solo compartirás tus números cuando acepte, y puedes elegir qué ve de ti cuando quieras.</p>
        </main>
      </div>
    );
  }

  function Unirse({ app }) {
    return (
      <div className="f-screen">
        <Toolbar back onBack={app.back} title="Unirse a un grupo" />
        <main className="f-content in-content">
          <div className="in-card">
            <span className="gr-tile lg" aria-hidden="true">P</span>
            <h2 className="f-title">Los del Pueblo</h2>
            <p className="in-copy">Te han invitado a este grupo</p>
          </div>
          <section className="f-card in-privacidad">
            <span className="f-label">antes de entrar</span>
            <p>Los miembros verán tu nombre, tu foto y tus números (total, mes y semana), aunque no seáis amigos. Puedes dejar de compartirlos desde Ajustes o salir del grupo cuando quieras.</p>
          </section>
          <button type="button" className="f-key pink block entrar-grupo" onClick={() => app.push('grupo')}>ENTRAR EN EL GRUPO</button>
          <button type="button" className="f-ghost block">ahora no</button>
        </main>
      </div>
    );
  }

  function CompartirQR({ app }) {
    const url = 'https://sexcontrol-6c000.web.app/invitar/Yq3kR8pLm2';
    const svg = useMemo(() => {
      try {
        const qr = window.qrcode(0, 'H');
        qr.addData(url);
        qr.make();
        return qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
      } catch (e) { return ''; }
    }, []);
    return (
      <div className="f-screen">
        <Toolbar back onBack={app.closeModal} title="Invita a tus amigos" />
        <main className="f-content">
          <p className="f-lead">Que te escaneen el código o mándales el enlace por WhatsApp.</p>
          <div className="qr-card qr">
            <div className="qr-img" role="img" aria-label="Código QR de la invitación" dangerouslySetInnerHTML={{ __html: svg }}></div>
            <img className="qr-logo" src={FD.LOGO_SIMBOLO} alt="" width="48" height="46" />
          </div>
          <div className="enlace"><code className="mono">{url}</code></div>
          <button type="button" className="f-key pink block compartir-invitacion" onClick={() => app.toast('Abriendo compartir…')}><Icon name="share" />COMPARTIR ENLACE</button>
          <button type="button" className="f-btn block copiar-invitacion" onClick={() => app.toast('Enlace copiado')}><Icon name="copy" />Copiar enlace</button>
          <p className="es-small">Cualquiera con este enlace puede mandarte una solicitud. Tus números solo los verá quien aceptes.</p>
        </main>
      </div>
    );
  }

  window.FS = Object.assign(window.FS || {}, { Grupo, Ficha, Detalles, Olvidada, Ajustes, Login, Bloqueo, Invitacion, Unirse, CompartirQR });
})();
