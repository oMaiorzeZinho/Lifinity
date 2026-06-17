# `backend/src/controllers/notificationController.js` — notificações internas

## Papel no projeto
Gere as **notificações do sino**: cria-as (função interna reutilizável) e expõe endpoints para listar, contar não lidas e marcar como lidas. A função `createNotifications` é **importada por muitos outros módulos** (achievements, amigos, grupos...) para avisar utilizadores.

## `normalizeRecipients(recipients, excludeUserId)` — limpar a lista de destinatários
```js
const exclude = Number(excludeUserId);
return [...new Set(
    recipients.map(r => Number(r))
              .filter(r => Number.isInteger(r) && r > 0 && r !== exclude)
)];
```
- Converte cada destinatário para número, **filtra** os inválidos (não-inteiros, ≤0) e o `excludeUserId` (para **não notificar o próprio autor** da ação).
- **`[...new Set(...)]`** — remove duplicados (cada pessoa recebe uma notificação só).
- **Porquê:** centraliza a "higiene" da lista; quem chama não tem de se preocupar com duplicados nem com notificar a si mesmo.

## `createNotifications({ recipients, type, message, entity_type, entity_id, link, excludeUserId, executor })`
```js
const notificationRecipients = normalizeRecipients(recipients, excludeUserId);
if (notificationRecipients.length === 0) return 0;

const placeholders = notificationRecipients.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
const values = notificationRecipients.flatMap(iduser => [iduser, type, message, entity_type, entity_id, link]);
await executor.query(`INSERT INTO NOTIFICATION (iduser, type, message, entity_type, entity_id, link) VALUES ${placeholders}`, values);
return notificationRecipients.length;
```
- **INSERT em massa**: cria uma linha por destinatário, com o mesmo `message`/`type`/entidade. Constrói placeholders e achata valores com `flatMap` (mesmo padrão visto em `achievements.js`).
- `entity_type`/`entity_id`/`link` alimentam o **deep-linking** (clicar leva à entidade certa).
- **`executor = db`** — por defeito usa a pool, mas aceita um `executor` (ex.: ligação de transação) para criar notificações **dentro** de uma transação maior.
- **`exports.createNotifications = createNotifications;`** — exportada para uso interno por outros controladores/utils (não é uma rota).

## Endpoints (handlers de rota)

### `getNotifications`
```js
SELECT idnotification, ..., created_at FROM NOTIFICATION
WHERE iduser = ? ORDER BY created_at DESC, idnotification DESC LIMIT 20
```
Devolve as **20 mais recentes** do utilizador autenticado (`req.user.iduser`). O `ORDER BY created_at DESC, idnotification DESC` garante ordem estável mesmo com timestamps iguais (desempata pelo id).

### `getUnreadCount`
```js
SELECT COUNT(*) AS unreadCount FROM NOTIFICATION WHERE iduser = ? AND is_read = FALSE
res.json({ unreadCount: Number(rows[0]?.unreadCount || 0) });
```
Conta as não lidas — alimenta o **badge** do sino. O `?.` + `|| 0` protege contra resultado vazio.

### `markNotificationAsRead`
```js
const idnotification = Number(req.params.idnotification);
if (!idnotification) return res.status(400)...
UPDATE NOTIFICATION SET is_read = TRUE WHERE idnotification = ? AND iduser = ?
if (result.affectedRows === 0) return res.status(404)...
```
- **Segurança/ownership:** o `WHERE ... AND iduser = ?` garante que só se marca como lida uma notificação **própria** — não dá para mexer nas de outros.
- Se nada foi afetado (`affectedRows === 0`), responde **404** (não existe ou não é tua).

### `markAllNotificationsAsRead`
```js
UPDATE NOTIFICATION SET is_read = TRUE WHERE iduser = ? AND is_read = FALSE
res.json({ ..., updated: result.affectedRows });
```
Marca **todas** as não lidas do utilizador como lidas e devolve quantas foram atualizadas.

## Padrão comum (vale para quase todos os controladores)
1. `const iduser = req.user.iduser;` (vem do `authMiddleware`).
2. Query com `?` (prepared statement) **sempre filtrada por `iduser`** (isolamento entre utilizadores).
3. `try/catch` com `console.error` + resposta 500 amigável.

## Ligações
- **Tabela:** `NOTIFICATION`.
- **`createNotifications` é usada por:** `utils/achievements.js`, `friendController.js`, `groupController.js`, `taskController.js` (e onde houver eventos a notificar).
- **Rotas:** `notificationRoutes.js`. **Frontend:** sino no header; Android `NotificationsActivity`.
