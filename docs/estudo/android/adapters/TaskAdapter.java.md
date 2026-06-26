# `adapters/TaskAdapter.java` — adapter da lista de tarefas

> Esta página explica também o **padrão RecyclerView/Adapter/ViewHolder** que todos os adapters seguem. Os
> outros docs de adapter referem-se a este.

## O que é um Adapter (contexto)
Um `RecyclerView` (lista eficiente) não sabe nada sobre os teus dados. O **Adapter** é a ponte: pega numa
`List` de objetos e, para cada linha visível, "infla" um layout XML e preenche-o. Recicla as *views* à
medida que se faz *scroll* (daí "Recycler") — só existem em memória as linhas visíveis + algumas, mesmo que
a lista tenha milhares de itens.

## As 3 peças
```java
public class TaskAdapter extends RecyclerView.Adapter<TaskAdapter.TaskViewHolder> {
    private final List<Task> tasks = new ArrayList<>();
    public void setTasks(List<Task> newTasks) { tasks.clear(); tasks.addAll(...); notifyDataSetChanged(); }
    @Override public TaskViewHolder onCreateViewHolder(...) { inflar item_task.xml; }
    @Override public void onBindViewHolder(holder, position) { holder.bind(tasks.get(position), ...); }
    @Override public int getItemCount() { return tasks.size(); }
}
```
- **`onCreateViewHolder`** — cria uma linha (infla o layout `R.layout.item_task`) e embrulha-a num
  **`ViewHolder`**. É chamado **poucas vezes** (só o necessário para preencher o ecrã + reserva).
- **`onBindViewHolder`** — preenche uma linha **já criada** com os dados da posição `position`. É chamado
  **muitas vezes** (sempre que uma linha entra no ecrã ao fazer scroll).
- **`getItemCount`** — quantas linhas há.
- **`ViewHolder`** — guarda as referências às *views* da linha (`findViewById` **uma só vez**, no construtor)
  para não as procurar a cada bind (performance).
- **`setTasks(...) + notifyDataSetChanged()`** — troca os dados e manda o RecyclerView redesenhar.

## Comunicar de volta — *listeners* por interface
```java
public interface OnTaskCompleteClickListener { void onTaskCompleteClick(Task task); }
public interface OnTaskOptionsClickListener  { void onTaskOptionsClick(Task task); }
```
O adapter não sabe o que fazer ao concluir/abrir opções — isso é da **activity**. Por isso recebe duas
**interfaces de callback** no construtor; quando se toca nos botões da linha, chama
`completeClickListener.onTaskCompleteClick(task)`. A `TasksActivity` passou `this::confirmCompleteTask` e
`this::showTaskOptions` — é o que liga o toque na lista à lógica do ecrã.

## `bind` — preencher uma linha de tarefa
- Título (com *fallback* "Atividade sem título"); descrição só visível se existir.
- **`bindPriorityPill`** — pinta a pílula de prioridade: "ALTA"/`bg_pill_alta`, "MÉDIA"/`bg_pill_media`,
  "BAIXA"/`bg_pill_baixa` (e um *fallback* neutro).
- **`bindStatus`** — mostra "Concluída"/"Perdida" (ou esconde).
- **`bindDueDate`/`formatShortDate`** — formata as datas para `dd/MM/yyyy` (tentando vários formatos do
  servidor com `parseDate`).
- **Botão concluir** só aparece se `canCompleteTask` (não concluída nem perdida) — a mesma regra da activity,
  repetida aqui para a UI. As funções `isCompleted`/`isLost` são iguais às da `TasksActivity`.

## Ligações
- **Layout da linha:** `res/layout/item_task.xml`. **Model:** `Task`.
- **Quem usa:** `TasksActivity` (lista e diálogo do dia no calendário).
