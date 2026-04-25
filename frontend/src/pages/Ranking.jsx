import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// URL base da API definida no .env do frontend
const API_URL = import.meta.env.VITE_API_URL;

// Função simples para mostrar medalhas no Top 3
const getMedal = (position) => {
  if (position === 0) return '🥇';
  if (position === 1) return '🥈';
  if (position === 2) return '🥉';
  return `#${position + 1}`;
};

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Função para ir buscar o ranking ao backend
  const fetchRanking = useCallback(async (token) => {
    try {
      setError('');

      const response = await axios.get(`${API_URL}/users/ranking`, {
        headers: { Authorization: `Bearer ${token}` }
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

    // Atualiza automaticamente o ranking quando o utilizador ganha XP
    const handleRankingRefresh = () => {
      const refreshedToken = localStorage.getItem('token');
      if (refreshedToken) {
        fetchRanking(refreshedToken);
      }

      const refreshedUser = localStorage.getItem('user');
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

  // Estado de carregamento
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
      {/* Cabeçalho da página */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
          Gamificação e Progresso
        </p>
        <h2 className="text-3xl font-black tracking-tighter text-slate-800 mb-2">
          Ranking Global
        </h2>
        <p className="text-slate-500 font-medium">
          Aqui podes ver os utilizadores com mais XP na plataforma Lifinity.
        </p>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      {/* Top 3 em destaque */}
      {ranking.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ranking.slice(0, 3).map((user, index) => {
            const isCurrentUser = currentUser?.username === user.username;

            return (
              <div
                key={`${user.username}-${index}`}
                className={`p-8 rounded-2xl shadow-sm border transition-all ${
                  isCurrentUser
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl">{getMedal(index)}</span>
                  {isCurrentUser && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-blue-600 text-white">
                      Tu
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black tracking-tight text-slate-800">
                  {user.username}
                </h3>

                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
                  Nível {user.level}
                </p>

                <p className="text-4xl font-black text-blue-600 tracking-tighter mt-6">
                  {user.xp}
                </p>

                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                  Pontos XP
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista completa */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-black tracking-tight text-slate-800">
            Top 10 Utilizadores
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            O ranking atualiza à medida que as tarefas são concluídas.
          </p>
        </div>

        {ranking.length === 0 ? (
          <div className="p-16 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
            Ainda não existem dados suficientes para mostrar o ranking.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {ranking.map((user, index) => {
              const isCurrentUser = currentUser?.username === user.username;

              return (
                <div
                  key={`${user.username}-${index}`}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                        index < 3
                          ? 'bg-amber-50 text-amber-500'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {getMedal(index)}
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

                  <div className="text-right">
                    <p className="text-2xl font-black text-blue-600 tracking-tighter">
                      {user.xp}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      XP
                    </p>
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