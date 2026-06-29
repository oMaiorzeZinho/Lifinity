# Android — Retoques nas Tarefas e Inspiração + atribuir tarefas a amigos/grupos (2026-06-29)

> Seis alterações **só no Android**, todas no **tema claro** já existente. **O backend NÃO foi
> tocado** — as Tarefas 5 e 6 usam apenas endpoints/campos que o `taskController` já aceitava.
> Validado com `gradlew :app:assembleDebug` → **BUILD SUCCESSFUL**.

Ficheiros tocados:
- `res/layout/activity_tasks.xml` (T1, T2, T3) + `TasksActivity.java` (T1)
- `res/drawable/bg_level_badge.xml` (T3, **novo**) + reutilização de `res/drawable/xp_progress_bar.xml` (T3)
- `res/layout/activity_inspiration.xml` (T4)
- `res/layout/activity_create_task.xml` (T5, T6) + `CreateTaskActivity.java` (T5, T6) + `models/CreateTaskRequest.java` (T5)

---

## T1 — Remover a pill "utilizador · NÍV X" do cabeçalho das Tarefas

**Problema:** no cabeçalho, o wordmark "Lifinity" aparecia cortado ("Lifin…"). A causa era a
**pill de utilizador** (`headerUserPill`, ex.: "teste · NÍV 8") que, somada ao ícone de
estatísticas e ao sino, apertava o espaço do bloco "Logo + marca" (que tem `layout_weight="1"`).

**Solução:** removeu-se a pill **por completo** do XML. O nível continua bem visível no **cartão
XP** logo abaixo, por isso a pill era redundante. Sem ela, o bloco da marca tem espaço de sobra e
o "Lifinity" (que já tinha `maxLines="1"`/`singleLine="true"`) deixa de cortar.

**Porque também se mexeu no Java (obrigatório):** a pill era usada em **3 sítios sem proteção
`null`** no `TasksActivity.java`. Se só se removesse do XML, o `findViewById(R.id.headerUserPill)`
devolveria `null` e o `headerUserPill.setText(...)` em `bindUserHeader()` rebentaria com
**`NullPointerException`** ao abrir o ecrã. Removeram-se as três referências:
1. o campo `private TextView headerUserPill;`
2. a linha `headerUserPill = findViewById(R.id.headerUserPill);` (em `bindViews()`)
3. o bloco `if (!TextUtils.isEmpty(username)) { headerUserPill.setText(username + " · NÍV " + level); }`

A saudação ("Bom trabalho, X") e o cartão XP **não** dependiam da pill, por isso mantêm-se.

---

## T2 — "Resumo de hoje": "CONCLUÍDAS" tem de caber numa linha só

**Problema:** no cartão "RESUMO DE HOJE", o label **"CONCLUÍDAS"** quebrava para duas linhas
("CONCLUÍD"+"AS"), porque os três labels tinham **`letterSpacing="0.05"`** e os mini-cartões são
estreitos (3 colunas com `weight=1`).

**Solução** (aplicada igual aos **três** labels — PENDENTES, CONCLUÍDAS, PERDIDAS):
- **Removido o `android:letterSpacing`** — o espaçamento entre letras era o que fazia transbordar.
- Adicionado `android:maxLines="1"` + `android:singleLine="true"`.
- `layout_width` de `wrap_content` → `match_parent` + `android:gravity="center"` (dá uma largura de
  referência ao autosize e centra o texto).
- **Autosize do AppCompat** (funciona em qualquer versão de Android, ao contrário do autosize
  nativo que só existe a partir do API 26):
  ```xml
  app:autoSizeTextType="uniform"
  app:autoSizeMinTextSize="8sp"
  app:autoSizeMaxTextSize="10sp"
  app:autoSizeStepGranularity="1sp"
  ```
  → o texto **encolhe só o necessário** (entre 10sp e 8sp) em vez de quebrar.
- Para o namespace `app:` funcionar, garantiu-se `xmlns:app="http://schemas.android.com/apk/res-auto"`
  na **tag raiz** do `activity_tasks.xml` (não existia, foi acrescentado).
- Bónus: padding dos três mini-cartões de `12dp` → `10dp`, dando um pouco mais de largura útil.

> **Nota técnica:** o autosize precisa de uma largura **fixa/limitada** para calcular o tamanho —
> por isso o `match_parent` (em vez de `wrap_content`) é essencial aqui.

---

## T3 — Cartão "NÍVEL · XP" mais polido (badge + barra de XP encorpada)

**Objetivo:** dar um aspeto mais "de jogo" ao cartão do topo das Tarefas, **mantendo os mesmos ids**
(`xpCardLevelNumber`, `xpCardXpNumber`, `xpCardProgressBar`, `xpCardProgressLabel`) para o
`TasksActivity.java` **não precisar de alterações**.

1. **Novo drawable `res/drawable/bg_level_badge.xml`** — retângulo arredondado (raio 20dp) com
   gradiente verde da marca (`primary_light → primary`, ângulo 135°). É o "selo" do nível.
2. **Reutilização do `xp_progress_bar.xml`** — este drawable já existia (criado para a barra de XP
   do Perfil) mas **não estava a ser usado** nas Tarefas. A barra passou a usar
   `android:progressDrawable="@drawable/xp_progress_bar"` (em vez de `progressTint`/`progressBackgroundTint`)
   e ganhou corpo com `layout_height`/`minHeight`/`maxHeight = 16dp`.
   > **Porque o `maxHeight`?** Um `ProgressBar` horizontal limita a altura do **desenho** pelo
   > `maxHeight`. Sem ele a barra ficaria fina, mesmo com `layout_height` maior.
