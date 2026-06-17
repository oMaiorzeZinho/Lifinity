# `backend/src/controllers/taskController.js` — tarefas (o controlador central)

## Papel no projeto
É o maior controlador. Trata **listar, criar, concluir (com XP via C), editar, apagar e resumir** tarefas, lidando com três tipos: **pessoais**, **atribuídas a amigos** e **partilhadas com grupos**. É aqui que o módulo nativo em C entra em ação.

## Imports (e confirmações importantes)
```js
const db = require('../config/db');
const { createNotifications } = require('./notificationController');
const { isUserMutedInGroup, getMutedUntil } = require('./groupController');
const { safeUnlockAchievementsForUser } = require('../utils/achievements');
const gamification = require('../../build/Release/gamification'); // ← o BINÁRIO C compilado
```
- ✅ **Confirma a dúvida do módulo C:** é **mesmo o binário compilado** (`build/Release/gamification.node`) que é usado, via `gamification.calcularRecompensa(...)` e `gamification.getLevelData(...)`. A versão JS em `utils/gamification.js` é só fallback.
- Reutiliza `createNotifications`, a verificação de "mute" de grupos e o motor de conquistas.

## Fragmentos SQL reutilizáveis (no topo)
```js
const taskVisibilityCondition = `( t.iduser = ?  OR EXISTS(... TASK_ASSIGNEE ta ... ta.iduser = ?)  OR EXISTS(... GROUP_TASK gt JOIN GROUP_MEMBER gm ... gm.iduser = ?) )`;
const taskHiddenForUserCondition = `NOT EXISTS (SELECT 1 FROM TASK_USER_ARCHIVE tua WHERE tua.idtask = t.idtask AND tua.iduser = ?)`;
```
- **`taskVisibilityCondition`** — uma tarefa é "visível" para mim se: a criei (`t.iduser = ?`), **ou** me foi atribuída (`TASK_ASSIGNEE`), **ou** sou membro de um grupo com essa tarefa (`GROUP_TASK` + `GROUP_MEMBER`). Cada `?` recebe o `iduser` — por isso aparece tantas vezes nos arrays de parâmetros.
- **`taskHiddenForUserCondition`** — exclui tarefas que **eu** escondi (`TASK_USER_ARCHIVE`).
- **Porquê fragmentos:** esta lógica repete-se em quase todos os métodos; defini-la uma vez evita erros e repetição. (A desvantagem é ter de contar bem os `?` em cada query.)

## `getTasks` — listar (com metadados para a UI)
A query devolve `t.*` mais várias colunas calculadas:
- `creator_username` — quem criou (JOIN a `USER`).
- **`task_origin`** (CASE): `created_by_me`, `assigned_to_me`, `group_task` ou `unknown`. Define em que **secção** a tarefa aparece no frontend (commit `4c02172f`).
- `group_ids` / `assignee_ids` — listas com `GROUP_CONCAT` (junta vários ids numa string separada por vírgulas).
- `group_names` — nomes dos grupos (para o badge "Grupo: X").
- `assignee_names` — nomes dos destinatários (para o badge "Para: X, Y").
- `has_assignees` / `has_groups` — `0/1` (a subquery `COUNT(*) > 0` devolve booleano) indicando se tem destinatários/grupos.

Filtro: `WHERE t.archived_at IS NULL AND <não escondida por mim> AND <visível para mim> ORDER BY t.idtask DESC`. São **9** `?` (todos `iduser`), na ordem em que aparecem na query.
- **Porquê tantas subqueries:** o frontend precisa destes metadados para desenhar os badges de origem e os destinatários sem fazer pedidos extra. Concentra tudo numa query (mais eficiente que N pedidos).

## `createTask` — criar (com transação e validações de segurança)
Usa uma **transação** (`connection.beginTransaction` / `commit` / `rollback`).

**1) Normalização e validação dos destinos:**
```js
const normalizeIdList = (value) => { ... devolve [] se vazio, null se inválido, senão [...new Set(ids)] };
const assigneeIds = normalizeIdList(req.body.assignees);
const groupIds = normalizeIdList(req.body.groups);
if (!assigneeIds || !groupIds) return res.status(400) // "Destinos invalidos"
```
`normalizeIdList` aceita só arrays de inteiros positivos (dedupe com `Set`); devolve `null` se algo for inválido → 400. Valida ainda título obrigatório, prioridade válida e normaliza `due_date` (vazio → `null`).

