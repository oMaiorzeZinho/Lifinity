import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'bg-[#111916]/88 border border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]';

const ASSISTANT_CONVERSATION_ID = 'assistant';

const getToken = () => localStorage.getItem('token');

const formatMessageTime = (date) => {
  if (!date) return '';

  return new Date(date).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getConversationTitle = (conversation) => {
  if (!conversation) return 'Seleciona uma conversa';

  if (conversation.type === 'group') {
    return conversation.name || 'Grupo sem nome';
  }

  return conversation.other_username || 'Utilizador';
};

const getConversationSubtitle = (conversation) => {
  if (!conversation) return '';

  if (conversation.type === 'group') {
    const memberCount = Number(conversation.member_count || 0);
    return `${memberCount} membro${memberCount === 1 ? '' : 's'}`;
  }

  return `Nivel ${conversation.other_level || 1}`;
};

const getConversationPreview = (conversation) => {
  if (!conversation?.last_message) return 'Sem mensagens ainda.';

  if (conversation.type === 'group' && conversation.last_sender_username) {
    return `${conversation.last_sender_username}: ${conversation.last_message}`;
  }

  return conversation.last_message;
};

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [conversationMembers, setConversationMembers] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [addMemberIds, setAddMemberIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [assistantSending, setAssistantSending] = useState(false);
  const [groupSubmitting, setGroupSubmitting] = useState(false);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState('');
  const assistantSendingRef = useRef(false);

  const navigate = useNavigate();
  const selectedConversationId = searchParams.get('conversation');
  const isAssistantSelected = selectedConversationId === ASSISTANT_CONVERSATION_ID;

  const currentUser = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, []);

  const selectedConversation = isAssistantSelected
    ? null
    : conversations.find(
        (conversation) =>
          Number(conversation.idconversation) === Number(selectedConversationId)
      );

  const isGroupSelected = selectedConversation?.type === 'group';
  const isSelectedGroupAdmin = selectedConversation?.current_user_role === 'admin';
  const isLifinityGroupSelected = Boolean(selectedConversation?.idgroup);

  const existingMemberIds = useMemo(
    () => new Set(conversationMembers.map((member) => Number(member.iduser))),
    [conversationMembers]
  );

  const friendsAvailableToAdd = useMemo(
    () => friends.filter((friend) => !existingMemberIds.has(Number(friend.iduser))),
    [existingMemberIds, friends]
  );

  const fetchFriends = useCallback(async () => {
    try {
      const token = getToken();

      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFriends(response.data);
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
      setError('Nao foi possivel carregar os amigos.');
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const token = getToken();

      if (!token || !currentUser) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConversations(response.data);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Nao foi possivel carregar as conversas.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  const fetchMessages = useCallback(async (idconversation) => {
    if (!idconversation) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);
      setError('');

      const token = getToken();
      const endpoint =
        idconversation === ASSISTANT_CONVERSATION_ID
          ? `${API_URL}/assistant/messages`
          : `${API_URL}/chat/conversations/${idconversation}/messages`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(response.data);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err.response?.data?.message || 'Nao foi possivel carregar esta conversa.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const fetchConversationMembers = useCallback(async (idconversation) => {
    if (!idconversation || idconversation === ASSISTANT_CONVERSATION_ID) {
      setConversationMembers([]);
      return;
    }

    try {
      setMembersLoading(true);
      setError('');

      const token = getToken();
      const response = await axios.get(
        `${API_URL}/chat/conversations/${idconversation}/members`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setConversationMembers(response.data);
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
      setError(err.response?.data?.message || 'Nao foi possivel carregar os membros.');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchFriends();
  }, [fetchConversations, fetchFriends]);

  useEffect(() => {
    fetchMessages(selectedConversationId);
    setShowMembers(false);
    setAddMemberIds([]);
  }, [fetchMessages, selectedConversationId]);

  useEffect(() => {
    if (showMembers && isGroupSelected) {
      fetchConversationMembers(selectedConversationId);
    }
  }, [fetchConversationMembers, isGroupSelected, selectedConversationId, showMembers]);

  const openConversation = (idconversation) => {
    setSearchParams({ conversation: String(idconversation) });
  };

  const openAssistantConversation = () => {
    setSearchParams({ conversation: ASSISTANT_CONVERSATION_ID });
  };

  const toggleSelectedFriend = (iduser) => {
    setSelectedFriendIds((currentIds) => (
      currentIds.includes(iduser)
        ? currentIds.filter((currentId) => currentId !== iduser)
        : [...currentIds, iduser]
    ));
  };

  const toggleAddMember = (iduser) => {
    setAddMemberIds((currentIds) => (
      currentIds.includes(iduser)
        ? currentIds.filter((currentId) => currentId !== iduser)
        : [...currentIds, iduser]
    ));
  };

  const openGroupModal = async () => {
    setError('');
    setShowGroupModal(true);
    await fetchFriends();
  };

  const closeGroupModal = () => {
    setShowGroupModal(false);
    setGroupName('');
    setSelectedFriendIds([]);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim() || selectedFriendIds.length === 0) return;

    try {
      setGroupSubmitting(true);
      setError('');

      const token = getToken();
      const response = await axios.post(
        `${API_URL}/chat/conversations/group`,
        {
          name: groupName.trim(),
          memberIds: selectedFriendIds
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      closeGroupModal();
      await fetchConversations();
      setSearchParams({ conversation: String(response.data.idconversation) });
    } catch (err) {
      console.error('Erro ao criar grupo:', err);
      setError(err.response?.data?.message || 'Nao foi possivel criar o grupo.');
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleAddMembers = async (e) => {
    e.preventDefault();

    if (!selectedConversationId || addMemberIds.length === 0) return;

    try {
      setMemberSubmitting(true);
      setError('');

      const token = getToken();
      await axios.post(
        `${API_URL}/chat/conversations/${selectedConversationId}/members`,
        { memberIds: addMemberIds },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAddMemberIds([]);
      await Promise.all([
        fetchConversationMembers(selectedConversationId),
        fetchConversations()
      ]);
    } catch (err) {
      console.error('Erro ao adicionar membros:', err);
      setError(err.response?.data?.message || 'Nao foi possivel adicionar membros.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!selectedConversationId) return;

    if (!window.confirm(`Remover ${member.username} deste grupo?`)) {
      return;
    }

    try {
      setMemberSubmitting(true);
      setError('');

      const token = getToken();
      await axios.delete(
        `${API_URL}/chat/conversations/${selectedConversationId}/members/${member.iduser}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await Promise.all([
        fetchConversationMembers(selectedConversationId),
        fetchConversations()
      ]);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      setError(err.response?.data?.message || 'Nao foi possivel remover o membro.');
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const content = messageText.trim();

    if (!content || !selectedConversationId) return;

    try {
      const token = getToken();

      if (isAssistantSelected) {
        if (assistantSendingRef.current) return;

        assistantSendingRef.current = true;
        setAssistantSending(true);

        const response = await axios.post(
          `${API_URL}/assistant/messages`,
          { content },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setMessages((currentMessages) => [
          ...currentMessages,
          ...(response.data.messages || [])
        ]);
        setMessageText('');
        return;
      }

      const response = await axios.post(
        `${API_URL}/chat/conversations/${selectedConversationId}/messages`,
        { content },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages((currentMessages) => [...currentMessages, response.data]);
      setMessageText('');
      await fetchConversations();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.response?.data?.message || 'Nao foi possivel enviar a mensagem.');
    } finally {
      if (isAssistantSelected) {
        assistantSendingRef.current = false;
        setAssistantSending(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} p-10 rounded-3xl text-center`}>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          A carregar conversas...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`${cardClass} p-8 rounded-[2rem]`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Conversas
            </p>
            <h2 className="text-4xl font-black tracking-tighter text-white">
              Chat
            </h2>
            <p className="text-slate-300 font-medium mt-3">
              Conversas diretas, grupos de chat e Assistente Lifinity.
            </p>
          </div>

          <button
            type="button"
            onClick={openGroupModal}
            className="px-6 py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
          >
            Novo grupo
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-400/20 text-red-200 p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <aside className={`${cardClass} rounded-[2rem] overflow-hidden h-fit`}>
          <div className="p-6 border-b border-white/10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Lista
            </p>
            <h3 className="text-2xl font-black tracking-tight text-white">
              As tuas conversas
            </h3>
          </div>

          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={openAssistantConversation}
              className={`w-full p-5 rounded-2xl border text-left transition-all ${
                isAssistantSelected
                  ? 'bg-emerald-500/10 border-emerald-300/30'
                  : 'bg-white/[0.045] border-white/10 hover:bg-white/[0.075]'
              }`}
            >
              <p className="text-lg font-black text-white">
                Assistente Lifinity
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80 mt-1">
                Sempre disponivel
              </p>
              <p className="text-sm text-slate-400 font-medium mt-4 line-clamp-2">
                Tarefas, produtividade, motivacao e organizacao.
              </p>
            </button>

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                Ainda nao tens conversas.
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected =
                  Number(conversation.idconversation) ===
                    Number(selectedConversationId) && !isAssistantSelected;

                return (
                  <button
                    key={conversation.idconversation}
                    type="button"
                    onClick={() => openConversation(conversation.idconversation)}
                    className={`w-full p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-400/30'
                        : 'bg-white/[0.045] border-white/10 hover:bg-white/[0.075]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {conversation.type === 'group' && (
                        <span className="shrink-0 rounded-lg bg-emerald-400/10 border border-emerald-300/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
                          Grupo
                        </span>
                      )}
                      <p className="text-lg font-black text-white truncate">
                        {getConversationTitle(conversation)}
                      </p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                      {getConversationSubtitle(conversation)}
                    </p>
                    <p className="text-sm text-slate-400 font-medium mt-4 line-clamp-2">
                      {getConversationPreview(conversation)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={`${cardClass} rounded-[2rem] overflow-hidden min-h-[640px] flex flex-col`}>
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                  Conversa ativa
                </p>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  {isAssistantSelected
                    ? 'Assistente Lifinity'
                    : getConversationTitle(selectedConversation)}
                </h3>
                {selectedConversation && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
                    {getConversationSubtitle(selectedConversation)}
                  </p>
                )}
              </div>

              {isGroupSelected && (
                <button
                  type="button"
                  onClick={() => setShowMembers((current) => !current)}
                  className="px-5 py-3 rounded-2xl bg-white/[0.08] border border-white/10 text-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.12] transition-all"
                >
                  {showMembers ? 'Fechar membros' : 'Membros'}
                </button>
              )}
            </div>
          </div>

          {showMembers && isGroupSelected && (
            <div className="border-b border-white/10 bg-white/[0.03] p-5 space-y-5">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">
                  Membros
                </p>

                {membersLoading ? (
                  <p className="text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                    A carregar membros...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {conversationMembers.map((member) => {
                      const isCurrentUser = Number(member.iduser) === Number(currentUser?.iduser);
                      const canRemove =
                        !isLifinityGroupSelected &&
                        isSelectedGroupAdmin &&
                        !isCurrentUser &&
                        conversationMembers.length > 1;

                      return (
                        <div
                          key={member.iduser}
                          className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-black text-white">
                              {member.username}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                              {member.role} · Nivel {member.level || 1}
                            </p>
                          </div>

                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member)}
                              disabled={memberSubmitting}
                              className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {isLifinityGroupSelected ? (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                  <p className="text-emerald-200 text-xs font-bold leading-relaxed">
                    Os membros deste chat sao geridos pelo grupo Lifinity.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddMembers} className="space-y-3">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    Adicionar amigos
                  </p>

                  {friendsAvailableToAdd.length === 0 ? (
                    <p className="text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                      Nao ha amigos disponiveis para adicionar.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {friendsAvailableToAdd.map((friend) => (
                        <label
                          key={friend.iduser}
                          className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 flex items-center gap-3 text-slate-200 font-bold text-sm cursor-pointer hover:bg-white/[0.08] transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={addMemberIds.includes(friend.iduser)}
                            onChange={() => toggleAddMember(friend.iduser)}
                            className="h-4 w-4 accent-emerald-500"
                          />
                          {friend.username}
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={addMemberIds.length === 0 || memberSubmitting}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {memberSubmitting ? 'A adicionar...' : 'Adicionar'}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {!selectedConversationId ? (
              <div className="h-full min-h-96 flex items-center justify-center text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                Escolhe uma conversa na lista.
              </div>
            ) : messagesLoading ? (
              <div className="h-full min-h-96 flex items-center justify-center text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                A carregar mensagens...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full min-h-96 flex items-center justify-center text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                {isAssistantSelected
                  ? 'Ainda nao falaste com o assistente.'
                  : 'Ainda nao ha mensagens nesta conversa.'}
              </div>
            ) : (
              messages.map((message) => {
                const isMine = isAssistantSelected
                  ? message.sender === 'user'
                  : Number(message.idsender) === Number(currentUser?.iduser);

                return (
                  <div
                    key={`${isAssistantSelected ? message.sender : message.idsender}-${message.idmessage}`}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-4 border ${
                        isMine
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-white/[0.06] text-slate-100 border-white/10'
                      }`}
                    >
                      {isGroupSelected && !isMine && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">
                          {message.sender_username || 'Utilizador'}
                        </p>
                      )}
                      <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest mt-3 ${
                          isMine ? 'text-blue-100/80' : 'text-slate-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-5 border-t border-white/10 flex flex-col md:flex-row gap-3"
          >
            <label htmlFor="chat-message" className="sr-only">
              Mensagem
            </label>
            <input
              id="chat-message"
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                isAssistantSelected && assistantSending
                  ? 'A aguardar resposta do Assistente Lifinity...'
                  : isAssistantSelected
                    ? 'Pergunta ao Assistente Lifinity...'
                    : 'Escreve uma mensagem...'
              }
              disabled={!selectedConversationId || (isAssistantSelected && assistantSending)}
              className="flex-1 bg-white/[0.06] border border-white/10 text-slate-100 placeholder:text-slate-500 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-300/40 focus:bg-white/[0.09] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={
                !selectedConversationId ||
                !messageText.trim() ||
                (isAssistantSelected && assistantSending)
              }
              className="px-6 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssistantSelected && assistantSending ? 'A enviar...' : 'Enviar'}
            </button>
          </form>
        </section>
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${cardClass} w-full max-w-xl rounded-[2rem] overflow-hidden`}>
            <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                  Novo grupo
                </p>
                <h3 className="text-2xl font-black tracking-tight text-white">
                  Criar conversa de grupo
                </h3>
              </div>

              <button
                type="button"
                onClick={closeGroupModal}
                className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 text-slate-300 hover:bg-white/[0.12] hover:text-white transition-all"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-5">
              <div>
                <label htmlFor="group-name" className="sr-only">
                  Nome do grupo
                </label>
                <input
                  id="group-name"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Nome do grupo"
                  maxLength={100}
                  className="w-full bg-white/[0.06] border border-white/10 text-slate-100 placeholder:text-slate-500 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-300/40 focus:bg-white/[0.09] transition-all"
                />
              </div>

              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">
                  Amigos
                </p>

                {friends.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest rounded-2xl border border-white/10 bg-white/[0.04]">
                    Ainda nao tens amigos para adicionar.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
                    {friends.map((friend) => (
                      <label
                        key={friend.iduser}
                        className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 flex items-center gap-3 text-slate-200 font-bold text-sm cursor-pointer hover:bg-white/[0.08] transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriendIds.includes(friend.iduser)}
                          onChange={() => toggleSelectedFriend(friend.iduser)}
                          className="h-4 w-4 accent-emerald-500"
                        />
                        <span>
                          {friend.username}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!groupName.trim() || selectedFriendIds.length === 0 || groupSubmitting}
                className="w-full px-6 py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {groupSubmitting ? 'A criar...' : 'Criar grupo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
