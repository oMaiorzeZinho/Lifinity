import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageUploadModal from '../components/ImageUploadModal';
import AccountSettingsModal from '../components/AccountSettingsModal';
import { getImageUrl } from '../utils/imageUrl';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'lifinity-card';

const innerCardClass =
  'lifinity-card-soft rounded-2xl';

const statValueClass =
  'text-3xl font-black tracking-tighter text-(--lifinity-primary-strong)';

const buttonSecondaryClass =
  'lifinity-button-secondary w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const buttonPrimaryClass =
  'lifinity-button-primary w-full px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const achievementCategoryLabels = {
  level: 'Nivel',
  xp: 'XP',
  tasks: 'Atividades',
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

  const [achievements, setAchievements] = useState([]);
  const [selectedHighlightIds, setSelectedHighlightIds] = useState([]);
  const [achievementError, setAchievementError] = useState('');
  const [savingHighlights, setSavingHighlights] = useState(false);
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Controlo dos uploads de imagem: menu expandido + modal aberto ('avatar' | 'cover' | null)
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [uploadModal, setUploadModal] = useState(null);

  // Modal de configurações da conta
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Tema — lido do localStorage para passar ao AccountSettingsModal
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('lifinity-theme') === 'light' ? 'light' : 'dark'
  );

  // Bio: texto local + estados de feedback
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState('');
  const [bioError, setBioError] = useState('');

  const navigate = useNavigate();

  const levelData = useMemo(() => {
    return getLevelData(user?.xp || 0);
  }, [user]);

  // Quando o tema muda via AccountSettingsModal, persiste no localStorage e notifica o Dashboard
  useEffect(() => {
    localStorage.setItem('lifinity-theme', theme);
    window.dispatchEvent(new CustomEvent('lifinity-theme-updated', { detail: theme }));
  }, [theme]);

  const fetchProfileData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Inicializa o campo de bio com o valor guardado
      setBioText(parsedUser.bio || '');

      const headers = { Authorization: `Bearer ${token}` };

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
        const parsed = JSON.parse(refreshedUser);
        setUser(parsed);
        setBioText(parsed.bio || '');
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

  // Guarda a bio via PUT /users/me/bio
  const handleSaveBio = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      setBioMessage('');
      setBioError('');
      setSavingBio(true);

      const response = await axios.put(
        `${API_URL}/users/me/bio`,
        { bio: bioText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = response.data?.user;

      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setBioText(updatedUser.bio || '');
        window.dispatchEvent(new Event('lifinity-user-updated'));
      }

      setBioMessage(response.data?.message || 'Descrição atualizada.');
    } catch (err) {
      setBioError(
        err?.response?.data?.message || 'Nao foi possivel guardar a descrição.'
      );
    } finally {
      setSavingBio(false);
    }
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
      setAchievementsModalOpen(false);
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
        className="relative overflow-hidden rounded-[2.5rem] shadow-(--lifinity-shadow) border border-(--lifinity-border) min-h-72 flex items-end"
        style={{
          backgroundImage: user.cover_image
            ? `url('${getImageUrl(user.cover_image)}')`
            : "url('/images/profile-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 lifinity-hero-overlay"></div>

        <div className="relative z-10 p-8 md:p-10 w-full text-(--lifinity-text)">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-6">
              {user.avatar ? (
                <img
                  src={getImageUrl(user.avatar)}
                  alt="Avatar"
                  className="w-24 h-24 rounded-3xl object-cover border border-(--lifinity-border) shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-(--lifinity-primary-muted) border border-(--lifinity-border) flex items-center justify-center text-4xl font-black shadow-xl backdrop-blur-xl text-(--lifinity-text)">
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}

              <div>
                <p className="lifinity-muted-label mb-2">
                  Perfil do Utilizador
                </p>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  {user.username}
                </h2>

                <p className="font-bold mt-3 text-(--lifinity-text-muted)">
                  {user.email || 'Email não disponível'}
                </p>
              </div>
            </div>

            <div className="lifinity-card-soft rounded-3xl p-6 min-w-64">
              <p className="lifinity-muted-label mb-1">
                Nível atual
              </p>

              <p className="text-5xl font-black tracking-tighter text-(--lifinity-primary-strong)">
                {levelData.level}
              </p>

              <p className="text-sm font-bold mt-2 text-(--lifinity-text-muted)">
                {user.xp || 0} XP acumulados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESSO */}
      <div className={`${cardClass} p-8 rounded-4xl`}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
          <div>
            <p className="lifinity-muted-label mb-2">
              Evolução
            </p>

            <h3 className="text-3xl font-black tracking-tighter text-(--lifinity-text)">
              Progresso para o próximo nível
            </h3>

            <p className="font-medium mt-2 text-(--lifinity-text-muted)">
              O teu nível aumenta conforme completas atividades e ganhas XP.
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

        <div className="w-full bg-(--lifinity-surface-soft) h-4 rounded-full overflow-hidden">
          <div
            className="bg-(--lifinity-primary) h-full transition-all duration-1000 shadow-[0_0_15px_rgba(47,111,79,0.28)]"
            style={{ width: `${levelData.progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-(--lifinity-text-muted)">
          <span>Nível {levelData.level}</span>
          <span>Nível {levelData.level + 1}</span>
        </div>
      </div>

      {/* CONQUISTAS */}
      <div className={`${cardClass} rounded-4xl overflow-hidden`}>
        <div className="p-6 md:p-8 border-b border-(--lifinity-border) flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="lifinity-muted-label mb-2">
              Medalhas
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-(--lifinity-text)">
              Conquistas em destaque
            </h3>
            <p className="font-medium mt-2 text-(--lifinity-text-muted)">
              Mantem o perfil limpo com ate 3 conquistas destacadas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAchievementsModalOpen(true)}
            className="lifinity-button-primary px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest"
          >
            Ver conquistas
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {achievementError && (
            <div className="lifinity-card-soft lifinity-danger-surface p-4 rounded-2xl text-sm font-bold">
              {achievementError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
            <div>
              {displayedHighlights.length === 0 ? (
                <div className={`${innerCardClass} p-5 text-sm font-bold text-(--lifinity-text-muted)`}>
                  Ainda nao tens conquistas desbloqueadas para destacar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayedHighlights.slice(0, 3).map((achievement, index) => (
                    <div
                      key={achievement.idbadge}
                      className="p-5 rounded-2xl bg-(--lifinity-primary-muted) border border-(--lifinity-primary) shadow-sm"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-(--lifinity-primary-strong)">
                        Destaque {achievement.position || index + 1}
                      </p>
                      <h5 className="text-lg font-black text-(--lifinity-text)">
                        {achievement.name}
                      </h5>
                      <p className="text-sm font-medium mt-2 text-(--lifinity-text-muted)">
                        {achievement.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`${innerCardClass} p-5 flex flex-col justify-between gap-4`}>
              <div>
                <p className="lifinity-muted-label mb-1">
                  Desbloqueadas
                </p>
                <p className={statValueClass}>
                  {unlockedAchievements.length}
                </p>
                <p className="text-xs font-bold mt-2 text-(--lifinity-text-muted)">
                  de {achievements.length} conquistas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAchievementsModalOpen(true)}
                className="lifinity-button-secondary px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Gerir conquistas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SOBRE MIM + AÇÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOBRE MIM — editor de bio/status */}
        <div className={`${cardClass} lg:col-span-2 rounded-4xl overflow-hidden`}>
          <div className="p-6 md:p-8 border-b border-(--lifinity-border)">
            <p className="lifinity-muted-label mb-2">
              Conta
            </p>
            <h3 className="text-3xl font-black tracking-tighter text-(--lifinity-text)">
              Sobre mim
            </h3>
            <p className="font-medium mt-2 text-(--lifinity-text-muted)">
              Escreve uma breve descrição que aparece no teu perfil público.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="relative">
              <textarea
                className="lifinity-input rounded-2xl px-4 py-4 text-sm font-bold w-full resize-none"
                rows={5}
                maxLength={300}
                placeholder="Conta algo sobre ti..."
                value={bioText}
                onChange={(e) => {
                  setBioText(e.target.value);
                  setBioMessage('');
                  setBioError('');
                }}
              />
              {/* Contador de caracteres */}
              <span className="absolute bottom-3 right-4 text-[10px] font-black uppercase tracking-widest text-(--lifinity-text-muted)">
                {bioText.length}/300
              </span>
            </div>

            {bioMessage && (
              <p className="text-sm font-bold text-(--lifinity-primary-strong)">{bioMessage}</p>
            )}
            {bioError && (
              <p className="text-sm font-bold text-(--lifinity-danger)">{bioError}</p>
            )}

            <button
              type="button"
              onClick={handleSaveBio}
              disabled={savingBio}
              className="lifinity-button-primary px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingBio ? 'A guardar...' : 'Guardar descrição'}
            </button>
          </div>
        </div>

        {/* AÇÕES */}
        <div className={`${cardClass} p-6 rounded-4xl h-fit`}>
          <p className="lifinity-muted-label mb-2">
            Ações
          </p>
          <h3 className="text-2xl font-black tracking-tight mb-4 text-(--lifinity-text)">
            Gestão do perfil
          </h3>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setImageMenuOpen((open) => !open)}
              className={buttonPrimaryClass}
              aria-expanded={imageMenuOpen}
            >
              Mudar imagens
            </button>

            {/* Opções de upload: aparecem ao clicar em "Mudar imagens" */}
            {imageMenuOpen && (
              <div className="lifinity-card-soft rounded-2xl p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setUploadModal('avatar')}
                  className={buttonSecondaryClass}
                >
                  Imagem de perfil
                </button>

                <button
                  type="button"
                  onClick={() => setUploadModal('cover')}
                  className={buttonSecondaryClass}
                >
                  Imagem de fundo
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className={buttonSecondaryClass}
            >
              Configurações
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="lifinity-danger-item w-full px-5 py-4 rounded-2xl border border-(--lifinity-border) text-[10px] font-black uppercase tracking-widest"
            >
              Terminar sessão
            </button>
          </div>
        </div>
      </div>

      {/* Modais de upload de imagem (perfil e fundo) */}
      <ImageUploadModal
        isOpen={uploadModal === 'avatar'}
        onClose={() => setUploadModal(null)}
        title="Imagem de perfil"
        endpoint="/users/me/avatar"
        currentImage={user.avatar}
      />

      <ImageUploadModal
        isOpen={uploadModal === 'cover'}
        onClose={() => setUploadModal(null)}
        title="Imagem de fundo"
        endpoint="/users/me/cover"
        currentImage={user.cover_image}
      />

      {/* Modal de configurações da conta (tema, username, password, apagar conta) */}
      {settingsOpen && (
        <AccountSettingsModal
          user={user}
          setUser={setUser}
          theme={theme}
          setTheme={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {achievementsModalOpen && (
        <div className="fixed inset-0 bg-(--lifinity-overlay) backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={`${cardClass} w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-4xl`}>
            <div className="p-6 md:p-8 border-b border-(--lifinity-border) flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div>
                <p className="lifinity-muted-label mb-2">
                  Medalhas
                </p>
                <h3 className="text-3xl font-black tracking-tighter text-(--lifinity-text)">
                  Gerir conquistas
                </h3>
                <p className="font-medium mt-2 text-(--lifinity-text-muted)">
                  Escolhe ate 3 conquistas desbloqueadas para destacar no teu perfil.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveHighlights}
                  disabled={savingHighlights}
                  className="lifinity-button-primary px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingHighlights ? 'A guardar...' : 'Guardar destaques'}
                </button>

                <button
                  type="button"
                  onClick={() => setAchievementsModalOpen(false)}
                  className="lifinity-button-secondary px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {achievementError && (
                <div className="lifinity-card-soft lifinity-danger-surface p-4 rounded-2xl text-sm font-bold">
                  {achievementError}
                </div>
              )}

              <div className={`${innerCardClass} p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3`}>
                <div>
                  <p className="lifinity-muted-label">
                    Selecionadas
                  </p>
                  <p className="text-sm font-bold mt-1 text-(--lifinity-text-muted)">
                    Clica em conquistas desbloqueadas para definir a ordem de destaque.
                  </p>
                </div>
                <p className="text-2xl font-black text-(--lifinity-primary-strong)">
                  {selectedHighlightIds.length}/3
                </p>
              </div>

              <div>
                <h4 className="text-xl font-black tracking-tight mb-4 text-(--lifinity-text)">
                  Desbloqueadas
                </h4>

                {unlockedAchievements.length === 0 ? (
                  <div className={`${innerCardClass} p-5 text-sm font-bold text-(--lifinity-text-muted)`}>
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
                              ? 'bg-(--lifinity-primary-muted) border-(--lifinity-primary) shadow-sm'
                              : 'lifinity-card-soft border-(--lifinity-border) hover:bg-(--lifinity-primary-muted)'
                          } disabled:opacity-55 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="lifinity-muted-label mb-2">
                                {achievementCategoryLabels[achievement.category] || achievement.category || 'Conquista'}
                              </p>
                              <h5 className="text-lg font-black text-(--lifinity-text)">
                                {achievement.name}
                              </h5>
                            </div>

                            {isSelected && (
                              <span className="shrink-0 lifinity-badge text-[10px]">
                                #{selectedPosition}
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-medium mt-3 text-(--lifinity-text-muted)">
                            {achievement.description}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-(--lifinity-text-muted)">
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
                  <h4 className="text-xl font-black tracking-tight mb-4 text-(--lifinity-text)">
                    Bloqueadas
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {lockedAchievements.map((achievement) => (
                      <div
                        key={achievement.idbadge}
                        className="p-5 rounded-2xl bg-(--lifinity-surface-soft) border border-(--lifinity-border) opacity-55"
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-(--lifinity-text-muted)">
                          {achievementCategoryLabels[achievement.category] || achievement.category || 'Conquista'}
                        </p>
                        <h5 className="text-lg font-black text-(--lifinity-text-muted)">
                          {achievement.name}
                        </h5>
                        <p className="text-sm font-medium mt-3 text-(--lifinity-text-muted)">
                          {achievement.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
