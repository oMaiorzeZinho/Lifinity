import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import DailyVerseWidget from '../components/DailyVerseWidget';

const DashboardLayout = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lifinity-theme') === 'light' ? 'light' : 'dark';
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('lifinity-theme', theme);
  }, [theme]);

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
  const isChatPage = location.pathname === '/dashboard/chat';
  const isLightTheme = theme === 'light';

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  const accentOpacity = isLightTheme ? 0.16 : 0.09;
  const secondaryAccentOpacity = isLightTheme ? 0.14 : 0.08;
  const pageBackground = isTasksPage
    ? `radial-gradient(circle at top left, rgba(110, 231, 183, ${accentOpacity}), transparent 38%)`
    : isRankingPage
      ? `radial-gradient(circle at top, rgba(251, 191, 36, ${secondaryAccentOpacity}), transparent 38%)`
      : isStatisticsPage
        ? `radial-gradient(circle at top right, rgba(34, 211, 238, ${secondaryAccentOpacity}), transparent 38%)`
        : isInspirationPage
          ? `radial-gradient(circle at top, rgba(245, 158, 11, ${secondaryAccentOpacity}), transparent 38%)`
          : isCommunityPage
            ? `radial-gradient(circle at top left, rgba(20, 184, 166, ${accentOpacity}), transparent 38%)`
            : isProfilePage
              ? `radial-gradient(circle at top, rgba(148, 163, 184, ${secondaryAccentOpacity}), transparent 38%)`
              : isChatPage
                ? `radial-gradient(circle at top right, rgba(59, 130, 246, ${secondaryAccentOpacity}), transparent 38%)`
              : `radial-gradient(circle at top, rgba(110, 231, 183, ${secondaryAccentOpacity}), transparent 38%)`;

  const backgroundOverlay = isLightTheme
    ? 'linear-gradient(to bottom, rgba(248, 250, 252, 0.78), rgba(241, 245, 249, 0.96) 70%)'
    : 'linear-gradient(to bottom, rgba(16, 23, 19, 0.65), rgba(16, 23, 19, 0.94) 70%)';

  const navLinkClass = (isActive) =>
    `px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
      isActive
        ? isLightTheme
          ? 'bg-slate-950 text-white shadow-sm'
          : 'bg-white text-slate-950 shadow-sm'
        : isLightTheme
          ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;
  return (
    <div
      className={`min-h-screen font-sans relative overflow-hidden transition-colors ${
        isLightTheme ? 'text-slate-950' : 'text-white'
      }`}
      style={{ backgroundColor: isLightTheme ? '#f8fafc' : '#101713' }}
    >
      <div
        className={`fixed inset-0 bg-cover bg-center ${
          isLightTheme ? 'opacity-10' : 'opacity-25'
        }`}
        style={{ backgroundImage: "url('/images/dashboard-bg.png')" }}
      ></div>

      <div
        className="fixed inset-0"
        style={{ background: pageBackground }}
      ></div>

      <div
        className="fixed inset-0"
        style={{ background: backgroundOverlay }}
      ></div>

      <div className="relative z-10">
      {/* HEADER */}
      <header
        className={`border-b sticky top-0 z-20 backdrop-blur-2xl transition-colors ${
          isLightTheme ? 'border-slate-200/80' : 'border-white/10'
        }`}
        style={{
          backgroundColor: isLightTheme
            ? 'rgba(248, 250, 252, 0.84)'
            : 'rgba(16, 23, 19, 0.8)'
        }}
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

            <h1
              className={`text-xl font-black tracking-tight transition-colors ${
                isLightTheme ? 'text-slate-950' : 'text-white'
              }`}
            >
              LIFINITY
            </h1>
          </Link>

          <nav
            className={`flex gap-1 p-1 rounded-2xl border overflow-x-auto transition-colors ${
              isLightTheme
                ? 'bg-white/85 border-slate-200 shadow-sm'
                : 'bg-white/5 border-white/10'
            }`}
            style={{ maxWidth: 760 }}
          >
            <Link
              to="/dashboard/tasks"
              className={navLinkClass(isTasksPage)}
            >
              Tarefas
            </Link>

            <Link
              to="/dashboard/ranking"
              className={navLinkClass(isRankingPage)}
            >
              Ranking
            </Link>

            <Link
              to="/dashboard/statistics"
              className={navLinkClass(isStatisticsPage)}
            >
              Estatísticas
            </Link>

            <Link
              to="/dashboard/inspiration"
              className={navLinkClass(isInspirationPage)}
            >
              Inspiração
            </Link>

            <Link
              to="/dashboard/community"
              className={navLinkClass(isCommunityPage)}
            >
              Comunidade
            </Link>

            <Link
              to="/dashboard/profile"
              className={navLinkClass(isProfilePage)}
            >
              Perfil
            </Link>

            <Link
              to="/dashboard/chat"
              className={navLinkClass(isChatPage)}
            >
              Chat
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/dashboard/profile" className="text-right hidden lg:block group">
              <p
                className={`text-sm font-black uppercase tracking-tight transition-colors ${
                  isLightTheme
                    ? 'text-slate-950 group-hover:text-emerald-700'
                    : 'text-white group-hover:text-emerald-200'
                }`}
              >
                {user.username}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Nível {user.level}
              </p>
            </Link>

            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                isLightTheme
                  ? 'border-slate-200 bg-white/85 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-yellow-300 hover:bg-white/10'
              }`}
              title={isLightTheme ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
              aria-label={isLightTheme ? 'Mudar para modo escuro' : 'Mudar para modo claro'}
              aria-pressed={isLightTheme}
            >
              {isLightTheme ? (
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
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75 9.75 9.75 0 018.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25 9.75 9.75 0 0012.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              ) : (
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
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                isLightTheme
                  ? 'border-slate-200 bg-white/85 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-400/20'
              }`}
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
