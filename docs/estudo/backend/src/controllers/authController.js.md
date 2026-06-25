# `backend/src/controllers/authController.js` — registo e login

> ⚠️ **Atualização 2026-06-25:** juntaram-se 3 funções de **recuperação de palavra-passe** (`forgotPassword`, `verifyResetCode`, `resetPassword` — código de 6 dígitos, 10 min, uso único, hash bcryptjs). Ver [Recuperação de palavra-passe](../../../RECUPERACAO_PALAVRA_PASSE_2026-06-25.md).

## Papel no projeto
Implementa a **autenticação**: criar conta (`register`) e entrar (`login`, devolvendo o token JWT). É chamado pelas rotas públicas de `authRoutes.js`.

## Imports
```js
const bcrypt = require('bcryptjs');   // hashing de passwords
const jwt = require('jsonwebtoken');  // criação do token
const db = require('../config/db');   // ligação MySQL
const { sendEmail } = require('../services/emailService'); // email de boas-vindas
```

## `register` — criar conta
```js
const { username, email, password } = req.body;
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
const [result] = await db.execute(
    'INSERT INTO USER (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
);
```
- Lê os dados do corpo do pedido.
- **`bcrypt.genSalt(10)`** — gera um "sal" (dado aleatório) com fator de custo 10. **`bcrypt.hash`** combina password + sal num hash. Guarda-se **o hash**, nunca a password — se a BD vazar, as passwords não ficam expostas. O sal evita que duas pessoas com a mesma password tenham o mesmo hash.
- `db.execute(..., [valores])` — **prepared statement**: os `?` são preenchidos em segurança pelo driver → imune a **SQL injection**.

```js
sendEmail({ to: email, subject: 'Bem-vindo ao Lifinity! 🌱', html: `...` })
    .catch((err) => { console.error('Erro ao enviar email de boas-vindas:', err.message); });

res.status(201).json({ message: 'Utilizador registado com sucesso!', userId: result.insertId });
```
- **Email de boas-vindas "fire-and-forget":** repara que **não há `await`** antes do `sendEmail` — o registo **não espera** pelo email. Se o envio falhar, só fica um log; o registo conclui à mesma. Decisão deliberada (comentada no código): a conta criar-se com sucesso não deve depender do email.
- Responde **201 (Created)** com o `insertId` (o `iduser` gerado).

```js
} catch (error) {
    res.status(500).json({ message: 'Erro ao registar utilizador. O email ou username podem já existir.' });
}
```
- Em erro, devolve 500. A mensagem sugere a causa mais provável: violação do `UNIQUE` em `username`/`email` (a BD rejeita duplicados). 
- ⚠️ **Nota de estudo:** não há validação explícita de formato/força aqui (ex.: tamanho mínimo da password) — confia-se nas restrições da BD e na validação do frontend. Ponto a melhorar se quiseres robustez extra.

## `login` — entrar
```js
const [users] = await db.execute('SELECT * FROM USER WHERE email = ?', [email]);
if (users.length === 0) return res.status(401).json({ message: 'Email ou password incorretos.' });
const user = users[0];
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(401).json({ message: 'Email ou password incorretos. ' });
```
- Procura o utilizador por email. **`bcrypt.compare`** volta a aplicar o hash à password escrita e compara com o hash guardado (sem nunca desencriptar — bcrypt é de sentido único).
- **Boa prática de segurança:** quando o email não existe **ou** a password está errada, devolve **a mesma mensagem genérica** ("Email ou password incorretos"). Assim **não revela** se um email está registado (evita *user enumeration*).

```js
const token = jwt.sign(
    { iduser: user.iduser },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
);
```
- Cria o **JWT** assinado com `JWT_SECRET`. O *payload* leva apenas o **`iduser`** — exatamente o que o `authMiddleware` lê depois (`req.user.iduser`). Expira em **1 dia** (`expiresIn: '1d'`) por segurança.

```js
res.json({ message: 'Login efetuado com sucesso!', token, user: { iduser, username, email, xp, level, avatar, cover_image } });
```
Devolve o token + dados básicos do utilizador (para o frontend popular logo a UI sem outro pedido). **Não** devolve a password (claro).

## Porquê estas escolhas
- **bcrypt + sal + prepared statements + mensagem genérica de login + expiração do token** são exatamente as boas práticas que "impressionam o júri" e que o `CLAUDE.md` pede.
- Payload mínimo no JWT (só `iduser`): menos dados expostos no token; tudo o resto é lido da BD quando preciso.

## Ligações
- **Rotas:** `authRoutes.js`.
- **Middleware que valida o token gerado aqui:** `authMiddleware.js` (mesmo `JWT_SECRET`).
- **Email:** `services/emailService.js`.
- **Frontend:** `Login.jsx`, `Register.jsx` (guardam o token e os dados do user).
