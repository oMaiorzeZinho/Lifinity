import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'lifinity-card';

const innerCardClass =
  'lifinity-card-soft rounded-2xl';

const statValueClass =
  'text-3xl font-black tracking-tighter [color:var(--lifinity-primary-strong)]';

const buttonSecondaryClass =
  'lifinity-button-secondary w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const buttonPrimaryClass =
  'lifinity-button-primary w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const achievementCategoryLabels = {
  level: 'Nivel',
  xp: 'XP',
  tasks: 'Tarefas',
  friends: 'Amigos',
  groups: 'Grupos',
  chat: 'Chat',
  verses: 'Versiculos',
  assistant: 'Assistente'
};

const getLevelData = (xp) => {
  if (!xp) xp = 0;

  let level = 1;

  const calculateXPForLevel = (lvl) => Math.floor(100 * Math.pow(lvl - 1, 1.5));

  while (xp >= calculateXPForLevel(level + 1)) {
    level++;
  }

  const xpStartOfLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const progress =
    ((xp - xpStartOfLevel) / (xpForNextLevel - xpStartOfLevel)) * 100;

  return {
    level,
    progress: Math.min(Math.max(progress, 0), 100),
    xpRemaining: Math.max(xpForNextLevel - xp, 0),
    nextLevelXP: xpForNextLevel
  };
};

