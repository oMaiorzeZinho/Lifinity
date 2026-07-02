# Android — Botão "Ocultar concluídas/perdidas" nas Tarefas (2026-07-02)

> Um chip nas Tarefas que **esconde da lista** as tarefas concluídas/perdidas, como no browser.
> **É um FILTRO DE VISUALIZAÇÃO client-side — não elimina, não arquiva, não toca no backend.**
> Validado com `gradlew :app:assembleDebug` → **BUILD SUCCESSFUL**.

Ficheiros tocados (só Android):
- `res/layout/activity_tasks.xml` — o chip `tasksToggleHiddenButton`.
- `TasksActivity.java` — flag, preferência, filtro em `applyFilters`, estado do chip.

## O que faz
Um chip discreto à direita (por baixo de "AS MINHAS ATIVIDADES") que alterna entre:
- **"Ocultar concluídas/perdidas"** (estado normal, cinzento) → ao tocar, a lista passa a mostrar só as
  **pendentes**;
- **"Mostrar todas"** (estado ativo, menta) → ao tocar, voltam a aparecer todas.

A escolha é **lembrada entre sessões** (SharedPreferences, chave `hide_completed_lost`).

## Porquê um filtro de visualização (e NÃO o endpoint do backend)
Havia a tentação de usar o endpoint `hide-completed-visible` do backend (o que a app tinha como código
morto — `TaskApi.hideCompletedVisibleTasks`, nunca chamado). **Não se usou**, por duas razões:
1. Esse endpoint **arquiva permanentemente** as tarefas (não é reversível pelo utilizador) e **só** trata
   das concluídas — não das perdidas.
2. O requisito é um **toggle reversível** que oculta **concluídas E perdidas**, sem apagar nada.

A solução é 100% local e assenta numa separação que já existia no `TasksActivity`:
- **`updateSummary()`** itera **`allTasks`** (a lista COMPLETA vinda do backend) → conta pendentes e as
  concluídas/perdidas **de hoje**. **Não foi tocado.**
- **`applyFilters()`** constrói a lista visível **`filteredTasks`** a partir de `allTasks`.

Como o resumo lê `allTasks` e a lista lê `filteredTasks`, **filtrar só a lista** deixa os contadores
intactos: o "Resumo de hoje" (concluídas/perdidas de hoje) e o total de perdidas das Estatísticas
continuam a contar as tarefas ocultas. Ocultar é, portanto, puramente visual e reversível.

## Como está implementado (`TasksActivity.java`)
- **Flag + preferência:** `boolean hideCompletedAndLost` e a constante `KEY_HIDE_DONE = "hide_completed_lost"`
  (no ficheiro de prefs já existente, `PREFS_NAME = "lifinity_prefs"`).
- **`setupHideToggle()`** (chamado no `onCreate`): lê a preferência, chama `updateToggleHiddenButton()` para
  o estado inicial e liga o `onClickListener` — que alterna o flag, **guarda a preferência**, atualiza o
  chip e chama `applyFilters()`.
- **`updateToggleHiddenButton()`:** define texto/fundo/cor do chip conforme o estado (menta+"Mostrar todas"
  quando a ocultar; cinzento+"Ocultar concluídas/perdidas" quando a mostrar tudo). Reaplica o padding a
  seguir ao `setBackgroundResource` (que pode repor o padding do drawable a 0).
- **Filtro em `applyFilters()`:** no início do `for (Task task : allTasks)`:
  ```java
  if (hideCompletedAndLost && (isTaskCompleted(task) || isTaskLost(task))) continue;
  ```
  O resto (pesquisa/estado/prioridade, ordenação, `taskAdapter.setTasks`, `tasksCountLabel`) mantém-se —
  o contador da lista passa a refletir só as **visíveis**, o que é coerente com a lista.
- **Visibilidade:** o chip só faz sentido na **Lista**; em `updateViewModeToggle()` define-se
  `toggleHiddenButton.setVisibility(calendarMode ? GONE : VISIBLE)`.
- **Limpeza:** removeu-se o campo morto `hideCompletedVisibleTasksCall` (e o seu `cancel` no `onDestroy`) —
  nunca era usado.

## Diferença face à web
- **Web:** o botão **arquiva permanentemente** (backend) e só trata das **concluídas**.
- **Android:** é um **toggle reversível** de visualização, que oculta **concluídas e perdidas**, sem
  eliminar nada e sem afetar os contadores.

## Teste-chave
Ativar "Ocultar" → as concluídas/perdidas somem da **lista**, mas o "Resumo de hoje" mantém os mesmos
números de concluídas/perdidas de hoje. Desativar → voltam a aparecer. Reabrir a app → o estado do chip é
lembrado.

## Ligações
- [`TasksActivity.java.md`](TasksActivity.java.md) — secção do filtro de visualização.
- **Nada no backend foi alterado.**
