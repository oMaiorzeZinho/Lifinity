# `backend/src/middlewares/authMiddleware.js` — proteção de rotas com JWT

## Papel no projeto
É o **guarda das rotas privadas**. Verifica se o pedido traz um **token JWT válido** no cabeçalho `Authorization`. Se trouxer, deixa passar e anexa os dados do utilizador ao pedido; se não, devolve erro e bloqueia o acesso. Usa-se em quase todas as rotas que precisam de "estar autenticado".

## Bloco a bloco

```js
const jwt = require('jsonwebtoken');
```
Importa a biblioteca de JWT (para validar o token).

```js
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
```
- `verifyToken` é um **middleware** Express: recebe `req` (pedido), `res` (resposta) e `next` (função que passa o controlo à próxima etapa).
- O cabeçalho `Authorization` vem no formato **`Bearer <token>`**. O `.split(' ')[1]` parte a string no espaço e fica com a 2ª parte (o token em si).
- O **`?.`** (optional chaining) evita um erro se o cabeçalho `authorization` não existir: nesse caso `token` fica `undefined` em vez de rebentar.

```js
    if (!token) {
        return res.status(403).json({ message: "Token não fornecido. Acesso negado." });
    }
```
Se não houver token, responde **403 (Forbidden)** e **para aqui** (`return`) — não chama `next()`, logo o pedido não chega ao controlador.

```js
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
```
- **`jwt.verify(token, segredo)`** — confirma que o token foi assinado com o `JWT_SECRET` (variável de ambiente) e que não expirou. Se algo estiver mal, lança exceção (cai no `catch`).
- Se for válido, devolve o *payload* (os dados que foram metidos no token ao fazer login, ex.: `iduser`, `username`). Guarda-os em **`req.user`** — assim, os controladores a seguir sabem **quem** está a fazer o pedido (`req.user.iduser`).
- **`next()`** — passa para o próximo middleware/controlador.
- Se o `verify` falhar, responde **401 (Unauthorized)**.

## Porquê assim
- **403 vs 401:** aqui usa-se 403 para "não enviaste token" e 401 para "token inválido/expirado". (Na prática muitos projetos usariam 401 nos dois casos; é uma distinção do autor.)
- **Stateless:** o JWT guarda a identidade dentro do próprio token (assinado), por isso o servidor **não precisa de guardar sessões** — basta validar a assinatura. É simples e escala bem.
- **`req.user`** é a "cola" entre este middleware e todos os controladores: é graças a ele que o resto do backend sabe o id do utilizador autenticado sem voltar a ler a BD.

## Ligações
- **Exporta:** a função `verifyToken` (export direto, `module.exports = verifyToken`).
- **Usado por:** quase todos os ficheiros `backend/src/routes/*.js`, normalmente como `router.get('/...', verifyToken, controller.fn)`.
- **Token criado em:** `authController.js` (no login, com `jwt.sign(...)` e o mesmo `JWT_SECRET`).
- **Depende de:** `process.env.JWT_SECRET` (no `.env`).