**2) Segurança dos destinatários:**
- **Amigos:** consulta `FRIENDSHIP` (status `aceite`) para confirmar que **todos** os `assigneeIds` são amigos aceites; se algum não for → **403** ("Só podes atribuir tarefas a amigos aceites"). O `CASE WHEN iduser_requester = ? THEN iduser_receiver ELSE iduser_requester` resolve "o outro lado" da amizade independentemente de quem pediu.
- **Grupos:** confirma em `GROUP_MEMBER` que pertences a **todos** os `groupIds` → senão 403.
- **Mute:** para cada grupo, `isUserMutedInGroup` — se estiveres **suspenso**, 403 com a data até quando (`getMutedUntil`, formatada em `pt-PT`).
- Junta todos os membros dos grupos a `taskNotificationRecipients` (para os avisar).

**3) Inserções (dentro da transação):**
```js
INSERT INTO TASK (...) → idtask = result.insertId
// se há assignees: INSERT em massa em TASK_ASSIGNEE (idtask, iduser, assigned_by)
// se há grupos:    INSERT em massa em GROUP_TASK (idtask, idgroup)
```
- ⚠️ **Nota de design importante (comentada no código):** `TASK_ASSIGNEE` e `GROUP_TASK` são **independentes**. Se um amigo for, ao mesmo tempo, destinatário individual **e** membro de um grupo selecionado, criam-se **ambos** os relacionamentos — **não** se deduplica. (Foi o fix do commit `b7db1254`.)

**4) Notificar + commit:**
```js
await createNotifications({ recipients: [...taskNotificationRecipients], type: 'tarefa', message: `Recebeste uma nova tarefa: ${title}.`, entity_type: 'task', entity_id: idtask, link: '/dashboard/tasks', excludeUserId: iduser, executor: connection });
await connection.commit();
```
As notificações são criadas **dentro da transação** (`executor: connection`) e `excludeUserId: iduser` evita notificar o próprio criador.
- **Porquê transação:** criar a tarefa + atribuições + tarefas de grupo + notificações tem de ser **tudo-ou-nada**. Se algo falhar a meio, `rollback()` desfaz tudo (não fica uma tarefa "meia-criada"). `finally` liberta sempre a `connection`.

## `completeTask` — concluir e ganhar XP (**o C em ação**)
```js
// 1. Buscar a tarefa COM verificação de visibilidade (owner/assignee/grupo)
// 2. Regra dos assignees:
const hasAssignees = ...; const isAssignee = ...;
if (hasAssignees && !isAssignee) return res.status(403) // só o destinatário conclui
if (task.status === "concluida") return res.status(400) // já concluída
if (task.due_date && new Date(task.due_date) < new Date()) return res.status(403) // perdida
```
- Só conclui quem tem visibilidade. Se a tarefa tem destinatários, **só um destinatário** a conclui (o criador, se não for destinatário, não pode). Bloqueia re-conclusão e tarefas fora do prazo ("perdidas").

```js
const today = new Date().toISOString().split('T')[0];
const createdAt = new Date(task.created_at).toISOString().split('T')[0];
const isSameDay = today === createdAt;       // bónus de velocidade = concluída no dia em que foi criada
const currentStreak = 3;                      // ⚠️ FIXO (placeholder!)
const XP_REWARD = gamification.calcularRecompensa(task.priority, isSameDay, currentStreak);  // ← C
```
- `isSameDay` → "bónus de velocidade" (concluir no próprio dia da criação).
- ⚠️ **Ponto a rever:** **`currentStreak` está hardcoded a 3**! O streak real (coluna `USER.current_streak`) **não** é usado aqui. Logo, todas as recompensas levam o bónus de streak de "3 dias" fixo. É uma simplificação por terminar — provavelmente para ligar à coluna real de streak no futuro.
- `gamification.calcularRecompensa(...)` — chamada ao **C** (prioridade, bónus de velocidade, streak) → devolve o XP.

```js
UPDATE TASK SET status='concluida', completed_at=NOW() ...
const currentXP = userStats[0].xp + XP_REWARD;
const levelData = gamification.getLevelData(currentXP);   // ← C calcula o novo nível
UPDATE USER SET xp = ?, level = ? ...
INSERT INTO XP_HISTORY (iduser, idtask, amount, reason) VALUES (?, ?, ?, 'task_completed')
await safeUnlockAchievementsForUser(iduser);
res.json({ message: `Tarefa concluída! Ganhaste ${XP_REWARD} XP${isSameDay ? " (Bónus de Velocidade incluído!)" : ""}.`, newXP, newLevel });
```
- Marca concluída, soma XP, recalcula o nível **em C** (`getLevelData`), grava `USER`, regista no `XP_HISTORY` (o `reason: 'task_completed'` é exatamente o que `achievements.js` procura), e tenta desbloquear conquistas (versão "safe", que nunca rebenta).
- ⚠️ Estas escritas **não** estão numa transação (ao contrário do `createTask`). Em teoria poderiam ficar inconsistentes se algo falhasse a meio; na prática o risco é baixo para o âmbito do projeto, mas é um ponto a notar.

