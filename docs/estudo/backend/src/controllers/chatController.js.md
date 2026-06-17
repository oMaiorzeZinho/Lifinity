# `backend/src/controllers/chatController.js` — chat (conversas e mensagens)

## Papel no projeto
Gere o **chat**: conversas privadas (1-para-1) e de grupo, membros, mensagens, contagem de não lidas. Montado em `/api/chat`.

## Distinção importante: dois tipos de "grupo de conversa"
1. **Conversa de um grupo Lifinity** — tem `CONVERSATION.idgroup` preenchido. Os membros são **geridos pelo grupo** (`groupController`), não aqui. Por isso vários métodos recusam mexer nos membros se `membership.idgroup` existir.
2. **Grupo de chat avulso** — `idgroup` a `NULL`, criado por `createGroupConversation`. Os membros **são geridos aqui** (adicionar/remover).

## Helpers
- `normalizePrivatePair(a, b)` — devolve o par **ordenado** `[menor, maior]`. Garante uma identidade consistente para conversas privadas (a ordem dos dois utilizadores não importa).
- `normalizeMemberIds(ids, currentUserId)` — dedupe + filtra inválidos + exclui o próprio (como em `notificationController`).
- `friendshipExists(a, b)` — há amizade **aceite** entre os dois?
- `getAcceptedFriendIds` / `validateAcceptedFriends` — confirmam que **todos** os ids dados são amigos aceites do utilizador (segurança ao criar grupos/adicionar membros).
- `findPrivateConversation(a, b)` — encontra a conversa privada **existente** entre dois utilizadores: junta `CONVERSATION_MEMBER` para ambos e exige que a conversa tenha **exatamente 2 membros** (`COUNT = 2`). Evita duplicar conversas privadas.
- `getConversationMembership(idconversation, iduser)` — devolve a linha de pertença (tipo, nome, idgroup, role) **se** o utilizador pertence; senão `null`. É a base do controlo de acesso.
- `userBelongsToConversation` — versão booleana do anterior.

## Endpoints

### `getConversations` — a lista de conversas (query rica)
Para cada conversa do utilizador devolve: tipo, nome, **role atual**, dados do **outro utilizador** (se privada), `member_count`, e a **última mensagem** (conteúdo, data, autor). Ordena por **atividade mais recente** (`COALESCE(last_message.created_at, updated_at, created_at) DESC`).
- A última mensagem vem de um `LEFT JOIN` a uma subquery que escolhe a mensagem mais recente da conversa. É o que permite mostrar a "pré-visualização" na lista.

### `createPrivateConversation`
```js
// valida amigo; 403 se não forem amigos aceites
// se já existe conversa privada → devolve-a (não duplica)
// senão (transação): INSERT CONVERSATION('private') + 2x CONVERSATION_MEMBER (par normalizado)
```
Cria (ou reutiliza) a conversa 1-para-1. Só entre **amigos aceites**.

### `createGroupConversation` — grupo de chat avulso
```js
// valida nome (2..100) e memberIds (>=1, todos amigos aceites)
// (transação) INSERT CONVERSATION('group', name, idcreated_by) + membros (criador 'admin', resto 'membro')
// notifica os membros adicionados
```
Cria um grupo de conversa **independente** de qualquer grupo Lifinity (`idgroup` fica NULL). O criador é `admin`.

### `getMessages`
```js
// 403 se não pertences
SELECT ... FROM MESSAGE ... ORDER BY created_at ASC
UPDATE CONVERSATION_MEMBER SET last_read_at = NOW() WHERE idconversation=? AND iduser=?
```
- Lista as mensagens (cronológico) e, **ao ler, marca a conversa como lida** (`last_read_at`). É isto que faz o contador de não lidas baixar.

### `getUnreadCount`
```js
COUNT(*) FROM MESSAGE m JOIN CONVERSATION_MEMBER cm ...
WHERE cm.iduser=? AND m.idsender != ? AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
```
Conta mensagens, em todas as minhas conversas, **que não são minhas** e que chegaram **depois** da última leitura (ou se nunca li). Alimenta o badge do `ChatWidget`.

### `getConversationMembers`
Confirma pertença e lista membros (admins primeiro, via `FIELD(role,'admin','membro')`).

### `addConversationMembers` / `removeConversationMember` — gerir membros (só chat avulso)
Ambos recusam se:
- não pertences (403),
- **não é conversa de grupo** (400),
- **está ligada a um grupo Lifinity** (`membership.idgroup` → 400, "geridos pelo grupo").

- **`addConversationMembers`** — só adiciona quem ainda não está e é amigo aceite; insere e **notifica**; atualiza `updated_at`.
- **`removeConversationMember`** — exige ser **admin**; impede remover **todos** os membros e impede o **único admin** remover-se a si próprio; depois remove.

### `sendMessage` — enviar
```js
// valida content e message_type ∈ {text, verse}
// 403 se não pertences
// se for conversa de grupo Lifinity e estiveres suspenso (isUserMutedInGroup) → 403 com data
// se for privada: confirma que AINDA há amizade aceite (senão 403)
INSERT INTO MESSAGE (...); UPDATE CONVERSATION.updated_at = NOW()
// devolve a mensagem criada (com username do autor)
await safeUnlockAchievementsForUser(iduser);   // badges messages_1 / messages_25 / verses_shared_1
```
- `message_type` pode ser `text` ou `verse` (partilha de versículo no chat).
- **Respeita o mute** dos grupos Lifinity e revalida a amizade nas conversas privadas (se desfizeram a amizade, não dá para continuar a falar).
- ⚠️ **Nota (comentada no código):** as mensagens de chat **já não criam notificações no sino** — as não lidas passaram a ser contadas pelo widget de chat via `last_read_at` (decisão da FASE A1, commit `ac618776`).

## Ligações
- **Tabelas:** `CONVERSATION`, `CONVERSATION_MEMBER`, `MESSAGE`, `FRIENDSHIP`, `USER`.
- **Reutiliza:** `createNotifications`, `isUserMutedInGroup`/`getMutedUntil` (groupController), `safeUnlockAchievementsForUser`.
- **Rotas:** `chatRoutes.js`. **Frontend:** `Chat.jsx`, `ChatWidget.jsx`. **Android:** `ChatActivity`, `ConversationsActivity`.