const Profile = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [taskSummary, setTaskSummary] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });

  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedHighlightIds, setSelectedHighlightIds] = useState([]);
  const [achievementError, setAchievementError] = useState('');
  const [savingHighlights, setSavingHighlights] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const levelData = useMemo(() => {
    return getLevelData(user?.xp || 0);
  }, [user]);

  const fetchProfileData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        navigate('/login');
        return;
      }

      setUser(JSON.parse(savedUser));

      const headers = { Authorization: `Bearer ${token}` };

      const [summaryResponse, groupsResponse, friendsResponse] = await Promise.all([
        axios.get(`${API_URL}/tasks/summary`, {
          headers
        }),
        axios.get(`${API_URL}/groups`, {
          headers
        }),
        axios.get(`${API_URL}/friends`, {
          headers
        })
      ]);

      setTaskSummary(summaryResponse.data);
      setGroups(groupsResponse.data);
      setFriends(friendsResponse.data);

      try {
        await axios.post(`${API_URL}/achievements/check`, {}, { headers });

        const achievementsResponse = await axios.get(`${API_URL}/achievements`, {
          headers
        });

        const achievementData = Array.isArray(achievementsResponse.data)
          ? achievementsResponse.data
          : [];

        setAchievements(achievementData);
        setSelectedHighlightIds(
          achievementData
            .filter((achievement) => achievement.highlighted)
            .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
            .map((achievement) => Number(achievement.idbadge))
        );
        setAchievementError('');
      } catch (achievementErr) {
        console.error('Erro ao carregar conquistas:', achievementErr);
        setAchievementError('Nao foi possivel carregar as conquistas.');
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfileData();

    const handleUserUpdated = () => {
      const refreshedUser = localStorage.getItem('user');

      if (refreshedUser) {
        setUser(JSON.parse(refreshedUser));
      }
    };

    window.addEventListener('lifinity-user-updated', handleUserUpdated);
    window.addEventListener('lifinity-tasks-updated', fetchProfileData);

    return () => {
      window.removeEventListener('lifinity-user-updated', handleUserUpdated);
      window.removeEventListener('lifinity-tasks-updated', fetchProfileData);
    };
  }, [fetchProfileData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const unlockedAchievements = useMemo(() => {
    return achievements.filter((achievement) => achievement.unlocked);
  }, [achievements]);

  const lockedAchievements = useMemo(() => {
    return achievements.filter((achievement) => !achievement.unlocked);
  }, [achievements]);

  const highlightedAchievements = useMemo(() => {
    return achievements
      .filter((achievement) => achievement.highlighted)
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  }, [achievements]);

  const displayedHighlights = useMemo(() => {
    if (highlightedAchievements.length > 0) return highlightedAchievements;

    return [...unlockedAchievements]
      .sort((a, b) => new Date(b.earned_at || 0) - new Date(a.earned_at || 0))
      .slice(0, 3);
  }, [highlightedAchievements, unlockedAchievements]);

  const toggleHighlightSelection = (achievement) => {
    if (!achievement.unlocked) return;

    const idbadge = Number(achievement.idbadge);

    setSelectedHighlightIds((currentIds) => {
      if (currentIds.includes(idbadge)) {
        return currentIds.filter((currentId) => currentId !== idbadge);
      }

      if (currentIds.length >= 3) return currentIds;

      return [...currentIds, idbadge];
    });
  };

  const saveHighlights = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      setSavingHighlights(true);

      const headers = { Authorization: `Bearer ${token}` };
      const highlights = selectedHighlightIds.map((idbadge, index) => ({
        idbadge,
        position: index + 1
      }));

      await axios.put(
        `${API_URL}/achievements/highlights`,
        { highlights },
        { headers }
      );

      const achievementsResponse = await axios.get(`${API_URL}/achievements`, {
        headers
      });

      const achievementData = Array.isArray(achievementsResponse.data)
        ? achievementsResponse.data
        : [];

      setAchievements(achievementData);
      setSelectedHighlightIds(
        achievementData
          .filter((achievement) => achievement.highlighted)
          .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
          .map((achievement) => Number(achievement.idbadge))
      );
      setAchievementError('');
    } catch (err) {
      console.error('Erro ao guardar destaques:', err);
      setAchievementError('Nao foi possivel guardar os destaques.');
    } finally {
      setSavingHighlights(false);
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} p-10 rounded-3xl text-center`}>
        <p className="lifinity-muted-label">
          A carregar perfil...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-[2.5rem] shadow-[var(--lifinity-shadow)] border border-[var(--lifinity-border)] min-h-72 flex items-end"
        style={{
          backgroundImage: "url('/images/profile-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 lifinity-hero-overlay"></div>

        <div className="relative z-10 p-8 md:p-10 w-full [color:var(--lifinity-text)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-[var(--lifinity-primary-muted)] border border-[var(--lifinity-border)] flex items-center justify-center text-4xl font-black shadow-xl backdrop-blur-xl [color:var(--lifinity-text)]">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div>
                <p className="lifinity-muted-label mb-2">
                  Perfil do Utilizador
                </p>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  {user.username}
                </h2>

                <p className="font-bold mt-3 [color:var(--lifinity-text-muted)]">
                  {user.email || 'Email não disponível'}
                </p>
              </div>
            </div>

            <div className="lifinity-card-soft rounded-3xl p-6 min-w-64">
              <p className="lifinity-muted-label mb-1">
                Nível atual
              </p>

              <p className="text-5xl font-black tracking-tighter [color:var(--lifinity-primary-strong)]">
                {levelData.level}
              </p>

              <p className="text-sm font-bold mt-2 [color:var(--lifinity-text-muted)]">
                {user.xp || 0} XP acumulados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESSO */}
      <div className={`${cardClass} p-8 rounded-[2rem]`}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
          <div>
            <p className="lifinity-muted-label mb-2">
              Evolução
            </p>

            <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
              Progresso para o próximo nível
            </h3>

            <p className="font-medium mt-2 [color:var(--lifinity-text-muted)]">
              O teu nível aumenta conforme completas tarefas e ganhas XP.
            </p>
          </div>

          <div className={`${innerCardClass} px-5 py-4`}>
            <p className="lifinity-muted-label">
              Faltam
            </p>
            <p className={statValueClass}>
              {Math.round(levelData.xpRemaining)} XP
            </p>
          </div>
        </div>

        <div className="w-full bg-[var(--lifinity-surface-soft)] h-4 rounded-full overflow-hidden">
          <div
            className="bg-[var(--lifinity-primary)] h-full transition-all duration-1000 shadow-[0_0_15px_rgba(47,111,79,0.28)]"
            style={{ width: `${levelData.progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest [color:var(--lifinity-text-muted)]">
          <span>Nível {levelData.level}</span>
          <span>Nível {levelData.level + 1}</span>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-1">
            XP Total
          </p>
          <p className={statValueClass}>
            {user.xp || 0}
          </p>
          <p className="text-xs font-bold mt-2 [color:var(--lifinity-text-muted)]">
            Pontos acumulados na plataforma.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-1">
            Produtividade Hoje
          </p>
          <p className={statValueClass}>
            {taskSummary.completionRate}%
          </p>
          <p className="text-xs font-bold mt-2 [color:var(--lifinity-text-muted)]">
            {taskSummary.completedTasks} concluídas hoje.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-1">
            Grupos
          </p>
          <p className={statValueClass}>
            {groups.length}
          </p>
          <p className="text-xs font-bold mt-2 [color:var(--lifinity-text-muted)]">
            Espaços de colaboração.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-1">
            Amigos
          </p>
          <p className={statValueClass}>
            {friends.length}
          </p>
          <p className="text-xs font-bold mt-2 [color:var(--lifinity-text-muted)]">
            Ligações na comunidade.
          </p>
        </div>
      </div>

      {/* CONQUISTAS */}
      <div className={`${cardClass} rounded-[2rem] overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-[var(--lifinity-border)] flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="lifinity-muted-label mb-2">
              Medalhas
            </p>
            <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
              Conquistas
            </h3>
            <p className="font-medium mt-2 [color:var(--lifinity-text-muted)]">
              Escolhe ate 3 conquistas desbloqueadas para destacar no teu perfil.
            </p>
          </div>

          <button
            type="button"
            onClick={saveHighlights}
            disabled={savingHighlights}
            className="lifinity-button-primary px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingHighlights ? 'A guardar...' : 'Guardar destaques'}
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {achievementError && (
            <div className="lifinity-card-soft lifinity-danger-surface p-4 rounded-2xl text-sm font-bold">
              {achievementError}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4 className="text-xl font-black tracking-tight [color:var(--lifinity-text)]">
                Destaques
              </h4>
              <p className="lifinity-muted-label">
                {selectedHighlightIds.length}/3 selecionadas
              </p>
            </div>

            {displayedHighlights.length === 0 ? (
              <div className={`${innerCardClass} p-5 text-sm font-bold [color:var(--lifinity-text-muted)]`}>
                Ainda nao tens conquistas desbloqueadas para destacar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedHighlights.map((achievement, index) => (
                  <div
                    key={achievement.idbadge}
                    className="p-5 rounded-2xl bg-[var(--lifinity-primary-muted)] border border-[var(--lifinity-primary)] shadow-sm"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-3 [color:var(--lifinity-primary-strong)]">
                      Destaque {achievement.position || index + 1}
                    </p>
                    <h5 className="text-lg font-black [color:var(--lifinity-text)]">
                      {achievement.name}
                    </h5>
                    <p className="text-sm font-medium mt-2 [color:var(--lifinity-text-muted)]">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xl font-black tracking-tight mb-4 [color:var(--lifinity-text)]">
              Desbloqueadas
            </h4>

            {unlockedAchievements.length === 0 ? (
              <div className={`${innerCardClass} p-5 text-sm font-bold [color:var(--lifinity-text-muted)]`}>
                Continua a usar o Lifinity para desbloquear as primeiras conquistas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement) => {
                  const isSelected = selectedHighlightIds.includes(Number(achievement.idbadge));
                  const selectedPosition = selectedHighlightIds.indexOf(Number(achievement.idbadge)) + 1;
                  const selectionLimitReached = selectedHighlightIds.length >= 3 && !isSelected;

                  return (
                    <button
                      key={achievement.idbadge}
                      type="button"
                      onClick={() => toggleHighlightSelection(achievement)}
                      disabled={selectionLimitReached}
                      className={`text-left p-5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-[var(--lifinity-primary-muted)] border-[var(--lifinity-primary)] shadow-sm'
                          : 'lifinity-card-soft border-[var(--lifinity-border)] hover:bg-[var(--lifinity-primary-muted)]'
                      } disabled:opacity-55 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="lifinity-muted-label mb-2">
                            {achievementCategoryLabels[achievement.category] || achievement.category || 'Conquista'}
                          </p>
                          <h5 className="text-lg font-black [color:var(--lifinity-text)]">
                            {achievement.name}
                          </h5>
                        </div>

                        {isSelected && (
                          <span className="shrink-0 lifinity-badge text-[10px]">
                            #{selectedPosition}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium mt-3 [color:var(--lifinity-text-muted)]">
                        {achievement.description}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-4 [color:var(--lifinity-text-muted)]">
                        Desbloqueada em{' '}
                        {achievement.earned_at
                          ? new Date(achievement.earned_at).toLocaleDateString('pt-PT')
                          : '--'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {lockedAchievements.length > 0 && (
            <div>
              <h4 className="text-xl font-black tracking-tight mb-4 [color:var(--lifinity-text)]">
                Bloqueadas
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.idbadge}
                    className="p-5 rounded-2xl bg-[var(--lifinity-surface-soft)] border border-[var(--lifinity-border)] opacity-60"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 [color:var(--lifinity-text-muted)]">
                      {achievementCategoryLabels[achievement.category] || achievement.category || 'Conquista'}
                    </p>
                    <h5 className="text-lg font-black [color:var(--lifinity-text-muted)]">
                      {achievement.name}
                    </h5>
                    <p className="text-sm font-medium mt-3 [color:var(--lifinity-text-muted)]">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETALHES DA CONTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} lg:col-span-2 rounded-[2rem] overflow-hidden`}>
          <div className="p-6 md:p-8 border-b border-[var(--lifinity-border)]">
            <p className="lifinity-muted-label mb-2">
              Conta
            </p>
            <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
              Informações pessoais
            </h3>
            <p className="font-medium mt-2 [color:var(--lifinity-text-muted)]">
              Dados principais associados ao teu perfil Lifinity.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${innerCardClass} p-5`}>
              <p className="lifinity-muted-label mb-1">
                Nome de utilizador
              </p>
              <p className="text-lg font-black [color:var(--lifinity-text)]">
                {user.username}
              </p>
            </div>

            <div className={`${innerCardClass} p-5`}>
              <p className="lifinity-muted-label mb-1">
                Email
              </p>
              <p className="text-lg font-black break-all [color:var(--lifinity-text)]">
                {user.email || 'Não disponível'}
              </p>
            </div>

            <div className={`${innerCardClass} p-5`}>
              <p className="lifinity-muted-label mb-1">
                Nível
              </p>
              <p className="text-lg font-black [color:var(--lifinity-text)]">
                {levelData.level}
              </p>
            </div>

            <div className={`${innerCardClass} p-5`}>
              <p className="lifinity-muted-label mb-1">
                Estado
              </p>
              <p className="text-lg font-black [color:var(--lifinity-primary-strong)]">
                Conta ativa
              </p>
            </div>
          </div>
        </div>

        {/* AÇÕES */}
        <div className={`${cardClass} p-6 rounded-[2rem] h-fit`}>
          <p className="lifinity-muted-label mb-2">
            Ações
          </p>
          <h3 className="text-2xl font-black tracking-tight mb-4 [color:var(--lifinity-text)]">
            Gestão do perfil
          </h3>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tasks')}
              className={buttonPrimaryClass}
            >
              Ver tarefas
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard/statistics')}
              className={buttonSecondaryClass}
            >
              Ver estatísticas
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="lifinity-danger-item w-full px-5 py-4 rounded-2xl border border-[var(--lifinity-border)] text-[10px] font-black uppercase tracking-widest"
            >
              Terminar sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
