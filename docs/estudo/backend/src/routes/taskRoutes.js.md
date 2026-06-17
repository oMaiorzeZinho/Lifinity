# `backend/src/routes/taskRoutes.js` — rotas de tarefas

## Papel no projeto
Endpoints de gestão de tarefas. Montado em `/api/tasks`. **Todas** exigem `verifyToken` (privadas). Segue o padrão de router explicado em `authRoutes.js.md`.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/tasks/` | `getTasks` | Listar as tarefas do utilizador (com filtros). |
| GET | `/api/tasks/summary` | `getTaskSummary` | Resumo/contagens (para widgets). |
| POST | `/api/tasks/` | `createTask` | Criar tarefa (com destinos: amigos/grupos). |
| PUT | `/api/tasks/complete/:idtask` | `completeTask` | Concluir tarefa (atribui XP). |
| PUT | `/api/tasks/hide-completed-visible` | `hideCompletedVisibleTasks` | Esconder as concluídas visíveis (arquivo por utilizador). |
| DELETE | `/api/tasks/completed/all` | `clearCompletedTasks` | Limpar todas as concluídas. |
| DELETE | `/api/tasks/:idtask` | `deleteTask` | Apagar uma tarefa. |
| PUT | `/api/tasks/:idtask` | `updateTask` | Editar uma tarefa. |

## Detalhe importante — ordem das rotas
No Express, as rotas são testadas **por ordem**. Repara que `DELETE /completed/all` é declarada **antes** de `DELETE /:idtask`. Se fosse ao contrário, o pedido a `/completed/all` cairia em `/:idtask` (com `idtask = "completed"` ... bem, "all"), e nunca chegaria à rota certa. O mesmo princípio com `/complete/:idtask` e `/hide-completed-visible` antes da rota genérica `/:idtask`. **Regra:** caminhos específicos antes dos caminhos com parâmetro.

## Ligações
- **Controlador:** `taskController.js`.
- **Middleware:** `authMiddleware` (`verifyToken`).
- **Frontend:** página `Tasks.jsx`.
