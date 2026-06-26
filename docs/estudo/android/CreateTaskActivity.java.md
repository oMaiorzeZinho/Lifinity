# `CreateTaskActivity.java` — criar uma tarefa

## Papel
Formulário para **criar** uma tarefa: título, descrição, data-limite e prioridade. É aberto pelo **FAB "+"**
(ver [`BottomNavHelper`](BottomNavHelper.java.md)). Segue os padrões comuns descritos em
[`LoginActivity`](LoginActivity.java.md).

## `onCreate` — montar o formulário e o Spinner de prioridade
```java
if (TextUtils.isEmpty(getToken())) { openLoginActivity(); return; }  // guarda de sessão
setContentView(R.layout.activity_create_task);
... findViewById dos campos ...
ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
        this, R.array.task_priorities, android.R.layout.simple_spinner_item);
adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
prioritySpinner.setAdapter(adapter);
prioritySpinner.setSelection(1);
createButton.setOnClickListener(v -> createTask());
```
- **Guarda de sessão** no topo: sem token, manda para o login (padrão repetido em todas as activities
  internas).
- O **`Spinner`** de prioridade é alimentado por um *array de recursos* `R.array.task_priorities`
  (definido em `res/values/`, ex.: baixa/media/alta). **`createFromResource`** cria o adaptador a partir
  desse array; **`setSelection(1)`** pré-seleciona o **2.º** item (`media`) por defeito.

## `createTask()` — validar e enviar
```java
String priority = prioritySpinner.getSelectedItem().toString();
...
if (TextUtils.isEmpty(title)) { showError("O titulo e obrigatorio."); return; }
CreateTaskRequest request = new CreateTaskRequest(
        title,
        TextUtils.isEmpty(description) ? null : description,
        priority,
        TextUtils.isEmpty(dueDate) ? null : dueDate);
taskApi.createTask("Bearer " + token, request).enqueue(...);
```
- A **prioridade** lê-se do item selecionado do Spinner. O **título é obrigatório**; descrição e data são
  opcionais — quando vazios, envia-se **`null`** (e não `""`), para o backend tratar como "sem valor".
- Constrói o `CreateTaskRequest` e faz `POST /tasks` com o token no cabeçalho.
- Em sucesso: **`Toast`** com a mensagem do servidor (ou uma por defeito) e **`finish()`** — volta à lista,
  que recarrega no `onResume` e mostra a tarefa nova.

## Tratamento de erros
- `getErrorMessage` trata o **401** com uma mensagem dedicada ("Sessao invalida...") e, caso contrário, lê o
  `message`/`error` do JSON de erro. O `onFailure` cobre o servidor inacessível.

## Ligações
- **API/Backend:** [`TaskApi`](api/TaskApi.java.md) (`POST /tasks`) → `taskController`.
- **Model:** `CreateTaskRequest`.
- **Quem abre:** o FAB da barra inferior. **A seguir:** volta à `TasksActivity`.
