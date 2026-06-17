# `frontend/src/pages/Contact.jsx` — página "Contacte-nos" (pública e no dashboard)

## Papel no projeto
Formulário de contacto. **Existe em dois sítios** (mesmo componente, comportamentos ligeiramente diferentes): `/contact` (público, a partir do login) e `/dashboard/contact` (dentro do painel). Emparelha com o `contactController`. FASE E.

## Setup
```jsx
const cardClass = 'lifinity-card'; const inputClass = 'lifinity-input ...'; const labelClass = 'lifinity-muted-label ...';
const MESSAGE_MAX_LENGTH = 2000;
```
Constantes de classes (reutiliza o design system `lifinity-*`, ao contrário das páginas de auth).

## Estado e modo (público vs dashboard)
```jsx
const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' });
const [sending, setSending] = useState(false);
const [feedback, setFeedback] = useState(null);   // { type:'success'|'error', text }
const location = useLocation();
const isPublicPage = !location.pathname.startsWith('/dashboard');
```
- **`isPublicPage`** — deteta, pelo URL, se está fora do dashboard. Decide se a página desenha o seu **próprio fundo + botão "Voltar ao login"** (público) ou se aproveita o layout do dashboard (que já traz fundo/header).
- `form` é **um único objeto** (em vez de 4 estados).

## `handleChange` — setter genérico
```jsx
const handleChange = (field) => (e) => setForm((cur) => ({ ...cur, [field]: e.target.value }));
```
Função **curried** que devolve um handler para um campo específico. Uso: `onChange={handleChange('name')}`. Atualiza só esse campo, copiando o resto (`...cur`). Evita escrever 4 handlers iguais.

## `handleSubmit`
```jsx
const response = await axios.post(`${API_URL}/contact`, {
  name: form.name, email: form.email,
  ...(form.phone.trim() ? { phone: form.phone } : {}),   // telefone só se preenchido
  message: form.message
});
setFeedback({ type:'success', text: response.data?.message || '...' });
setForm({ name:'', email:'', phone:'', message:'' });     // limpa em sucesso
```
- `POST /contact` (rota **pública**, ver `contactController`). 
- **Spread condicional** do `phone` (só vai se tiver conteúdo) — espelha o `replyTo` opcional do backend.
- Em sucesso, mostra feedback verde e **limpa** o formulário; em erro, feedback vermelho. `sending` desativa o botão durante o envio.

## JSX
- Hero + formulário (nome, email, telefone opcional, mensagem). Validação **no cliente** com `required`/`minLength`/`maxLength` (complementa a do backend). **Contador de caracteres** da mensagem (`{form.message.length}/2000`). Feedback com `role="status"`/`aria-live` (acessibilidade).
- Renderização condicional no fim: `if (!isPublicPage) return content;` (dentro do dashboard, devolve só o conteúdo). Senão, embrulha em `lifinity-page` com botão "← Voltar ao login".

## Ligações
- **Backend:** `POST /api/contact` (público) → `contactController` → `emailService`.
- **Acedida por:** `Login.jsx` (link público) e o menu do `Dashboard.jsx`.
