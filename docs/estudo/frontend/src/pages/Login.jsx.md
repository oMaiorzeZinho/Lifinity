# `frontend/src/pages/Login.jsx` — página de login

## Papel no projeto
Página pública de **entrada na conta**. Envia email+password ao backend, guarda o token e redireciona para o dashboard.

## Lógica (o essencial)
```jsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [message, setMessage] = useState('');   // mensagem de erro
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    navigate('/dashboard/tasks');
  } catch (error) {
    setMessage(error.response?.data?.message || 'Erro ao iniciar sessão.');
  }
};
```
- **`e.preventDefault()`** — impede o recarregamento da página que um `<form>` faria por defeito.
- Chama `POST /auth/login` (ver `authController.login`).
- **É aqui que a sessão começa:** guarda o **`token`** e o **`user`** no `localStorage`. A partir daí, os outros componentes leem o token de lá para autenticar pedidos.
- Em sucesso, navega para `/dashboard/tasks`. Em erro, mostra a mensagem do backend (genérica, "Email ou password incorretos").

## JSX e estética
- Layout *split-screen*: à esquerda texto promocional (escondido em ecrãs pequenos, `hidden lg:block`), à direita o formulário.
- ⚠️ **Nota de estética:** estas páginas pré-dashboard usam **Tailwind "cru" + estilos inline** (cores `slate`/`emerald`, `rgba(...)`, imagens de fundo), **não** o design system `lifinity-*`/variáveis `--lifinity-*` do resto da app. São visualmente independentes (uma "montra" escura premium).
- Inputs controlados (`value` + `onChange`) com `required` e `autoComplete`. Links para registo e para `/contact`.

## Ligações
- **Backend:** `POST /api/auth/login`.
- **Guarda:** `token` e `user` no `localStorage` (base de toda a autenticação do frontend).
- **Navega para:** `/dashboard/tasks`. **Liga a:** `Register.jsx`, `Contact.jsx`.
