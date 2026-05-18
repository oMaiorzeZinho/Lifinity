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
          className="lifinity-button-secondary rounded-2xl px-5 py-4 shadow-[var(--lifinity-shadow)]"
        >
          <p className="lifinity-muted-label">
            Versículo do Dia
          </p>
        </button>
      ) : (
        <div className="lifinity-card w-80 sm:w-90 rounded-[2rem] overflow-hidden">
          <div className="p-5 border-b border-[var(--lifinity-border)] flex items-center justify-between gap-4">
            <div>
              <p className="lifinity-muted-label">
                Versículo do Dia
              </p>
              <p className="text-xs font-bold mt-1 [color:var(--lifinity-text-muted)]">
                {verse.book} {verse.chapter}:{verse.verse}
              </p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="lifinity-button-secondary w-9 h-9 rounded-xl flex items-center justify-center text-xl font-black"
              title="Fechar"
              aria-label="Fechar widget do versiculo"
            >
              ×
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="font-bold leading-relaxed text-sm [color:var(--lifinity-text)]">
              “{verse.text}”
            </p>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={toggleFavorite}
                className={`text-2xl transition-all ${
                  verse.isFavorite
                    ? 'text-yellow-400 scale-110'
                    : '[color:var(--lifinity-text-muted)] hover:text-yellow-400'
                }`}
                title="Adicionar aos favoritos"
                aria-label="Adicionar aos favoritos"
              >
                ★
              </button>

              <button
                onClick={() => navigate('/dashboard/inspiration')}
                className="lifinity-button-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
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
