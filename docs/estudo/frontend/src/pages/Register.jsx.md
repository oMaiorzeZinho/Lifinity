# `frontend/src/pages/Register.jsx` — página de registo

## Papel no projeto
Página pública de **criação de conta**. Muito parecida com o `Login.jsx`, mas com um campo extra (username) e fluxo diferente no fim.

## Lógica (o essencial)
```jsx
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [message, setMessage] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post(`${API_URL}/auth/register`, { username, email, password });
    setMessage('Conta criada com sucesso. A redirecionar para o login...');
    setTimeout(() => navigate('/login'), 1800);
  } catch (error) {
    setMessage(error.response?.data?.message || 'Erro ao criar conta.');
  }
};
```
- Chama `POST /auth/register` (ver `authController.register`).
- **Não faz login automático:** em sucesso, mostra mensagem e, após **1,8 s** (`setTimeout`), redireciona para `/login` (o utilizador entra a seguir com as credenciais). Decisão de fluxo simples.
- O backend é que envia o email de boas-vindas (não há nada disso aqui).

## Detalhe — mensagem com cor condicional
```jsx
className={`... ${message.includes('sucesso') ? 'verde' : 'vermelho'}`}
```
A caixa de mensagem fica **verde** se o texto contém "sucesso", senão **vermelha**. (Truque simples: decide a cor pela presença da palavra — funciona, mas é frágil; um estado `type` seria mais robusto, como faz o `Contact.jsx`.)

## JSX e estética
- Mesmo estilo *split-screen* escuro do `Login.jsx` (Tailwind cru + inline, fora do design system `lifinity-*`). Lado esquerdo lista funcionalidades; lado direito o formulário (username, email, password), todos `required`.

## Ligações
- **Backend:** `POST /api/auth/register`.
- **Navega para:** `/login` após sucesso. **Liga a:** `Login.jsx`.
