# `api/TaskApi.java` — interface Retrofit das tarefas

## Papel
Agrupa todos os pedidos sobre **tarefas**: listar, criar, concluir, editar, apagar e esconder concluídas.
Todos exigem token (`@Header("Authorization")`).

## Código e explicação
```java
@GET("tasks")
Call<List<Task>> getTasks(@Header("Authorization") String authorization);
```
- **GET** a `.../api/tasks` → devolve a **lista de tarefas** do utilizador (já filtrada/visível pelo
  backend). O `@Header("Authorization")` envia o cabeçalho `Authorization: Bearer <token>` — é assim que o
  backend (`authMiddleware`) sabe quem está a pedir.

```java
@POST("tasks")
Call<JsonObject> createTask(@Header(...) String auth, @Body CreateTaskRequest request);
```
- **POST** para criar. O corpo é um `CreateTaskRequest` (título, prazo, prioridade, etc.). Devolve um
  `JsonObject` genérico (a resposta do backend, ex.: `{ message, ... }`) — quando a app não precisa de um
  modelo tipado, usa o `JsonObject` do Gson e lê os campos à mão.

```java
@PUT("tasks/complete/{idtask}")
Call<CompleteTaskResponse> completeTask(@Header(...) String auth, @Path("idtask") int idtask);
```
- **PUT** para **concluir** a tarefa nº `idtask`. O **`@Path("idtask")`** substitui o `{idtask}` no caminho
  pelo número passado (ex.: `tasks/complete/42`). Devolve um `CompleteTaskResponse` (XP/nível ganhos, etc.).

```java
@PUT("tasks/hide-completed-visible")
Call<JsonObject> hideCompletedVisibleTasks(@Header(...) String auth);

@PUT("tasks/{idtask}")
Call<JsonObject> updateTask(@Header(...) String auth, @Path("idtask") int idtask, @Body UpdateTaskRequest request);

@DELETE("tasks/{idtask}")
Call<JsonObject> deleteTask(@Header(...) String auth, @Path("idtask") int idtask);
```
- **`hideCompletedVisibleTasks`** — esconde da lista as concluídas visíveis (limpeza visual).
- **`updateTask`** — **PUT** com `@Path` + `@Body` (edição completa de uma tarefa).
- **`deleteTask`** — **DELETE** da tarefa nº `idtask`.

## Resumo dos verbos HTTP
GET = ler, POST = criar, PUT = atualizar, DELETE = apagar. É a convenção **REST** que o backend segue.

## Ligações
- **Backend:** [`taskRoutes.js`](../../backend/src/routes/taskRoutes.js.md) / [`taskController.js`](../../backend/src/controllers/taskController.js.md).
- **Models:** `Task`, `CreateTaskRequest`, `UpdateTaskRequest`, `CompleteTaskResponse`.
- **Quem chama:** `TasksActivity`, `CreateTaskActivity`, `EditTaskActivity`, `ProfileActivity` (resumo).
