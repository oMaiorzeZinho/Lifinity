import { useEffect, useState } from 'react';
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

const categoryLabels = {
  level: 'Nivel',
  xp: 'XP',
  tasks: 'Atividades',
  friends: 'Amigos',
  groups: 'Grupos',
  chat: 'Chat',
  verses: 'Versiculos',
  assistant: 'Assistente'
};

const PublicProfileModal = ({ iduser, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !iduser) {
      setProfile(null);
      setError('');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/users/${iduser}/public-profile`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setProfile(response.data);
      } catch (err) {
        console.error('Erro ao carregar perfil publico:', err);
        setError(
          err.response?.status === 404
            ? 'Utilizador nao encontrado.'
            : 'Nao foi possivel carregar este perfil.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [iduser, isOpen]);

  if (!isOpen) return null;

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--lifinity-overlay)] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`${cardClass} max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-profile-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--lifinity-border)] p-6">
          <div>
            <p className="lifinity-muted-label mb-2">
              Perfil publico
            </p>
            <h3
              id="public-profile-title"
              className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]"
            >
              {profile?.username || 'A carregar...'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lifinity-button-secondary h-10 w-10 rounded-xl"
            aria-label="Fechar perfil publico"
          >
            X
          </button>
        </div>

        {loading ? (
          <div className={`p-10 text-center text-xs font-black uppercase tracking-widest ${mutedTextClass}`}>
            A carregar perfil...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm font-bold [color:var(--lifinity-danger)]">
            {error}
          </div>
        ) : profile ? (
          <div className="space-y-6 p-6">
            <div className={`${softCardClass} flex flex-col gap-5 rounded-3xl p-6 md:flex-row md:items-center md:justify-between`}>
              <div className="flex items-center gap-5">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt=""
                    className="h-20 w-20 rounded-3xl border border-[var(--lifinity-border)] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--lifinity-border)] bg-[var(--lifinity-primary-muted)] text-3xl font-black [color:var(--lifinity-text)]">
                    {profile.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}

                <div>
                  <h4 className="text-3xl font-black tracking-tight [color:var(--lifinity-text)]">
                    {profile.username}
                  </h4>
                  <p className={`mt-2 text-sm font-bold ${mutedTextClass}`}>
                    No Lifinity desde {joinedDate || 'data indisponivel'}
                  </p>
                </div>
              </div>

              <div className={`${softCardClass} rounded-2xl px-5 py-4`}>
                <p className="lifinity-muted-label">
                  Nivel
                </p>
                <p className="text-4xl font-black tracking-tighter [color:var(--lifinity-primary-strong)]">
                  {profile.level || 1}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`${softCardClass} rounded-2xl p-5`}>
                <p className="lifinity-muted-label">
                  Conquistas
                </p>
                <p className={`mt-1 ${statValueClass}`}>
                  {profile.totalUnlockedBadges || 0}
                </p>
                <p className={`mt-2 text-xs font-bold ${mutedTextClass}`}>
                  Medalhas desbloqueadas.
                </p>
              </div>

              <div className={`${softCardClass} rounded-2xl p-5`}>
                <p className="lifinity-muted-label">
                  Grupos em comum
                </p>
                <p className={`mt-1 ${statValueClass}`}>
                  {profile.commonGroups?.length || 0}
                </p>
                <p className={`mt-2 text-xs font-bold ${mutedTextClass}`}>
                  Espaços partilhados contigo.
                </p>
              </div>
            </div>

            <div>
              <h5 className="mb-3 text-lg font-black tracking-tight [color:var(--lifinity-text)]">
                Conquistas destacadas
              </h5>

              {profile.highlightedBadges?.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {profile.highlightedBadges.map((badge, index) => (
                    <div
                      key={badge.idbadge}
                      className="rounded-2xl border border-[var(--lifinity-primary)] bg-[var(--lifinity-primary-muted)] p-4"
                    >
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest [color:var(--lifinity-primary-strong)]">
                        {badge.position ? `Destaque ${badge.position}` : `Recente ${index + 1}`}
                      </p>
                      <p className="font-black [color:var(--lifinity-text)]">
                        {badge.name}
                      </p>
                      <p className={`mt-2 text-xs font-medium ${mutedTextClass}`}>
                        {badge.description}
                      </p>
                      <p className={`mt-3 text-[10px] font-black uppercase tracking-widest ${mutedTextClass}`}>
                        {categoryLabels[badge.category] || badge.category || 'Conquista'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${softCardClass} rounded-2xl p-5 text-sm font-bold ${mutedTextClass}`}>
                  Este utilizador ainda nao tem conquistas destacadas.
                </div>
              )}
            </div>

            <div>
              <h5 className="mb-3 text-lg font-black tracking-tight [color:var(--lifinity-text)]">
                Grupos em comum
              </h5>

              {profile.commonGroups?.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {profile.commonGroups.map((group) => (
                    <div
                      key={group.idgroup}
                      className={`${softCardClass} rounded-2xl p-4`}
                    >
                      <p className="font-black [color:var(--lifinity-text)]">
                        {group.name}
                      </p>
                      {group.description && (
                        <p className={`mt-2 text-sm font-medium ${mutedTextClass}`}>
                          {group.description}
                        </p>
                      )}
                      <p className={`mt-3 text-[10px] font-black uppercase tracking-widest ${mutedTextClass}`}>
                        {group.member_count || 0} membros
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${softCardClass} rounded-2xl p-5 text-sm font-bold ${mutedTextClass}`}>
                  Ainda nao existem grupos em comum.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PublicProfileModal;
