# `backend/src/controllers/contactController.js` — formulário público "Contacte-nos"

## Papel no projeto
Trata o envio do formulário de contacto. É **público** (sem login), por isso reúne várias defesas: validação de campos, **escape de HTML**, e **anti-spam por IP**. Envia a mensagem por email para o endereço de suporte. FASE E.

## Setup no topo do ficheiro
```js
const { sendEmail } = require('../services/emailService');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const lastSubmissionByIp = new Map();
const SUBMISSION_COOLDOWN_MS = 60 * 1000;
```
- `EMAIL_REGEX` — validação simples de email (algo@algo.algo, sem espaços).
- **`lastSubmissionByIp`** — um `Map` em **memória** que guarda o instante do último envio de cada IP. `SUBMISSION_COOLDOWN_MS` = 60 s.
  - ⚠️ **Nota:** sendo em memória, **reinicia quando o servidor reinicia** e é por processo. É um anti-spam "leve", suficiente para o projeto, não uma solução distribuída.

```js
const escapeHtml = (text) =>
    String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
```
- **`escapeHtml`** — substitui caracteres perigosos (`& < > "`) pelas suas entidades HTML. **Porquê:** o conteúdo vem de **utilizadores anónimos** e vai para um email em HTML; sem escapar, alguém podia injetar HTML/scripts no email. É a mesma ideia de defesa contra **XSS/injeção de HTML**.

## `sendContactMessage`
```js
const name = String(req.body.name || '').trim();
const email = String(req.body.email || '').trim();
const phone = String(req.body.phone || '').trim();
const message = String(req.body.message || '').trim();
```
Lê e **limpa** (trim) os campos, tratando ausências como string vazia.

```js
if (name.length < 2 || name.length > 100) return res.status(400)...;
if (!EMAIL_REGEX.test(email)) return res.status(400)...;
if (phone && (phone.length < 9 || phone.length > 20)) return res.status(400)...;
if (message.length < 10 || message.length > 2000) return res.status(400)...;
```
**Validações** com mensagens claras (400 Bad Request): nome 2–100, email válido, telefone **opcional** mas (se vier) 9–20, mensagem 10–2000. Limitar tamanhos também é defesa anti-abuso.

```js
const ip = req.ip || req.socket?.remoteAddress || 'desconhecido';
const lastSubmission = lastSubmissionByIp.get(ip);
if (lastSubmission && Date.now() - lastSubmission < SUBMISSION_COOLDOWN_MS) {
    return res.status(429).json({ message: 'Aguarda um momento antes de enviar outra mensagem.' });
}
```
**Anti-spam:** se o mesmo IP já enviou há menos de 60 s, responde **429 (Too Many Requests)**.

```js
const html = `... ${escapeHtml(name)} ... ${phone ? `<p>...${escapeHtml(phone)}</p>` : ''} ... <p style="white-space: pre-wrap;">${escapeHtml(message)}</p> ...`;
await sendEmail({ to: process.env.CONTACT_EMAIL, subject: `[Lifinity] Nova mensagem de contacto de ${name}`, replyTo: email, html });
lastSubmissionByIp.set(ip, Date.now());
res.json({ message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.' });
```
- Monta o email em HTML com **todos os campos escapados**. O telefone só aparece se existir (`phone ? ... : ''`). O `white-space: pre-wrap` preserva as quebras de linha da mensagem.
- Envia para `CONTACT_EMAIL` (do `.env`), com **`replyTo: email`** — assim, responder ao email vai diretamente para quem preencheu o formulário (graças ao spread condicional de `replyTo` no `emailService`).
- **Só regista o cooldown depois do envio ter sucesso** (`lastSubmissionByIp.set(...)` no fim) — se o envio falhar, o utilizador pode tentar logo de novo.
- Em erro inesperado → 500.

## Porquê tanto cuidado aqui
Por ser a **única rota pública**, é a mais exposta a abusos. Validação + escape + rate-limit são a tríade de defesa correta. Demonstra preocupação com segurança mesmo num projeto escolar.

## Ligações
- **Rota:** `contactRoutes.js` (`POST /api/contact`, pública).
- **Serviço:** `services/emailService.js`.
- **Depende de:** `process.env.CONTACT_EMAIL`.
- **Frontend:** `Contact.jsx`.
