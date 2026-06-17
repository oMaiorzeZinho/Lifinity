# `backend/src/routes/authRoutes.js` — rotas de autenticação

## Papel no projeto
Define os endpoints de **registo e login**. Montado em `/api/auth` (ver `index.js`).

## O padrão das rotas (explicado aqui uma vez, vale para todas)
```js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
```
- **`express.Router()`** — cria um "mini-app" de rotas que depois é montado num prefixo no `index.js`. Mantém as rotas de cada tema separadas.
- **`router.MÉTODO(caminho, [middlewares...], handler)`** — associa um método HTTP + caminho a uma função do controlador. O caminho é **relativo ao prefixo**: aqui `/register` torna-se `POST /api/auth/register`.
- Quando há **middlewares** antes do handler (ex.: `verifyToken`), eles correm primeiro; só passam ao controlador se deixarem (`next()`). Estas duas rotas de auth **não** têm `verifyToken` — têm de ser públicas (ainda não há sessão antes de entrar).
- **`module.exports = router`** — exporta o router para o `index.js` o montar.

## Endpoints
| Método | Caminho | Auth | Função | Para quê |
|---|---|---|---|---|
| POST | `/api/auth/register` | pública | `authController.register` | Criar conta nova. |
| POST | `/api/auth/login` | pública | `authController.login` | Entrar e receber o token JWT. |

## Ligações
- **Controlador:** `authController.js` (faz hashing/validação e gera o JWT).
- **Frontend:** páginas `Login.jsx` e `Register.jsx`.
