# `EditTaskActivity.java` — editar uma tarefa

## Papel
Formulário para **editar** uma tarefa existente. Muito parecido com o
[`CreateTaskActivity`](CreateTaskActivity.java.md), com duas diferenças importantes: **recebe os dados da
tarefa por `Intent`** (para pré-preencher o formulário) e faz `PUT /tasks/{id}` em vez de `POST`.

## Receber a tarefa via `Intent` (extras)
```java
public static final String EXTRA_IDTASK = "idtask";
public static final String EXTRA_TITLE = "title";
... EXTRA_DESCRIPTION, EXTRA_PRIORITY, EXTRA_DUE_DATE ...

idtask = getIntent().getIntExtra(EXTRA_IDTASK, -1);
if (idtask <= 0) { Toast(...); finish(); return; }
```
- Quem abre este ecrã (a `TasksActivity`, via `TaskAdapter`) mete os dados da tarefa no **Intent** como
  "extras" (pares chave-valor). Aqui leem-se com `getIntent().getIntExtra(...)` / `getStringExtra(...)`.
- As **constantes `EXTRA_*`** públicas são o "contrato": quem envia e quem recebe usam as **mesmas chaves**.
  É a forma padrão de passar dados entre activities.
- Se o `idtask` for inválido (≤ 0), aborta logo (`Toast` + `finish()`).

## `fillForm` — pré-preencher
```java
titleInput.setText(intent.getStringExtra(EXTRA_TITLE));
descriptionInput.setText(intent.getStringExtra(EXTRA_DESCRIPTION));
dueDateInput.setText(formatDueDateForInput(intent.getStringExtra(EXTRA_DUE_DATE)));
String priority = intent.getStringExtra(EXTRA_PRIORITY);
int position = adapter.getPosition(TextUtils.isEmpty(priority) ? "media" : priority);
prioritySpinner.setSelection(position >= 0 ? position : 1);
```
- Põe os valores recebidos nos campos. Para o Spinner, **procura a posição** do texto da prioridade
  (`adapter.getPosition("alta")`) e seleciona-a; se não encontrar, usa o índice 1 (`media`).

### `formatDueDateForInput` — ajustar o formato da data
```java
String normalized = dueDate.trim().replace(" ", "T");
if (normalized.length() >= 16) return normalized.substring(0, 16);
return normalized;
```
- A data vem do backend como `"2026-06-30 14:00:00"` (ou com `T`). O campo de input espera `yyyy-MM-ddTHH:mm`
  (16 caracteres). Então: troca o espaço por **`T`** e corta nos **16** primeiros caracteres (tira os
  segundos). Pequeno mas essencial para a edição mostrar a data certa.

## `updateTask()` — guardar
Igual ao criar, mas com `UpdateTaskRequest` e `taskApi.updateTask("Bearer " + token, idtask, request)`
(**`PUT /tasks/{idtask}`**). Em sucesso, `Toast` + `finish()` (volta à lista, que recarrega). O título
continua obrigatório; vazios → `null`.

## Ligações
- **API/Backend:** [`TaskApi`](api/TaskApi.java.md) (`PUT /tasks/{id}`) → `taskController`.
- **Model:** `UpdateTaskRequest`.
- **Quem abre:** `TasksActivity`/`TaskAdapter` (botão editar, passando os `EXTRA_*`).
