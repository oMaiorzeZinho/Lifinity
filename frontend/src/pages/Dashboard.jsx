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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 min-h-20 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
              L
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-800">
              LIFINITY
            </h1>
          </div>

          <nav className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
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
              to="/dashboard/inspiration"
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isInspirationPage
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Inspiração
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
                Nível {user.level}
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className="w-10 h-10 rounded-xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"
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

      <main
        className={`mx-auto p-6 transition-all ${
          isInspirationPage ? '' : 'max-w-7xl'
        }`}
        style={isInspirationPage ? { maxWidth: 2000 } : undefined}
      >
        <Outlet />
      </main>
      {!isInspirationPage && <DailyVerseWidget />}
    </div>
  );
};

export default DashboardLayout;
