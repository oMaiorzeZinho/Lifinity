# `backend/src/utils/achievements.js` — motor de conquistas (badges)

## Papel no projeto
É o **cérebro do sistema de conquistas**. Define todas as conquistas (com a regra que as desbloqueia), recolhe as estatísticas do utilizador, decide quais novas conquistas foram atingidas, grava-as e cria notificações. É chamado depois de ações relevantes (concluir tarefa, fazer amigo, enviar mensagem, etc.).

## Bloco a bloco

```js
const db = require('../config/db');
const { createNotifications } = require('../controllers/notificationController');
```
Importa a ligação à BD e a função que cria notificações (para avisar o utilizador da conquista).

### `ACHIEVEMENTS` — catálogo com regras
```js
const ACHIEVEMENTS = [
    { code: 'level_2', name: 'Primeiro Salto', ..., requirements: 2,
      isEligible: (stats) => stats.level >= 2 },
    ...
    { code: 'assistant_10', ..., isEligible: (stats) => stats.assistantMessages >= 10 }
];
```
Array com as **19 conquistas**. Cada uma tem os mesmos campos da tabela `BADGE` (`code`, `name`, `description`, `category`, `requirements`, `sort_order`) **mais** uma função **`isEligible(stats)`** que devolve `true`/`false` consoante as estatísticas do utilizador.
- **A grande ideia:** a tabela `BADGE` guarda a *descrição* da conquista; este array guarda a *condição* para a ganhar (que não cabe numa coluna SQL). Ex.: `before_deadline_5` → `stats.beforeDeadlineTasks >= 5`.
- É o **espelho em código** do seed SQL — por isso há a função `ensureAchievementSeeds` para manter a BD em sincronia com este array.

```js
const toNumber = (value) => Number(value || 0);
```
Pequeno utilitário: converte para número, tratando `null`/`undefined` como `0` (as contagens SQL podem vir `NULL`).

### `ensureAchievementSeeds(executor = db)` — semear/atualizar a tabela BADGE
```js
const placeholders = ACHIEVEMENTS.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
const values = ACHIEVEMENTS.flatMap((a) => [a.code, a.name, a.description, a.category, a.requirements, a.sort_order, a.is_active !== false]);
await executor.query(
    `INSERT INTO BADGE (...) VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE name = VALUES(name), ...`, values);
```
- Constrói **dinamicamente** um único `INSERT` em massa: gera N grupos de `(?, ?, ...)` (placeholders) e achata todos os valores com `flatMap`.
- **`ON DUPLICATE KEY UPDATE`** (recordar de `estrutura_lifinity.sql`): se o `code` já existir, atualiza em vez de duplicar — *upsert* idempotente.
- `a.is_active !== false` → fica `true` a não ser que esteja explicitamente a `false`.
- Usa **prepared statement** (valores via `?`) → seguro contra SQL injection.
- Recebe `executor` opcional (por defeito `db`) para poder correr dentro de uma transação, se necessário.

### `getAchievementStats(iduser)` — recolher tudo o que é preciso saber
```js
const [userRows, taskRows, friendRows, groupRows, messageRows, favoriteRows, assistantRows] =
    await Promise.all([ /* 7 queries */ ]);
```
Corre **7 queries em paralelo** com `Promise.all` (mais rápido que uma a uma). Cada uma conta uma métrica:
1. **`USER`** → `xp`, `level`.
2. **Tarefas** (a query mais rica): junta `XP_HISTORY` (com `reason = 'task_completed'`) a `TASK` para contar:
   - `completedTasks` — total de tarefas concluídas (uma linha de XP por conclusão);
   - `highPriorityTasks` — destas, quantas eram de prioridade `alta` (`SUM(CASE WHEN ...)`);
   - `beforeDeadlineTasks` — quantas foram concluídas **dentro do prazo** (`completed_at <= due_date`, com prazo definido).
   - O `SUM(CASE WHEN cond THEN 1 ELSE 0 END)` é o padrão SQL para "contar condicionalmente".
3. **`FRIENDSHIP`** com `status = 'aceite'` onde o utilizador é requester **ou** receiver → `friends`.
4. **`GROUP_MEMBER`** → `groups` (a quantos grupos pertence).
5. **`MESSAGE`** onde `idsender = ?` → `messages` (total) e `sharedVerses` (as de `message_type = 'verse'`).
6. **`FAVORITE_VERSE`** → `favoriteVerses`.
7. **`ASSISTANT_MESSAGE`** com `sender = 'user'` → `assistantMessages` (quantas vezes falou com o assistente).

```js
const user = userRows[0][0] || {};
...
return { xp: toNumber(user.xp), level: toNumber(user.level), completedTasks: ..., ... };
```
- **`rows[0][0]`** — o `mysql2` devolve `[linhas, metadados]`; `[0]` apanha as linhas e o outro `[0]` a primeira linha. O `|| {}` protege contra resultados vazios.
- Devolve um objeto plano `stats` com todas as métricas já convertidas a número — exatamente o que as funções `isEligible` esperam.

