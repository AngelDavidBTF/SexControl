// Follendario · componentes reutilizables del prototipo (cada uno se corresponde con un patrón Ionic).
(function () {
  const { useState, useEffect, useRef } = React;
  const { Icon, RollNumber, avatarColor, WEEK } = FD;

  function Toolbar({ title, back, onBack, brand, right, center, discreet }) {
    return (
      <header className="f-toolbar">
        {back && <button type="button" className="f-iconbtn" aria-label="Volver" onClick={onBack}><Icon name="back" /></button>}
        {brand ? (
          <div className="f-brand">
            {discreet ? <Icon name="note" className="f-brand-note" /> : <img src={FD.LOGO_SIMBOLO} alt="" width="26" height="25" />}
            <span translate={title === 'follendario' ? 'no' : undefined}>{discreet && title === 'follendario' ? 'notas' : title}</span>
          </div>
        ) : (
          <h1 className={'f-toolbar-title' + (center ? ' center' : '')}>{title}</h1>
        )}
        {right}
      </header>
    );
  }

  const TABS = [['amigos', 'amigos', 'users'], ['sumar', 'sumar', 'plus'], ['estadisticas', 'estadísticas', 'stats']];
  function TabBar({ active, onTab }) {
    return (
      <nav className="f-tabs" aria-label="Pestañas">
        {TABS.map(([id, label, icon]) => (
          <button type="button" key={id} className={'f-tab' + (active === id ? ' on' : '')} aria-current={active === id ? 'page' : undefined} onClick={() => onTab(id)}>
            {id === 'sumar' ? <span className="f-tab-key"><Icon name="plus" /></span> : <Icon name={icon} />}
            {label}
          </button>
        ))}
      </nav>
    );
  }

  function Seg({ options, value, onChange, label }) {
    const i = Math.max(0, options.findIndex(([v]) => v === value));
    return (
      <div className="f-seg" role="tablist" aria-label={label}>
        <span className="f-seg-ind" style={{ width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${i * 100}%)` }} aria-hidden="true"></span>
        {options.map(([v, text]) => (
          <button type="button" role="tab" key={v} aria-selected={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{text}</button>
        ))}
      </div>
    );
  }

  function Toggle({ title, sub, on, onChange }) {
    return (
      <button type="button" role="switch" aria-checked={on} className="f-toggle-row" onClick={() => onChange(!on)}>
        <span><strong>{title}</strong>{sub && <small>{sub}</small>}</span>
        <span className={'f-toggle' + (on ? ' on' : '')} aria-hidden="true"></span>
      </button>
    );
  }

  function Avatar({ name, size = '' }) {
    return <span className={'f-avatar ' + size} style={{ background: avatarColor(name) }} aria-hidden="true">{name.slice(0, 1)}</span>;
  }

  function Badges({ f }) {
    if (f.hidden) return <Icon name="eyeOff" className="f-hidden-ic" />;
    if (f.total != null) return <span className="f-badge t dato">{f.total}</span>;
    return <span className="f-badges"><span className="f-badge c dato">{f.c}</span><span className="f-badge s dato">{f.s}</span></span>;
  }

  // Capa para modales (ion-modal) y hojas de acciones (ion-action-sheet).
  function Layer({ open, onClose, kind = 'modal', children, label }) {
    return (
      <div className={'f-layer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="f-backdrop" aria-hidden="true" onClick={onClose}></div>
        {kind === 'modal'
          ? <div className="f-modal" role="dialog" aria-label={label}>{children}</div>
          : <div className="f-actions" role="dialog" aria-label={label}>{children}</div>}
      </div>
    );
  }

  function ActionSheet({ sheet, onClose }) {
    const s = sheet || { title: '', actions: [] };
    return (
      <Layer open={!!sheet} onClose={onClose} kind="actions" label={s.title}>
        <div className="f-actions-group">
          <div className="f-actions-head">{s.title}</div>
          {s.actions.map((a) => (
            <button type="button" key={a.text} className={'f-action' + (a.danger ? ' danger' : '')} onClick={() => { onClose(); a.onPick && a.onPick(); }}>{a.text}</button>
          ))}
        </div>
        <div className="f-actions-group"><button type="button" className="f-action cancel" onClick={onClose}>Cancelar</button></div>
      </Layer>
    );
  }

  function Toast({ toast, onAction, top }) {
    if (!toast) return null;
    return (
      <div className={'f-toast' + (top ? ' top' : '')} key={toast.seq} role="status">
        <span>{toast.text}</span>
        {(toast.actions || []).map((a) => <button type="button" key={a.role} onClick={() => onAction(a.role)}>{a.text}</button>)}
      </div>
    );
  }

  function Console({ title, live, action, children, label }) {
    return (
      <section className="f-console" aria-label={label}>
        <div className="f-console-head"><span>{title}</span>{live ? <span className="f-live">{live}</span> : action}</div>
        {children}
      </section>
    );
  }

  function Ticket({ group, week, rows, foot }) {
    return (
      <div className="f-ticket-slot" aria-label="Títulos de la semana">
        <div className="f-ticket">
          <h3>TICKET SEMANAL</h3>
          <p className="sub">{group} · sem {week}</p>
          <hr />
          {rows.map(([k, v]) => <div className="f-tline" key={k}><span>{k}</span><span></span><span>{v}</span></div>)}
          <hr />
          <p className="foot">{foot}</p>
        </div>
      </div>
    );
  }

  const CUBE = (
    <React.Fragment>
      <polygon className="t" points="15,0 30,7.5 15,15 0,7.5" />
      <polygon className="l" points="0,7.5 15,15 15,31 0,23.5" />
      <polygon className="r" points="30,7.5 15,15 15,31 30,23.5" />
      <polyline points="0.5,7.5 15,14.8 29.5,7.5" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="0.8" />
    </React.Fragment>
  );

  // Cubo pequeño que cae en la casilla de hoy al apuntar.
  function CellCube({ kind }) {
    return <svg className={'f-cellcube ' + kind} width="18" height="19" viewBox="0 0 30 31" aria-hidden="true">{CUBE}</svg>;
  }

  function Stamp({ kind, discreet }) {
    if (discreet) return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="var(--f-cal-ink)" /></svg>;
    return kind === 'c'
      ? <svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="var(--f-pink)" stroke="var(--f-cal-ink)" strokeWidth="1.2" /></svg>
      : <svg viewBox="0 0 24 24"><path d="M12 2.5c.8 5 2.9 7.8 9.5 9.5-6.6 1.7-8.7 4.5-9.5 9.5-.8-5-2.9-7.8-9.5-9.5 6.6-1.7 8.7-4.5 9.5-9.5z" fill="var(--f-solo)" stroke="var(--f-cal-ink)" strokeWidth="1.2" /></svg>;
  }

  function Bars({ bars, height = 120, labels }) {
    const max = Math.max(1, ...bars.map((b) => b.c + b.s));
    return (
      <div>
        <div className="f-bars" style={{ height }} role="img" aria-label="Gráfica de barras: compañía en rosa, solitario en berenjena">
          {bars.map((b, i) => (
            <div className="f-bar" key={i}>
              {b.c + b.s === 0 ? <i className="z"></i> : null}
              {b.c > 0 && <i className="c" style={{ height: `${(b.c / max) * 100}%`, animationDelay: i * 18 + 'ms' }}></i>}
              {b.s > 0 && <i className="s" style={{ height: `${(b.s / max) * 100}%`, animationDelay: i * 18 + 40 + 'ms' }}></i>}
            </div>
          ))}
        </div>
        {labels && <div className="f-bar-labels" aria-hidden="true">{labels.map((l, i) => <span key={i}>{l}</span>)}</div>}
      </div>
    );
  }

  function Field({ label, ...rest }) {
    const id = React.useId();
    return (
      <div className="f-field">
        <label htmlFor={id}>{label}</label>
        <input id={id} className="f-input" {...rest} />
      </div>
    );
  }

  function Search({ placeholder }) {
    const id = React.useId();
    return (
      <label className="f-search" htmlFor={id}>
        <Icon name="search" />
        <input id={id} type="search" name="buscar" aria-label={placeholder.replace('…', '')} placeholder={placeholder} autoComplete="off" spellCheck={false} />
      </label>
    );
  }

  window.FC = { Toolbar, TabBar, Seg, Toggle, Avatar, Badges, Layer, ActionSheet, Toast, Console, Ticket, CellCube, Stamp, Bars, Field, Search };
})();
