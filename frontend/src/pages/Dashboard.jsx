import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import DailyVerseWidget from '../components/DailyVerseWidget';

const API_URL = import.meta.env.VITE_API_URL;

const DashboardLayout = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lifinity-theme') === 'light' ? 'light' : 'dark';
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) return null;

    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const headers = getAuthHeaders();

      if (!headers) return;

      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers
      });

      setUnreadCount(Number(response.data?.unreadCount || 0));
    } catch (err) {
      console.error('Erro ao carregar contador de notificacoes:', err);
    }
  }, [getAuthHeaders]);

  const fetchNotifications = useCallback(async () => {
    try {
      const headers = getAuthHeaders();

      if (!headers) return;

      setNotificationsLoading(true);
      setNotificationError('');

      const response = await axios.get(`${API_URL}/notifications`, {
        headers
      });

      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao carregar notificacoes:', err);
      setNotificationError('Nao foi possivel carregar notificacoes.');
    } finally {
      setNotificationsLoading(false);
    }
  }, [getAuthHeaders]);

  const toggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications();
      await fetchUnreadCount();
    }
  };

  const markNotificationAsRead = async (notification) => {
    if (Number(notification.is_read) === 1) return true;

    try {
      const headers = getAuthHeaders();

      if (!headers) return false;

      await axios.put(
        `${API_URL}/notifications/${notification.idnotification}/read`,
        {},
        { headers }
      );

      setNotifications((currentNotifications) => {
        return currentNotifications.map((item) => {
          if (item.idnotification !== notification.idnotification) return item;
          return { ...item, is_read: 1 };
        });
      });

      await fetchUnreadCount();
      return true;
    } catch (err) {
      console.error('Erro ao marcar notificacao como lida:', err);
      setNotificationError('Nao foi possivel marcar a notificacao como lida.');
      return false;
    }
  };

  const handleNotificationClick = async (notification) => {
    const wasMarked = await markNotificationAsRead(notification);

    if (!wasMarked) return;

    setNotificationsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const headers = getAuthHeaders();

      if (!headers) return;

      await axios.put(`${API_URL}/notifications/read-all`, {}, { headers });

      setNotifications((currentNotifications) => {
        return currentNotifications.map((notification) => ({
          ...notification,
          is_read: 1
        }));
      });

      setUnreadCount(0);
    } catch (err) {
      console.error('Erro ao marcar todas as notificacoes como lidas:', err);
      setNotificationError('Nao foi possivel marcar todas como lidas.');
    }
  };

  useEffect(() => {
    localStorage.setItem('lifinity-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

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

            <div className="relative">
              <button
                onClick={toggleNotifications}
                className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  isLightTheme
                    ? 'border-slate-200 bg-white/85 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-emerald-200 hover:bg-white/10'
                }`}
                title="Notificacoes"
                aria-label="Notificacoes"
                aria-expanded={notificationsOpen}
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
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022 23.848 23.848 0 005.455 1.31m5.714 0a3 3 0 01-5.714 0"
                  />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border border-white/80">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className={`absolute right-0 mt-3 w-80 rounded-2xl border shadow-2xl overflow-hidden ${
                    isLightTheme
                      ? 'bg-white border-slate-200 text-slate-950'
                      : 'bg-[#111916] border-white/10 text-white'
                  }`}
                >
                  <div
                    className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
                      isLightTheme ? 'border-slate-200' : 'border-white/10'
                    }`}
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Notificacoes
                      </p>
                      <p className="text-sm font-black">
                        {unreadCount} por ler
                      </p>
                    </div>

                    <button
                      onClick={markAllNotificationsAsRead}
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                        isLightTheme
                          ? 'text-emerald-700 hover:text-emerald-900'
                          : 'text-emerald-200 hover:text-white'
                      }`}
                    >
                      Ler todas
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading && (
                      <p className="px-4 py-6 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                        A carregar...
                      </p>
                    )}

                    {!notificationsLoading && notificationError && (
                      <p className="px-4 py-4 text-xs font-bold text-red-300">
                        {notificationError}
                      </p>
                    )}

                    {!notificationsLoading && !notificationError && notifications.length === 0 && (
                      <p className="px-4 py-6 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
                        Sem notificacoes.
                      </p>
                    )}

                    {!notificationsLoading && !notificationError && notifications.map((notification) => {
                      const isUnread = Number(notification.is_read) === 0;

                      return (
                        <button
                          key={notification.idnotification}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 border-b transition-colors ${
                            isLightTheme
                              ? 'border-slate-100 hover:bg-slate-50'
                              : 'border-white/10 hover:bg-white/5'
                          } ${isUnread ? '' : 'opacity-65'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-none ${
                                isUnread ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            ></span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {notification.type}
                              </p>
                              <p className="text-sm font-bold leading-snug">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                {new Date(notification.created_at).toLocaleString('pt-PT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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
