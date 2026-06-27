# Wordmark, botão "•••" e "X para Y" nas tarefas (2026-06-27)

Três correções na app Android (tema claro mantido, lógica de negócio intacta; o backend **não** foi tocado — só se passou a ler campos que já devolvia).

> Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).

---

## 1. Wordmark "Lifinity" partia em duas linhas (cabeçalho das Tarefas)

**Ficheiro:** `res/layout/activity_tasks.xml`, o `TextView` do wordmark (`style="@style/LifinityWordmark"`).

**Causa:** o bloco "Logo + marca" tem `layout_weight="1"` e divide o espaço com a pill de utilizador (`headerUserPill`), o ícone de estatísticas e o sino. Apertado, o wordmark (`wrap_content`, sem limite de linhas) quebrava para "Lifinit"+"y".

**Correção:** forçar uma linha só no `TextView`:
```xml
android:maxLines="1"
android:singleLine="true"
android:ellipsize="end"
```
Não foi preciso reduzir os outros elementos — "Lifinity" cabe inteiro ao lado do símbolo.

---

## 2. Botão de opções "•••" aparecia como quadrado verde vazio (Tarefas e Amigos)

**Ficheiros:** `res/layout/item_task.xml` (`@id/taskOptionsButton`) e `res/layout/item_friend.xml` (`@id/friendOptionsButton`).

**Causa (a mesma do FAB "+"):** ambos eram `<Button android:text="•••">`. Com o tema Material, o inflater converte `<Button>` em **`MaterialButton`**, que aplica o seu próprio fundo (verde/primary) e gere o texto à sua maneira — resultado: fundo verde e os três pontos **não apareciam**.

**Correção (abordagem robusta do FAB — `ImageView` + vector, que o inflater não substitui):**
1. Novo `res/drawable/ic_dots.xml`: vector à mão com **três pontos horizontais** (path do Material `more_horiz`), `fillColor="@color/lifinity_text"` (escuro, lê-se sobre o fundo claro), 24dp.
2. `item_task.xml`: `@id/taskOptionsButton` passou de `<Button>` a **`<ImageView>`** — mesmo id, 48×48dp, `background=btn_secondary_clay`, `elevation=4dp`, `src=ic_dots`, `scaleType=fitCenter`, `padding=12dp`, `clickable`/`focusable`, `contentDescription`.
3. `item_friend.xml`: `@id/friendOptionsButton` igual — 44×44dp, `padding=11dp`, mantém `visibility="gone"` (o adapter controla).

**Java:** nos dois adapters (`TaskAdapter`, `FriendAdapter`) o campo `optionsButton` mudou de `Button` para **`View`** — caso contrário o `findViewById` (que agora devolve um `ImageView`) rebentava com `ClassCastException`. O `setOnClickListener`/`setVisibility` são métodos de `View`, por isso o menu (tarefas) e o menu de 3 opções (amigos) continuam a funcionar na mesma.

---

## 3. "X para Y" nas tarefas (quem criou / para quem)

**Contexto:** o backend (`taskController`) já devolve por tarefa, além de `t.*`: `creator_username`, `assignee_names` (destinatários diretos, `GROUP_CONCAT` por `", "`), `group_names` (grupos) e `task_origin`. Faltava o Android mapear/usar.

**`models/Task.java`:** acrescentados os 4 campos com `@SerializedName` (+ getters) e um helper `getCreatorAssigneeLabel()`:
- destinatário = `assignee_names` (se houver) → senão `group_names` (se houver) → senão `null`;
- se destinatário `null` → tarefa **pessoal** (criada por mim só para mim) → devolve `null` (linha escondida);
- se `creator_username == destinatário` → `null` (evita "X para X");
- senão → `"creator_username para destinatário"` (ex.: `"teste para cliente"`, `"teste para Grupo Sigma"`).

**`res/layout/item_task.xml`:** novo `TextView` `@id/taskCreatorAssigneeText`, discreto (`lifinity_text_secondary`, 12sp, bold), por baixo dos badges de meta, acima da data de criação.

**`adapters/TaskAdapter.java`:** preenche o `TextView` com `task.getCreatorAssigneeLabel()`; se vier `null`/vazio → `View.GONE` (tarefas pessoais não ocupam espaço). Como a vista de calendário reutiliza o mesmo `TaskAdapter`, a linha aparece também lá, de forma coerente.

---

## Ficheiros tocados
- `res/layout/activity_tasks.xml` — wordmark numa linha.
- `res/drawable/ic_dots.xml` — **novo** ícone de três pontos.
- `res/layout/item_task.xml` — botão de opções (ImageView) + `taskCreatorAssigneeText`.
- `res/layout/item_friend.xml` — botão de opções (ImageView).
- `models/Task.java` — campos de origem/atribuição + helper "X para Y".
- `adapters/TaskAdapter.java` — `optionsButton` (Button→View) + bind da linha "X para Y".
- `adapters/FriendAdapter.java` — `optionsButton` (Button→View).

## Lições
- `<Button>` com tema Material vira `MaterialButton` e ignora `text`/`background` próprios de ícone → para ícones, usar **`ImageView` + vector** (igual ao FAB).
- Ao trocar um `<Button>` por `<ImageView>` no XML, é preciso atualizar o **tipo do campo** no adapter (`View`), senão `findViewById` rebenta com `ClassCastException`.
- "X para Y" sai todo de campos que o backend já dá (`creator_username`/`assignee_names`/`group_names`); tarefas pessoais não têm destinatários → basta esconder a linha.
