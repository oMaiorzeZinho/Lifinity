# `backend/src/controllers/groupController.js` — grupos e moderação

## Papel no projeto
Gere os **grupos Lifinity**: criar, entrar por código, listar, membros, sair, **moderação** (expulsar/suspender), trancar e apagar. Também garante a **conversa de chat** associada a cada grupo. Exporta helpers (`getMutedUntil`, `isUserMutedInGroup`) usados pelo `taskController` e `chatController`.

## Helpers e constantes
```js
const generateInviteCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();
const buildPlaceholders = (rows, cols) => rows.map(() => `(${Array(cols).fill('?').join(', ')})`).join(', ');
const MUTE_DURATIONS = { '30min': {minutes:30,...}, '1d': {minutes:1440,...}, '3d': {minutes:4320,...} };
```
- `generateInviteCode` — código de 8 caracteres em base-36 (letras+dígitos), em maiúsculas. Simples; a unicidade é garantida depois com um *loop* (ver `createGroup`).
- `buildPlaceholders` — gera placeholders `(?, ?, ...)` para inserts em massa (reutilizado também no `chatController`).
- `MUTE_DURATIONS` — opções de suspensão permitidas (30 min / 1 dia / 3 dias), com minutos e texto legível.

### `getMutedUntil` / `isUserMutedInGroup` (exportadas)
```js
const getMutedUntil = async (iduser, idgroup) => { ... return mutedUntil > new Date() ? mutedUntil : null; };
const isUserMutedInGroup = async (iduser, idgroup) => (await getMutedUntil(...)) !== null;
exports.getMutedUntil = getMutedUntil;
exports.isUserMutedInGroup = isUserMutedInGroup;
```
- Leem `GROUP_MEMBER.muted_until`. Só consideram "suspenso" se a data **ainda for futura** (suspensões expiradas contam como não-suspenso). 
- **Exportadas** porque `taskController` (bloquear criar tarefas) e `chatController` (bloquear mensagens) precisam delas.

### `syncGroupConversationMembers` + `getOrCreateGroupConversation`
Mantêm a **conversa de chat de um grupo** em sincronia com os membros do grupo:
- `syncGroupConversationMembers` — **remove** da conversa quem já não é membro do grupo e **insere/atualiza** os membros atuais (o dono fica `admin`), com `ON DUPLICATE KEY UPDATE`.
- `getOrCreateGroupConversation(idgroup)` — numa **transação**: procura a `CONVERSATION` do grupo; se não existir, cria-a (tipo `group`, ligada ao `idgroup`); depois sincroniza membros. Devolve a conversa.
- **Porquê:** garante que o chat do grupo reflete sempre quem lá está — os membros do chat de um grupo Lifinity **não** são geridos à mão, são derivados do grupo.

## Endpoints

### `getMyGroups`
Lista os grupos do utilizador com `member_count` (via `COUNT` + `GROUP BY`) e o `role` dele em cada. Ordena pelos mais recentes.

### `getOrCreateConversationForGroup`
Confirma que sou membro (senão 403) e devolve a `idconversation` do grupo (criando-a se preciso, via helper acima).

### `createGroup`
```js
// valida nome (>= 2)
// gera invite_code ÚNICO (loop: repete generateInviteCode enquanto já existir)
INSERT INTO GROUP_ENTITY (idowner, name, description, invite_code) ...
INSERT INTO GROUP_MEMBER (iduser, idgroup, role) VALUES (?, ?, 'admin')   // o criador entra como admin
await safeUnlockAchievementsForUser(iduser);   // badges groups_1 / groups_3
```
- O **loop de unicidade** repete a geração do código até encontrar um livre (evita colisão na coluna `UNIQUE invite_code`).
- O criador torna-se automaticamente **admin** e dono.

### `joinGroupByCode`
```js
// procura por invite_code (normalizado: trim + UPPERCASE)
// 404 se inválido; 400 se já és membro
if (group.is_locked === 1) return 403 'Este grupo está trancado'   // FASE A2
INSERT INTO GROUP_MEMBER (..., 'membro')
// se já existe conversa do grupo, adiciona-te também a CONVERSATION_MEMBER
await safeUnlockAchievementsForUser(iduser);
```
- Respeita o **`is_locked`**: grupos trancados não aceitam novas entradas (os membros existentes não são afetados). Adiciona-te ao chat do grupo se ele já existir.

### `getGroupMembers`
Confirma a tua pertença e lista membros (com `role` e `muted_until`), admins primeiro.

### `leaveGroup`
- O **dono não pode sair** (tem de apagar o grupo ou — futuramente — transferir a propriedade). 
- Remove de `GROUP_MEMBER` **e** da `CONVERSATION_MEMBER` do grupo.

### Moderação — `kickGroupMember`, `muteGroupMember`, `unmuteGroupMember`
Partilham o mesmo **padrão de permissões** (explico uma vez):
1. Validar entradas (motivo obrigatório em kick/mute; duração válida em mute).
2. Grupo tem de existir.
3. Quem age tem de ser **dono ou admin** (senão 403).
4. Não se pode agir **sobre si próprio** nem **sobre o dono**.
5. O alvo tem de pertencer ao grupo.

- **`kickGroupMember`** — numa transação, remove de `GROUP_MEMBER` e da conversa; depois **notifica** o expulso com o motivo.
- **`muteGroupMember`** — `UPDATE ... SET muted_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)` (a duração de `MUTE_DURATIONS`); lê o valor aplicado e notifica o suspenso (duração + motivo). A partir daqui, `isUserMutedInGroup` impede-o de criar tarefas/mensagens no grupo.
- **`unmuteGroupMember`** — `SET muted_until = NULL` (levanta a suspensão).

### `deleteGroup`
- Permitido ao **dono ou a um admin**. `DELETE FROM GROUP_ENTITY` — e, por `ON DELETE CASCADE`, arrasta membros, tarefas de grupo, conversa, etc.

### `toggleGroupLock`
- **Só o dono** pode trancar/destrancar. `UPDATE ... SET is_locked = NOT is_locked` (alterna), lê o novo valor e devolve-o. Liga-se ao bloqueio em `joinGroupByCode`.

## Ligações
- **Tabelas:** `GROUP_ENTITY`, `GROUP_MEMBER`, `CONVERSATION`, `CONVERSATION_MEMBER`, `USER`.
- **Exporta:** `getMutedUntil`, `isUserMutedInGroup` (usados por `taskController` e `chatController`).
- **Reutiliza:** `createNotifications`, `safeUnlockAchievementsForUser`.
- **Rotas:** `groupRoutes.js`. **Frontend:** `Community.jsx`. **Android:** `CommunityActivity`.
