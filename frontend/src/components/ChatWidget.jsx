import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ChatWidget = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUnreadCount(Number(response.data?.count || 0));
    } catch (err) {
      console.error('Erro ao carregar mensagens nao lidas:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Polling a cada 30s + atualizacao imediata quando uma conversa e lida
    const interval = setInterval(fetchUnreadCount, 30000);
    window.addEventListener('lifinity-chat-read', fetchUnreadCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('lifinity-chat-read', fetchUnreadCount);
    };
  }, [fetchUnreadCount]);

  return (
    <button
      onClick={() => navigate('/dashboard/chat')}
      className="lifinity-button-secondary relative rounded-2xl px-5 py-4 shadow-(--lifinity-shadow)"
      title="Abrir chat"
      aria-label="Abrir chat"
    >
      <p className="lifinity-muted-label">
        Abrir Chat
      </p>

      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-(--lifinity-danger) text-(--lifinity-on-primary) text-[10px] font-black flex items-center justify-center border border-(--lifinity-border)">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatWidget;
