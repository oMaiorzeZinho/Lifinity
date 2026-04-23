import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

// URL base da API vinda do .env do frontend
const API_URL = import.meta.env.VITE_API_URL;

// --- MOTOR DE GAMIFICAÇÃO (FRONTEND) ---
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
    xpRemaining: Math.max(xpForNextLevel - xp, 0),
  };
};

const DashboardLayout = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Função que sincroniza os dados do utilizador e das tarefas
    const loadDashboardData = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!savedUser || !token) {
        navigate('/login');
        return;
      }

      try {
        setUser(JSON.parse(savedUser));

        const response = await axios.get(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTasks(response.data);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Estes eventos vão permitir atualizar o dashboard
    // quando uma tarefa for criada/concluída/apagada
    window.addEventListener('lifinity-user-updated', loadDashboardData);
    window.addEventListener('lifinity-tasks-updated', loadDashboardData);

    return () => {
      window.removeEventListener('lifinity-user-updated', loadDashboardData);
      window.removeEventListener('lifinity-tasks-updated', loadDashboardData);
    };
  }, [navigate]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'concluida').length;
    const pending = tasks.filter((task) => task.status !== 'concluida').length;
    const highPriority = tasks.filter(
      (task) => task.priority === 'alta' && task.status !== 'concluida'
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      highPriority,
      completionRate,
    };
  }, [tasks]);

  const weeklyData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      return {
        key: date.toISOString().split('T')[0],
        label: date
          .toLocaleDateString('pt-PT', { weekday: 'short' })
          .replace('.', ''),
        total: 0,
        completed: 0,
      };
    });

    tasks.forEach((task) => {
      if (!task.created_at) return;

      const createdKey = new Date(task.created_at).toISOString().split('T')[0];
      const day = data.find((item) => item.key === createdKey);

      if (day) {
        day.total += 1;

        if (task.status === 'concluida') {
          day.completed += 1;
        }
      }
    });

    return data;
  }, [tasks]);

  const maxBarValue = useMemo(() => {
    return Math.max(
      ...weeklyData.map((day) => Math.max(day.total, day.completed)),
      1
    );
  }, [weeklyData]);

  if (loading && !user) {
    return (
      <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center">
        A carregar...
      </div>
    );
  }

  if (!user) return null;

  const levelData = getLevelData(user.xp);

  const isTasksPage = location.pathname === '/dashboard/tasks';
  const isRankingPage = location.pathname === '/dashboard/ranking';
  const isCommunityPage = location.pathname === '/dashboard/community';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
              L
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">
              LIFINITY
            </h1>
          </div>

          <nav className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
            <Link
              to="/dashboard/tasks"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isTasksPage
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Tarefas
            </Link>

            <Link
              to="/dashboard/ranking"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isRankingPage
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Ranking
            </Link>

            <Link
              to="/dashboard/community"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isCommunityPage
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Comunidade
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {user.username}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Nível {levelData.level}
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className="w-10 h-10 rounded-xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">
              Nível {levelData.level}
            </p>
            <p className="text-3xl font-black text-blue-600 tracking-tighter">
              {user.xp} XP
            </p>

            <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                style={{ width: `${levelData.progress}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase italic tracking-widest">
              Faltam {Math.round(levelData.xpRemaining)} XP para o Nível{' '}
              {levelData.level + 1}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">
              Total de Tarefas
            </p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter">
              {stats.total}
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
              Criadas até agora
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">
              Pendentes
            </p>
            <p className="text-3xl font-black text-orange-500 tracking-tighter">
              {stats.pending}
            </p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
              Alta prioridade: {stats.highPriority}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">
              Taxa de Conclusão
            </p>
            <p className="text-3xl font-black text-emerald-600 tracking-tighter">
              {stats.completionRate}%
            </p>

            <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-1000"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>

            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
              {stats.completed} concluídas / {stats.total} totais
            </p>
          </div>
        </div>

        {/* MINI GRÁFICO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-slate-800">
                Atividade dos Últimos 7 Dias
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Comparação entre tarefas criadas e concluídas.
              </p>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-300 block" />
                Criadas
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-blue-600 block" />
                Concluídas
              </div>
            </div>
          </div>

          {stats.total === 0 ? (
            <div className="p-16 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
              Ainda não tens tarefas suficientes para mostrar atividade.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {weeklyData.map((day) => (
                <div
                  key={day.key}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-4"
                >
                  <div className="h-32 flex items-end justify-center gap-2 mb-3">
                    <div
                      className="w-5 bg-slate-300 rounded-t-xl transition-all"
                      style={{
                        height: `${(day.total / maxBarValue) * 100}%`,
                        minHeight: day.total > 0 ? '10px' : '0px',
                      }}
                    />
                    <div
                      className="w-5 bg-blue-600 rounded-t-xl transition-all"
                      style={{
                        height: `${(day.completed / maxBarValue) * 100}%`,
                        minHeight: day.completed > 0 ? '10px' : '0px',
                      }}
                    />
                  </div>

                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {day.label}
                  </p>
                  <p className="text-center text-xs font-bold text-slate-400 mt-1">
                    {day.completed}/{day.total}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONTEÚDO DAS PÁGINAS FILHAS */}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;