3. **Layout reestruturado para horizontal:** badge verde à esquerda (72×72dp, com "NÍVEL" + número
   em branco) + coluna direita com o XP em destaque (32sp) + " XP" (verde, 16sp) + barra + label.
   O label "NÍVEL" antigo (que estava solto por cima) foi **removido** — agora vive dentro do badge.

---

## T4 — Inspiração: banner do versículo um pouco mais alto (200dp → 250dp)

**Problema:** o banner do versículo tinha **altura fixa 200dp** e versículos mais longos (ex.:
**João 14:27**) cortavam a **referência** em baixo.

**Solução:** `android:layout_height` do `FrameLayout @id/inspirationVerseHero` de `200dp` → `250dp`
(só um pouco, para a referência caber). Mantém-se tudo o resto: `centerCrop`, overlay, `clipToOutline`.
O comentário em cima do `FrameLayout` foi atualizado para refletir os 250dp e a razão.

> **Porquê altura fixa (e não `wrap_content`)?** Já documentado em
> [CABECALHOS_E_BANNER_2026-06-27.md](CABECALHOS_E_BANNER_2026-06-27.md): com a `ImageView` de fundo
> em `match_parent` dentro de um `FrameLayout` em `wrap_content`, a imagem grande **inflava** a
> medição e esticava a faixa. A altura fixa resolve isso — só se ajustou o valor.

---

## T5 — Criar tarefa: atribuir a amigos e grupos (igual ao browser)

**Contexto:** o backend `POST /tasks` (`taskController.createTask`) **já** aceitava no corpo JSON
os arrays **`assignees`** (iduser de amigos) e **`groups`** (idgroup), e valida que só se atribui a
amigos aceites / grupos a que pertencemos. O frontend web (`Tasks.jsx`) já fazia isto; **faltava
replicar no Android**. **Nada do backend foi alterado.**

**`models/CreateTaskRequest.java`:** acrescentados os campos `List<Integer> assignees` e
`List<Integer> groups` (nomes **exatos** para o GSON gerar o JSON certo), inicializados a lista
vazia, com `setAssignees`/`setGroups`. O construtor antigo `(title, description, priority, dueDate)`
**mantém-se** (compatibilidade) — as listas preenchem-se pelos setters.

**`res/layout/activity_create_task.xml`:** nova secção **"DESTINO"** por baixo da data limite:
- "Só para mim" (`createTaskOnlyMeButton`);
- cabeçalho "Amigos" clicável (`createTaskFriendsHeader` + seta `createTaskFriendsArrow`) e contentor
  `createTaskFriendsContainer` (escondido, preenchido em Java);
- o mesmo para "Grupos".

> **Nada de `<Button>`** nesta secção: o tema Material converte `<Button>` em `MaterialButton` e
> estraga o aspeto (foi o que aconteceu com os "•••" e o FAB). Usaram-se `LinearLayout`/`TextView`
> clicáveis.

**`CreateTaskActivity.java`:**
- carrega amigos (`FriendApi.getFriends`) e grupos (`GroupApi.getMyGroups`) e cria as **linhas em
  runtime** dentro dos contentores (username / nome do grupo);
- estado visual: selecionada = `bg_pill_mint` + texto verde; não-selecionada = `bg_card_soft_clay`
  + texto normal (espelha o `lifinity-selected` vs `lifinity-button-secondary` do browser);
- tocar numa linha alterna o id no `Set` respetivo, repinta a linha, atualiza o contador no
  cabeçalho ("Amigos (n)") e marca "Só para mim" como **não** selecionado;
- "Só para mim" limpa os dois `Set`, repõe todas as linhas e os contadores;
- os cabeçalhos alternam a visibilidade do contentor e a seta (▼/▲);
- listas vazias mostram "Ainda não tens amigos disponíveis." / "Ainda não pertences a nenhum grupo.";
- no `createTask()`, `request.setAssignees(...)` e `request.setGroups(...)` (vazias = só para mim).

---

## T6 — Prioridade com placeholder "Prioridade" (em vez de "media" por defeito)

**Problema:** o spinner abria já em "media" (`setSelection(1)`) e o utilizador não percebia o campo.

**Cuidado:** o backend **rejeita** prioridades fora de `["baixa","media","alta"]` (400 "Prioridade
inválida"). Logo, **nunca** se pode enviar a string "Prioridade".

**Solução** (`CreateTaskActivity.java`):
- lista do spinner = `["Prioridade", "baixa", "media", "alta"]` (posição 0 = placeholder);
- **`ArrayAdapter` custom (anónimo)** que pinta a posição 0 com a cor de hint
  (`@color/lifinity_input_hint`) e as restantes com `@color/lifinity_input_text` — para o 0 parecer
  mesmo um placeholder, tanto no campo fechado (`getView`) como na lista aberta (`getDropDownView`);
- `prioritySpinner.setSelection(0)` por defeito (mostra "Prioridade");
- no `createTask()`: se a posição for `<= 0` (placeholder), `priority = "media"`; senão usa o item
  selecionado.

> Resultado: campo auto-explicativo à partida; se o utilizador não tocar, a tarefa fica com a
> prioridade **"media"** (defeito do sistema, aceite pelo backend). O array de recursos
> `R.array.task_priorities` deixou de ser usado neste ecrã (passou-se a uma lista construída em Java).

## Ligações
- [`TasksActivity.java.md`](TasksActivity.java.md) · [`CreateTaskActivity.java.md`](CreateTaskActivity.java.md) · [`InspirationActivity.java.md`](InspirationActivity.java.md)
- [`models/_MODELS_TASKS.md`](models/_MODELS_TASKS.md) · [`res/drawable/_DRAWABLES_CLAY.md`](res/drawable/_DRAWABLES_CLAY.md)
- **Backend (inalterado):** `taskController.createTask` (já aceitava `assignees`/`groups`).
