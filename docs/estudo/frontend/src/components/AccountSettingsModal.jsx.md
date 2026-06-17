# `frontend/src/components/AccountSettingsModal.jsx` — configurações da conta

## Papel no projeto
Modal com as **configurações da conta**: alternar tema (claro/escuro), mudar **username**, mudar **password** e **apagar conta**. Movido para o perfil na FASE B (commit `9b8b08be`).

## Props e helpers
```jsx
const AccountSettingsModal = ({ user, setUser, theme, setTheme, onClose }) => { ... }
const getErrorMessage = (err, fallback) => err?.response?.data?.message || err?.response?.data?.error || fallback;
const getAuthHeaders = () => { const token = localStorage.getItem('token'); return token ? { Authorization: `Bearer ${token}` } : null; };
```
- Recebe `user`/`setUser` e `theme`/`setTheme` do componente-pai (**lifting state up** — o tema é gerido acima, no dashboard, para afetar a app toda).
- `getErrorMessage` — extrai a melhor mensagem de erro disponível. `getAuthHeaders` — devolve o header de auth ou `null` (se não houver token → redireciona para login).

## Estado
Três formulários, cada um com os seus campos + mensagens de sucesso/erro + flag "a guardar": **username**, **password** (atual/nova/confirmar) e **apagar conta** (username + password de confirmação).

## `toggleTheme`
```jsx
const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
```
Alterna o tema (o pai persiste/aplica).

## `handleUpdateUsername`
- Valida não-vazio e 3–30 caracteres (igual ao backend).
- **`window.confirm(...)`** pede confirmação antes de mudar.
- `PUT /users/me/username`. Com sucesso: grava o user atualizado no `localStorage`, chama `setUser`, dispara **`lifinity-user-updated`** e mostra mensagem.

## `handleUpdatePassword`
- Valida campos preenchidos, nova com ≥6 caracteres e **nova == confirmar** (validação só no cliente, complementar à do backend).
- `PUT /users/me/password` com `{ currentPassword, newPassword }`. Limpa os campos em sucesso.

## `handleDeleteAccount`
```jsx
if (!window.confirm('Esta acao apaga definitivamente a tua conta...')) return;
await axios.delete(`${API_URL}/users/me`, { headers, data: { username, password } });
localStorage.clear(); navigate('/login');
```
- Exige **username + password** (dupla confirmação, coincide com `userController.deleteAccount`) e um `window.confirm`.
- ⚠️ Detalhe técnico: num **DELETE** com corpo, o axios precisa do campo **`data`** (ao contrário de POST/PUT, onde o corpo é o 2.º argumento).
- Em sucesso, **`localStorage.clear()`** (apaga token e user) e volta ao login.

## JSX (resumo)
Overlay + cartão com scroll. Secção de **aparência** (botão de tema), e três `<form>` (username, password em grelha de 3, apagar conta com `lifinity-danger-surface`). Cada um mostra erros (vermelho) ou sucesso (verde) e desativa o botão enquanto guarda. Tem rótulos `sr-only` (acessibilidade) e `autoComplete` apropriado.

## Ligações
- **Backend:** `PUT /users/me/username`, `PUT /users/me/password`, `DELETE /users/me`.
- **Evento:** dispara `lifinity-user-updated`.
- **Usado em:** `Profile.jsx` (recebe `theme`/`setTheme` que sobem até ao `Dashboard.jsx`).
