# `backend/src/controllers/friendController.js` — amizades

## Papel no projeto
Gere o sistema social de **amigos**: pesquisar, enviar/aceitar/recusar pedidos, listar amigos e remover. Montado em `/api/friends`. Usa `createNotifications` (avisos) e `safeUnlockAchievementsForUser` (badges de amizade).

## `searchUsers`
```js
if (query.trim().length < 2) return res.json([]);   // exige >= 2 caracteres
SELECT iduser, username, level, xp FROM USER WHERE username LIKE ? AND iduser != ? LIMIT 10
```
Procura por nome (mín. 2 caracteres para não devolver "tudo"), exclui o próprio, máx. 10.

## `sendFriendRequest`
```js
if (!iduser_receiver || receiver === requester) return 400;
// verifica relação existente em QUALQUER direção:
SELECT * FROM FRIENDSHIP WHERE (requester,receiver) OR (receiver,requester)
if (existing) return 400 'Já existe uma relação ou pedido';
INSERT INTO FRIENDSHIP (..., status) VALUES (?, ?, 'pendente')
// notifica o receiver
```
- Impede pedir a si próprio e **duplicar** relações (verifica os dois sentidos requester↔receiver).
- Cria o pedido `pendente` e **notifica** o destinatário (com `entity_type: 'friendship'`, link para a comunidade).

## `getFriendRequests`
Lista os pedidos **pendentes recebidos** (`f.iduser_receiver = ? AND status='pendente'`), juntando os dados de quem pediu (`iduser_requester`), mais recentes primeiro.

## `acceptFriendRequest`
```js
// confirma que o pedido é para mim e está pendente
UPDATE FRIENDSHIP SET status='aceite' WHERE idfriendship=? AND iduser_receiver=?
// notifica quem fez o pedido
await safeUnlockAchievementsForUser(iduser);                       // badges para mim
await safeUnlockAchievementsForUser(requests[0].iduser_requester); // ...e para o amigo
```
- Marca `aceite`. Notifica o autor do pedido.
- **Desbloqueia conquistas para AMBOS** (os dois ganharam +1 amigo → ambos podem atingir `friends_1`/`friends_5`). Detalhe cuidado.

## `declineFriendRequest`
`DELETE FROM FRIENDSHIP WHERE idfriendship=? AND iduser_receiver=? AND status='pendente'`. Recusar = **apagar** o pedido (só o destinatário, só se pendente). 404 se nada foi apagado.

## `getFriends`
```js
INNER JOIN USER u ON u.iduser = CASE WHEN f.iduser_requester = ? THEN f.iduser_receiver ELSE f.iduser_requester END
WHERE (f.iduser_requester = ? OR f.iduser_receiver = ?) AND f.status='aceite'
```
Lista os amigos aceites. O `CASE` resolve "o outro lado" da amizade (independente de quem pediu) — padrão recorrente neste projeto.

## `removeFriend`
`DELETE FROM FRIENDSHIP WHERE status='aceite' AND (par nos dois sentidos)`. Remove a amizade aceite (qualquer direção). 404 se não existir.

## ⚠️ Nota de codificação
Algumas mensagens de erro têm **caracteres mal codificados** (ex.: `"Pedido pendente nÃ£o encontrado"`, `"Amigo invÃ¡lido"`, `"Amizade nÃ£o encontrada"`). São artefactos de *double-encoding* de UTF-8 no ficheiro-fonte. Não afeta a lógica, mas seria de corrigir para o utilizador final. (Outras mensagens no mesmo ficheiro estão corretas, logo é inconsistência pontual.)

## Ligações
- **Tabela:** `FRIENDSHIP` (+ `USER`).
- **Reutiliza:** `createNotifications`, `safeUnlockAchievementsForUser`.
- **Rotas:** `friendRoutes.js`. **Frontend:** `Community.jsx`. **Android:** `CommunityActivity`.
