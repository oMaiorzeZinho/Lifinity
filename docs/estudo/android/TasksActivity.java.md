# `TasksActivity.java` — o hub principal (lista + calendário de tarefas)

## Papel
É o **ecrã central** da app (a tab "Tarefas", para onde se entra com sessão iniciada). Mostra: o **cartão
de XP/nível**, o **resumo de hoje** (pendentes/concluídas/perdidas), a **lista de tarefas** com pesquisa e
filtros, e uma **vista de calendário** alternativa. Permite **concluir**, **editar** e **ocultar/eliminar**
tarefas. É a maior activity — vale a pena estudá-la com calma.

## `onCreate` — montar tudo
```java
String token = getToken();
if (TextUtils.isEmpty(token)) { openLoginActivity(); return; }   // guarda de sessão
setContentView(R.layout.activity_tasks);
bindViews();
findViewById(R.id.tasksStatsButton).setOnClickListener(v -> startActivity(new Intent(this, StatisticsActivity.class)));
setupFilters(); setupBottomNav(); setupViewToggle();
HeaderHelper.setupBell(this); bindUserHeader();
taskAdapter = new TaskAdapter(this::confirmCompleteTask, this::showTaskOptions);
tasksRecyclerView.setLayoutManager(new LinearLayoutManager(this));
tasksRecyclerView.setAdapter(taskAdapter);
```
- **`bindViews()`** apanha todas as *views* (são muitas: XP card, resumo, filtros, recycler, calendário).
- O **`RecyclerView`** é a lista eficiente do Android: recicla as *views* das linhas à medida que se faz
  *scroll* (não cria uma por tarefa). Precisa de um **LayoutManager** (aqui linear/vertical) e de um
  **Adapter** ([`TaskAdapter`](adapters/TaskAdapter.java.md)) que liga os dados às linhas.
- O `TaskAdapter` recebe **duas referências de método** (`this::confirmCompleteTask`,
  `this::showTaskOptions`) — são os *callbacks* de "concluir" e "opções" que o adapter dispara quando se toca
  numa linha. É assim que a lista comunica de volta com a activity.

## `onResume` — recarregar sempre que se volta ao ecrã
```java
@Override protected void onResume() {
    super.onResume();
    if (taskAdapter == null) return;
    ... guarda de sessão ...
    bindUserHeader();
    loadTasks(token);
}
```
- **`onResume`** corre sempre que o ecrã fica visível (incluindo ao **voltar** de criar/editar uma tarefa).
  Por isso é aqui que se **recarregam as tarefas** — garante que a lista reflete o que mudou noutro ecrã.

## `bindUserHeader` — cartão de XP e saudação
Lê o `User` guardado e mostra nível, XP, saudação e a **barra de progresso** do nível. A matemática é a
**mesma fórmula do backend**:
```java
int currentLevelXp = calculateXpForLevel(level);     // 100*(level-1)^1.5
int nextLevelXp = calculateXpForLevel(level + 1);
int progress = Math.round(((xp - currentLevelXp) * 100f) / (nextLevelXp - currentLevelXp));
xpCardProgressBar.setProgress(clamp(progress, 0, 100));
xpCardProgressLabel.setText("Faltam " + (nextLevelXp - xp) + " XP para o nível " + (level + 1));
```
- `calculateLevelFromXp`/`calculateXpForLevel` replicam o `gamification.c`/`gamification.js` do backend, para
  os cálculos baterem certo no telemóvel sem mais um pedido.

## `loadTasks` — buscar e processar
`GET /tasks` → guarda tudo em `allTasks`, depois `updateSummary()` (conta pendentes/concluídas/perdidas) e
`applyFilters()` (filtra + ordena + mostra). Em 401/403 mostra "Sessão inválida".

## Filtros e ordenação — `setupFilters` + `applyFilters`
- **Filtros:** dois `Spinner` (estado: Todas/Pendentes/Concluídas/Perdidas; prioridade: Todas/Baixa/Média/
  Alta) + uma caixa de **pesquisa** com um `TextWatcher` (reage a cada tecla, chamando `applyFilters`).
