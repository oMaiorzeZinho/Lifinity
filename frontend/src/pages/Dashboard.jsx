import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';

// --- MOTOR DE GAMIFICAÇÃO (FRONTEND) ---
// Esta função pode ser movida para um ficheiro de utilidades mais tarde
const getLevelData = (xp) => {
  if (!xp) xp = 0;
  let level = 1;
  const calculateXPForLevel = (lvl) => Math.floor(100 * Math.pow(lvl - 1, 1.5));
  while (xp >= calculateXPForLevel(level + 1)) {
    level++;
  }
  const xpStartOfLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const progress = ((xp - xpStartOfLevel) / (xpForNextLevel - xpStartOfLevel)) * 100;
  return {
    level,
    progress: Math.min(Math.max(progress, 0), 100),
    xpRemaining: Math.max(xpForNextLevel - xp, 0)
  };
};

const DashboardLayout = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Para saber qual a rota ativa

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center">A carregar...</div>;

  const levelData = getLevelData(user.xp);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">L</div>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">LIFINITY</h1>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <Link to="/dashboard/tasks"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/dashboard/tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              Tarefas
            </Link>
            <Link to="/dashboard/ranking"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/dashboard/ranking' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              Ranking
            </Link>
            <Link to="/dashboard/community"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                location.pathname === '/dashboard/community' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}>
              Comunidade
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{user.username}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível {user.level}</p>
            </div>
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* CARDS DE RESUMO GERAIS (XP/Nível) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">Nível {levelData.level}</p>
            <p className="text-3xl font-black text-blue-600 tracking-tighter">{user.xp} XP</p>
            <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-600 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]" style={{ width: `${levelData.progress}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase italic tracking-widest">Faltam {Math.round(levelData.xpRemaining)} XP para o Nível {levelData.level + 1}</p>
          </div>
          {/* Placeholder para outros cards gerais do dashboard, se houver */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">Card Genérico 1</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">...</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">Card Genérico 2</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">...</p>
          </div>
        </div>

        {/* ONDE AS PÁGINAS FILHAS SERÃO RENDERIZADAS */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
