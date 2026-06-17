# `frontend/src/pages/Dashboard.jsx` — layout do painel (shell partilhado)

## Papel no projeto
É o **molde** de todas as páginas internas (`/dashboard/*`): header com navegação, gestão do **tema**, **notificações** (sino + dropdown), **guarda de autenticação**, e o `<Outlet/>` onde as sub-páginas aparecem. Exportado como `DashboardLayout` (usado no `App.jsx`).

## Estado (inicialização "preguiçosa" a partir do localStorage)
```jsx
const [user, setUser] = useState(() => { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; });
const [theme, setTheme] = useState(() => localStorage.getItem('lifinity-theme') === 'light' ? 'light' : 'dark');
const [notifications, setNotifications] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);
const [notificationsOpen, setNotificationsOpen] = useState(false); // + loading/error
```
- **`useState(() => ...)`** com função — *lazy initializer*: lê o `localStorage` **uma só vez** na montagem (em vez de a cada render). `user` e `theme` vêm de lá.

## Notificações (lógica)
- `getAuthHeaders` / `fetchUnreadCount` / `fetchNotifications` — embrulhados em **`useCallback`** (memorizados) para poderem ser dependências estáveis de `useEffect` sem causar repetições.
- `toggleNotifications` — abre/fecha o dropdown; ao abrir, recarrega notificações e contador.
- `markNotificationAsRead(n)` — `PUT /notifications/:id/read`; **atualiza o estado localmente** (marca essa como lida) e refaz a contagem. *Optimistic-ish*: reflete já na UI.
- `handleNotificationClick(n)` — marca como lida, fecha o dropdown e, se a notificação tiver **`link`**, **navega** para lá (`navigate(notification.link)`) — é o **deep-linking** que vem do backend (`entity_type`/`link`).
- `markAllNotificationsAsRead` — `PUT /notifications/read-all`; marca todas localmente e zera o contador.

## Efeitos (`useEffect`)
```jsx
useEffect(() => { localStorage.setItem('lifinity-theme', theme); }, [theme]);           // persiste o tema
useEffect(() => { /* ouve 'lifinity-theme-updated' → setTheme(e.detail) */ }, []);      // sincroniza tema do perfil
useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);                            // contador ao montar
useEffect(() => {                                                                        // ⟵ GUARDA DE AUTENTICAÇÃO
  const savedUser = localStorage.getItem('user'); const token = localStorage.getItem('token');
  if (!savedUser || !token) { navigate('/login'); return; }
  // ouve 'lifinity-user-updated' → recarrega o user do localStorage
}, [navigate]);
```
- ✅ **Resolve a dúvida do `App.jsx`:** **a proteção de rotas está AQUI.** Se não houver `user`/`token` no `localStorage`, redireciona para `/login`. Como todas as páginas internas vivem dentro deste layout, todas ficam protegidas.
- **Tema:** persiste em `localStorage` e **sincroniza** entre componentes via o evento `lifinity-theme-updated` (disparado quando se muda o tema no perfil) — coerente com o padrão "sem store global".
- **`lifinity-user-updated`:** quando o avatar/username/bio mudam (noutro componente), o header atualiza-se.

```jsx
if (!user) return (<div ...>A carregar...</div>);
```
Enquanto o `user` não está pronto (ou antes do redirect), mostra um *loader*.

## Tema e fundos por página
```jsx
const isTasksPage = location.pathname === '/dashboard/tasks'; // ... um booleano por página
const pageBackground = isTasksPage ? 'radial-gradient(... verde ...)' : isRankingPage ? '... dourado ...' : ...;
<div className="lifinity-page ..." data-theme={theme}> ... </div>
```
- Cada página tem um **gradiente de destaque** diferente (verde para tarefas, dourado para ranking, etc.) — detalhe estético calculado pelo `location.pathname`.
- **`data-theme={theme}`** no contentor raiz é o que **ativa o tema** (o `index.css` define as variáveis `--lifinity-*` consoante `[data-theme="light"|"dark"]`). [Confirmar em `index.css`.]

## Header (JSX)
- Logo (link para tarefas), **navegação** (Atividades, Ranking, Estatísticas, Inspiração, Comunidade) com `navLinkClass(isActive)` a realçar a ativa.
- **Contacto** fora da "pílula" de navegação (comentário explica: lá dentro causava *scroll* horizontal).
- Bloco do utilizador (username, "Nível X", avatar com inicial como *fallback*) — link para o perfil.
- **Sino de notificações** com badge (igual padrão do `ChatWidget`) e **dropdown** que lista as notificações (tipo, mensagem, data em pt-PT; não-lidas com bola colorida; clicar marca lida + navega).
- **Logout:** `localStorage.clear()` + `navigate('/login')`.

## `<main>` e widgets
```jsx
<main ...><Outlet /></main>
<div className="fixed bottom-6 right-6 ...">
  {!isChatPage && <ChatWidget />}
  {!isInspirationPage && <DailyVerseWidget />}
</div>
```
- **`<Outlet/>`** — o "buraco" onde o react-router injeta a sub-página atual (Tasks, Ranking, ...). É a peça central do layout aninhado definido no `App.jsx`.
- **Widgets flutuantes:** `ChatWidget` e `DailyVerseWidget` no canto inferior direito — escondidos na respetiva página (não mostrar o widget de chat **na** página de chat, etc.).

## Ligações
- **Backend:** `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`.
- **Componentes:** `ChatWidget`, `DailyVerseWidget`, `getImageUrl`.
- **Eventos:** ouve `lifinity-theme-updated` e `lifinity-user-updated`.
- **Renderiza (via Outlet):** todas as páginas `/dashboard/*`.
- **Tema:** passa `theme`/`setTheme` para baixo (ex.: até ao `Profile.jsx` → `AccountSettingsModal`).
