# `backend/index.js` — ponto de entrada do servidor (orquestrador)

## Papel no projeto
É o **arranque do backend**: cria a aplicação Express, ativa os middlewares globais (CORS, JSON, ficheiros estáticos), **monta todas as rotas** sob `/api/...` e põe o servidor à escuta. É o ficheiro que se corre com `node index.js`.

## Bloco a bloco

```js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
```
- Importa o Express (motor do servidor), o `cors` (permissões entre origens), o `path` (caminhos de ficheiros) e carrega o `.env`.
- ⚠️ **Importante (resolve a dúvida do `db.js`):** `require('dotenv').config()` está aqui **sem `path`**, logo lê `backend/.env` (relativo à pasta onde se corre o `node`). E corre **na linha 4**, *antes* de importar as rotas (linhas 6-17). Como as rotas importam os controladores, que importam o `db.js`, quando a pool MySQL é criada o `process.env` **já está preenchido por este `config()`**. Conclusão: as variáveis de ambiente vêm **daqui**; o `dotenv` "com caminho errado" dentro do `db.js` é redundante e inofensivo.

```js
const authRoutes = require('./src/routes/authRoutes');
... (12 imports de rotas) ...
const contactRoutes = require('./src/routes/contactRoutes');
```
Importa os 12 módulos de rotas (cada um agrupa endpoints de um tema).

```js
const app = express();
const PORT = process.env.PORT || 3000;
```
Cria a app e define a porta a partir do `.env` (`PORT`), com **3000** por defeito.
- ⚠️ Nota: o `CLAUDE.md` fala em `3001`; o valor real depende do `.env`. O *fallback* no código é 3000. (Não confundir.)

```js
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://wrinkle-basically-payphone.ngrok-free.dev'
    ],
    credentials: true
}));
```
**CORS** — autoriza pedidos vindos do frontend. Lista de origens permitidas: o Vite local (`localhost:5173`) e um túnel **ngrok** (usado para expor o backend à internet/telemóvel em testes). `credentials: true` permite enviar cookies/credenciais. Sem isto, o browser bloquearia os pedidos do frontend (política same-origin).

```js
app.use(express.json());
```
Faz o Express **interpretar corpos JSON** automaticamente (preenche `req.body`). Essencial para receber dados dos formulários/POSTs.

```js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```
Serve a pasta `backend/uploads/` como **ficheiros estáticos** em `/uploads`. É assim que os avatares e covers carregados ficam acessíveis por URL (ex.: `http://host/uploads/avatars/avatar_3_....png`). Liga-se ao `uploadMiddleware`.

```js
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/inspiration', inspirationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
```
**Monta cada grupo de rotas** sob um prefixo. Ex.: tudo o que está em `taskRoutes` fica acessível sob `/api/tasks/...`. Esta é a tabela-mestra que mapeia prefixos → módulos.
- Repara que `/api/contact` é a única **pública** (sem autenticação) — ver `contactRoutes`.

```js
app.listen(PORT, () => {
    console.log(`🚀 Servidor do Lifinity a correr em http://localhost:${PORT}`);
});
```
Põe o servidor à escuta na porta e confirma no terminal.

## Porquê esta arquitetura
- **Separação por temas (routes/controllers):** em vez de ter tudo num ficheiro gigante, cada funcionalidade tem o seu módulo de rotas + controlador. Facilita manutenção e leitura — padrão típico de uma API Express bem organizada.
- **Prefixos `/api/...`:** convenção que separa claramente a API de eventuais recursos estáticos e evita conflitos.

## Ligações
- **Importa:** todos os `src/routes/*.js`.
- **Middlewares globais:** `cors`, `express.json`, `express.static` (uploads).
- **Depende de:** `.env` (PORT, e indiretamente DB/JWT/SMTP via os módulos importados).
- **Frontend correspondente:** os pedidos Axios do `frontend/` batem nestes endpoints `/api/...`.
