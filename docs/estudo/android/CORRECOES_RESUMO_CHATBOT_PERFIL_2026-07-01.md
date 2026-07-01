# Android — Resumo por data, chatbot, perfil de amigo e retoques (2026-07-01)

> Sete correções **só no Android** (tema claro mantido). **O backend NÃO foi tocado** — todas
> usam endpoints/campos que já existiam (confirmado no `taskController`, `assistantController` e
> `userController`). Validado com `gradlew :app:assembleDebug` → **BUILD SUCCESSFUL**.

Ficheiros tocados:
- `models/Task.java` (T1, T4), `TasksActivity.java` (T1)
- `res/layout/activity_inspiration.xml` (T2)
- `models/AssistantSendRequest.java` (T3)
- `adapters/TaskAdapter.java` (T4, T5) + `res/drawable/bg_card_lost.xml` (T5, **novo**)
- `res/drawable/ic_check.xml`/`ic_close.xml` (T6, **novos**), `res/layout/item_friend_request.xml` (T6),
  `adapters/FriendRequestAdapter.java` (T6)
- `models/PublicProfile.java` (T7, **novo**), `api/UserApi.java` (T7),
  `res/layout/dialog_friend_profile.xml` (T7, **novo**), `FriendsActivity.java` (T7)

---

## T1 (funcional) — "Resumo de hoje": concluídas/perdidas contam só HOJE

**Problema:** o cartão "RESUMO DE HOJE" mostrava concluídas/perdidas de **sempre** (ex.: 12 e 8).
**Causa:** `TasksActivity.updateSummary()` contava localmente a partir de **todas** as tarefas, sem
filtro de data. As **pendentes** estavam corretas (todas as pendentes) e mantêm-se assim.

**Solução:**
- `Task.java` ganhou o campo `completed_at` (`@SerializedName`, já devolvido pelo backend via `t.*`)
  + `getCompletedAt()`.
- `updateSummary()` passou a:
  - **pending:** não concluída e não perdida → conta (igual a antes);
  - **completed:** concluída **e** `completed_at` é hoje → conta;
  - **lost:** perdida **e** `due_date` é hoje → conta.
  - As concluídas/perdidas **noutro dia** não entram em nenhuma das três (em particular **não** caem
    em "pending", graças ao `if/else if/else`).
- Novo helper `isSameDayAsToday(String)`: usa o `parseDate(...)` já existente e compara
  ano+mês+dia com hoje (`Calendar`). Null/não parsável → `false`.

> Assume o mesmo fuso do servidor — na demo local (mesmo PC) é correto.

## T2 (visual) — Inspiração: banner ainda cortava versículos longos

Versículos longos (ex.: **Jeremias 29:11**) cortavam no fim, com o banner a 250dp.
**Solução** (só XML, `inspirationVerseHero`): altura fixa `250dp → 300dp`, texto do versículo
`18sp → 16sp` e aspas decorativas `34sp → 28sp`. Mantém `centerCrop`, overlay e `clipToOutline`.

## T3 (funcional) — Chatbot não respondia (campo do pedido errado)

**Problema:** qualquer mensagem ao Assistente devolvia "Não consegui gerar uma resposta...".
**Causa (confirmada):** o backend (`assistantController.sendAssistantMessage`) lê `req.body.content`,
mas o Android enviava `{ message: ... }` (o campo do `AssistantSendRequest` chamava-se `message`). O
backend recebia conteúdo vazio → **400** → a app caía no *fallback*. O browser envia `{ content }`.

**Solução:** em `AssistantSendRequest.java`, o campo passou de `message` para **`content`** (o GSON
serializa pelo nome do campo). O `AssistantActivity` não mudou (continua `new AssistantSendRequest(text)`).

## T4 (funcional) — Esconder "Concluir" nas tarefas que criei para OUTRA pessoa

**Problema:** numa tarefa que eu criei e atribuí a um amigo, o botão "Concluir" aparecia mas dava
**403** ("Apenas a pessoa a quem a tarefa foi atribuída a pode concluir").

**Regra (igual à web):** mostrar "Concluir" só se: não concluída **e** não perdida **e** (a tarefa
**não** tem destinatários individuais **ou** eu sou o destinatário).

**Solução:**
- `Task.java` ganhou `has_assignees`/`has_groups` (0/1, já devolvidos pelo backend) + `hasAssignees()`/
  `hasGroups()`.
