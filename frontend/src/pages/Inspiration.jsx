import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Inspiration = () => {
  const [dailyVerse, setDailyVerse] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [cardMode, setCardMode] = useState('daily');
  const [copyMessage, setCopyMessage] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVerseToShare, setSelectedVerseToShare] = useState(null);

  const navigate = useNavigate();

  const fetchDailyVerse = useCallback(async (token) => {
    try {
      const response = await axios.get(`${API_URL}/inspiration/daily`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDailyVerse(response.data);
      setCardMode('daily');
    } catch (err) {
      console.error('Erro ao carregar versículo do dia:', err);
      setError('Não foi possível carregar o versículo do dia.');
    }
  }, []);

  const fetchRandomVerse = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_URL}/inspiration/random`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDailyVerse(response.data);
      setCardMode('random');
    } catch (err) {
      console.error('Erro ao carregar versículo aleatório:', err);
    }
  };

  const fetchFavorites = useCallback(async (token) => {
    try {
      const response = await axios.get(`${API_URL}/inspiration/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFavorites(response.data);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const toggleFavorite = async (idverse) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/inspiration/favorite/${idverse}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDailyVerse((prev) =>
        prev && prev.idverse === idverse
          ? { ...prev, isFavorite: response.data.isFavorite }
          : prev
      );

      await fetchFavorites(token);
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
    }
  };

  const removeFavoriteDirectly = async (idverse) => {
    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_URL}/inspiration/favorite/${idverse}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDailyVerse((prev) =>
        prev && prev.idverse === idverse
          ? { ...prev, isFavorite: false }
          : prev
      );

      await fetchFavorites(token);
    } catch (err) {
      console.error('Erro ao remover favorito:', err);
    }
  };

  const copyVerse = async () => {
    if (!dailyVerse) return;

    const textToCopy = `“${dailyVerse.text}” — ${dailyVerse.book} ${dailyVerse.chapter}:${dailyVerse.verse}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyMessage('Versículo copiado com sucesso.');

      setTimeout(() => {
        setCopyMessage('');
      }, 2000);
    } catch (err) {
      console.error('Erro ao copiar versículo:', err);
      setCopyMessage('Não foi possível copiar o versículo.');
    }
  };

  const openShareModal = (verse) => {
    setSelectedVerseToShare(verse);
    setShareModalOpen(true);
  };

  const closeShareModal = () => {
    setSelectedVerseToShare(null);
    setShareModalOpen(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await fetchDailyVerse(token);
      await fetchFavorites(token);
      setLoading(false);
    };

    loadData();
  }, [navigate, fetchDailyVerse, fetchFavorites]);

  const themes = useMemo(() => {
    const uniqueThemes = [
      ...new Set(favorites.map((verse) => verse.theme).filter(Boolean))
    ];
    return uniqueThemes.sort();
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    if (selectedTheme === 'all') return favorites;
    return favorites.filter((verse) => verse.theme === selectedTheme);
  }, [favorites, selectedTheme]);

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          A carregar inspiração...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO / BANNER */}
      <div
        className="relative overflow-hidden rounded-4xl shadow-sm border border-slate-200 min-h-70 flex items-end"
        style={{
          backgroundImage: "url('/images/bible-banner.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-slate-900/45"></div>

        <div className="relative z-10 p-8 md:p-10 text-white max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-blue-100">
            Inspiração Diária
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">
            Uma mensagem para fortalecer o teu dia
          </h2>
          <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
            Descobre um versículo diário, guarda os teus favoritos e mantém uma
            fonte de motivação espiritual dentro do Lifinity.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      {/* VERSÍCULO DO DIA / ALEATÓRIO */}
      {dailyVerse && (
        <div className="grid grid-cols-1 inspiration-verse-grid gap-6 items-stretch">
          <div
            className="rounded-4xl shadow-sm border border-slate-200 overflow-hidden h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/daily-verse.jpg')",
              minHeight: 460
            }}
          ></div>

          <div
            className="bg-white p-8 rounded-4xl shadow-sm border border-slate-200 h-full flex flex-col justify-between"
            style={{ minHeight: 460 }}
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                    {cardMode === 'daily' ? 'Versículo do Dia' : 'Versículo Aleatório'}
                  </p>
                  <span className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                    Tema: {dailyVerse.theme || 'Geral'}
                  </span>
                </div>

                <button
                  onClick={() => toggleFavorite(dailyVerse.idverse)}
                  className={`text-3xl transition-all ${
                    dailyVerse.isFavorite
                      ? 'text-yellow-400 scale-110'
                      : 'text-slate-300 hover:text-yellow-400'
                  }`}
                  title="Adicionar aos favoritos"
                >
                  ★
                </button>
              </div>

              <p className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 leading-relaxed min-h-42.5">
                “{dailyVerse.text}”
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <p className="text-slate-500 text-sm font-bold">
                {dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}
              </p>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Guarda este versículo nos teus favoritos para o consultares mais tarde
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchRandomVerse}
                  className="px-5 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Versículo Aleatório
                </button>

                <button
                  onClick={copyVerse}
                  className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Copiar Versículo
                </button>

                {cardMode === 'random' && (
                  <button
                    onClick={() => fetchDailyVerse(localStorage.getItem('token'))}
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Voltar ao Diário
                  </button>
                )}
              </div>

              {copyMessage && (
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">
                  {copyMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAVORITOS */}
      <div className="bg-white rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
        <div
          className="relative px-8 py-10 border-b border-slate-100"
          style={{
            backgroundImage: "url('/images/favorites-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-white/85"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                Coleção Pessoal
              </p>
              <h3 className="text-3xl font-black tracking-tighter text-slate-800">
                Versículos Favoritos
              </h3>
              <p className="text-slate-500 font-medium mt-2">
                Aqui ficam guardados os versículos que mais te marcaram.
              </p>
            </div>

            
            <div className="relative z-10">
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-slate-50 transition-all"
              >
                <option value="all">Todos os Temas</option>
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {favoritesLoading ? (
          <div className="p-12 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
            A carregar favoritos...
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="p-12 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
            Ainda não tens versículos favoritos para este filtro.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFavorites.map((verse) => (
              <div
                key={verse.idfavorite}
                className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => removeFavoriteDirectly(verse.idverse)}
                    className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-500 flex items-center justify-center text-xl font-black shrink-0 hover:scale-105 transition-all"
                    title="Remover dos favoritos"
                  >
                    ★
                  </button>

                  <div className="flex-1">
                    <p className="text-slate-800 font-bold leading-relaxed">
                      “{verse.text}”
                    </p>
                    <p className="text-slate-400 text-sm font-bold mt-4">
                      {verse.book} {verse.chapter}:{verse.verse}
                    </p>
                    {verse.theme && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-2">
                        {verse.theme}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openShareModal(verse)}
                        className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                      >
                        Partilhar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {shareModalOpen && selectedVerseToShare && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-4xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                  Partilhar Versículo
                </p>
                <h3 className="text-2xl font-black tracking-tight text-slate-800">
                  Enviar inspiração
                </h3>
              </div>

              <button
                onClick={closeShareModal}
                className="text-slate-300 hover:text-slate-700 text-2xl font-black transition-all"
                title="Fechar"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-slate-800 font-bold leading-relaxed">
                  “{selectedVerseToShare.text}”
                </p>
                <p className="text-slate-400 text-sm font-bold mt-3">
                  {selectedVerseToShare.book} {selectedVerseToShare.chapter}:{selectedVerseToShare.verse}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-100 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
                    Amigos
                  </p>
                  <p className="text-sm text-slate-400 font-medium">
                    Ainda não tens amigos disponíveis para partilhar.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-100 bg-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
                    Grupos
                  </p>
                  <p className="text-sm text-slate-400 font-medium">
                    Ainda não existem grupos disponíveis para partilhar.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-blue-600 text-xs font-bold leading-relaxed">
                  Esta funcionalidade está preparada para a futura integração com amigos,
                  grupos e notificações da plataforma Lifinity.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeShareModal}
                  className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
  </div>
)}
    </div>
  );
};

export default Inspiration;
