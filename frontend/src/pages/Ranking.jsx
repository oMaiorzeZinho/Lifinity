import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl';

const getProgressWidth = (xp, maxXP) => {
  if (!maxXP || maxXP <= 0) return 0;
  return Math.max(8, Math.round((xp / maxXP) * 100));
};

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const user = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    const fetchRanking = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`${API_URL}/users/ranking`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const rankingData = Array.isArray(response.data)
          ? response.data
          : response.data.ranking || [];

        setRanking(rankingData);
      } catch (err) {
        console.error('Erro ao carregar ranking:', err);
        setError('Não foi possível carregar o ranking.');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [navigate, user]);

  const maxXP = useMemo(() => {
    return Math.max(...ranking.map((item) => Number(item.xp || 0)), 1);
  }, [ranking]);

  const topUsers = ranking.slice(0, 3);

  const currentUserPosition = useMemo(() => {
    if (!user) return null;

    const index = ranking.findIndex(
      (item) => Number(item.iduser) === Number(user.iduser)
    );

    return index >= 0 ? index + 1 : null;
  }, [ranking, user]);

  const totalXP = useMemo(() => {
    return ranking.reduce((sum, item) => sum + Number(item.xp || 0), 0);
  }, [ranking]);

  const averageXP = useMemo(() => {
    if (ranking.length === 0) return 0;
    return Math.round(totalXP / ranking.length);
  }, [ranking, totalXP]);

  const leader = ranking[0];

  if (loading) {
    return (
      <div className={`${cardClass} p-10 rounded-3xl text-center`}>
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
        className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        style={{
          backgroundImage: "url('/images/ranking-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: 230
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(16, 23, 19, 0.95), rgba(16, 23, 19, 0.7), rgba(16, 23, 19, 0.35))'
          }}
        ></div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top right, rgba(251, 191, 36, 0.2), transparent 35%)'
          }}
        ></div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-amber-200 mb-4">
              Gamificação Lifinity
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
              Ranking Global
            </h2>

            <p className="text-slate-300 max-w-2xl font-medium mt-4 leading-relaxed">
              Compara o teu progresso com outros utilizadores, acompanha o teu XP
              e mantém a motivação para concluir tarefas diariamente.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 min-w-52 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              A tua posição
            </p>

            <p className="text-4xl font-black tracking-tighter text-white">
              {currentUserPosition ? `${currentUserPosition}.º` : '--'}
            </p>

            <p className="text-xs text-slate-400 font-bold mt-2">
              {user?.username || 'Utilizador'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-400/20 text-red-200 p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
            Utilizadores no top
          </p>
          <p className="text-3xl font-black text-white tracking-tighter">
            {ranking.length}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2">
            Lista dos melhores utilizadores por XP.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
            Líder atual
          </p>
          <p className="text-3xl font-black text-amber-300 tracking-tighter">
            {leader?.username || '--'}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2">
            {leader ? `${leader.xp} XP acumulados.` : 'Sem dados suficientes.'}
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
            XP total
          </p>
          <p className="text-3xl font-black text-emerald-300 tracking-tighter">
            {totalXP}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2">
            XP somado dos utilizadores listados.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">
            Média de XP
          </p>
          <p className="text-3xl font-black text-purple-300 tracking-tighter">
            {averageXP}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2">
            Média entre os utilizadores do ranking.
          </p>
        </div>
      </div>

      {/* TOP 3 */}
      <div className={`${cardClass} rounded-3xl overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-white/10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 italic">
              Pódio
            </p>

            <h3 className="text-3xl font-black tracking-tighter text-white">
              Top 3 Utilizadores
            </h3>

            <p className="text-slate-400 font-medium mt-2">
              Os utilizadores com mais XP acumulado na plataforma.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard/tasks')}
            className="px-5 py-3 rounded-2xl bg-white text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Ganhar XP ao concluir tarefas
          </button>
        </div>

        {topUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
            Ainda não existem dados suficientes para mostrar o ranking.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {topUsers.map((item, index) => {
              const isCurrentUser = Number(item.iduser) === Number(user?.iduser);
              const position = index + 1;

              return (
                <div
                  key={item.iduser}
                  className={`relative overflow-hidden rounded-3xl border p-6 transition-all ${
                    position === 1
                      ? 'bg-amber-300/10 border-amber-300/30'
                      : position === 2
                        ? 'bg-slate-300/10 border-slate-300/20'
                        : 'bg-orange-400/10 border-orange-300/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                        position === 1
                          ? 'bg-amber-300 text-slate-950'
                          : position === 2
                            ? 'bg-slate-300 text-slate-950'
                            : 'bg-orange-300 text-slate-950'
                      }`}
                    >
                      {position}
                    </div>

                    {isCurrentUser && (
                      <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-black uppercase tracking-widest">
                        Tu
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                    {position}.º lugar
                  </p>

                  <h4 className="text-2xl font-black tracking-tight text-white">
                    {item.username}
                  </h4>

                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                    Nível {item.level || 1}
                  </p>

                  <p className="text-4xl font-black text-blue-400 tracking-tighter mt-6">
                    {item.xp || 0}
                  </p>

                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    pontos XP
                  </p>

                  <div className="w-full bg-white/10 h-2 rounded-full mt-5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${getProgressWidth(Number(item.xp || 0), maxXP)}%`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXPLICAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">
            Como funciona?
          </p>
          <h4 className="text-2xl font-black text-white tracking-tight">
            Sistema de XP
          </h4>
          <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">
            O Lifinity recompensa os utilizadores à medida que concluem tarefas.
            A gamificação ajuda a manter consistência, motivação e progresso diário.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-3">
            Concluir tarefa
          </p>
          <h4 className="text-2xl font-black text-white tracking-tight">
            + XP
          </h4>
          <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">
            Cada tarefa concluída aumenta a pontuação do utilizador.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-emerald-300 text-xs font-black uppercase tracking-widest mb-3">
            Subir nível
          </p>
          <h4 className="text-2xl font-black text-white tracking-tight">
            Níveis
          </h4>
          <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">
            O nível representa a evolução do utilizador ao longo do tempo.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="text-purple-300 text-xs font-black uppercase tracking-widest mb-3">
            Competição saudável
          </p>
          <h4 className="text-2xl font-black text-white tracking-tight">
            Ranking
          </h4>
          <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">
            O ranking aumenta o envolvimento e incentiva a produtividade.
          </p>
        </div>
      </div>

      {/* LISTA COMPLETA */}
      <div className={`${cardClass} rounded-3xl overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-white/10">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 italic">
            Classificação
          </p>

          <h3 className="text-3xl font-black tracking-tighter text-white">
            Lista Completa
          </h3>

          <p className="text-slate-400 font-medium mt-2">
            Ranking ordenado por XP acumulado.
          </p>
        </div>

        {ranking.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
            Ainda não existem utilizadores suficientes para apresentar.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {ranking.map((item, index) => {
              const position = index + 1;
              const isCurrentUser = Number(item.iduser) === Number(user?.iduser);

              return (
                <div
                  key={item.iduser}
                  className={`flex flex-col md:flex-row md:items-center md:justify-between gap-5 p-5 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? 'bg-blue-500/10 border-blue-400/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                        position === 1
                          ? 'bg-amber-300 text-slate-950'
                          : position === 2
                            ? 'bg-slate-300 text-slate-950'
                            : position === 3
                              ? 'bg-orange-300 text-slate-950'
                              : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {position}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black text-white">
                          {item.username}
                        </h4>

                        {isCurrentUser && (
                          <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-black uppercase tracking-widest">
                            Tu
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">
                        Nível {item.level || 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 min-w-72">
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                        Progresso relativo ao líder
                      </p>

                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{
                            width: `${getProgressWidth(Number(item.xp || 0), maxXP)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-400 tracking-tighter">
                        {item.xp || 0}
                      </p>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                        XP
                      </p>
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
