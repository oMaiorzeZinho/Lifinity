/* Lifinity — App Android (claymorphism) */

const { useState, useEffect, useRef } = React;

const XP_GAIN = { alta: 60, media: 35, baixa: 20 };

const INITIAL_TASKS = [
  { id: 1, title: 'Preparar apresentação da PAP', desc: 'Slides + demo ao vivo do Lifinity', priority: 'alta', due: 'Prazo: 30/05/2026, 14:00', locked: true },
  { id: 2, title: 'Rever estatísticas semanais', desc: 'Confirmar gráficos da Recharts', priority: 'media', due: '', locked: true },
  { id: 3, title: 'Atualizar diagramas E-R', desc: 'Modelo da base de dados MySQL', priority: 'media', due: 'Prazo: 02/06/2026, 23:59', locked: false },
  { id: 4, title: 'Treino de 30 minutos', desc: 'Rotina diária de exercício', priority: 'baixa', due: '', locked: false },
  { id: 5, title: 'Ler capítulo de Filosofia', desc: '', priority: 'baixa', due: 'Prazo: 31/05/2026, 21:00', locked: false },
];

/* ---------- Acentos (alteram o menta base) ---------- */
const ACCENTS = {
  'Menta':   { mint: '#7EE0A2', m2: '#8eedb0', md: '#57b87e', on: '#0e2c1b' },
  'Azul':    { mint: '#8fb8e8', m2: '#a6cbf2', md: '#5f93d6', on: '#0e2138' },
  'Coral':   { mint: '#f0a487', m2: '#f7b89f', md: '#dd7e5d', on: '#3a1a0f' },
  'Violeta': { mint: '#bda6ef', m2: '#cbbbf5', md: '#9579dc', on: '#1f1238' },
};

function themeVars(t) {
  const a = ACCENTS[t.accent] || ACCENTS['Menta'];
  const base = {
    '--clay': t.clay,
    '--mint': a.mint, '--mint-2': a.m2, '--mint-d': a.md, '--on-mint': a.on,
  };
  if (t.theme === 'Claro (creme)') {
    return { ...base,
      '--bg': '#e7e1d5', '--bg2': '#00000000',
      '--surface': '#f1ebdf', '--surface2': '#fbf6ec',
      '--inset': '#e0d9ca', '--inset2': '#e7e0d2',
      '--text': '#39342b', '--muted': '#8d8676', '--faint': '#a8a191',
      '--gold': '#d6a83a', '--coral': '#e08763', '--sage': '#7faf88',
      '--hi': 'rgba(255,255,255,0.92)', '--hi-strong': 'rgba(255,255,255,1)',
      '--lo': 'rgba(150,138,116,0.40)', '--lo-strong': 'rgba(140,128,106,0.52)',
    };
  }
  return base; // escuro (verde) — usa :root
}

/* ---------- Bottom nav ---------- */
function BottomNav({ screen, setScreen, onAdd }) {
  const Tab = ({ id, icon: Ico, label }) => {
    const on = screen === id;
    return (
      <button onClick={() => setScreen(id)} style={{
        flex: 1, border: 0, background: 'transparent', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0',
        color: on ? 'var(--mint)' : 'var(--muted)', transition: 'color .2s',
      }}>
        <div className={on ? 'clay-inset' : ''} style={{ width: 44, height: 32, borderRadius: 12, display: 'grid', placeItems: 'center' }}>
          <Ico size={23} sw={on ? 2.5 : 2.2} />
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.02em' }}>{label}</span>
      </button>
    );
  };
  return (
    <div className="clay" style={{
      borderRadius: '26px 26px 0 0', padding: '9px 12px 8px', display: 'flex', alignItems: 'center',
      position: 'relative', flexShrink: 0, zIndex: 20,
    }}>
      <Tab id="atividades" icon={IcTasks} label="Atividades" />
      <Tab id="ranking" icon={IcTrophy} label="Ranking" />
      <div style={{ width: 64, flexShrink: 0 }} />
      <Tab id="inspiracao" icon={IcSpark} label="Inspiração" />
      <Tab id="perfil" icon={IcUser} label="Perfil" />
      {/* FAB central */}
      <button className="clay-btn" onClick={onAdd} style={{
        position: 'absolute', left: '50%', top: -22, transform: 'translateX(-50%)',
        width: 60, height: 60, borderRadius: '50%', display: 'grid', placeItems: 'center',
      }}>
        <IcPlus size={28} sw={3} />
      </button>
    </div>
  );
}

