import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'lifinity-card';

const softCardClass =
  'lifinity-card-soft';

const buttonSecondaryClass =
  'lifinity-button-secondary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const buttonPrimaryClass =
  'lifinity-button-primary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const modalSectionClass =
  `${softCardClass} p-5 rounded-2xl`;

const Inspiration = () => {
  const [dailyVerse, setDailyVerse] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [cardMode, setCardMode] = useState('daily');
  const [copyMessage, setCopyMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVerseToShare, setSelectedVerseToShare] = useState(null);
  const [shareError, setShareError] = useState('');
  const [sharingTargetKey, setSharingTargetKey] = useState(null);
  const copyMessageTimeoutRef = useRef(null);
  const sharingInProgressRef = useRef(false);

  const navigate = useNavigate();

  const showCopyMessage = useCallback((text) => {
    if (copyMessageTimeoutRef.current) {
      clearTimeout(copyMessageTimeoutRef.current);
    }

    setCopyMessage(text);

    copyMessageTimeoutRef.current = setTimeout(() => {
      setCopyMessage('');
      copyMessageTimeoutRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (copyMessageTimeoutRef.current) {
        clearTimeout(copyMessageTimeoutRef.current);
      }
    };
  }, []);

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

  const fetchRandomVerse = useCallback(async () => {
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
  }, []);

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

  const fetchFriends = useCallback(async (token) => {
    try {
      setFriendsLoading(true);
      setFriendsError('');

      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFriends(response.data);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
      setFriends([]);
      setFriendsError('Nao foi possivel carregar a lista de amigos.');
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async (token) => {
    try {
      setConversationsLoading(true);
      setConversationsError('');

      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConversations(response.data);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setConversations([]);
      setConversationsError('Nao foi possivel carregar os grupos de conversa.');
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async (token) => {
    try {
      setGroupsLoading(true);
      setGroupsError('');

      const response = await axios.get(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(response.data);
    } catch (err) {
      console.error('Erro ao carregar grupos:', err);
      setGroups([]);
      setGroupsError('Nao foi possivel carregar os grupos Lifinity.');
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (idverse) => {
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
  }, [fetchFavorites]);

  const removeFavoriteDirectly = useCallback(async (idverse) => {
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
        prev && prev.idverse === idverse ? { ...prev, isFavorite: false } : prev
      );

      await fetchFavorites(token);
    } catch (err) {
      console.error('Erro ao remover favorito:', err);
    }
  }, [fetchFavorites]);

  const copyVerse = useCallback(async () => {
    if (!dailyVerse) return;

    const textToCopy = `“${dailyVerse.text}” — ${dailyVerse.book} ${dailyVerse.chapter}:${dailyVerse.verse}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showCopyMessage('Versículo copiado com sucesso.');

    } catch (err) {
      console.error('Erro ao copiar versículo:', err);
      showCopyMessage('Não foi possível copiar o versículo.');
    }
  }, [dailyVerse, showCopyMessage]);

  const formatVerseContent = useCallback((verse) => {
    return `“${verse.text}” — ${verse.book} ${verse.chapter}:${verse.verse}`;
  }, []);

  const openShareModal = useCallback((verse) => {
    setSelectedVerseToShare(verse);
    setShareError('');
    setShareModalOpen(true);

    const token = localStorage.getItem('token');
    if (token) {
      fetchFriends(token);
      fetchConversations(token);
      fetchGroups(token);
    }
  }, [fetchConversations, fetchFriends, fetchGroups]);

  const closeShareModal = useCallback(() => {
    setSelectedVerseToShare(null);
    setShareError('');
    setSharingTargetKey(null);
    sharingInProgressRef.current = false;
    setShareModalOpen(false);
  }, []);

  const shareVerseWithTarget = useCallback(async (target) => {
    if (!selectedVerseToShare || sharingInProgressRef.current) return;

    try {
      sharingInProgressRef.current = true;
      setShareError('');
      setSharingTargetKey(target.key);

      const token = localStorage.getItem('token');
      let idconversation;

      if (target.type === 'friend') {
        const conversationResponse = await axios.post(
          `${API_URL}/chat/conversations/private`,
          { idfriend: target.iduser },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        idconversation = conversationResponse.data.idconversation;
      } else if (target.type === 'conversation') {
        idconversation = target.idconversation;
      } else if (target.type === 'lifinity-group') {
        const conversationResponse = await axios.post(
          `${API_URL}/groups/${target.idgroup}/conversation`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        idconversation = conversationResponse.data.idconversation;
      }

      if (!idconversation) {
        throw new Error('Destino de partilha invalido.');
      }

      const content = formatVerseContent(selectedVerseToShare);

      await axios.post(
        `${API_URL}/chat/conversations/${idconversation}/messages`,
        { content, message_type: 'verse' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      closeShareModal();
      navigate(`/dashboard/chat?conversation=${idconversation}`);
    } catch (err) {
      console.error('Erro ao partilhar versiculo:', err);
      setShareError(err.response?.data?.message || 'Nao foi possivel partilhar o versiculo.');
      setSharingTargetKey(null);
      sharingInProgressRef.current = false;
    }
  }, [closeShareModal, formatVerseContent, navigate, selectedVerseToShare]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      await fetchDailyVerse(token);
      await fetchFavorites(token);
      await fetchFriends(token);
      await fetchConversations(token);
      await fetchGroups(token);
      if (isActive) {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [navigate, fetchDailyVerse, fetchFavorites, fetchFriends, fetchConversations, fetchGroups]);

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

  const groupConversations = useMemo(() => {
    return conversations.filter(
      (conversation) => conversation.type === 'group' && !conversation.idgroup
    );
  }, [conversations]);

  if (loading) {
    return (
      <div className={`${cardClass} p-10 rounded-3xl text-center`}>
        <p className="lifinity-muted-label">
          A carregar inspiração...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO / BANNER */}
      <div
        className="relative overflow-hidden rounded-[2.5rem] shadow-[var(--lifinity-shadow)] border border-[var(--lifinity-border)] min-h-72 flex items-end"
        style={{
          backgroundImage: "url('/images/bible-banner.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 lifinity-hero-overlay"></div>

        <div className="relative z-10 p-8 md:p-10 max-w-3xl [color:var(--lifinity-text)]">
          <p className="lifinity-muted-label mb-3">
            Inspiração Diária
          </p>

          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">
            Uma mensagem para fortalecer o teu dia
          </h2>

          <p className="text-sm md:text-base font-medium leading-relaxed [color:var(--lifinity-text-muted)]">
            Descobre um versículo diário, guarda os teus favoritos e mantém uma
            fonte de motivação espiritual dentro do Lifinity.
          </p>
        </div>
      </div>

      {error && (
        <div className="lifinity-card-soft border-red-400/30 p-5 rounded-2xl font-bold text-sm [color:var(--lifinity-danger)]">
          {error}
        </div>
      )}

      {/* VERSÍCULO DO DIA / ALEATÓRIO */}
      {dailyVerse && (
        <div className="grid grid-cols-1 inspiration-verse-grid gap-6 items-stretch">
          <div
            className="rounded-[2rem] shadow-[var(--lifinity-shadow)] border border-[var(--lifinity-border)] overflow-hidden h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/daily-verse.jpg')",
              minHeight: 460
            }}
          ></div>

          <div
            className={`${cardClass} p-8 rounded-[2rem] h-full flex flex-col justify-between`}
            style={{ minHeight: 460 }}
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="lifinity-muted-label mb-2">
                    {cardMode === 'daily'
                      ? 'Versículo do Dia'
                      : 'Versículo Aleatório'}
                  </p>

                  <span className="inline-block px-4 py-2 rounded-full bg-[var(--lifinity-primary-muted)] border border-[var(--lifinity-border)] [color:var(--lifinity-primary-strong)] text-[10px] font-black uppercase tracking-widest">
                    Tema: {dailyVerse.theme || 'Geral'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFavorite(dailyVerse.idverse)}
                  className={`text-3xl transition-all ${
                    dailyVerse.isFavorite
                      ? 'text-yellow-300 scale-110 drop-shadow-[0_0_16px_rgba(253,224,71,0.35)]'
                      : '[color:var(--lifinity-text-muted)] hover:text-yellow-300'
                  }`}
                  title="Adicionar aos favoritos"
                  aria-label="Adicionar aos favoritos"
                >
                  ★
                </button>
              </div>

              <p className="text-2xl md:text-3xl font-black tracking-tight [color:var(--lifinity-text)] leading-relaxed min-h-[10.625rem]">
                “{dailyVerse.text}”
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--lifinity-border)] space-y-4">
              <p className="text-sm font-bold [color:var(--lifinity-text)]">
                {dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}
              </p>

              <p className="text-xs font-bold uppercase tracking-widest [color:var(--lifinity-text-muted)]">
                Guarda este versículo nos teus favoritos para o consultares mais tarde
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={fetchRandomVerse}
                  className={buttonPrimaryClass}
                >
                  Versículo Aleatório
                </button>

                <button type="button" onClick={copyVerse} className={buttonSecondaryClass}>
                  Copiar Versículo
                </button>

                {cardMode === 'random' && (
                  <button
                    type="button"
                    onClick={() => fetchDailyVerse(localStorage.getItem('token'))}
                    className={buttonSecondaryClass}
                  >
                    Voltar ao Diário
                  </button>
                )}
              </div>

              {copyMessage && (
                <p
                  className="text-xs font-bold uppercase tracking-widest [color:var(--lifinity-primary-strong)]"
                  role="status"
                  aria-live="polite"
                >
                  {copyMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAVORITOS */}
      <div className={`${cardClass} rounded-[2.5rem] overflow-hidden`}>
        <div
          className="relative px-8 py-14 md:py-20 border-b border-[var(--lifinity-border)] min-h-[220px] flex items-end"
          style={{
            backgroundImage: "url('/images/favorites-bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 lifinity-hero-overlay"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="lifinity-muted-label mb-2">
                Coleção Pessoal
              </p>

              <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
                Versículos Favoritos
              </h3>

              <p className="font-medium mt-2 [color:var(--lifinity-text-muted)]">
                Aqui ficam guardados os versículos que mais te marcaram.
              </p>
            </div>

            <div className="relative z-10">
              <label htmlFor="inspiration-theme-filter" className="sr-only">
                Filtrar favoritos por tema
              </label>
              <select
                id="inspiration-theme-filter"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="lifinity-input rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest cursor-pointer"
              >
                <option value="all">
                  Todos os Temas
                </option>
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
          <div className="p-12 text-center font-bold text-xs tracking-widest [color:var(--lifinity-text-muted)]">
            A carregar favoritos...
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="p-12 text-center font-bold text-xs tracking-widest [color:var(--lifinity-text-muted)]">
            Ainda não tens versículos favoritos para este filtro.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFavorites.map((verse) => (
              <div
                key={verse.idfavorite}
                className="group lifinity-card-soft p-6 rounded-3xl hover:bg-[var(--lifinity-primary-muted)] transition-all"
              >
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => removeFavoriteDirectly(verse.idverse)}
                    className="w-12 h-12 rounded-2xl bg-[var(--lifinity-primary-muted)] border border-[var(--lifinity-border)] [color:var(--lifinity-primary-strong)] flex items-center justify-center text-xl font-black shrink-0 hover:scale-105 transition-all"
                    title="Remover dos favoritos"
                    aria-label="Remover dos favoritos"
                  >
                    ★
                  </button>

                  <div className="flex-1">
                    <p className="font-bold leading-relaxed [color:var(--lifinity-text)] transition-colors">
                      “{verse.text}”
                    </p>

                    <p className="text-sm font-bold mt-4 [color:var(--lifinity-text-muted)]">
                      {verse.book} {verse.chapter}:{verse.verse}
                    </p>

                    {verse.theme && (
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2 [color:var(--lifinity-primary-strong)]">
                        {verse.theme}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openShareModal(verse)}
                        className="lifinity-button-secondary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Partilhar
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFavoriteDirectly(verse.idverse)}
                        className="lifinity-danger-item px-4 py-2 rounded-xl border border-red-400/20 text-[10px] font-black uppercase tracking-widest"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PARTILHA */}
      {shareModalOpen && selectedVerseToShare && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={`${cardClass} w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col`}>
            <div className="p-6 border-b border-[var(--lifinity-border)] flex items-start justify-between gap-4">
              <div>
                <p className="lifinity-muted-label mb-2">
                  Partilhar Versículo
                </p>

                <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]">
                  Enviar inspiração
                </h3>
              </div>

              <button
                type="button"
                onClick={closeShareModal}
                className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-black"
                title="Fechar"
                aria-label="Fechar modal de partilha"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className={modalSectionClass}>
                <p className="font-bold leading-relaxed [color:var(--lifinity-text)]">
                  “{selectedVerseToShare.text}”
                </p>

                <p className="text-sm font-bold mt-3 [color:var(--lifinity-text-muted)]">
                  {selectedVerseToShare.book} {selectedVerseToShare.chapter}:
                  {selectedVerseToShare.verse}
                </p>
              </div>

              <div className={modalSectionClass}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 [color:var(--lifinity-primary-strong)]">
                  Amigos
                </p>

                {friendsLoading ? (
                  <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
                    A carregar amigos...
                  </p>
                ) : friendsError ? (
                  <p className="text-sm font-medium [color:var(--lifinity-danger)]">
                    {friendsError}
                  </p>
                ) : friends.length === 0 ? (
                  <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
                    Ainda nao tens amigos aceites para partilhar este versiculo.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {friends.map((friend) => {
                      const target = {
                        type: 'friend',
                        key: `friend-${friend.iduser}`,
                        iduser: friend.iduser
                      };
                      const isSending = sharingTargetKey === target.key;

                      return (
                        <button
                          key={friend.iduser}
                          type="button"
                          onClick={() => shareVerseWithTarget(target)}
                          disabled={sharingTargetKey !== null}
                          className="lifinity-card-soft w-full p-4 rounded-2xl text-left hover:bg-[var(--lifinity-primary-muted)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span className="block font-black [color:var(--lifinity-text)]">
                            {friend.username}
                          </span>
                          <span className="block text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                            {isSending ? 'A enviar...' : `Nivel ${friend.level || 1}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={modalSectionClass}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 [color:var(--lifinity-primary-strong)]">
                  Grupos de conversa
                </p>

                {conversationsLoading ? (
                  <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
                    A carregar grupos de conversa...
                  </p>
                ) : conversationsError ? (
                  <p className="text-sm font-medium [color:var(--lifinity-danger)]">
                    {conversationsError}
                  </p>
                ) : groupConversations.length === 0 ? (
                  <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
                    Ainda nao tens grupos de conversa para partilhar este versiculo.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {groupConversations.map((conversation) => {
                      const target = {
                        type: 'conversation',
                        key: `conversation-${conversation.idconversation}`,
                        idconversation: conversation.idconversation
                      };
                      const isSending = sharingTargetKey === target.key;

                      return (
                        <button
                          key={conversation.idconversation}
                          type="button"
                          onClick={() => shareVerseWithTarget(target)}
                          disabled={sharingTargetKey !== null}
                          className="lifinity-card-soft w-full p-4 rounded-2xl text-left hover:bg-[var(--lifinity-primary-muted)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span className="block font-black [color:var(--lifinity-text)]">
                            {conversation.name || 'Grupo sem nome'}
                          </span>
                          <span className="block text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                            {isSending
                              ? 'A enviar...'
                              : `${conversation.member_count || 0} membro(s)`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={modalSectionClass}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 [color:var(--lifinity-primary-strong)]">
                  Grupos Lifinity
                </p>

                {groupsLoading ? (
                  <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
                    A carregar grupos Lifinity...
                  </p>
                ) : groupsError ? (
                  <p className="text-sm font-medium [color:var(--lifinity-danger)]">
                    {groupsError}
                  </p>
                ) : groups.length === 0 ? (
                  <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
                    Ainda nao pertences a grupos Lifinity para partilhar este versiculo.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {groups.map((group) => {
                      const target = {
                        type: 'lifinity-group',
                        key: `lifinity-group-${group.idgroup}`,
                        idgroup: group.idgroup
                      };
                      const isSending = sharingTargetKey === target.key;

                      return (
                        <button
                          key={group.idgroup}
                          type="button"
                          onClick={() => shareVerseWithTarget(target)}
                          disabled={sharingTargetKey !== null}
                          className="lifinity-card-soft w-full p-4 rounded-2xl text-left hover:bg-[var(--lifinity-primary-muted)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <span className="block font-black [color:var(--lifinity-text)]">
                            {group.name}
                          </span>
                          <span className="block text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                            {isSending
                              ? 'A enviar...'
                              : `${group.member_count || 0} membro(s)`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {shareError && (
                <div className="lifinity-card-soft border-red-400/30 p-4 rounded-2xl">
                  <p className="text-xs font-bold leading-relaxed [color:var(--lifinity-danger)]">
                    {shareError}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeShareModal}
                  className={buttonSecondaryClass}
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