- **`applyFilters`** percorre `allTasks`, mantém as que passam na pesquisa + estado + prioridade, e depois
  **ordena igual à web**:
  ```java
  filteredTasks.sort((a, b) -> {
      int orderDiff = getTaskStatusOrder(a) - getTaskStatusOrder(b);   // pendente=1, perdida=2, concluída=3
      if (orderDiff != 0) return orderDiff;
      return Long.compare(idB, idA);   // desempate: idtask DESC (mais recentes primeiro)
  });
  ```
- **Como se sabe o estado:** `isTaskCompleted` (status == "concluida") e `isTaskLost` (não concluída **e**
  `due_date` já passou, comparando com `new Date()`). `parseDate` tenta vários formatos de data do servidor.

## Concluir / Eliminar — diálogos de confirmação
- **`confirmCompleteTask`** abre um `AlertDialog` "Queres concluir?"; ao confirmar chama `completeTask` →
  `PUT /tasks/complete/{id}`. A resposta traz **novo XP/nível** → `updateStoredUser` (atualiza o `User` no
  `SharedPreferences` via `JsonObject`) → `bindUserHeader` (atualiza o cartão) → `Toast` → recarrega.
- **`showTaskOptions`** abre um menu (`setItems`): "Editar" (só se `canEditTask`, i.e. não concluída/perdida),
  "Ocultar/Eliminar" e "Cancelar". Eliminar pede confirmação e chama `DELETE /tasks/{id}`.

## Vista de calendário (nativa, sem bibliotecas)
- **`setCalendarMode(boolean)`** alterna: em calendário esconde pesquisa/filtros/lista e mostra a grelha;
  em lista faz o inverso e reaplica filtros. `updateViewModeToggle` pinta o botão ativo do segmento.
- **`buildCalendar()`** desenha o mês:
  1. agrupa as tarefas **com prazo** por dia (`Map<String yyyy-MM-dd, List<Task>>`) — tarefas **sem** prazo
     ficam só na lista (como na web);
  2. calcula o 1.º dia da semana (`startOffset`, domingo primeiro) e os dias do mês;
  3. adiciona **células vazias** antes do dia 1 e depois uma `makeDayCell` por dia.
- **`makeDayCell`** desenha a célula à mão: fundo arredondado (`GradientDrawable`), **bordo menta** se for
  **hoje**, **coral** se houver tarefa **perdida**; mostra o número do dia e até **2 pills** de tarefa
  (coloridas por prioridade via `makeTaskPill`) + um "**+N**" se houver mais. Tocar na célula abre o diálogo
  do dia.
- **`openDayTasksDialog`** — mostra as tarefas desse dia num `AlertDialog` que **reutiliza o `TaskAdapter`**
  (mesmas ações/validações: concluir/editar/ocultar). Ao fazer uma ação, fecha o diálogo (`dismiss`) e
  delega nos mesmos métodos. **Reutilizar o adapter** evita duplicar lógica — é uma decisão elegante.

## Navegação para criar/editar
`openEditTaskActivity` mete os dados da tarefa nos **extras do Intent** (`EXTRA_IDTASK`, `EXTRA_TITLE`, ...)
para o [`EditTaskActivity`](EditTaskActivity.java.md) pré-preencher. O criar abre-se pelo FAB.

## `onDestroy`
Cancela todas as `Call` pendentes e fecha o `dayDialog` se estiver aberto (evita *window leaked*).

## Ligações
- **API/Backend:** [`TaskApi`](api/TaskApi.java.md) → `taskController` (+ módulo C para XP).
- **Adapter:** [`TaskAdapter`](adapters/TaskAdapter.java.md). **Models:** `Task`, `CompleteTaskResponse`, `User`.
- **Abre:** `CreateTaskActivity`, `EditTaskActivity`, `StatisticsActivity`. **Barra:** `BottomNavHelper`.
- **Equivalente web:** `frontend/src/pages/Tasks.jsx` (mesma ordenação e regra do calendário).
