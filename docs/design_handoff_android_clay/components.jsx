/* Lifinity — componentes partilhados (clay) */

const PRIORITY = {
  alta:  { label: 'Alta',  color: 'var(--coral)', text: '#3a1a10' },
  media: { label: 'Média', color: 'var(--gold)',  text: '#3a2e08' },
  baixa: { label: 'Baixa', color: 'var(--sage)',  text: '#16291c' },
};

/* ---------- Marca ---------- */
function Brand({ size = 26 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div className="clay-soft" style={{
        width: size + 16, height: size + 16, borderRadius: 14,
        display: 'grid', placeItems: 'center', padding: 6,
        background: 'linear-gradient(152deg, var(--mint-2), var(--mint-d))',
      }}>
        <img src="assets/lifinity-logo.png" alt="Lifinity" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <span style={{ fontWeight: 900, fontSize: size - 4, letterSpacing: '-0.01em' }}>Lifinity</span>
    </div>
  );
}

/* ---------- Cabeçalho do ecrã ---------- */
function TopBar({ level = 8, onBell, notif = 2 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px 10px',
    }}>
      <Brand size={24} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="clay-pill" style={{
          padding: '7px 13px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          background: 'linear-gradient(152deg, var(--surface2), var(--surface))', lineHeight: 1.1,
        }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.02em', color: 'var(--text)', textTransform: 'none' }}>Teste</span>
          <span style={{ fontSize: 9, color: 'var(--mint)', letterSpacing: '0.1em' }}>NÍVEL {level}</span>
        </div>
        <button className="clay-ico" style={{ width: 44, height: 44, position: 'relative' }} onClick={onBell}>
          <IcBell size={21} />
          {notif > 0 && <span style={{
            position: 'absolute', top: 7, right: 8, width: 16, height: 16, borderRadius: '50%',
            background: 'var(--coral)', color: '#3a1a10', fontSize: 10, fontWeight: 900,
            display: 'grid', placeItems: 'center',
          }}>{notif}</span>}
        </button>
      </div>
    </div>
  );
}

/* ---------- Pill de prioridade ---------- */
function PriorityPill({ level, small }) {
  const p = PRIORITY[level] || PRIORITY.media;
  return (
    <span className="clay-pill" style={{
      background: p.color, color: p.text, fontSize: small ? 10 : 11,
      padding: small ? '4px 10px' : '6px 13px', display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <IcFlag size={small ? 11 : 12} sw={2.6} />{p.label}
    </span>
  );
}

/* ---------- Badge neutro (meta) ---------- */
function MetaBadge({ icon: Ico, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, color: 'var(--muted)',
      background: 'var(--inset2)', borderRadius: 999, padding: '5px 11px',
      boxShadow: 'inset 2px 2px 5px var(--lo), inset -2px -2px 4px var(--hi)',
    }}>
      {Ico && <Ico size={12} />}{children}
    </span>
  );
}

/* ---------- Barra de progresso ---------- */
function Progress({ value, color = 'var(--mint)', height = 14 }) {
  return (
    <div className="clay-inset" style={{ height, borderRadius: 999, padding: 3, width: '100%' }}>
      <div style={{
        height: '100%', width: `${Math.max(4, Math.min(100, value))}%`,
        borderRadius: 999, background: `linear-gradient(90deg, ${color}, color-mix(in oklab, ${color}, white 22%))`,
        boxShadow: '2px 0 6px rgba(0,0,0,.25), inset 1px 1px 3px rgba(255,255,255,.55), inset -1px -2px 4px rgba(30,110,65,.4)',
        transition: 'width .6s cubic-bezier(.34,1.4,.5,1)',
      }} />
    </div>
  );
}

/* ---------- Anel de progresso (perfil) ---------- */
function Ring({ value, size = 116, stroke = 13, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--inset)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--mint)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value/100)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.34,1.4,.5,1)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- Card de tarefa ---------- */
function TaskCard({ task, onComplete, onDelete }) {
  const [leaving, setLeaving] = React.useState(false);
  const done = task.done;

  const handle = (fn) => {
    setLeaving(true);
    setTimeout(fn, 320);
  };

  return (
    <div className="clay" style={{
      padding: '16px 17px', marginBottom: 14,
      animation: leaving ? 'collapse .32s forwards' : 'none',
      opacity: done ? 0.6 : 1,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, textDecoration: done ? 'line-through' : 'none' }}>
            {task.title}
          </div>
          {task.desc && <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 5, lineHeight: 1.35 }}>{task.desc}</div>}
        </div>
        <PriorityPill level={task.priority} small />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
        <MetaBadge icon={IcUser}>Criada por mim</MetaBadge>
        {task.due && <MetaBadge icon={IcClock}>{task.due}</MetaBadge>}
        {task.locked && <MetaBadge icon={IcLock}>Edição bloqueada</MetaBadge>}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="clay-btn" style={{ flex: 1, height: 46, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          onClick={() => handle(() => onComplete(task))}>
          <IcCheck size={18} sw={3} /> Concluir
        </button>
        <button className="clay-ico" style={{ width: 46, height: 46, color: 'var(--coral)' }}
          onClick={() => handle(() => onDelete(task))}>
          <IcTrash size={19} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  PRIORITY, Brand, TopBar, PriorityPill, MetaBadge, Progress, Ring, TaskCard,
});
