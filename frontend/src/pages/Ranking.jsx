import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getRankStyle = (position) => {
  if (position === 0) {
    return {
      label: '1.º Lugar',
      short: '1',
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      badge: 'bg-amber-500 text-white',
    };
  }

  if (position === 1) {
    return {
      label: '2.º Lugar',
      short: '2',
      border: 'border-slate-300',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      badge: 'bg-slate-500 text-white',
    };
  }

  if (position === 2) {
    return {
      label: '3.º Lugar',
      short: '3',
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      badge: 'bg-orange-500 text-white',
    };
  }

  return {
    label: `${position + 1}.º Lugar`,
    short: String(position + 1),
    border: 'border-slate-100',
    bg: 'bg-white',
    text: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-500',
  };
};

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchRanking = useCallback(async (token) => {
    try {
      setError('');

      const response = await axios.get(`${API_URL}/users/ranking`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRanking(response.data);
    } catch (err) {
      console.error('Erro ao carregar ranking:', err);
      setError('Não foi possível carregar o ranking.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setCurrentUser(parsedUser);

    fetchRanking(token);

    const handleRankingRefresh = () => {
      const refreshedToken = localStorage.getItem('token');
      const refreshedUser = localStorage.getItem('user');

      if (refreshedToken) {
        fetchRanking(refreshedToken);
      }

      if (refreshedUser) {
        setCurrentUser(JSON.parse(refreshedUser));
      }
    };

    window.addEventListener('lifinity-user-updated', handleRankingRefresh);
    window.addEventListener('lifinity-tasks-updated', handleRankingRefresh);

    return () => {
      window.removeEventListener('lifinity-user-updated', handleRankingRefresh);
      window.removeEventListener('lifinity-tasks-updated', handleRankingRefresh);
    };
  }, [navigate, fetchRanking]);

  const stats = useMemo(() => {
    const totalUsers = ranking.length;
    const topUser = ranking[0] || null;
    const totalXP = ranking.reduce((sum, user) => sum + Number(user.xp || 0), 0);
    const averageXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;

    const currentUserIndex = ranking.findIndex(
      (user) => user.username === currentUser?.username
    );

    const currentUserRank =
      currentUserIndex >= 0 ? currentUserIndex + 1 : null;

    return {
      totalUsers,
      topUser,
      totalXP,
      averageXP,
      currentUserRank,
    };
  }, [ranking, currentUser]);

  const maxXP = useMemo(() => {
    return Math.max(...ranking.map((user) => Number(user.xp || 0)), 1);
  }, [ranking]);

  const topThree = ranking.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          A carregar ranking...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div
        className="relative overflow-hidden border border-slate-200 bg-slate-900 shadow-sm"
        style={{
          borderRadius: '2rem',
          backgroundImage:
            'linear-gradient(to right, var(--color-blue-950), var(--color-slate-900), var(--color-slate-800))',
        }}
      >
        <div
          className="absolute top-0 right-0 h-full w-1/2 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, white, transparent 60%)',
          }}
        />

        <div className="relative z-10 p-8 md:p-10 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-blue-200">
            Gamificação Lifinity
          </p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">
                Ranking Global
              </h2>
              <p className="text-slate-200 max-w-2xl font-medium leading-relaxed">
                Compara o teu progresso com outros utilizadores, acompanha o teu XP
                e mantém a motivação para concluir tarefas diariamente.
              </p>
            </div>

            <div className="min-w-57.5 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">
                A tua posição
              </p>
              <p className="text-4xl font-black tracking-tighter">
                {stats.currentUserRank ? `${stats.currentUserRank}.º` : '--'}
              </p>
              <p className="text-xs text-slate-300 font-bold mt-2">
                {currentUser?.username || 'Utilizador'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      {/* CARDS DE ESTATÍSTICA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
            Utilizadores no Top
          </p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter">
            {stats.totalUsers}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            Lista dos melhores utilizadores por XP.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
            Líder Atual
          </p>
          <p className="text-3xl font-black text-blue-600 tracking-tighter truncate">
            {stats.topUser?.username || '--'}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            {stats.topUser ? `${stats.topUser.xp} XP acumulados.` : 'Sem dados.'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
            XP Total
          </p>
          <p className="text-3xl font-black text-emerald-600 tracking-tighter">
            {stats.totalXP}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            XP somado dos utilizadores listados.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
            Média de XP
          </p>
          <p className="text-3xl font-black text-purple-600 tracking-tighter">
            {stats.averageXP}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-2">
            Média entre os utilizadores do ranking.
          </p>
        </div>
      </div>

      {/* TOP 3 */}
      <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Pódio
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-slate-800">
              Top 3 Utilizadores
            </h3>
            <p className="text-slate-500 font-medium mt-2">
              Os utilizadores com mais XP acumulado na plataforma.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3">
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">
              XP ganho ao concluir tarefas
            </p>
          </div>
        </div>

        {topThree.length === 0 ? (
          <div className="p-16 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
            Ainda não existem utilizadores suficientes para formar o pódio.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {topThree.map((user, index) => {
              const rank = getRankStyle(index);
              const isCurrentUser = currentUser?.username === user.username;
              const progress = Math.round((Number(user.xp || 0) / maxXP) * 100);

              return (
                <div
                  key={`${user.username}-${index}`}
                  className={`relative overflow-hidden p-6 rounded-3xl border ${rank.border} ${rank.bg}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${rank.badge}`}
                    >
                      {rank.short}
                    </div>

                    {isCurrentUser && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-blue-600 text-white">
                        Tu
                      </span>
                    )}
                  </div>

                  <p className={`text-[10px] font-black uppercase tracking-widest ${rank.text}`}>
                    {rank.label}
                  </p>

                  <h4 className="text-2xl font-black tracking-tight text-slate-800 mt-2 truncate">
                    {user.username}
                  </h4>

                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
                    Nível {user.level}
                  </p>

                  <p className="text-4xl font-black text-blue-600 tracking-tighter mt-6">
                    {user.xp}
                  </p>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    Pontos XP
                  </p>

                  <div className="w-full bg-white/70 h-3 rounded-full mt-6 overflow-hidden border border-white">
                    <div
                      className="bg-blue-600 h-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SISTEMA DE XP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-4xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Como funciona?
          </p>
          <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-4">
            Sistema de XP
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed text-sm">
            O Lifinity recompensa os utilizadores à medida que concluem tarefas.
            A gamificação ajuda a manter consistência, motivação e progresso diário.
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2">
              Concluir tarefa
            </p>
            <p className="text-2xl font-black text-slate-800">+ XP</p>
            <p className="text-xs text-slate-400 font-bold mt-2">
              Cada tarefa concluída aumenta a pontuação do utilizador.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2">
              Subir nível
            </p>
            <p className="text-2xl font-black text-slate-800">Níveis</p>
            <p className="text-xs text-slate-400 font-bold mt-2">
              O nível representa a evolução do utilizador ao longo do tempo.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-purple-600 text-[10px] font-black uppercase tracking-widest mb-2">
              Competição saudável
            </p>
            <p className="text-2xl font-black text-slate-800">Ranking</p>
            <p className="text-xs text-slate-400 font-bold mt-2">
              O ranking aumenta o envolvimento e incentiva a produtividade.
            </p>
          </div>
        </div>
      </div>

      {/* LISTA COMPLETA */}
      <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Classificação
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-slate-800">
              Lista Completa
            </h3>
            <p className="text-slate-500 font-medium mt-2">
              Ranking ordenado por XP acumulado.
            </p>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="p-16 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
            Ainda não existem dados suficientes para mostrar o ranking.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {ranking.map((user, index) => {
              const rank = getRankStyle(index);
              const isCurrentUser = currentUser?.username === user.username;
              const progress = Math.round((Number(user.xp || 0) / maxXP) * 100);

              return (
                <div
                  key={`${user.username}-${index}`}
                  className={`p-5 rounded-3xl border transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${rank.badge}`}
                      >
                        {rank.short}
                      </div>

                      <div>
                        <p className="text-lg font-black tracking-tight text-slate-800">
                          {user.username}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Nível {user.level}
                          {isCurrentUser ? ' • Este és tu' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 md:min-w-90">
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                          Progresso relativo ao líder
                        </p>
                      </div>

                      <div className="min-w-22.5 text-right">
                        <p className="text-2xl font-black text-blue-600 tracking-tighter">
                          {user.xp}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          XP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;