### `createAchievementNotification(iduser, unlockedAchievements)`
```js
if (unlockedAchievements.length === 0) return;
const message = unlockedAchievements.length === 1
    ? `Conquista desbloqueada: ${unlockedAchievements[0].name}`
    : `Desbloqueaste ${unlockedAchievements.length} novas conquistas`;
await createNotifications({ recipients: [iduser], type: 'sistema', message,
    entity_type: 'achievement', entity_id: firstAchievement?.idbadge || null,
    link: '/dashboard/profile' });
```
Cria uma notificação: mensagem no singular (uma conquista, com o nome) ou plural (várias). Aponta o `link` para o perfil (onde se veem as conquistas) — usa o sistema de deep-linking da tabela `NOTIFICATION`.

### `unlockAchievementsForUser(iduser, options)` — o fluxo principal
```js
const notify = options.notify !== false;     // notifica por defeito
await ensureAchievementSeeds();               // 1. garante a BD em dia
const stats = await getAchievementStats(iduser); // 2. recolhe métricas
const eligibleCodes = ACHIEVEMENTS.filter(a => a.isEligible(stats)).map(a => a.code); // 3. quais cumpre
if (eligibleCodes.length === 0) return [];
```
Passos 1-3: garante o seed, recolhe estatísticas e filtra as conquistas **elegíveis** (cuja condição é cumprida agora).

```js
const [badgeRows] = await db.query(
   `SELECT idbadge, code, name FROM BADGE WHERE is_active = TRUE AND code IN (?)`, [eligibleCodes]);
```
4. Vai à BD buscar os `idbadge` das conquistas elegíveis e ativas. **`code IN (?)`** com um *array* como parâmetro: o `mysql2` expande-o para `IN ('level_2','tasks_1', ...)` automaticamente.

```js
const badgeIds = badgeRows.map(b => b.idbadge);
const [alreadyUnlockedRows] = await db.query(
   `SELECT idbadge FROM USER_BADGE WHERE iduser = ? AND idbadge IN (?)`, [iduser, badgeIds]);
const alreadyUnlocked = new Set(alreadyUnlockedRows.map(r => Number(r.idbadge)));
const newBadges = badgeRows.filter(b => !alreadyUnlocked.has(Number(b.idbadge)));
if (newBadges.length === 0) return [];
```
5-6. Descobre quais o utilizador **já tinha** (`USER_BADGE`) e calcula a **diferença** (`newBadges` = elegíveis − já-ganhas). Usa um `Set` para a pesquisa ser rápida (O(1)). Se não há nada novo, sai.

```js
const placeholders = newBadges.map(() => '(?, ?)').join(', ');
const values = newBadges.flatMap(b => [iduser, b.idbadge]);
await db.query(`INSERT IGNORE INTO USER_BADGE (iduser, idbadge) VALUES ${placeholders}`, values);
if (notify) await createAchievementNotification(iduser, newBadges);
return newBadges;
```
7-9. Insere as novas conquistas em `USER_BADGE` (em massa). **`INSERT IGNORE`** ignora silenciosamente duplicados (segurança extra contra corridas/concorrência). Notifica (se pedido) e devolve as novas conquistas.

### `safeUnlockAchievementsForUser` — versão "à prova de falhas"
```js
const safeUnlockAchievementsForUser = async (iduser, options = {}) => {
    try { return await unlockAchievementsForUser(iduser, options); }
    catch (err) { console.error('Erro ao desbloquear conquistas:', err); return []; }
};
```
Embrulha tudo num `try/catch` que **nunca lança**: se a verificação de conquistas falhar, regista o erro e devolve `[]`.
- **Porquê:** as conquistas são um "extra". Se algo correr mal nesta lógica, **não** deve fazer falhar a ação principal (ex.: concluir uma tarefa deve resultar mesmo que a verificação de badges rebente). Esta é a função que os controladores chamam.

```js
module.exports = { ACHIEVEMENTS, ensureAchievementSeeds, unlockAchievementsForUser, safeUnlockAchievementsForUser };
```

## Porquê este design (resumo)
- **Data-driven + funções de elegibilidade:** separa o "o quê" (tabela `BADGE`) do "quando" (`isEligible`). Adicionar uma conquista é (quase) só acrescentar uma entrada ao array.
- **Idempotência e segurança:** `ON DUPLICATE KEY UPDATE`, `INSERT IGNORE`, prepared statements, e a wrapper "safe" tornam o sistema robusto.
- **Recalcula tudo a partir das contagens reais:** em vez de incrementar contadores (frágeis), recalcula sempre as métricas a partir da BD — mais fiável, à custa de mais queries.

## Ligações
- **Lê:** `USER`, `XP_HISTORY`, `TASK`, `FRIENDSHIP`, `GROUP_MEMBER`, `MESSAGE`, `FAVORITE_VERSE`, `ASSISTANT_MESSAGE`, `BADGE`, `USER_BADGE`.
- **Escreve:** `BADGE` (seed), `USER_BADGE` (conquistas ganhas).
- **Usa:** `notificationController.createNotifications`.
- **Chamado por:** controladores após ações relevantes (ex.: `taskController` ao concluir tarefa, `friendController`, `chatController`, `assistantController`, `inspirationController`). Tipicamente via `safeUnlockAchievementsForUser`.
- **Apresentado por:** `achievementController.js` (lista de conquistas do utilizador).
