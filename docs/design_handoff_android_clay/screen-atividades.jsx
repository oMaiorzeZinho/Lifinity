/* Lifinity — Ecrã Atividades (home pós-login, o mais importante) */

function StatChip({ value, label, color }) {
  return (
    <div className="clay-soft" style={{ flex: 1, padding: '11px 8px', textAlign: 'center', borderRadius: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: color || 'var(--text)' }}>{value}</div>
      <div className="label" style={{ fontSize: 9.5, marginTop: 1 }}>{label}</div>
    </div>
  );
}

function FilterSelect({ value, options, onChange }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <button className="clay-inset" onClick={() => setOpen(o => !o)} style={{
        width: '100%', border: 0, cursor: 'pointer', color: 'var(--text)',
        font: 'inherit', fontWeight: 800, fontSize: 11, letterSpacing: '0.03em', textTransform: 'uppercase',
        padding: '11px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
      }}>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{options.find(o => o.v === value)?.t || options[0].t}</span>
        <IcChevD size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'var(--mint)' }} />
      </button>
      {open && (
        <div className="clay" style={{ position: 'absolute', top: '108%', left: 0, right: 0, zIndex: 30, padding: 6 }}>
          {options.map(o => (
            <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', border: 0, cursor: 'pointer', borderRadius: 12,
              background: o.v === value ? 'var(--inset)' : 'transparent', color: o.v === value ? 'var(--mint)' : 'var(--text)',
              font: 'inherit', fontWeight: 800, fontSize: 12.5, letterSpacing: '0.03em', textTransform: 'uppercase',
              padding: '10px 12px',
            }}>{o.t}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Atividades({ tasks, xp, level, xpForNext, xpInLevel, onComplete, onDelete }) {
  const [q, setQ] = React.useState('');
  const [estado, setEstado] = React.useState('todos');
  const [prio, setPrio] = React.useState('todas');

  const visible = tasks.filter(t => {
    if (t.done || t.lost) return false;
    if (q && !(t.title + ' ' + (t.desc||'')).toLowerCase().includes(q.toLowerCase())) return false;
    if (prio !== 'todas' && t.priority !== prio) return false;
    return true;
  });

  const pendentes = tasks.filter(t => !t.done && !t.lost).length;
  const concluidas = tasks.filter(t => t.done).length;
  const perdidas = tasks.filter(t => t.lost).length;
  const totalToday = pendentes + concluidas + perdidas;
  const pct = totalToday ? Math.round((concluidas / totalToday) * 100) : 0;
  const pctLevel = Math.round((xpInLevel / (xpInLevel + xpForNext)) * 100);

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      {/* XP / nível */}
      <div className="clay" style={{ padding: '18px 20px', marginBottom: 14 }}>
        <div className="label">Nível {level}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 13px' }}>
          <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em' }}>{xp.toLocaleString('pt-PT')}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--mint)' }}>XP</span>
        </div>
        <Progress value={pctLevel} />
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 700, marginTop: 9 }}>
          Faltam <b style={{ color: 'var(--text)' }}>{xpForNext} XP</b> para o nível {level + 1}
        </div>
      </div>

      {/* Resumo de hoje */}
      <div className="clay" style={{ padding: '17px 19px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <div>
            <div className="label">Resumo de hoje</div>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, marginTop: 3 }}>{pct}%</div>
          </div>
          <div style={{ width: 56, height: 56 }}>
            <Ring value={pct} size={56} stroke={8}>
              <IcFire size={22} style={{ color: 'var(--mint)' }} />
            </Ring>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <StatChip value={pendentes} label="Pendentes" />
          <StatChip value={concluidas} label="Concluídas" color="var(--mint)" />
          <StatChip value={perdidas} label="Perdidas" color="var(--coral)" />
        </div>
      </div>

      {/* Pesquisa */}
      <div className="clay-inset" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 50, marginBottom: 11 }}>
        <IcSearch size={19} style={{ color: 'var(--muted)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Procurar atividade…" style={{
          flex: 1, border: 0, background: 'transparent', outline: 'none', color: 'var(--text)',
          font: 'inherit', fontWeight: 700, fontSize: 15,
        }} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <FilterSelect value={estado} onChange={setEstado} options={[
          { v: 'todos', t: 'Todos os estados' }, { v: 'pend', t: 'Pendentes' }, { v: 'conc', t: 'Concluídas' },
        ]} />
        <FilterSelect value={prio} onChange={setPrio} options={[
          { v: 'todas', t: 'Prioridades' }, { v: 'alta', t: 'Alta' }, { v: 'media', t: 'Média' }, { v: 'baixa', t: 'Baixa' },
        ]} />
      </div>

      <div className="label" style={{ marginBottom: 11, display: 'flex', justifyContent: 'space-between' }}>
        <span>As minhas atividades</span>
        <span style={{ color: 'var(--mint)' }}>{visible.length}</span>
      </div>

      {visible.length === 0 ? (
        <div className="clay" style={{ padding: '34px 20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--mint)', display: 'grid', placeItems: 'center', marginBottom: 10 }}><IcCheck size={34} sw={2.6} /></div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Tudo em dia!</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Sem atividades a corresponder. Cria uma nova com o +.</div>
        </div>
      ) : visible.map(t => (
        <TaskCard key={t.id} task={t} onComplete={onComplete} onDelete={onDelete} />
      ))}
    </div>
  );
}

Object.assign(window, { Atividades });
