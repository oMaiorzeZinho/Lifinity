# `backend/package.json` — manifesto e dependências do backend

## Papel no projeto
É o **manifesto do projeto Node.js** do backend: dá-lhe nome, define como o arrancar (`scripts`) e — o mais importante — lista todas as **bibliotecas (dependências)** que o servidor precisa. É o ficheiro que o `npm install` lê para descarregar tudo o que falta.

## Bloco a bloco

```json
"main": "index.js",
"type": "commonjs",
```
- `main` — o ponto de entrada do backend é `index.js`.
- `type: "commonjs"` — diz ao Node que os ficheiros usam o sistema de módulos **CommonJS** (`require(...)` / `module.exports`), e não o ES Modules (`import`). Por isso é que todo o backend usa `const x = require('...')`.

```json
"scripts": {
  "dev": "nodemon index.js",
  "start": "node index.js"
}
```
- `npm run dev` — corre com **nodemon**, que reinicia o servidor automaticamente sempre que se grava um ficheiro (cómodo em desenvolvimento).
- `npm start` — corre com o `node` normal (modo produção/normal).

### Dependências (usadas em runtime)
| Pacote | Versão | Para que serve |
|---|---|---|
| `express` | ^5.2.1 | Framework web: define rotas, middlewares, trata pedidos HTTP. É o esqueleto da API. |
| `mysql2` | ^3.22.0 | Driver para falar com o MySQL. Suporta *prepared statements* e Promises (usado em `config/db.js`). |
| `jsonwebtoken` | ^9.0.3 | Gera e valida **JWT** (tokens de autenticação). Usado no login e no `authMiddleware`. |
| `bcryptjs` | ^3.0.3 | Faz **hashing** de passwords (e compara no login). Versão "js puro" do bcrypt, sem compilar nada. |
| `cors` | ^2.8.6 | Middleware que ativa **CORS** — deixa o frontend (porta 5173) chamar o backend (porta 3001) sem ser bloqueado pelo browser. |
| `dotenv` | ^17.4.1 | Lê variáveis de ambiente do ficheiro `.env` (credenciais MySQL, segredo JWT, porta). |
| `multer` | ^2.1.1 | Trata **uploads de ficheiros** (multipart/form-data) — usado para avatares e covers (`uploadMiddleware`). |
| `nodemailer` | ^8.0.11 | Envia **emails** (boas-vindas, formulário de contacto) — usado em `services/emailService.js`. |

### devDependencies (só em desenvolvimento)
| Pacote | Para que serve |
|---|---|
| `node-gyp` | ^12.2.0 — compila o **módulo C nativo** (`gamification.c`) ao correr `npm install`. Lê o `binding.gyp`. |
| `nodemon` | ^3.1.14 — reinício automático em desenvolvimento (usado no script `dev`). |

## Porquê estas escolhas
- **Express + mysql2 + JWT + bcrypt** é a "stack clássica" de uma API Node com MySQL e autenticação por token — robusta e bem documentada, adequada ao nível do projeto.
- **bcryptjs** (em vez do `bcrypt` nativo) evita ter de compilar código C só para o hashing — menos problemas de instalação no Windows. (Repara que o projeto **já** compila C para a gamificação, mas para passwords preferiu-se a versão pura.)
- A presença de `node-gyp` é o que torna possível o requisito do **módulo C via N-API**.

## Ligações
- `npm install` aqui instala estas dependências **e** dispara a compilação do C (por causa do `binding.gyp` + `node-gyp`).
- As versões com `^` (caret) permitem atualizações *minor/patch* compatíveis. As versões exatas instaladas ficam fixadas no `package-lock.json` (não documentado por ser gerado automaticamente).
