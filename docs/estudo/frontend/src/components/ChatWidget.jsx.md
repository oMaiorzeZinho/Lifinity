# `frontend/src/components/ChatWidget.jsx` — botão de chat com badge de não lidas

## Papel no projeto
Botão flutuante (no header do dashboard) que abre o chat e mostra um **badge com o número de mensagens não lidas**, atualizado periodicamente. Introduzido na FASE A1 (commit `ac618776`).

## Padrões comuns do frontend (explicados aqui, valem para quase todos os componentes/páginas)
- **`const API_URL = import.meta.env.VITE_API_URL;`** — todo o ficheiro que fala com o backend lê este URL base.
- **Token:** vem de `localStorage.getItem('token')` e envia-se no header `Authorization: Bearer <token>` (validado pelo `authMiddleware` do backend).
- **Classes `lifinity-*` e `(--lifinity-*)`:** são o **tema clay/escuro**. As `lifinity-button-secondary`, `lifinity-card`, etc., e as variáveis CSS `var(--lifinity-...)` (escritas em Tailwind v4 como `bg-(--lifinity-danger)`) estão definidas em `src/index.css`.
- **Eventos `window` personalizados:** o projeto **não usa Redux nem Context global**; em vez disso, componentes comunicam disparando/ouvindo eventos no `window` (ex.: `lifinity-chat-read`, `lifinity-user-updated`). É uma forma leve de sincronizar partes distantes da UI.

## Bloco a bloco
```jsx
const [unreadCount, setUnreadCount] = useState(0);
const navigate = useNavigate();
```
Estado com o nº de não lidas; `navigate` para mudar de página.

```jsx
useEffect(() => {
  let cancelled = false;
  const fetchUnreadCount = async () => {
    const token = localStorage.getItem('token'); if (!token) return;
    const response = await axios.get(`${API_URL}/chat/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
    if (!cancelled) setUnreadCount(Number(response.data?.count || 0));
  };
  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 30000);                 // polling 30s
  window.addEventListener('lifinity-chat-read', fetchUnreadCount);       // atualização imediata ao ler
  return () => { cancelled = true; clearInterval(interval); window.removeEventListener('lifinity-chat-read', fetchUnreadCount); };
}, []);
```
- Vai buscar o contador a `GET /chat/unread-count` (ver `chatController.getUnreadCount`).
- **`cancelled`** — *flag* para **não** atualizar o estado se o componente já tiver sido desmontado (evita o aviso "set state on unmounted component"). É um padrão importante com chamadas assíncronas.
- **Polling de 30s** (`setInterval`) mantém o badge razoavelmente atualizado.
- **`lifinity-chat-read`** — quando o utilizador lê uma conversa (na página de chat), essa página dispara este evento e o widget **atualiza imediatamente** (em vez de esperar 30s).
- O **`return` do `useEffect`** faz a limpeza (cancela timer e remove o listener) quando o componente sai — essencial para não acumular timers/listeners.

```jsx
<button onClick={() => navigate('/dashboard/chat')} ...>
  <p ...>Abrir Chat</p>
  {unreadCount > 0 && (<span ...>{unreadCount > 9 ? '9+' : unreadCount}</span>)}
</button>
```
Botão que navega para o chat. O badge só aparece se `unreadCount > 0`, mostrando "9+" acima de 9.

## Ligações
- **Backend:** `GET /api/chat/unread-count`.
- **Evento:** ouve `lifinity-chat-read` (disparado por `Chat.jsx` ao ler).
- **Usado em:** header do `Dashboard.jsx`.
