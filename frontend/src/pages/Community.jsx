import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PublicProfileModal from '../components/PublicProfileModal';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'lifinity-card';

const inputClass =
  'lifinity-input w-full rounded-2xl px-5 py-4 text-sm font-bold';

const buttonPrimaryClass =
  'lifinity-button-primary w-full px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const buttonSecondaryClass =
  'lifinity-button-secondary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest';

const menuButtonClass =
  'lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center';

const menuPanelClass =
  'lifinity-menu absolute right-0 top-12 z-[120] w-56 overflow-hidden rounded-2xl';

const menuItemClass =
  'lifinity-menu-item w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest';

const dangerMenuItemClass =
  'lifinity-danger-item w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest';

const getToken = () => localStorage.getItem('token');

const Community = () => {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });

  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [publicProfileUserId, setPublicProfileUserId] = useState(null);
  const messageTimeoutRef = useRef(null);

  const navigate = useNavigate();

  const currentUserId = (() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser).iduser : null;
    } catch {
      return null;
    }
  })();

  const showMessage = useCallback((text) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    setMessage(text);

    messageTimeoutRef.current = setTimeout(() => {
      setMessage('');
      messageTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const closeActionMenu = () => setOpenActionMenu(null);

    document.addEventListener('click', closeActionMenu);

    return () => {
      document.removeEventListener('click', closeActionMenu);
    };
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const token = getToken();

      const response = await axios.get(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(response.data);
    } catch (err) {
      console.error('Erro ao carregar grupos:', err);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const token = getToken();

      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFriends(response.data);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
    }
  }, []);

  const fetchFriendRequests = useCallback(async () => {
    try {
      const token = getToken();

      const response = await axios.get(`${API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFriendRequests(response.data);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    }
  }, []);

  const refreshCommunityData = useCallback(async () => {
    await Promise.all([
      fetchGroups(),
      fetchFriends(),
      fetchFriendRequests()
    ]);
  }, [fetchGroups, fetchFriends, fetchFriendRequests]);

  const fetchGroupMembers = useCallback(async (group) => {
    try {
      const token = getToken();

      const response = await axios.get(`${API_URL}/groups/${group.idgroup}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedGroup(group);
      setGroupMembers(response.data);
    } catch (err) {
      console.error('Erro ao carregar membros do grupo:', err);
      showMessage('Não foi possível carregar os membros do grupo.');
    }
  }, [showMessage]);

  useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      navigate('/login');
      return;
    }

    const loadCommunityData = async () => {
      setLoading(true);

      await refreshCommunityData();

      setLoading(false);
    };

    loadCommunityData();
  }, [navigate, refreshCommunityData]);

  const toggleActionMenu = (menuKey) => {
    setOpenActionMenu((currentMenu) => (
      currentMenu === menuKey ? null : menuKey
    ));
  };

  const handleMenuClick = (e, menuKey) => {
    e.stopPropagation();
    toggleActionMenu(menuKey);
  };

  const openPublicProfile = (iduser) => {
    setOpenActionMenu(null);
    setPublicProfileUserId(iduser);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();

      await axios.post(`${API_URL}/groups`, newGroup, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewGroup({
        name: '',
        description: ''
      });

      await refreshCommunityData();
      showMessage('Grupo criado com sucesso.');
    } catch (err) {
      console.error('Erro ao criar grupo:', err);
      showMessage(err.response?.data?.message || 'Erro ao criar grupo.');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();

      await axios.post(
        `${API_URL}/groups/join`,
        { inviteCode },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setInviteCode('');
      await refreshCommunityData();
      showMessage('Entraste no grupo com sucesso.');
    } catch (err) {
      console.error('Erro ao entrar no grupo:', err);
      showMessage(err.response?.data?.message || 'Erro ao entrar no grupo.');
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();

    try {
      const token = getToken();

      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        showMessage('Escreve pelo menos 2 caracteres para pesquisar.');
        return;
      }

      const response = await axios.get(`${API_URL}/friends/search`, {
        params: { query: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });

      setSearchResults(response.data);
    } catch (err) {
      console.error('Erro ao pesquisar utilizadores:', err);
      showMessage('Erro ao pesquisar utilizadores.');
    }
  };

  const handleSendFriendRequest = async (iduserReceiver) => {
    try {
      const token = getToken();

      await axios.post(
        `${API_URL}/friends/request`,
        { iduser_receiver: iduserReceiver },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await refreshCommunityData();
      showMessage('Pedido de amizade enviado.');
    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      showMessage(err.response?.data?.message || 'Erro ao enviar pedido.');
    }
  };

  const handleAcceptFriendRequest = async (idfriendship) => {
    try {
      const token = getToken();

      await axios.put(
        `${API_URL}/friends/requests/${idfriendship}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await refreshCommunityData();

      showMessage('Pedido de amizade aceite.');
    } catch (err) {
      console.error('Erro ao aceitar pedido:', err);
      showMessage('Erro ao aceitar pedido de amizade.');
    }
  };

  const handleDeclineFriendRequest = async (request) => {
    setOpenActionMenu(null);

    if (!window.confirm(`Recusar o pedido de amizade de ${request.username}?`)) {
      return;
    }

    try {
      const token = getToken();

      await axios.delete(`${API_URL}/friends/requests/${request.idfriendship}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await refreshCommunityData();
      showMessage('Pedido de amizade recusado.');
    } catch (err) {
      console.error('Erro ao recusar pedido:', err);
      showMessage(err.response?.data?.message || 'Erro ao recusar pedido de amizade.');
    }
  };

  const handleRemoveFriend = async (friend) => {
    setOpenActionMenu(null);

    if (!window.confirm(`Remover ${friend.username} da tua lista de amigos?`)) {
      return;
    }

    try {
      const token = getToken();

      await axios.delete(`${API_URL}/friends/${friend.iduser}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await refreshCommunityData();
      showMessage('Amigo removido.');
    } catch (err) {
      console.error('Erro ao remover amigo:', err);
      showMessage(err.response?.data?.message || 'Erro ao remover amigo.');
    }
  };

  const handleOpenPrivateChat = async (friend) => {
    setOpenActionMenu(null);

    try {
      const token = getToken();

      const response = await axios.post(
        `${API_URL}/chat/conversations/private`,
        { idfriend: friend.iduser },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      navigate(`/dashboard/chat?conversation=${response.data.idconversation}`);
    } catch (err) {
      console.error('Erro ao abrir conversa:', err);
      showMessage(err.response?.data?.message || 'Erro ao abrir conversa.');
    }
  };

  const handleShareVerse = () => {
    setOpenActionMenu(null);
    navigate('/dashboard/inspiration');
  };

  const handleViewGroupMembers = async (group) => {
    setOpenActionMenu(null);
    await fetchGroupMembers(group);
  };

  const handleOpenGroupChat = async (group) => {
    setOpenActionMenu(null);

    try {
      const token = getToken();

      const response = await axios.post(
        `${API_URL}/groups/${group.idgroup}/conversation`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      navigate(`/dashboard/chat?conversation=${response.data.idconversation}`);
    } catch (err) {
      console.error('Erro ao abrir chat do grupo:', err);
      showMessage(err.response?.data?.message || 'Erro ao abrir chat do grupo.');
    }
  };

  const handleLeaveGroup = async (group) => {
    setOpenActionMenu(null);

    if (Number(group.idowner) === Number(currentUserId)) {
      showMessage('O dono do grupo nao pode sair. Apaga o grupo para o remover.');
      return;
    }

    if (!window.confirm(`Sair do grupo "${group.name}"?`)) {
      return;
    }

    try {
      const token = getToken();

      await axios.delete(`${API_URL}/groups/${group.idgroup}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedGroup(null);
      setGroupMembers([]);
      await refreshCommunityData();
      showMessage('SaÃ­ste do grupo.');
    } catch (err) {
      console.error('Erro ao sair do grupo:', err);
      showMessage(err.response?.data?.message || 'Erro ao sair do grupo.');
    }
  };

  const handleDeleteGroup = async (group) => {
    setOpenActionMenu(null);

    if (!window.confirm(`Apagar definitivamente o grupo "${group.name}"?`)) {
      return;
    }

    try {
      const token = getToken();

      await axios.delete(`${API_URL}/groups/${group.idgroup}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedGroup(null);
      setGroupMembers([]);
      await refreshCommunityData();
      showMessage('Grupo apagado.');
    } catch (err) {
      console.error('Erro ao apagar grupo:', err);
      showMessage(err.response?.data?.message || 'Erro ao apagar grupo.');
    }
  };

  const copyInviteCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showMessage('Código copiado.');
    } catch (err) {
      console.error('Erro ao copiar código:', err);
      showMessage('Não foi possível copiar o código.');
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} p-10 rounded-3xl text-center`}>
        <p className="font-black uppercase tracking-widest text-xs [color:var(--lifinity-text-muted)]">
          A carregar comunidade...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-[2.5rem] border border-[var(--lifinity-border)] min-h-72 flex items-end shadow-[var(--lifinity-shadow)]"
        style={{
          backgroundImage: "url('/images/community-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 lifinity-hero-overlay"></div>

        <div className="relative z-10 p-8 md:p-10 [color:var(--lifinity-text)] w-full">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 [color:var(--lifinity-primary-strong)]">
            Comunidade Lifinity
          </p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">
                Grupos, amigos e colaboração
              </h2>

              <p className="max-w-3xl font-medium leading-relaxed [color:var(--lifinity-text-secondary)]">
                Cria grupos, entra por código de convite, adiciona amigos e prepara
                o Lifinity para atividades partilhadas, estatísticas comparativas e
                conversas e progresso em conjunto.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-64">
              <div className="lifinity-card-soft rounded-3xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest [color:var(--lifinity-primary-strong)]">
                  Grupos
                </p>
                <p className="text-4xl font-black tracking-tighter mt-1 [color:var(--lifinity-text)]">
                  {groups.length}
                </p>
              </div>

              <div className="lifinity-card-soft rounded-3xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest [color:var(--lifinity-primary-strong)]">
                  Amigos
                </p>
                <p className="text-4xl font-black tracking-tighter mt-1 [color:var(--lifinity-text)]">
                  {friends.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className="lifinity-card-soft p-5 rounded-2xl font-bold text-sm [color:var(--lifinity-text)]"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {/* AÇÕES PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* CRIAR GRUPO */}
        <div className={`${cardClass} p-6 rounded-[2rem]`}>
          <p className="lifinity-muted-label mb-2 italic">
            Criar grupo
          </p>

          <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)] mb-2">
            Novo espaço de colaboração
          </h3>

          <p className="font-medium text-sm mb-6 [color:var(--lifinity-text-muted)]">
            Cria um grupo e partilha o código de convite com colegas ou amigos.
          </p>

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <label htmlFor="community-group-name" className="sr-only">
              Nome do grupo
            </label>
            <input
              id="community-group-name"
              type="text"
              placeholder="Nome do grupo"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              className={inputClass}
              required
            />

            <label htmlFor="community-group-description" className="sr-only">
              Descricao do grupo
            </label>
            <textarea
              id="community-group-description"
              placeholder="Descrição do grupo"
              value={newGroup.description}
              onChange={(e) =>
                setNewGroup({ ...newGroup, description: e.target.value })
              }
              className={`${inputClass} resize-none h-28`}
            />

            <button type="submit" className={buttonPrimaryClass}>
              Criar grupo
            </button>
          </form>
        </div>

        {/* ENTRAR POR CÓDIGO */}
        <div className={`${cardClass} p-6 rounded-[2rem]`}>
          <p className="lifinity-muted-label mb-2 italic">
            Convite
          </p>

          <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)] mb-2">
            Entrar num grupo
          </h3>

          <p className="font-medium text-sm mb-6 [color:var(--lifinity-text-muted)]">
            Usa o código recebido para entrares num grupo já existente.
          </p>

          <form onSubmit={handleJoinGroup} className="space-y-4">
            <label htmlFor="community-invite-code" className="sr-only">
              Codigo do grupo
            </label>
            <input
              id="community-invite-code"
              type="text"
              placeholder="Código do grupo"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className={`${inputClass} uppercase tracking-widest font-black`}
              required
            />

            <button
              type="submit"
              className={buttonSecondaryClass}
            >
              Entrar no grupo
            </button>
          </form>

          <div className="lifinity-card-soft mt-6 p-5 rounded-2xl">
            <p className="text-xs font-bold leading-relaxed [color:var(--lifinity-text-muted)]">
              Os grupos juntam atividades partilhadas, estatísticas por grupo,
              chat e partilha de versículos.
            </p>
          </div>
        </div>

        {/* CONVERSAS */}
        <div className={`${cardClass} p-6 rounded-[2rem]`}>
          <p className="lifinity-muted-label mb-2 italic">
            Conversas
          </p>

          <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)] mb-2">
            Chat da comunidade
          </h3>

          <p className="font-medium text-sm mb-6 [color:var(--lifinity-text-muted)]">
            Abre as tuas conversas com amigos, grupos e o Assistente Lifinity.
          </p>

          <button
            type="button"
            onClick={() => navigate('/dashboard/chat')}
            className={buttonSecondaryClass}
          >
            Abrir Chat
          </button>
        </div>
      </div>

      {/* GRUPOS */}
      <div className={`${cardClass} rounded-[2.5rem] overflow-visible`}>
        <div className="p-6 md:p-8 border-b border-[var(--lifinity-border)] flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="lifinity-muted-label mb-2 italic">
              Os meus grupos
            </p>

            <h3 className="text-3xl font-black tracking-tighter [color:var(--lifinity-text)]">
              Espaços de colaboração
            </h3>

            <p className="font-medium mt-2 [color:var(--lifinity-text-muted)]">
              Gere grupos criados ou grupos onde já entraste através de convite.
            </p>
          </div>

          {selectedGroup && (
            <button
              type="button"
              onClick={() => {
                setSelectedGroup(null);
                setGroupMembers([]);
              }}
              className={buttonSecondaryClass}
            >
              Fechar membros
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="p-14 text-center font-bold italic uppercase text-xs tracking-widest [color:var(--lifinity-text-muted)]">
            Ainda não pertences a nenhum grupo.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {groups.map((group) => (
              <div
                key={group.idgroup}
                className={`group lifinity-card-soft relative p-6 rounded-3xl hover:bg-[var(--lifinity-primary-muted)] transition-all ${
                  openActionMenu === `group-${group.idgroup}` ? 'z-[90]' : 'z-0'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 [color:var(--lifinity-primary-strong)]">
                      {group.role === 'admin' ? 'Administrador' : 'Membro'}
                    </p>

                    <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]">
                      {group.name}
                    </h4>

                    <p className="text-sm font-medium mt-2 [color:var(--lifinity-text-muted)]">
                      {group.description || 'Sem descrição.'}
                    </p>

                    <p className="text-[10px] font-black uppercase tracking-widest mt-4 [color:var(--lifinity-text-muted)]">
                      {group.member_count} membro(s)
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="lifinity-card-soft rounded-2xl p-4 min-w-40">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 [color:var(--lifinity-text-muted)]">
                      Código
                    </p>

                    <p className="text-lg font-black tracking-widest [color:var(--lifinity-text)]">
                      {group.invite_code}
                    </p>

                    <button
                      type="button"
                      onClick={() => copyInviteCode(group.invite_code)}
                      className="lifinity-button-secondary mt-3 w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Copiar
                    </button>
                    </div>

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleMenuClick(e, `group-${group.idgroup}`)}
                        className={menuButtonClass}
                        title="Acoes do grupo"
                        aria-label="Acoes do grupo"
                        aria-expanded={openActionMenu === `group-${group.idgroup}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>

                      {openActionMenu === `group-${group.idgroup}` && (
                        <div className={menuPanelClass}>
                          <button
                            type="button"
                            onClick={() => handleOpenGroupChat(group)}
                            className={menuItemClass}
                          >
                            Abrir chat
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewGroupMembers(group)}
                            className={menuItemClass}
                          >
                            Ver membros
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLeaveGroup(group)}
                            className={dangerMenuItemClass}
                          >
                            Sair do grupo
                          </button>

                          {(group.role === 'admin' ||
                            Number(group.idowner) === Number(currentUserId)) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group)}
                              className={dangerMenuItemClass}
                            >
                              Apagar grupo
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {selectedGroup && (
          <div className="border-t border-[var(--lifinity-border)] p-6 bg-[var(--lifinity-surface-soft)]">
            <p className="lifinity-muted-label mb-2 italic">
              Membros do grupo
            </p>

            <h4 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)] mb-5">
              {selectedGroup.name}
            </h4>

            {groupMembers.length === 0 ? (
              <div className="p-10 text-center font-bold italic uppercase text-xs tracking-widest [color:var(--lifinity-text-muted)]">
                Ainda não existem membros para apresentar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groupMembers.map((member) => (
                  <div
                    key={member.iduser}
                    className="lifinity-card-soft rounded-2xl p-5"
                  >
                    <button
                      type="button"
                      onClick={() => openPublicProfile(member.iduser)}
                      className="text-left text-lg font-black [color:var(--lifinity-text)] hover:[color:var(--lifinity-primary-strong)] transition-colors"
                    >
                      {member.username}
                    </button>

                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                      Nível {member.level} • {member.xp} XP
                    </p>

                    <p className="text-[10px] font-black uppercase tracking-widest mt-4 [color:var(--lifinity-primary-strong)]">
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AMIGOS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* PESQUISA */}
        <div className={`${cardClass} xl:col-span-1 p-6 rounded-[2rem] h-fit`}>
          <p className="lifinity-muted-label mb-2 italic">
            Procurar pessoas
          </p>

          <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)] mb-6">
            Adicionar amigos
          </h3>

          <form onSubmit={handleSearchUsers} className="space-y-4">
            <label htmlFor="community-user-search" className="sr-only">
              Pesquisar username
            </label>
            <input
              id="community-user-search"
              type="text"
              placeholder="Pesquisar username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />

            <button type="submit" className={buttonPrimaryClass}>
              Pesquisar
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-xs font-bold uppercase tracking-widest text-center py-4 [color:var(--lifinity-text-muted)]">
                Sem resultados pesquisados.
              </p>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.iduser}
                  className="lifinity-card-soft p-4 rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => openPublicProfile(user.iduser)}
                    className="text-left font-black [color:var(--lifinity-text)] hover:[color:var(--lifinity-primary-strong)] transition-colors"
                  >
                    {user.username}
                  </button>

                  <p className="text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                    Nível {user.level} • {user.xp} XP
                  </p>

                  <button
                    type="button"
                    onClick={() => handleSendFriendRequest(user.iduser)}
                    className="lifinity-button-secondary mt-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Enviar pedido
                  </button>

                  <button
                    type="button"
                    onClick={() => openPublicProfile(user.iduser)}
                    className="lifinity-button-secondary mt-3 ml-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Ver perfil
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PEDIDOS E AMIGOS */}
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${cardClass} rounded-[2rem] overflow-visible`}>
            <div className="p-6 border-b border-[var(--lifinity-border)]">
              <p className="lifinity-muted-label mb-2 italic">
                Pedidos
              </p>

              <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]">
                Pedidos recebidos
              </h3>
            </div>

            {friendRequests.length === 0 ? (
              <div className="p-10 text-center font-bold italic uppercase text-xs tracking-widest [color:var(--lifinity-text-muted)]">
                Não tens pedidos pendentes.
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.idfriendship}
                    className={`lifinity-card-soft relative p-5 rounded-2xl ${
                      openActionMenu === `request-${request.idfriendship}` ? 'z-[90]' : 'z-0'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openPublicProfile(request.iduser)}
                      className="text-left text-lg font-black [color:var(--lifinity-text)] hover:[color:var(--lifinity-primary-strong)] transition-colors"
                    >
                      {request.username}
                    </button>

                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                      Nível {request.level} • {request.xp} XP
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAcceptFriendRequest(request.idfriendship)}
                        className="lifinity-button-primary px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Aceitar
                      </button>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleMenuClick(e, `request-${request.idfriendship}`)}
                          className={menuButtonClass}
                          title="Acoes do pedido"
                          aria-label="Acoes do pedido"
                          aria-expanded={openActionMenu === `request-${request.idfriendship}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>

                        {openActionMenu === `request-${request.idfriendship}` && (
                          <div className={menuPanelClass}>
                            <button
                              type="button"
                              onClick={() => openPublicProfile(request.iduser)}
                              className={menuItemClass}
                            >
                              Ver perfil
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeclineFriendRequest(request)}
                              className={dangerMenuItemClass}
                            >
                              Recusar pedido
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${cardClass} rounded-[2rem] overflow-visible`}>
            <div className="p-6 border-b border-[var(--lifinity-border)]">
              <p className="lifinity-muted-label mb-2 italic">
                Rede pessoal
              </p>

              <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)]">
                Os meus amigos
              </h3>
            </div>

            {friends.length === 0 ? (
              <div className="p-10 text-center font-bold italic uppercase text-xs tracking-widest [color:var(--lifinity-text-muted)]">
                Ainda não tens amigos adicionados.
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.iduser}
                    className={`lifinity-card-soft relative p-5 rounded-2xl ${
                      openActionMenu === `friend-${friend.iduser}` ? 'z-[90]' : 'z-0'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => openPublicProfile(friend.iduser)}
                          className="text-left text-lg font-black [color:var(--lifinity-text)] hover:[color:var(--lifinity-primary-strong)] transition-colors"
                        >
                          {friend.username}
                        </button>

                    <p className="text-[10px] font-black uppercase tracking-widest mt-1 [color:var(--lifinity-text-muted)]">
                      Nível {friend.level} • {friend.xp} XP
                    </p>

                      </div>

                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleMenuClick(e, `friend-${friend.iduser}`)}
                          className={menuButtonClass}
                          title="Acoes do amigo"
                          aria-label="Acoes do amigo"
                          aria-expanded={openActionMenu === `friend-${friend.iduser}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>

                        {openActionMenu === `friend-${friend.iduser}` && (
                          <div className={menuPanelClass}>
                            <button
                              type="button"
                              onClick={() => openPublicProfile(friend.iduser)}
                              className={menuItemClass}
                            >
                              Ver perfil
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenPrivateChat(friend)}
                              className={menuItemClass}
                            >
                              Conversar com este amigo
                            </button>

                            <button
                              type="button"
                              onClick={handleShareVerse}
                              className={menuItemClass}
                            >
                              Partilhar versiculo
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveFriend(friend)}
                              className={dangerMenuItemClass}
                            >
                              Remover amigo
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="hidden">
                      <span className="px-3 py-2 rounded-xl bg-[var(--lifinity-primary-muted)] border border-[var(--lifinity-border)] [color:var(--lifinity-primary-strong)] text-[10px] font-black uppercase tracking-widest">
                        Progresso partilhado
                      </span>

                      <span className="px-3 py-2 rounded-xl bg-[var(--lifinity-surface-soft)] border border-[var(--lifinity-border)] [color:var(--lifinity-text-muted)] text-[10px] font-black uppercase tracking-widest">
                        Chat
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESUMO DA COMUNIDADE */}
      <div className={`${cardClass} p-6 rounded-[2rem]`}>
        <p className="lifinity-muted-label mb-2 italic">
          Comunidade ativa
        </p>

        <h3 className="text-2xl font-black tracking-tight [color:var(--lifinity-text)] mb-4">
          O que podes fazer aqui
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="lifinity-card-soft p-5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 [color:var(--lifinity-primary-strong)]">
              Atividades de grupo
            </p>
            <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
              Criar atividades destinadas a grupos ou membros específicos.
            </p>
          </div>

          <div className="lifinity-card-soft p-5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 [color:var(--lifinity-primary-strong)]">
              Estatísticas comparadas
            </p>
            <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
              Comparar progresso com amigos ou médias de grupos.
            </p>
          </div>

          <div className="lifinity-card-soft p-5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 [color:var(--lifinity-primary-strong)]">
              Partilha de inspiração
            </p>
            <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
              Enviar versículos favoritos para amigos ou grupos.
            </p>
          </div>

          <div className="lifinity-card-soft p-5 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest mb-2 [color:var(--lifinity-text-muted)]">
              Chat
            </p>
            <p className="text-sm font-medium [color:var(--lifinity-text-muted)]">
              Conversas integradas com amigos e grupos.
            </p>
          </div>
        </div>
      </div>

      <PublicProfileModal
        iduser={publicProfileUserId}
        isOpen={Boolean(publicProfileUserId)}
        onClose={() => setPublicProfileUserId(null)}
      />
    </div>
  );
};

export default Community;
