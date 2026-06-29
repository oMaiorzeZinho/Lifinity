# `CreateTaskActivity.java` — criar uma tarefa

## Papel
Formulário para **criar** uma tarefa: título, descrição, data-limite, prioridade e **destino** (só para
mim / amigos / grupos). É aberto pelo **FAB "+"** (ver [`BottomNavHelper`](BottomNavHelper.java.md)).
Segue os padrões comuns descritos em [`LoginActivity`](LoginActivity.java.md).

> **Atualizado a 2026-06-29:** acrescentou-se o **destino** (atribuir a amigos/grupos, igual ao browser)
> e o **placeholder "Prioridade"** no spinner. Detalhe: [RETOQUES_TAREFAS_E_INSPIRACAO_2026-06-29.md](RETOQUES_TAREFAS_E_INSPIRACAO_2026-06-29.md).

## `onCreate` — montar o formulário, o spinner e o destino
```java
if (TextUtils.isEmpty(getToken())) { openLoginActivity(); return; }  // guarda de sessão
setContentView(R.layout.activity_create_task);
... findViewById dos campos + secção DESTINO ...
setupPrioritySpinner();   // placeholder "Prioridade" + cores de hint
setupDestination();       // só para mim / amigos / grupos
createButton.setOnClickListener(v -> createTask());
```
- **Guarda de sessão** no topo: sem token, manda para o login (padrão repetido em todas as activities
  internas).
- **`setupPrioritySpinner()` (placeholder):** a lista é `["Prioridade", "baixa", "media", "alta"]` — a
  posição 0 é só um **placeholder** auto-explicativo. Um `ArrayAdapter` **custom (anónimo)** pinta a
  posição 0 com a cor de *hint* (`lifinity_input_hint`) e as restantes com a cor de texto normal, tanto
  no campo fechado (`getView`) como na lista aberta (`getDropDownView`). `setSelection(0)` mostra
  "Prioridade" à partida (em vez da antiga "media" pré-selecionada).
- **`setupDestination()`:** estado inicial "Só para mim" selecionado; liga os cabeçalhos "Amigos"/"Grupos"
  (que mostram/escondem os contentores e trocam a seta ▼/▲) e carrega amigos/grupos.

## Destino — atribuir a amigos/grupos (igual ao browser)
- `loadFriendsAndGroups()` faz `GET /friends` ([`FriendApi`](api/FriendApi.java.md)) e `GET /groups`
  ([`GroupApi`](api/GroupApi.java.md)) e **cria as linhas em runtime** dentro dos contentores (uma por
  amigo/grupo). Listas vazias → texto "Ainda não tens amigos disponíveis." / "Ainda não pertences a
  nenhum grupo.".
- Cada linha alterna o id num `Set<Integer>` (`selectedAssignees`/`selectedGroups`), repinta-se
  (`bg_pill_mint`+verde = selecionada; `bg_card_soft_clay` = não) e atualiza o contador do cabeçalho
  ("Amigos (n)"). Como há destino, "Só para mim" deixa de estar selecionado.
- "Só para mim" limpa os dois `Set` e repõe tudo a não-selecionado.

## `createTask()` — validar e enviar
```java
int priorityPos = prioritySpinner.getSelectedItemPosition();
String priority = (priorityPos <= 0) ? "media" : prioritySpinner.getSelectedItem().toString();
...
if (TextUtils.isEmpty(title)) { showError("O titulo e obrigatorio."); return; }
CreateTaskRequest request = new CreateTaskRequest(
        title,
        TextUtils.isEmpty(description) ? null : description,
        priority,
        TextUtils.isEmpty(dueDate) ? null : dueDate);
request.setAssignees(new ArrayList<>(selectedAssignees));  // vazias = só para mim
request.setGroups(new ArrayList<>(selectedGroups));
taskApi.createTask("Bearer " + token, request).enqueue(...);
```
- **Prioridade:** se a posição for `<= 0` (o placeholder "Prioridade"), envia-se **"media"** (defeito do
  sistema); senão, o item escolhido. **Nunca** se envia a string "Prioridade" — o backend rejeita
  qualquer valor fora de `baixa/media/alta` (400 "Prioridade inválida").
- **Destino:** `setAssignees`/`setGroups` com os `Set` convertidos em lista (vazias = só para mim). O
  backend valida que só se atribui a amigos aceites / grupos a que pertencemos (já o fazia — **não foi
  tocado**).
- O **título é obrigatório**; descrição e data são opcionais — quando vazios, envia-se **`null`** (e não
  `""`), para o backend tratar como "sem valor".
- Em sucesso: **`Toast`** com a mensagem do servidor (ou uma por defeito) e **`finish()`** — volta à lista,
  que recarrega no `onResume` e mostra a tarefa nova.

## Tratamento de erros
- `getErrorMessage` trata o **401** com uma mensagem dedicada ("Sessao invalida...") e, caso contrário, lê o
  `message`/`error` do JSON de erro. O `onFailure` cobre o servidor inacessível.

## Ligações
- **API/Backend:** [`TaskApi`](api/TaskApi.java.md) (`POST /tasks`) → `taskController`;
  [`FriendApi`](api/FriendApi.java.md) (`GET /friends`) e [`GroupApi`](api/GroupApi.java.md)
  (`GET /groups`) para o destino.
- **Models:** `CreateTaskRequest` (com `assignees`/`groups`), `Friend`, `Group`.
- **Quem abre:** o FAB da barra inferior. **A seguir:** volta à `TasksActivity`.
- **Equivalente web:** `frontend/src/pages/Tasks.jsx` (mesma lógica de destino).
