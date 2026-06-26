# Android — Models de tarefas (4 ficheiros)

> Agrupa: `Task`, `CreateTaskRequest`, `UpdateTaskRequest`, `CompleteTaskResponse`.

## `Task` — uma tarefa vinda do backend
Campos: `idtask`, `title`, `description`, `priority`, `status`, `due_date`, `created_at`. Só *getters*.
**Pormenor de nomes:** os campos JSON `due_date` e `created_at` (estilo snake_case do MySQL) são campos
Java com o mesmo nome, mas os *getters* expõem-nos em camelCase: `getDueDate()`, `getCreatedAt()`. Como o
**nome do campo Java** (`due_date`) bate certo com a chave JSON, o Gson preenche sem precisar de
`@SerializedName` — o nome do *getter* é irrelevante para o Gson (ele olha para os **campos**, não para os
métodos).
- `priority` é texto (`"alta"`/`"media"`/`"baixa"`); `status` é texto (ex.: `"concluida"`); `due_date` é a
  data-limite. Vários ecrãs interpretam estes textos (ex.: ordenar/colorir por prioridade, ver se está
  "perdida" comparando `due_date` com agora).

## `CreateTaskRequest` / `UpdateTaskRequest` — corpos de criar/editar
São **idênticos**: `title`, `description`, `priority`, `due_date`, com construtor
`(title, description, priority, dueDate)`. Viram JSON no `POST /tasks` (criar) e `PUT /tasks/{id}`
(editar). Existem dois por clareza semântica (e para poderem divergir no futuro).
- Repara que o **parâmetro** do construtor é `dueDate` (camelCase) mas o **campo** é `due_date` — é o campo
  que conta para o JSON enviado (`{ ..., "due_date": ... }`), batendo certo com o que o backend espera.

## `CompleteTaskResponse` — resposta ao concluir
Campos: `message`, `newXP`, `newLevel`. Quando se conclui uma tarefa (`PUT /tasks/complete/{id}`), o
backend devolve o **XP e o nível novos** (calculados no módulo C). A app usa isto para dar *feedback*
("ganhaste X XP", subir de nível) sem ter de recarregar o perfil.

## Ligações
- **API:** [`TaskApi`](../api/TaskApi.java.md).
- **Backend:** `taskController.js` (+ módulo C `gamification.c` para o XP).
- **Quem usa:** `TasksActivity`, `CreateTaskActivity`, `EditTaskActivity`, `TaskAdapter`.
