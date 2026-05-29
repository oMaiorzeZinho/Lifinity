/* Lifinity — Ranking, Inspiração, Perfil + Nova Atividade (sheet) */

/* ============ RANKING ============ */
const RANK_DATA = [
  { name: 'Sofia M.',  xp: 4820, lvl: 14 },
  { name: 'João R.',   xp: 3990, lvl: 12 },
  { name: 'Mariana C.',xp: 3110, lvl: 11 },
  { name: 'Teste',     xp: 2043, lvl: 8, me: true },
  { name: 'Pedro L.',  xp: 1870, lvl: 8 },
  { name: 'Inês F.',   xp: 1540, lvl: 7 },
  { name: 'Rui A.',    xp: 1320, lvl: 6 },
  { name: 'Carla S.',  xp: 980,  lvl: 5 },
];
const initials = (n) => n.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
const PODIUM = ['var(--gold)', 'var(--sage)', 'var(--coral)'];

function Ranking() {
  const top3 = RANK_DATA.slice(0, 3);
  const order = [1, 0, 2]; // pódio: 2º, 1º, 3º
  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <div className="label" style={{ marginBottom: 14 }}>Ranking global · por XP</div>

      {/* Pódio */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 11, marginBottom: 24 }}>
        {order.map((idx, i) => {
          const u = top3[idx];
          const place = idx + 1;
          const h = place === 1 ? 100 : place === 2 ? 78 : 64;
          const av = place === 1 ? 58 : 48;
          return (
            <div key={u.name} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="clay" style={{ width: av, height: av, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: `linear-gradient(152deg, ${PODIUM[place-1]}, color-mix(in oklab, ${PODIUM[place-1]}, black 18%))`,
                color: '#1a2418', fontWeight: 900, fontSize: av*0.36, marginBottom: 8, flexShrink: 0 }}>{initials(u.name)}</div>
              <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{u.name.split(' ')[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--mint)', fontWeight: 800, marginBottom: 9, whiteSpace: 'nowrap' }}>{u.xp.toLocaleString('pt-PT')} XP</div>
              <div className="clay-soft" style={{ width: '100%', height: h, borderRadius: 18, display: 'grid', placeItems: 'center',
                fontSize: 30, fontWeight: 900, color: PODIUM[place-1] }}>
                {place}
              </div>
            </div>
          );
        })}
      </div>

      <div className="label" style={{ marginBottom: 11 }}>Classificação completa</div>
      {RANK_DATA.map((u, i) => (
        <div key={u.name} className={u.me ? 'clay' : 'clay-soft'} style={{
          display: 'flex', alignItems: 'center', gap: 13, padding: '12px 15px', marginBottom: 10,
          outline: u.me ? '2px solid var(--mint)' : 'none', outlineOffset: -2,
        }}>
          <span style={{ width: 22, fontWeight: 900, fontSize: 15, color: i < 3 ? PODIUM[i] : 'var(--muted)', textAlign: 'center' }}>{i+1}</span>
          <div className="clay-inset" style={{ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 14, color: 'var(--mint)' }}>{initials(u.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5 }}>{u.name}{u.me && <span style={{ color: 'var(--mint)', fontSize: 11, fontWeight: 800 }}> · tu</span>}</div>
            <div className="label" style={{ fontSize: 9.5 }}>Nível {u.lvl}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{u.xp.toLocaleString('pt-PT')}<span style={{ fontSize: 11, color: 'var(--mint)' }}> XP</span></div>
        </div>
      ))}
    </div>
  );
}

