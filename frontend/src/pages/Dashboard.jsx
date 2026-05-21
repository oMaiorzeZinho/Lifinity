import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import DailyVerseWidget from '../components/DailyVerseWidget';
import AccountSettingsModal from '../components/AccountSettingsModal';

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
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const accentOpacity = isLightTheme ? 0.22 : 0.15;
  const secondaryAccentOpacity = isLightTheme ? 0.17 : 0.11;
  const pageBackground = isTasksPage
    ? `radial-gradient(circle at top left, rgba(47, 111, 79, ${accentOpacity}), transparent 40%)`
    : isRankingPage
      ? `radial-gradient(circle at top, rgba(122, 105, 67, ${secondaryAccentOpacity}), transparent 40%)`
      : isStatisticsPage
        ? `radial-gradient(circle at top right, rgba(90, 120, 112, ${secondaryAccentOpacity}), transparent 40%)`
        : isInspirationPage
          ? `radial-gradient(circle at top, rgba(111, 143, 123, ${secondaryAccentOpacity}), transparent 40%)`
          : isCommunityPage
            ? `radial-gradient(circle at top left, rgba(71, 130, 101, ${accentOpacity}), transparent 40%)`
            : isProfilePage
              ? `radial-gradient(circle at top, rgba(143, 163, 151, ${secondaryAccentOpacity}), transparent 40%)`
              : isChatPage
                ? `radial-gradient(circle at top right, rgba(82, 115, 105, ${secondaryAccentOpacity}), transparent 40%)`
              : `radial-gradient(circle at top, rgba(111, 143, 123, ${secondaryAccentOpacity}), transparent 40%)`;

  const backgroundOverlay = isLightTheme
    ? 'linear-gradient(to bottom, rgba(223, 232, 223, 0.5), rgba(212, 222, 212, 0.9) 72%)'
    : 'linear-gradient(to bottom, rgba(31, 42, 36, 0.48), rgba(31, 42, 36, 0.86) 72%)';

  const navLinkClass = (isActive) =>
    `px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
      isActive
        ? 'bg-[var(--lifinity-primary)] [color:var(--lifinity-on-primary)] shadow-sm'
        : '[color:var(--lifinity-text-muted)] hover:[color:var(--lifinity-text)] hover:bg-[var(--lifinity-surface-soft)]'
    }`;
  return (
    <div
      className="lifinity-page min-h-screen font-sans relative overflow-hidden transition-colors"
      data-theme={theme}
    >
      <div
        className={`fixed inset-0 bg-cover bg-center ${
          isLightTheme ? 'opacity-[0.18]' : 'opacity-[0.28]'
        }`}
        style={{
          backgroundImage: "url('/images/dashboard-bg.png')",
          filter: isLightTheme ? 'saturate(0.9)' : 'saturate(0.85) brightness(1.08)'
        }}
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
        className="border-b sticky top-0 z-20 backdrop-blur-2xl transition-colors"
        style={{
          backgroundColor: isLightTheme
            ? 'rgba(244, 247, 240, 0.82)'
            : 'rgba(37, 50, 42, 0.76)',
          borderColor: 'var(--lifinity-border)'
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
              className="text-xl font-black tracking-tight transition-colors [color:var(--lifinity-text)]"
            >
              LIFINITY
            </h1>
          </Link>

          <nav
            className="lifinity-card-soft flex gap-1 p-1 rounded-2xl overflow-x-auto transition-colors"
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
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/dashboard/profile" className="text-right hidden lg:block group">
              <p
                className="text-sm font-black uppercase tracking-tight transition-colors [color:var(--lifinity-text)] group-hover:[color:var(--lifinity-primary-strong)]"
              >
                {user.username}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest [color:var(--lifinity-text-muted)]">
                Nível {user.level}
              </p>
            </Link>

            <div className="relative">
              <button
                onClick={toggleNotifications}
                className="lifinity-button-secondary relative w-10 h-10 rounded-xl flex items-center justify-center hover:[color:var(--lifinity-primary-strong)]"
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
                  <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-[var(--lifinity-danger)] [color:var(--lifinity-on-primary)] text-[10px] font-black flex items-center justify-center border border-[var(--lifinity-border)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="lifinity-menu absolute right-0 mt-3 w-80 rounded-2xl overflow-hidden"
                >
                  <div
                    className="px-4 py-3 border-b flex items-center justify-between gap-3"
                    style={{ borderColor: 'var(--lifinity-border)' }}
                  >
                    <div>
                      <p className="lifinity-muted-label">
                        Notificacoes
                      </p>
                      <p className="text-sm font-black">
                        {unreadCount} por ler
                      </p>
                    </div>

                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] font-black uppercase tracking-widest transition-colors [color:var(--lifinity-primary)] hover:[color:var(--lifinity-primary-strong)]"
                    >
                      Ler todas
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading && (
                      <p className="px-4 py-6 text-center text-xs font-bold uppercase tracking-widest [color:var(--lifinity-text-muted)]">
                        A carregar...
                      </p>
                    )}

                    {!notificationsLoading && notificationError && (
                      <p className="px-4 py-4 text-xs font-bold [color:var(--lifinity-danger)]">
                        {notificationError}
                      </p>
                    )}

                    {!notificationsLoading && !notificationError && notifications.length === 0 && (
                      <p className="px-4 py-6 text-center text-xs font-bold uppercase tracking-widest [color:var(--lifinity-text-muted)]">
                        Sem notificacoes.
                      </p>
                    )}

                    {!notificationsLoading && !notificationError && notifications.map((notification) => {
                      const isUnread = Number(notification.is_read) === 0;

                      return (
                        <button
                          key={notification.idnotification}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full text-left px-4 py-3 border-b transition-colors hover:bg-[var(--lifinity-surface-hover)] ${
                            isUnread ? '' : 'opacity-65'
                          }`}
                          style={{ borderColor: 'var(--lifinity-border)' }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-none ${
                                isUnread ? 'bg-[var(--lifinity-primary)]' : 'bg-[var(--lifinity-text-muted)]'
                              }`}
                            ></span>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-widest [color:var(--lifinity-text-muted)]">
                                {notification.type}
                              </p>
                              <p className="text-sm font-bold leading-snug">
                                {notification.message}
                              </p>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest [color:var(--lifinity-text-muted)]">
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
              onClick={() => setSettingsOpen(true)}
              className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center hover:[color:var(--lifinity-primary-strong)]"
              title="Configuracoes"
              aria-label="Abrir configuracoes"
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
                  d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.894c.063.38.32.697.665.87.075.037.148.077.22.118.334.193.73.218 1.092.083l.853-.32a1.125 1.125 0 011.37.49l.547.948c.275.477.178 1.084-.232 1.451l-.675.607a1.125 1.125 0 00-.327 1.157c.021.08.04.162.057.244.08.377.315.704.643.906l.774.478c.468.289.668.87.49 1.391l-.338 1.04a1.125 1.125 0 01-1.206.754l-.9-.113a1.125 1.125 0 00-1.055.48 7.32 7.32 0 01-.157.194 1.125 1.125 0 00-.154 1.151l.36.833c.219.505.034 1.095-.44 1.374l-.943.555a1.125 1.125 0 01-1.454-.244l-.579-.698a1.125 1.125 0 00-1.133-.367 6.996 6.996 0 01-.25.041 1.125 1.125 0 00-.915.637l-.393.817a1.125 1.125 0 01-1.332.598l-1.05-.298a1.125 1.125 0 01-.79-1.182l.083-.905a1.125 1.125 0 00-.514-1.038 6.98 6.98 0 01-.204-.148 1.125 1.125 0 00-1.158-.116l-.817.39a1.125 1.125 0 01-1.39-.39l-.595-.919a1.125 1.125 0 01.18-1.462l.67-.614c.285-.262.412-.657.33-1.036a6.507 6.507 0 01-.045-.25 1.125 1.125 0 00-.665-.89l-.831-.365a1.125 1.125 0 01-.642-1.313l.26-1.064a1.125 1.125 0 011.153-.832l.908.052c.386.022.756-.155.982-.47.049-.069.1-.137.153-.202.24-.302.31-.71.19-1.077l-.282-.863a1.125 1.125 0 01.548-1.347l.966-.512a1.125 1.125 0 011.439.313l.556.719c.236.305.616.462.997.407.083-.012.167-.022.251-.03.384-.036.723-.273.886-.622l.382-.824z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            <button
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center hover:[color:var(--lifinity-danger)]"
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
      {settingsOpen && (
        <AccountSettingsModal
          user={user}
          setUser={setUser}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      </div>
    </div>
  );
};

export default DashboardLayout;
