import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'bg-[#111916]/88 border border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]';

const innerCardClass =
  'bg-white/[0.045] border border-white/10 rounded-2xl';

const buttonSecondaryClass =
  'w-full px-5 py-4 rounded-2xl bg-white/[0.08] border border-white/10 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.12] transition-all';

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
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
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
        className="relative overflow-hidden rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-white/10 min-h-72 flex items-end"
        style={{
          backgroundImage: "url('/images/profile-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#101713]/96 via-[#101713]/72 to-[#101713]/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.22),_transparent_35%)]"></div>

        <div className="relative z-10 p-8 md:p-10 text-white w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-4xl font-black shadow-xl backdrop-blur-xl text-white">
                {user.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-slate-300">
                  Perfil do Utilizador
                </p>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  {user.username}
                </h2>

                <p className="text-slate-300 font-bold mt-3">
                  {user.email || 'Email não disponível'}
                </p>
              </div>
            </div>

            <div className="bg-white/[0.07] border border-white/10 rounded-3xl p-6 backdrop-blur-xl min-w-64">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">
                Nível atual
              </p>

              <p className="text-5xl font-black tracking-tighter text-white">
                {levelData.level}
              </p>

              <p className="text-sm text-slate-300 font-bold mt-2">
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
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Evolução
            </p>

            <h3 className="text-3xl font-black tracking-tighter text-white">
              Progresso para o próximo nível
            </h3>

            <p className="text-slate-300 font-medium mt-2">
              O teu nível aumenta conforme completas tarefas e ganhas XP.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
              Faltam
            </p>
            <p className="text-3xl font-black text-blue-300 tracking-tighter">
              {Math.round(levelData.xpRemaining)} XP
            </p>
          </div>
        </div>

        <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.35)]"
            style={{ width: `${levelData.progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span>Nível {levelData.level}</span>
          <span>Nível {levelData.level + 1}</span>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
            XP Total
          </p>
          <p className="text-3xl font-black text-blue-400 tracking-tighter">
            {user.xp || 0}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            Pontos acumulados na plataforma.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
            Produtividade Hoje
          </p>
          <p className="text-3xl font-black text-emerald-300 tracking-tighter">
            {taskSummary.completionRate}%
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            {taskSummary.completedTasks} concluídas hoje.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
            Grupos
          </p>
          <p className="text-3xl font-black text-purple-300 tracking-tighter">
            {groups.length}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            Espaços de colaboração.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
            Amigos
          </p>
          <p className="text-3xl font-black text-white tracking-tighter">
            {friends.length}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            Ligações na comunidade.
          </p>
        </div>
      </div>

      {/* CONQUISTAS */}
      <div className={`${cardClass} rounded-[2rem] overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-white/10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Medalhas
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-white">
              Conquistas
            </h3>
            <p className="text-slate-300 font-medium mt-2">
              Escolhe ate 3 conquistas desbloqueadas para destacar no teu perfil.
            </p>
          </div>

          <button
            type="button"
            onClick={saveHighlights}
            disabled={savingHighlights}
            className="px-5 py-4 rounded-2xl bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingHighlights ? 'A guardar...' : 'Guardar destaques'}
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {achievementError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-200 text-sm font-bold">
              {achievementError}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h4 className="text-xl font-black tracking-tight text-white">
                Destaques
              </h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {selectedHighlightIds.length}/3 selecionadas
              </p>
            </div>

            {displayedHighlights.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-400 text-sm font-bold">
                Ainda nao tens conquistas desbloqueadas para destacar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {displayedHighlights.map((achievement, index) => (
                  <div
                    key={achievement.idbadge}
                    className="p-5 rounded-2xl bg-blue-500/10 border border-blue-400/20"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-3">
                      Destaque {achievement.position || index + 1}
                    </p>
                    <h5 className="text-lg font-black text-white">
                      {achievement.name}
                    </h5>
                    <p className="text-sm text-blue-100/80 font-medium mt-2">
                      {achievement.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xl font-black tracking-tight text-white mb-4">
              Desbloqueadas
            </h4>

            {unlockedAchievements.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-slate-400 text-sm font-bold">
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
                          ? 'bg-emerald-500/10 border-emerald-400/30'
                          : 'bg-white/[0.045] border-white/10 hover:bg-white/[0.07]'
                      } disabled:opacity-55 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            {achievementCategoryLabels[achievement.category] || achievement.category || 'Conquista'}
                          </p>
                          <h5 className="text-lg font-black text-white">
                            {achievement.name}
                          </h5>
                        </div>

                        {isSelected && (
                          <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest">
                            #{selectedPosition}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-300 font-medium mt-3">
                        {achievement.description}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4">
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
              <h4 className="text-xl font-black tracking-tight text-white mb-4">
                Bloqueadas
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.idbadge}
                    className="p-5 rounded-2xl bg-white/[0.025] border border-white/10 opacity-65"
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      {achievementCategoryLabels[achievement.category] || achievement.category || 'Conquista'}
                    </p>
                    <h5 className="text-lg font-black text-slate-300">
                      {achievement.name}
                    </h5>
                    <p className="text-sm text-slate-500 font-medium mt-3">
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
          <div className="p-6 md:p-8 border-b border-white/10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Conta
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-white">
              Informações pessoais
            </h3>
            <p className="text-slate-300 font-medium mt-2">
              Dados principais associados ao teu perfil Lifinity.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${innerCardClass} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Nome de utilizador
              </p>
              <p className="text-lg font-black text-white">
                {user.username}
              </p>
            </div>

            <div className={`${innerCardClass} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Email
              </p>
              <p className="text-lg font-black text-white break-all">
                {user.email || 'Não disponível'}
              </p>
            </div>

            <div className={`${innerCardClass} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Nível
              </p>
              <p className="text-lg font-black text-white">
                {levelData.level}
              </p>
            </div>

            <div className={`${innerCardClass} p-5`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Estado
              </p>
              <p className="text-lg font-black text-emerald-300">
                Conta ativa
              </p>
            </div>
          </div>
        </div>

        {/* AÇÕES */}
        <div className={`${cardClass} p-6 rounded-[2rem] h-fit`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Ações
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white mb-4">
            Gestão do perfil
          </h3>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tasks')}
              className="w-full px-5 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-950/40"
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
              className="w-full px-5 py-4 rounded-2xl bg-red-500/10 border border-red-400/20 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              Terminar sessão
            </button>
          </div>

          <div className="mt-6 p-5 rounded-2xl bg-white/[0.045] border border-white/10">
            <p className="text-slate-400 text-xs font-bold leading-relaxed">
              Futuramente, esta página poderá permitir editar avatar, nome,
              preferências, privacidade e notificações.
            </p>
          </div>
        </div>
      </div>

      {/* ROADMAP */}
      <div className={`${cardClass} p-6 rounded-[2rem]`}>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
          Evolução futura
        </p>

        <h3 className="text-2xl font-black tracking-tight text-white mb-4">
          Próximas melhorias do perfil
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-400/20">
            <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-2">
              Avatar
            </p>
            <p className="text-sm text-blue-100/80 font-medium">
              Personalização visual da conta.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
            <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-2">
              Preferências
            </p>
            <p className="text-sm text-emerald-100/80 font-medium">
              Definições de notificações e experiência.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-400/20">
            <p className="text-purple-300 text-[10px] font-black uppercase tracking-widest mb-2">
              Privacidade
            </p>
            <p className="text-sm text-purple-100/80 font-medium">
              Controlo de partilhas, amigos e grupos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.05] border border-white/10">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-2">
              Histórico
            </p>
            <p className="text-sm text-slate-300 font-medium">
              Resumo completo da evolução do utilizador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
