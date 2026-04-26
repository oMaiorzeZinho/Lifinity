import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import DailyVerseWidget from '../components/DailyVerseWidget';

const DashboardLayout = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!savedUser || !token) {
      navigate('/login');
      return;
    }

    const handleUserUpdated = () => {
      const refreshedUser = localStorage.getItem('user');
      if (refreshedUser) {
        setUser(JSON.parse(refreshedUser));
      }
    };

    window.addEventListener('lifinity-user-updated', handleUserUpdated);

    return () => {
      window.removeEventListener('lifinity-user-updated', handleUserUpdated);
    };
  }, [navigate]);

  if (!user) {
    return (
      <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center">
        A carregar...
      </div>
    );
  }

  const isTasksPage = location.pathname === '/dashboard/tasks';
  const isRankingPage = location.pathname === '/dashboard/ranking';
  const isCommunityPage = location.pathname === '/dashboard/community';
  const isInspirationPage = location.pathname === '/dashboard/inspiration';
  const isStatisticsPage = location.pathname === '/dashboard/statistics';
  const isProfilePage = location.pathname === '/dashboard/profile';


  const pageBackground = isTasksPage
    ? 'radial-gradient(circle at top left, rgba(110, 231, 183, 0.09), transparent 38%)'
    : isRankingPage
      ? 'radial-gradient(circle at top, rgba(251, 191, 36, 0.08), transparent 38%)'
      : isStatisticsPage
        ? 'radial-gradient(circle at top right, rgba(34, 211, 238, 0.08), transparent 38%)'
        : isInspirationPage
          ? 'radial-gradient(circle at top, rgba(245, 158, 11, 0.08), transparent 38%)'
          : isCommunityPage
            ? 'radial-gradient(circle at top left, rgba(20, 184, 166, 0.09), transparent 38%)'
            : isProfilePage
              ? 'radial-gradient(circle at top, rgba(148, 163, 184, 0.08), transparent 38%)'
              : 'radial-gradient(circle at top, rgba(110, 231, 183, 0.08), transparent 38%)';
  return (
    <div
      className="min-h-screen text-white font-sans relative overflow-hidden"
      style={{ backgroundColor: '#101713' }}
    >
      <div
        className="fixed inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/images/dashboard-bg.png')" }}
      ></div>

      <div
        className="fixed inset-0"
        style={{ background: pageBackground }}
      ></div>

      <div
        className="fixed inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(16, 23, 19, 0.65), rgba(16, 23, 19, 0.94) 70%)'
        }}
      ></div>

      <div className="relative z-10">
      {/* HEADER */}
      <header
        className="border-b border-white/10 sticky top-0 z-20 backdrop-blur-2xl"
        style={{ backgroundColor: 'rgba(16, 23, 19, 0.8)' }}
      >
        <div
          className="mx-auto px-6 h-20 flex items-center justify-between gap-4"
          style={{ maxWidth: 1500 }}
        >
          <Link to="/dashboard/tasks" className="flex items-center gap-3">
            <img
              src="/images/lifinity-logo.png"
              alt="Logotipo Lifinity"
              className="h-10 w-auto object-contain"
            />

            <h1 className="text-xl font-black tracking-tight text-white">
              LIFINITY
            </h1>
          </Link>

          <nav
            className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto"
            style={{ maxWidth: 760 }}
          >
            <Link
              to="/dashboard/tasks"
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isTasksPage
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tarefas
            </Link>

            <Link
              to="/dashboard/ranking"
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isRankingPage
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Ranking
            </Link>

            <Link
              to="/dashboard/statistics"
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isStatisticsPage
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Estatísticas
            </Link>

            <Link
              to="/dashboard/inspiration"
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isInspirationPage
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Inspiração
            </Link>

            <Link
              to="/dashboard/community"
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isCommunityPage
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Comunidade
            </Link>

            <Link
              to="/dashboard/profile"
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                isProfilePage
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Perfil
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/dashboard/profile" className="text-right hidden lg:block group">
              <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-emerald-200 transition-colors">
                {user.username}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Nível {user.level}
              </p>
            </Link>

            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/20 transition-all"
              title="Terminar sessão"
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

      <main className="mx-auto p-6 transition-all" style={{ maxWidth: 1800 }}>
        <Outlet />
      </main>

      {!isInspirationPage && <DailyVerseWidget />}
      </div>
    </div>
  );
};

export default DashboardLayout;
