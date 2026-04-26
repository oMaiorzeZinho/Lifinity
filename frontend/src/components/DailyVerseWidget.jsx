import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const DailyVerseWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [verse, setVerse] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadVerse = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/inspiration/daily`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setVerse(response.data);
      } catch (err) {
        console.error('Erro ao carregar widget do versículo:', err);
      }
    };

    loadVerse();
  }, []);

  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !verse) return;

      const response = await axios.post(
        `${API_URL}/inspiration/favorite/${verse.idverse}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setVerse((prev) =>
        prev ? { ...prev, isFavorite: response.data.isFavorite } : prev
      );
    } catch (err) {
      console.error('Erro ao atualizar favorito no widget:', err);
    }
  };

  if (!verse) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#111916]/88 border border-white/10 shadow-xl rounded-2xl px-5 py-4 hover:shadow-2xl transition-all"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
            Versículo do Dia
          </p>
        </button>
      ) : (
        <div className="w-90 bg-[#111916]/88 border border-white/10 shadow-2xl rounded-4xl overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                Versículo do Dia
              </p>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {verse.book} {verse.chapter}:{verse.verse}
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xl font-black"
              title="Fechar"
            >
              ×
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-white font-bold leading-relaxed text-sm">
              “{verse.text}”
            </p>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={toggleFavorite}
                className={`text-2xl transition-all ${
                  verse.isFavorite
                    ? 'text-yellow-400 scale-110'
                    : 'text-slate-300 hover:text-yellow-400'
                }`}
                title="Adicionar aos favoritos"
              >
                ★
              </button>

              <button
                onClick={() => navigate('/dashboard/inspiration')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Abrir Inspiração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyVerseWidget;
