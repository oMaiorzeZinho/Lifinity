import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'lifinity-card';

const softCardClass =
  'lifinity-card-soft';

const mutedTextClass =
  '[color:var(--lifinity-text-muted)]';

const statValueClass =
  'text-3xl font-black tracking-tighter [color:var(--lifinity-primary-strong)]';

const progressTrackClass =
  'w-full bg-[var(--lifinity-surface-soft)] h-2 rounded-full overflow-hidden';

const progressBarClass =
  'bg-[var(--lifinity-primary)] h-full rounded-full';

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
        <p className="lifinity-muted-label">
          A carregar ranking...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-3xl border border-[var(--lifinity-border)] shadow-[var(--lifinity-shadow)]"
        style={{
          backgroundImage: "url('/images/ranking-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: 230
        }}
      >
        <div className="absolute inset-0 lifinity-hero-overlay"></div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 [color:var(--lifinity-text)]">
          <div>
            <p className="lifinity-muted-label mb-4">
              Gamificação Lifinity
            </p>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              Ranking Global
            </h2>

            <p className={`max-w-2xl font-medium mt-4 leading-relaxed ${mutedTextClass}`}>
              Compara o teu progresso com outros utilizadores, acompanha o teu XP
              e mantém a motivação para concluir atividades diariamente.
            </p>
          </div>

          <div className={`${softCardClass} rounded-3xl p-6 min-w-52`}>
            <p className="lifinity-muted-label mb-2">
              A tua posição
            </p>

            <p className="text-4xl font-black tracking-tighter [color:var(--lifinity-primary-strong)]">
              {currentUserPosition ? `${currentUserPosition}.º` : '--'}
            </p>

            <p className={`text-xs font-bold mt-2 ${mutedTextClass}`}>
              {user?.username || 'Utilizador'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="lifinity-card-soft lifinity-danger-surface p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-2">
            Utilizadores no top
          </p>
          <p className={statValueClass}>
            {ranking.length}
          </p>
          <p className={`text-xs font-bold mt-2 ${mutedTextClass}`}>
            Lista dos melhores utilizadores por XP.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-2">
            Líder atual
          </p>
          <p className={statValueClass}>
            {leader?.username || '--'}
          </p>
          <p className={`text-xs font-bold mt-2 ${mutedTextClass}`}>
            {leader ? `${leader.xp} XP acumulados.` : 'Sem dados suficientes.'}
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-2">
            XP total
          </p>
          <p className={statValueClass}>
            {totalXP}
          </p>
          <p className={`text-xs font-bold mt-2 ${mutedTextClass}`}>
            XP somado dos utilizadores listados.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-2">
            Média de XP
          </p>
          <p className={statValueClass}>
            {averageXP}
          </p>
          <p className={`text-xs font-bold mt-2 ${mutedTextClass}`}>
            Média entre os utilizadores do ranking.
          </p>
        </div>
      </div>

      {/* TOP 3 */}
      <div className={`${cardClass} rounded-3xl overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-[var(--lifinity-border)] flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="lifinity-muted-label mb-2">
              Pódio
            </p>

            <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
              Top 3 Utilizadores
            </h3>

            <p className={`font-medium mt-2 ${mutedTextClass}`}>
              Os utilizadores com mais XP acumulado na plataforma.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard/tasks')}
            className="lifinity-button-primary px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            Ganhar XP ao concluir atividades
          </button>
        </div>

        {topUsers.length === 0 ? (
          <div className={`p-16 text-center font-bold uppercase text-xs tracking-widest ${mutedTextClass}`}>
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
                      ? 'bg-[var(--lifinity-primary-muted)] border-[var(--lifinity-primary)] shadow-sm'
                      : position === 2
                        ? 'lifinity-card-soft border-[var(--lifinity-border)]'
                        : 'bg-[var(--lifinity-surface-soft)] border-[var(--lifinity-border)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                        position === 1
                          ? 'bg-[var(--lifinity-warning)] [color:var(--lifinity-on-primary)]'
                          : position === 2
                            ? 'bg-[var(--lifinity-primary-strong)] [color:var(--lifinity-on-primary)]'
                            : 'bg-[var(--lifinity-primary)] [color:var(--lifinity-on-primary)]'
                      }`}
                    >
                      {position}
                    </div>

                    {isCurrentUser && (
                      <span className="lifinity-badge text-xs">
                        Tu
                      </span>
                    )}
                  </div>

                  <p className="lifinity-muted-label mb-2">
                    {position}.º lugar
                  </p>

                  <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]">
                    {item.username}
                  </h4>

                  <p className={`text-xs font-bold uppercase tracking-widest mt-2 ${mutedTextClass}`}>
                    Nível {item.level || 1}
                  </p>

                  <p className="text-4xl font-black tracking-tighter mt-6 [color:var(--lifinity-primary-strong)]">
                    {item.xp || 0}
                  </p>

                  <p className={`text-xs font-black uppercase tracking-widest ${mutedTextClass}`}>
                    pontos XP
                  </p>

                  <div className={`${progressTrackClass} mt-5`}>
                    <div
                      className={progressBarClass}
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
          <p className="lifinity-muted-label mb-3">
            Como funciona?
          </p>
          <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]">
            Sistema de XP
          </h4>
          <p className={`text-sm font-medium mt-3 leading-relaxed ${mutedTextClass}`}>
            O Lifinity recompensa os utilizadores à medida que concluem atividades.
            A gamificação ajuda a manter consistência, motivação e progresso diário.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-3">
            Concluir atividade
          </p>
          <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-primary-strong)]">
            + XP
          </h4>
          <p className={`text-sm font-medium mt-3 leading-relaxed ${mutedTextClass}`}>
            Cada atividade concluída aumenta a pontuação do utilizador.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-3">
            Subir nível
          </p>
          <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-primary-strong)]">
            Níveis
          </h4>
          <p className={`text-sm font-medium mt-3 leading-relaxed ${mutedTextClass}`}>
            O nível representa a evolução do utilizador ao longo do tempo.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-3xl`}>
          <p className="lifinity-muted-label mb-3">
            Competição saudável
          </p>
          <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-primary-strong)]">
            Ranking
          </h4>
          <p className={`text-sm font-medium mt-3 leading-relaxed ${mutedTextClass}`}>
            O ranking aumenta o envolvimento e incentiva a produtividade.
          </p>
        </div>
      </div>

      {/* LISTA COMPLETA */}
      <div className={`${cardClass} rounded-3xl overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-[var(--lifinity-border)]">
          <p className="lifinity-muted-label mb-2">
            Classificação
          </p>

          <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
            Lista Completa
          </h3>

          <p className={`font-medium mt-2 ${mutedTextClass}`}>
            Ranking ordenado por XP acumulado.
          </p>
        </div>

        {ranking.length === 0 ? (
          <div className={`p-16 text-center font-bold uppercase text-xs tracking-widest ${mutedTextClass}`}>
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
                      ? 'bg-[var(--lifinity-primary-muted)] border-[var(--lifinity-primary)] shadow-sm'
                      : 'lifinity-card-soft border-[var(--lifinity-border)] hover:bg-[var(--lifinity-primary-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                        position === 1
                          ? 'bg-[var(--lifinity-warning)] [color:var(--lifinity-on-primary)]'
                          : position === 2
                            ? 'bg-[var(--lifinity-primary-strong)] [color:var(--lifinity-on-primary)]'
                            : position === 3
                              ? 'bg-[var(--lifinity-primary)] [color:var(--lifinity-on-primary)]'
                              : 'bg-[var(--lifinity-surface-soft)] [color:var(--lifinity-text-muted)] border border-[var(--lifinity-border)]'
                      }`}
                    >
                      {position}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-black [color:var(--lifinity-text)]">
                          {item.username}
                        </h4>

                        {isCurrentUser && (
                          <span className="lifinity-badge text-xs">
                            Tu
                          </span>
                        )}
                      </div>

                      <p className={`text-xs font-black uppercase tracking-widest mt-1 ${mutedTextClass}`}>
                        Nível {item.level || 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 min-w-72">
                    <div className="flex-1">
                      <p className={`text-xs font-black uppercase tracking-widest mb-2 ${mutedTextClass}`}>
                        Progresso relativo ao líder
                      </p>

                      <div className={progressTrackClass}>
                        <div
                          className={progressBarClass}
                          style={{
                            width: `${getProgressWidth(Number(item.xp || 0), maxXP)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black tracking-tighter [color:var(--lifinity-primary-strong)]">
                        {item.xp || 0}
                      </p>
                      <p className={`text-xs font-black uppercase tracking-widest ${mutedTextClass}`}>
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