/* ============ INSPIRAÇÃO ============ */
const VERSES = [
  { t: 'Tudo posso naquele que me fortalece.', r: 'Filipenses 4:13', tag: 'Força' },
  { t: 'O Senhor é o meu pastor; nada me faltará.', r: 'Salmos 23:1', tag: 'Confiança' },
  { t: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', r: 'Salmos 37:5', tag: 'Fé' },
  { t: 'Sede fortes e corajosos. Não temais.', r: 'Deuteronómio 31:6', tag: 'Coragem' },
  { t: 'O amor é paciente, o amor é bondoso.', r: '1 Coríntios 13:4', tag: 'Amor' },
];

function Inspiracao() {
  const [i, setI] = React.useState(0);
  const [fav, setFav] = React.useState({ 1: true });
  const [copied, setCopied] = React.useState(false);
  const v = VERSES[i];
  const favCount = Object.values(fav).filter(Boolean).length;

  const shuffle = () => { let n; do { n = Math.floor(Math.random()*VERSES.length); } while (n === i); setI(n); setCopied(false); };
  const toggleFav = () => setFav(f => ({ ...f, [i]: !f[i] }));
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1400); };

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <div className="label" style={{ marginBottom: 14 }}>Inspiração diária</div>

      <div className="clay" style={{ padding: '26px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }} key={i}>
        <div style={{ position: 'absolute', top: -18, right: 6, fontSize: 130, fontWeight: 900, color: 'var(--mint)', opacity: 0.08, lineHeight: 1 }}>”</div>
        <span className="clay-pill" style={{ background: 'var(--inset)', color: 'var(--mint)', fontSize: 10, padding: '5px 12px', boxShadow: 'inset 2px 2px 5px var(--lo)' }}>{v.tag}</span>
        <div style={{ fontSize: 25, fontWeight: 800, lineHeight: 1.34, margin: '16px 0 14px', textWrap: 'pretty' }}>{v.t}</div>
        <div style={{ fontWeight: 900, color: 'var(--mint)', fontSize: 14, letterSpacing: '0.02em' }}>— {v.r}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button className="clay-btn-soft" onClick={toggleFav} style={{ flex: 1, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: fav[i] ? 'var(--coral)' : 'var(--text)' }}>
          {fav[i] ? <IcHeartF size={19} /> : <IcHeart size={19} />} {fav[i] ? 'Guardado' : 'Guardar'}
        </button>
        <button className="clay-ico" onClick={copy} style={{ width: 52, height: 52, color: copied ? 'var(--mint)' : 'var(--text)' }}>
          {copied ? <IcCheck size={20} sw={3} /> : <IcCopy size={19} />}
        </button>
      </div>

      <button className="clay-btn" onClick={shuffle} style={{ width: '100%', height: 56, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 18 }}>
        <IcShuffle size={20} /> Versículo aleatório
      </button>

      <div className="clay-soft" style={{ padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
        <div className="clay-inset" style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', color: 'var(--coral)' }}><IcHeartF size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Favoritos</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{favCount} versículo{favCount !== 1 ? 's' : ''} guardado{favCount !== 1 ? 's' : ''}</div>
        </div>
        <IcChevR size={20} style={{ color: 'var(--muted)' }} />
      </div>
    </div>
  );
}

/* ============ PERFIL ============ */
function ProfStat({ icon: Ico, value, label, color }) {
  return (
    <div className="clay-soft" style={{ padding: '15px 12px', borderRadius: 18 }}>
      <div style={{ color: color || 'var(--mint)', marginBottom: 7 }}><Ico size={22} /></div>
      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{value}</div>
      <div className="label" style={{ fontSize: 9.5, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Perfil({ xp, level, xpForNext, xpInLevel }) {
  const pct = Math.round((xpInLevel / (xpInLevel + xpForNext)) * 100);
  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <div className="clay" style={{ padding: '24px 20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 14 }}>
          <Ring value={pct} size={120} stroke={13}>
            <div className="clay" style={{ width: 80, height: 80, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: 'linear-gradient(152deg, var(--mint-2), var(--mint-d))', color: 'var(--on-mint)', fontWeight: 900, fontSize: 30 }}>T</div>
          </Ring>
        </div>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Teste</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>teste@lifinity.pt</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <span className="clay-pill" style={{ background: 'var(--inset)', color: 'var(--mint)', fontSize: 11, padding: '7px 15px', boxShadow: 'inset 2px 2px 5px var(--lo)' }}>Nível {level}</span>
          <span className="clay-pill" style={{ background: 'var(--inset)', color: 'var(--gold)', fontSize: 11, padding: '7px 15px', boxShadow: 'inset 2px 2px 5px var(--lo)' }}>{xp.toLocaleString('pt-PT')} XP</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <Progress value={pct} height={12} />
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginTop: 8 }}>Faltam {xpForNext} XP para o nível {level + 1}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 11, marginBottom: 16 }}>
        <ProfStat icon={IcFire} value="12" label="Dias seguidos" color="var(--coral)" />
        <ProfStat icon={IcUsers} value="3" label="Grupos" />
        <ProfStat icon={IcUser} value="9" label="Amigos" color="var(--gold)" />
      </div>

      <div className="label" style={{ marginBottom: 11 }}>Conquistas recentes</div>
      <div style={{ display: 'flex', gap: 11, marginBottom: 18 }}>
        {[{ i: IcTrophy, c: 'var(--gold)' }, { i: IcFire, c: 'var(--coral)' }, { i: IcCheck, c: 'var(--mint)' }, { i: IcSpark, c: 'var(--sky)' }].map((b, k) => (
          <div key={k} className="clay-soft" style={{ flex: 1, aspectRatio: '1', borderRadius: 18, display: 'grid', placeItems: 'center', color: b.c }}>
            <b.i size={26} />
          </div>
        ))}
      </div>

      <button className="clay-btn-soft" style={{ width: '100%', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, color: 'var(--coral)' }}>
        <IcLogout size={20} /> Terminar sessão
      </button>
    </div>
  );
}

/* ============ NOVA ATIVIDADE (sheet) ============ */
function NovaAtividade({ onClose, onCreate }) {
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [prio, setPrio] = React.useState('media');
  const [due, setDue] = React.useState('');

  const submit = () => {
    if (!title.trim()) return;
    onCreate({ title: title.trim(), desc: desc.trim(), priority: prio, due: due.trim() ? `Prazo: ${due.trim()}` : '' });
    onClose();
  };

  const field = { width: '100%', border: 0, background: 'transparent', outline: 'none', color: 'var(--text)', font: 'inherit', fontWeight: 700, fontSize: 15 };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div className="clay" style={{ position: 'relative', borderRadius: '34px 34px 0 0', padding: '14px 22px 26px', animation: 'sheetIn .3s ease' }}>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: 'var(--inset)', margin: '0 auto 16px' }} />
        <div style={{ fontWeight: 900, fontSize: 21, marginBottom: 16 }}>Nova atividade</div>

        <div className="label" style={{ marginBottom: 7 }}>Título</div>
        <div className="clay-inset" style={{ padding: '13px 15px', marginBottom: 14 }}>
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Preparar apresentação" style={field} />
        </div>

        <div className="label" style={{ marginBottom: 7 }}>Descrição</div>
        <div className="clay-inset" style={{ padding: '13px 15px', marginBottom: 14 }}>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalhes (opcional)" style={field} />
        </div>

        <div className="label" style={{ marginBottom: 7 }}>Prioridade</div>
        <div style={{ display: 'flex', gap: 9, marginBottom: 14 }}>
          {['alta','media','baixa'].map(p => {
            const on = prio === p;
            const meta = PRIORITY[p];
            return (
              <button key={p} onClick={() => setPrio(p)} className={on ? '' : 'clay-inset'} style={{
                flex: 1, height: 46, border: 0, cursor: 'pointer', borderRadius: 14, font: 'inherit',
                fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em',
                background: on ? meta.color : undefined, color: on ? meta.text : 'var(--muted)',
                boxShadow: on ? '4px 5px 12px var(--lo), inset 2px 2px 4px rgba(255,255,255,.25), inset -2px -3px 6px var(--lo)' : undefined,
              }}>{meta.label}</button>
            );
          })}
        </div>

        <div className="label" style={{ marginBottom: 7 }}>Prazo</div>
        <div className="clay-inset" style={{ padding: '13px 15px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <IcClock size={18} style={{ color: 'var(--muted)' }} />
          <input value={due} onChange={e => setDue(e.target.value)} placeholder="dd/mm/aaaa (opcional)" style={field} />
        </div>

        <div style={{ display: 'flex', gap: 11 }}>
          <button className="clay-btn-soft" onClick={onClose} style={{ flex: 1, height: 54, fontSize: 15 }}>Cancelar</button>
          <button className="clay-btn" onClick={submit} style={{ flex: 1.4, height: 54, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: title.trim() ? 1 : 0.5 }}>
            <IcPlus size={20} sw={3} /> Criar
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Ranking, Inspiracao, Perfil, NovaAtividade });