## `updateTask` — editar (com regras de permissão)
- **Só o criador** edita (`WHERE idtask = ? AND iduser = ?`).
- Calcula `is_lost` (tem prazo passado e não está concluída) e `has_assignees` na própria SELECT.
- Bloqueia editar: tarefas **concluídas** (403), **perdidas** (403).
- **Regra de tempo conforme o tipo** (comentada no código):
  - Tarefa **pessoal** (sem assignees): só editável **até 1 hora** após a criação (`diffInMs > 60*60*1000` → 403). 
  - Tarefa **para outros** (com assignees): editável **até ser concluída** (sem limite de tempo).
- Se passar tudo, faz o `UPDATE`. (Estas regras vêm do commit `59b6c810`.)

## `deleteTask` — apagar **ou** esconder (consoante o caso)
Lógica subtil (boa de reler):
```js
const isOwner = task.iduser === iduser;
const isShared = has_assignees || has_groups;
if (concluida || is_lost) {
    if (isOwner && !isShared) UPDATE TASK SET archived_at = NOW()   // arquivo GLOBAL (pessoal)
    else INSERT INTO TASK_USER_ARCHIVE ... ON DUPLICATE KEY ...      // esconde SÓ para mim
    return // "ocultada"
}
if (!isOwner) return 403   // não apagas tarefa de outro
DELETE FROM TASK ...        // pendente e minha → apagar mesmo
```
- **Concluídas/perdidas** nunca são apagadas a sério: ou se arquivam globalmente (se forem **pessoais minhas**) ou se escondem **só para mim** (se forem partilhadas) — assim não desaparecem para os outros.
- **Pendentes** só podem ser **apagadas pelo dono** (DELETE real).
- **Porquê:** respeita a natureza colaborativa — esconder ≠ apagar para todos.

## `clearCompletedTasks` e `hideCompletedVisibleTasks` — limpar concluídas em massa
Ambas escondem todas as tarefas concluídas visíveis, com a mesma filosofia:
- **Pessoais** (minhas, sem assignees nem grupos) → `archived_at = NOW()` (arquivo global).
- **Colaborativas** → `TASK_USER_ARCHIVE` (escondidas só para mim).
- `hideCompletedVisibleTasks` faz isto dentro de uma **transação** e devolve `hiddenCount`; `clearCompletedTasks` faz em duas queries soltas.
- ⚠️ Há aqui alguma **redundância** (dois endpoints a fazer essencialmente o mesmo) — provavelmente fruto de iterações. Vale a pena confirmar no frontend qual é usado.

## `getTaskSummary` — resumo do **dia**
Conta, entre as tarefas visíveis, as de **hoje**:
- `pendingTasks` — não concluídas, não arquivadas, dentro do prazo, **criadas hoje**.
- `completedTasks` — concluídas **hoje** (`DATE(completed_at) = CURDATE()`).
- `lostTasks` — não concluídas, prazo passado, **prazo era hoje**.
- Calcula `totalTasks` e `completionRate` (% concluídas, arredondada).
- **Usado por** widgets de resumo (dashboard) e, indiretamente, pela página de estatísticas.

## Ligações
- **Tabelas:** `TASK`, `TASK_ASSIGNEE`, `GROUP_TASK`, `TASK_USER_ARCHIVE`, `XP_HISTORY`, `USER`, `FRIENDSHIP`, `GROUP_MEMBER`, `GROUP_ENTITY`.
- **Módulo C:** `gamification.calcularRecompensa`, `gamification.getLevelData`.
- **Reutiliza:** `createNotifications`, `isUserMutedInGroup`/`getMutedUntil` (groupController), `safeUnlockAchievementsForUser`.
- **Rotas:** `taskRoutes.js`. **Frontend:** `Tasks.jsx`. **Android:** `TasksActivity`, `CreateTaskActivity`, `EditTaskActivity`.

## Pontos a rever (resumo)
1. **`currentStreak = 3` fixo** em `completeTask` — o streak real não é usado.
2. `completeTask` não usa transação (várias escritas sequenciais).
3. Redundância entre `clearCompletedTasks` e `hideCompletedVisibleTasks`.
