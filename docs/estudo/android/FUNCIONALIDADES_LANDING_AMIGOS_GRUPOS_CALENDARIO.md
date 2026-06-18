# Android — Landing, Amigos/Grupos e Calendário (paridade com a web)

> Três funcionalidades acrescentadas à app Android (Java + XML + Retrofit), todas a
> **replicar lógica que já existia na web** e a reutilizar os recursos visuais clay já
> presentes. Cada secção lista os ficheiros envolvidos, o que fazem e as decisões tomadas.

---

## TAREFA 1 — Landing (ecrã de boas-vindas público)

**Referência web:** `frontend/src/pages/Home.jsx` (página pública com marca, funcionalidades e CTAs).

**Ficheiros:**
- `res/layout/activity_landing.xml` — ScrollView clay: logo, etiqueta, frase de apresentação,
  dois CTAs (topo), 6 cartões de funcionalidade (Gestão de tarefas, Gamificação, Estatísticas,
  Comunidade, Inspiração diária, Assistente) e um cartão CTA final.
- `LandingActivity.java` — apenas encaminha: "Criar conta" → `RegisterActivity`,
  "Entrar"/"Já tenho conta" → `LoginActivity` (sem lógica de sessão própria).
- `MainActivity.java` — **única alteração Java fora dos ecrãs novos**: sem token passa a abrir
  `LandingActivity` (antes ia direto ao Login); com token continua a ir ao `TasksActivity`.
- `AndroidManifest.xml` — regista `LandingActivity`.

**Decisões:**
- A Landing só aparece quando **não há sessão** — o `MainActivity` continua a ser o porteiro.
- **Hierarquia de CTAs** coerente com o refinamento já feito: "Criar conta" é o botão primário
  (clay menta) e "Entrar" é o ghost discreto (`btn_ghost_clay`).
- As 6 funcionalidades vêm do array `features` da Home.jsx, adaptadas a cartões `bg_card_soft_clay`
  com ícone (emoji) + título + descrição, no mesmo estilo dos cartões do hub Comunidade.

---

## TAREFA 2 — Amigos e Grupos (concluir a Comunidade)

**Referências:** secção de amigos/grupos da web (`Community.jsx`) e o backend
`routes/friendRoutes.js` + `controllers/friendController.js`, `routes/groupRoutes.js` +
`controllers/groupController.js`. **Todos os endpoints já existiam** — não foi inventado nada.

**Endpoints usados (montados em `/api/friends` e `/api/groups`):**

| Amigos | Grupos |
|---|---|
| `GET /friends` (lista) | `GET /groups` (os meus grupos) |
| `GET /friends/search?query=` | `POST /groups` (criar) |
| `GET /friends/requests` | `POST /groups/join` (entrar por código) |
| `POST /friends/request` | `GET /groups/{id}/members` |
| `PUT /friends/requests/{id}/accept` | `POST /groups/{id}/conversation` (abrir chat) |
| `DELETE /friends/requests/{id}` (recusar) | `PUT /groups/{id}/lock` (trancar/destrancar) |
| `DELETE /friends/{idfriend}` (remover) | `DELETE /groups/{id}/leave` · `DELETE /groups/{id}` |

**Modelos (`models/`):** `Friend`, `FriendRequest`, `SendFriendRequest`, `Group`, `GroupMember`,
`CreateGroupRequest`, `JoinGroupRequest` — campos a espelhar exatamente o JSON do backend.

**Interfaces Retrofit (`api/`):** `FriendApi`, `GroupApi`.

**Adapters (`adapters/`):**
- `FriendAdapter` — **reutilizado** para a lista de amigos E para os resultados de pesquisa; o
  texto do botão ("Remover" / "Adicionar") e a ação são passados no construtor (evita duplicação).
- `FriendRequestAdapter` — pedidos recebidos com aceitar (✓) / recusar (✕).
- `GroupAdapter` — cartão de grupo com nº de membros, badge de papel (Admin) e de trancado.

**Ecrãs (`*.java` + `res/layout/`):**
- `FriendsActivity` / `activity_friends.xml` — cartão "Adicionar amigo" (pesquisa + resultados),
  secção "Pedidos recebidos" (só visível se houver) e "Os meus amigos" (remover).
- `GroupsActivity` / `activity_groups.xml` — cartões "Criar grupo" e "Entrar com código" e a lista
  "Os meus grupos". O clique num grupo abre um menu de ações.
- Items: `item_friend.xml`, `item_friend_request.xml`, `item_group.xml`.
- `CommunityActivity.java` — os cartões "Amigos" e "Grupos" (que mostravam "Em breve") passam a
  abrir os ecrãs reais.
- `AndroidManifest.xml` — regista `FriendsActivity` e `GroupsActivity`.

**Decisões:**
- O **menu de ações do grupo** adapta-se ao papel: ver membros e copiar código para todos; abrir
  conversa do grupo (reutiliza o `ChatActivity` via `POST /groups/{id}/conversation`); trancar
  apenas para o dono; sair apenas para quem não é dono (o backend impede o dono de sair); apagar
  para dono/admin. O dono é detetado comparando `idowner` com o `iduser` guardado em SharedPreferences.
- A lista de **membros** é apresentada num diálogo só de leitura (nome · nível · admin). A moderação
  avançada (expulsar/suspender) existe no backend mas ficou de fora deste passe para manter o ecrã
  simples — é uma possível evolução futura, não um endpoint em falta.

---

## TAREFA 3 — Calendário nas Tarefas (vista lista/calendário)

**Referência web:** `frontend/src/pages/Tasks.jsx` (o componente `TaskCalendar` e o `viewMode`).

**Ficheiros alterados:**
- `res/layout/activity_tasks.xml` — segmento "Lista / Calendário"; `id` nas linhas de filtros e do
  rótulo da lista (para as esconder em modo calendário); contentor do calendário com navegação de
  mês, cabeçalho dos dias da semana e um `GridLayout` de 7 colunas preenchido em Java.
- `res/values/styles.xml` (novo) — estilo `CalendarWeekday` (7 colunas iguais no cabeçalho).
- `TasksActivity.java` — `setupViewToggle`, `setCalendarMode`, `updateViewModeToggle`,
  `buildCalendar`, `makeDayCell`/`makeTaskPill`/`makeEmptyCell`, `openDayTasksDialog` e utilitários.

**Decisões:**
- **Nativo, não webview** (regra do enunciado): grelha desenhada com `GridLayout` + células criadas
  em Java; fundos arredondados com `GradientDrawable` (bordo menta = hoje, coral = dia com tarefa
  perdida). As mini-pills dos títulos usam os drawables de prioridade já existentes (`bg_pill_*`).
- **Agrupamento por prazo** igual à web: as tarefas são agrupadas por `due_date` (chave `yyyy-MM-dd`).
  **Tarefas sem prazo não entram no calendário** — ficam só na lista.
- **Domingo primeiro** no cabeçalho (Dom…Sáb), como na web.
- Tocar num dia com tarefas abre um diálogo que **reutiliza o `TaskAdapter`** — logo, as ações
  (concluir / editar / ocultar-eliminar) e as validações são exatamente as mesmas da lista, sem
  duplicar lógica de negócio.
- O calendário usa **todas as tarefas com prazo** (os filtros de pesquisa/estado, que ficam ocultos
  em modo calendário, não se aplicam aqui) — comportamento previsível para o utilizador.

---

Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL). Sem alterações à lógica de negócio
existente nem à navegação aprovada (à exceção do encaminhamento mínimo do `MainActivity` para a Landing).
