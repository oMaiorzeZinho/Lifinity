import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const cardClass =
  'bg-[#111916]/88 border border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]';

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

const Chat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const selectedConversationId = searchParams.get('conversation');

  const currentUser = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
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

      const response = await axios.get(
        `${API_URL}/chat/conversations/${idconversation}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages(response.data);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError(err.response?.data?.message || 'Nao foi possivel carregar as mensagens.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages(selectedConversationId);
  }, [fetchMessages, selectedConversationId]);

  const selectedConversation = conversations.find(
    (conversation) =>
      Number(conversation.idconversation) === Number(selectedConversationId)
  );

  const openConversation = (idconversation) => {
    setSearchParams({ conversation: String(idconversation) });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const content = messageText.trim();

    if (!content || !selectedConversationId) return;

    try {
      const token = getToken();

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
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
          Conversas
        </p>
        <h2 className="text-4xl font-black tracking-tighter text-white">
          Chat privado
        </h2>
        <p className="text-slate-300 font-medium mt-3">
          Conversas diretas com amigos aceites no Lifinity.
        </p>
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

          {conversations.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
              Ainda nao tens conversas privadas.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {conversations.map((conversation) => {
                const isSelected =
                  Number(conversation.idconversation) ===
                  Number(selectedConversationId);

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
                    <p className="text-lg font-black text-white">
                      {conversation.other_username || 'Utilizador'}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
                      Nivel {conversation.other_level || 1}
                    </p>
                    <p className="text-sm text-slate-400 font-medium mt-4 line-clamp-2">
                      {conversation.last_message || 'Sem mensagens ainda.'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className={`${cardClass} rounded-[2rem] overflow-hidden min-h-[640px] flex flex-col`}>
          <div className="p-6 border-b border-white/10">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
              Conversa ativa
            </p>
            <h3 className="text-2xl font-black tracking-tight text-white">
              {selectedConversation?.other_username || 'Seleciona uma conversa'}
            </h3>
          </div>

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
                Ainda nao ha mensagens nesta conversa.
              </div>
            ) : (
              messages.map((message) => {
                const isMine = Number(message.idsender) === Number(currentUser?.iduser);

                return (
                  <div
                    key={message.idmessage}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-4 border ${
                        isMine
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-white/[0.06] text-slate-100 border-white/10'
                      }`}
                    >
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
              placeholder="Escreve uma mensagem..."
              disabled={!selectedConversationId}
              className="flex-1 bg-white/[0.06] border border-white/10 text-slate-100 placeholder:text-slate-500 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-emerald-300/40 focus:bg-white/[0.09] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!selectedConversationId || !messageText.trim()}
              className="px-6 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Chat;