- `TaskAdapter.canCompleteTask()` acrescentou: se `hasAssignees()` **e** eu não sou o destinatário
  (`task_origin != "assigned_to_me"`) → esconde o "Concluir". Tarefas de **grupo** (sem assignees
  individuais) mantêm o "Concluir" (qualquer membro conclui); tarefas pessoais e as atribuídas a mim
  também.

## T5 (visual) — Tarefa perdida: cartão coberto de vermelho

**Antes:** um pequeno chip cinzento "Perdida". **Agora:** o cartão inteiro a coral, com toda a
informação legível por cima.
- Novo drawable `bg_card_lost.xml` — espelha o `bg_card_clay` (cantos 30dp) mas em coral muito claro
  (`#FCEAE5`) com borda coral (`lifinity_coral`, 1.5dp).
- `TaskAdapter.bind()`: define **sempre** o fundo do cartão — `bg_card_lost` se perdida, senão
  `bg_card_clay` (por causa da reciclagem de views).
- `TaskAdapter.bindStatus()`: se perdida, "PERDIDA" como **rótulo vermelho** (`lifinity_danger`, fundo
  transparente); se concluída, mantém o chip cinzento (repondo fundo/cor por causa da reciclagem). O
  botão "Concluir" já fica escondido nas perdidas (via `canCompleteTask`).

## T6 (visual) — Pedidos de amizade: botões aceitar/recusar vazios

**Causa:** eram `<Button>` com `android:text="✓"/"✕"` — o tema Material converte-os em `MaterialButton`
e o símbolo desaparece (**mesmo bug do FAB/•••**).
**Solução:** novos vectores `ic_check.xml` (branco) e `ic_close.xml` (secundário); no
`item_friend_request.xml` os dois `<Button>` passaram a **`<ImageView>`** (mesmos ids, 44dp,
`btn_primary_clay`/`btn_ghost_clay`, `src` do vector). No `FriendRequestAdapter` os campos
`acceptButton`/`declineButton` mudaram de `Button` para **`View`** (evita `ClassCastException`;
`setOnClickListener` mantém-se).

## T7 (visual) — Perfil de amigo rico (avatar, nível, XP, 3 conquistas)

**Antes:** "Ver perfil" abria um popup simples só com "Nível X · Y XP". **Agora:** popup como o
`PublicProfileModal` da web.
- **Endpoint (já existia):** `GET /users/{iduser}/public-profile` devolve
  `{ username, level, avatar, bio, highlightedBadges: [...], totalUnlockedBadges }` — **não** devolve
  `xp` (usa-se o `friend.getXp()`).
- Novo model `PublicProfile.java` (reutiliza `Achievement` para os `highlightedBadges` — os campos
  coincidem). Novo endpoint em `UserApi` (`getPublicProfile`). Novo layout `dialog_friend_profile.xml`
  (avatar placeholder+foto, nome, pill "Nível X · Y XP", label "CONQUISTAS EM DESTAQUE", contentor +
  `ProgressBar`).
- `FriendsActivity.showFriendProfile()` reescrito: infla o layout, preenche já o que temos do `Friend`
  (nome, nível·XP, inicial), mostra o `AlertDialog`, e chama `getPublicProfile` para completar com o
  **avatar real** (`AvatarLoader`) e até **3 conquistas em destaque** (mini-cartões "★ nome +
  descrição"). Sem conquistas ou em erro → "Sem conquistas em destaque." (nunca rebenta). Removido o
  TODO antigo.

## Ligações
- [`TasksActivity.java.md`](TasksActivity.java.md) · [`adapters/TaskAdapter.java.md`](adapters/TaskAdapter.java.md) · [`FriendsActivity.java.md`](FriendsActivity.java.md)
- [`models/_MODELS_TASKS.md`](models/_MODELS_TASKS.md) · [`models/_MODELS_NOTIFICATIONS_CHAT_ASSISTANT.md`](models/_MODELS_NOTIFICATIONS_CHAT_ASSISTANT.md) · [`api/UserApi.java.md`](api/UserApi.java.md) · [`res/drawable/_DRAWABLES_CLAY.md`](res/drawable/_DRAWABLES_CLAY.md)
- **Backend (inalterado):** `taskController` (completed_at/has_assignees), `assistantController` (content), `userController.getPublicProfile`.