const TITLES = { atividades: 'Atividades', ranking: 'Ranking', inspiracao: 'Inspiração', perfil: 'Perfil' };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('atividades');
  const [sheet, setSheet] = useState(false);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [xp, setXp] = useState(2043);
  const [level, setLevel] = useState(8);
  const [xpInLevel, setXpInLevel] = useState(124);
  const [xpForNext, setXpForNext] = useState(219);
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);
  const idRef = useRef(100);

  // repõe o scroll ao topo na troca de ecrã
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [screen]);

  const showToast = (msg) => { setToast(msg + '|' + Date.now()); setTimeout(() => setToast(null), 1500); };

  const complete = (task) => {
    const gain = XP_GAIN[task.priority] || 20;
    setTasks(ts => ts.map(x => x.id === task.id ? { ...x, done: true } : x));
    setXp(v => v + gain);
    showToast('+' + gain + ' XP');
    setXpForNext(prev => {
      let nxt = prev - gain;
      if (nxt <= 0) { setLevel(l => l + 1); setXpInLevel(-nxt); return 280 + Math.floor(Math.random()*60); }
      setXpInLevel(v => v + gain);
      return nxt;
    });
  };
  const remove = (task) => setTasks(ts => ts.filter(x => x.id !== task.id));
  const create = (data) => {
    const nt = { id: ++idRef.current, ...data, locked: false };
    setTasks(ts => [nt, ...ts]);
    setScreen('atividades');
    showToast('Atividade criada');
  };

  const xpProps = { xp, level, xpForNext, xpInLevel };

  return (
    <div className="clay-root" style={{ ...themeVars(t), width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* fundo subtil com brilho */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 60% at 50% -10%, color-mix(in oklab, var(--mint), transparent 88%), transparent 60%)', pointerEvents: 'none' }} />

      <TopBar level={level} onBell={() => showToast('Sem notificações novas')} />

      {/* título do ecrã */}
      <div style={{ padding: '0 20px 8px', display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 900, letterSpacing: '-0.02em', flexShrink: 0 }}>{TITLES[screen]}</h1>
        {screen === 'atividades' && <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bom trabalho, Teste</span>}
      </div>

      <div ref={scrollRef} className="scroll" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {screen === 'atividades' && <Atividades tasks={tasks} {...xpProps} onComplete={complete} onDelete={remove} />}
        {screen === 'ranking' && <Ranking />}
        {screen === 'inspiracao' && <Inspiracao />}
        {screen === 'perfil' && <Perfil {...xpProps} />}
      </div>

      <BottomNav screen={screen} setScreen={setScreen} onAdd={() => setSheet(true)} />

      {sheet && <NovaAtividade onClose={() => setSheet(false)} onCreate={create} />}

      {/* Toast XP */}
      {toast && (
        <div key={toast} style={{
          position: 'absolute', top: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 80,
          animation: 'floatUp 1.5s ease-out forwards',
        }}>
          <div className="clay-pill" style={{ background: 'linear-gradient(152deg, var(--mint-2), var(--mint-d))', color: 'var(--on-mint)', padding: '10px 20px', fontSize: 14, whiteSpace: 'nowrap' }}>
            {toast.split('|')[0]}
          </div>
        </div>
      )}

      <Tweaks t={t} setTweak={setTweak} />
    </div>
  );
}

/* ---------- Painel de Tweaks ---------- */
function Tweaks({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Estilo clay" />
      <TweakSlider label="Intensidade do relevo" value={t.clay} min={0.5} max={1.5} step={0.05}
        onChange={(v) => setTweak('clay', v)} />
      <TweakSection label="Tema" />
      <TweakRadio label="Fundo" value={t.theme} options={['Escuro (verde)', 'Claro (creme)']}
        onChange={(v) => setTweak('theme', v)} />
      <TweakSelect label="Acento" value={t.accent} options={['Menta', 'Azul', 'Coral', 'Violeta']}
        onChange={(v) => setTweak('accent', v)} />
    </TweaksPanel>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "clay": 1,
  "theme": "Escuro (verde)",
  "accent": "Menta"
}/*EDITMODE-END*/;

ReactDOM.createRoot(document.getElementById('app-root')).render(
  <AndroidDevice dark>
    <App />
  </AndroidDevice>
);
