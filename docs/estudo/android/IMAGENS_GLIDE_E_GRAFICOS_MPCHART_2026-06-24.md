# Android — Imagens de avatar (Glide) + Gráficos das Estatísticas (MPAndroidChart) — 2026-06-24

> Duas funcionalidades **aditivas**, ambas com bibliotecas novas, mantendo o tema claro e a
> lógica de negócio existentes:
> 1. **Imagens reais de perfil (avatares)** com o **Glide**.
> 2. **Gráficos a sério** na página de Estatísticas com o **MPAndroidChart**.

---

## 0. Configuração das bibliotecas (uma vez para as duas)

Ambas vivem no **JitPack**, por isso bastou adicioná-lo uma vez:

- `settings.gradle.kts` → em `dependencyResolutionManagement.repositories`:
  `maven { url = uri("https://jitpack.io") }` (o projeto usa `FAIL_ON_PROJECT_REPOS`,
  por isso os repositórios declaram-se aqui, não no módulo).
- `app/build.gradle.kts` → em `dependencies`:
  - `implementation("com.github.bumptech.glide:glide:4.16.0")` — uso simples
    `Glide.with(...).load(...).circleCrop().into(...)`, **sem** `annotationProcessor`
    (não criámos `AppGlideModule`, não é preciso).
  - `implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")`.

A permissão `INTERNET` já existia no Manifest (necessária para o Glide ir buscar as imagens).

> Nota de versionamento: o `build.gradle.kts` tem o `API_BASE_URL` (IP local) e **não** é
> commitado com o IP local. As dependências novas foram, ainda assim, incluídas no commit
> mantendo o IP que já estava no repositório (stage seletivo do ficheiro).

---

## TAREFA 1 — Imagens de perfil com Glide

### Como se monta o URL da imagem
O backend serve as imagens em `/uploads` (estático) e guarda na BD caminhos como
`/uploads/avatars/x.jpg`. O URL completo monta-se **igual ao frontend web**
(`frontend/src/utils/imageUrl.js`): pega no `API_BASE_URL` **sem** o sufixo `/api` e
concatena o caminho.

- **`utils/ImageUrlHelper.java`** — `build(path)`:
  - `path` null/vazio → `null` (não há imagem; usa-se o placeholder);
  - `path` que já começa por `http` → devolve tal como está;
  - caso contrário → `API_BASE_URL.replaceFirst("/api/?$", "") + path`.
  - Ex.: `http://IP:3000/api/` + `/uploads/avatars/x.jpg` → `http://IP:3000/uploads/avatars/x.jpg`.

### Como se carrega o avatar (com fallback)
- **`utils/AvatarLoader.java`** — `load(ImageView image, String avatarPath, TextView initialView, String username)`:
  - escreve sempre a **inicial** no placeholder (se `initialView`/`username` forem dados);
  - se houver caminho → `Glide.with(...).load(url).circleCrop().into(image)` e
    `image` fica **visível** (a foto redonda cobre o placeholder);
  - se **não** houver, ou se a foto **falhar** (RequestListener `onLoadFailed`) → `image`
    fica `GONE` e reaparece o placeholder (círculo claro + inicial).

### Padrão nos layouts
Cada avatar era um `TextView` (círculo `bg_avatar_clay` + inicial). Envolveu-se num
`FrameLayout` com uma `ImageView` circular **por cima** (`scaleType="centerCrop"`,
`visibility="gone"` por defeito). O Glide faz o recorte redondo (`circleCrop`).

### Onde foi aplicado
| Local | Backend devolve avatar? | Resultado |
|---|---|---|
| **Perfil** (avatar grande, `activity_profile` + `ProfileActivity`) | **Sim** (login/perfil) | foto real |
| **Ranking — lista** (`item_ranking` + `RankingAdapter`) | **Sim** (ranking) | foto real |
| **Ranking — pódio** (3 avatares, `activity_ranking` + `RankingActivity`) | **Sim** | foto real; a **medalha** fica como fallback por baixo |
| **Amigos** (`item_friend` + `FriendAdapter`) | **Não** (ainda) | placeholder (inicial) |
| **Pedidos de amizade** (`item_friend_request` + `FriendRequestAdapter`) | **Não** (ainda) | placeholder (inicial) |

A app já está **pronta** para mostrar as fotos nesses últimos sítios — só falta o backend
incluir `avatar` no `SELECT`. Ver TODOs abaixo.

### Modelos
Adicionou-se o campo `avatar` (+ `getAvatar()`) a `User`, `RankingUser`, `Friend`,
`FriendRequest` e `GroupMember`. Nos modelos onde o backend ainda não devolve avatar, o
campo fica `null` (fallback) e há um **TODO(backend)** no próprio modelo.

### TODO (backend — NÃO alterado nesta tarefa)
Estes endpoints, usados pelo Android para listar utilizadores, ainda **não** incluem
`avatar` no `SELECT` (logo, mostram o placeholder):
- `GET /friends` e `GET /friends/search` (`friendController`);
- `GET /friends/requests` (`friendController`);
- `GET /groups/{id}/members` (`groupController`).
Já devolvem avatar: o **ranking** e o **perfil/login** (`userController`/`authController`).

> Conversas (`item_conversation`) e itens de tarefa (`item_task`) **não têm avatar** (não
> há sequer campo de utilizador/foto nesses dados), por isso ficaram de fora.

---

## TAREFA 2 — Gráficos das Estatísticas com MPAndroidChart

### O bug que existia
O endpoint `/statistics/me` devolve `{ period, summary, chartData, ... }`, mas o Android
desserializava a resposta **inteira** para `StatisticsSummary`, lendo campos no nível errado
e com **nomes que não existiam** no backend (`tasksCreated`, `xpEarned`, `currentStreak`,
`bestDay`). Resultado: a página mostrava quase tudo a "—".

### Correções de dados
- `StatisticsApi.getStatistics(...)` passou a devolver **`StatisticsResponse`**
  (`{ period, summary, chartData }`), não `StatisticsSummary`.
- `StatisticsSummary` reescrito com as chaves **reais** do módulo C
  (`gamification.calculateStats`): `totalTasks`, `completedTasks`, `pendingTasks`,
  `lostTasks`, `totalXP`, `completionRate` (já em **0–100**), `productivityScore`.
- `StatisticsDay` (já existia) tem por dia: `date`, `label` (dd/MM), `tasksCreated`,
  `tasksCompleted`, `tasksLost`, `xpGained`.

### A nova página (`activity_statistics.xml` + `StatisticsActivity`)
- **Totais** numa grelha de 2 colunas (cartões brancos, número grande):
  Concluídas, Criadas (`totalTasks`), Perdidas, XP ganho, Taxa de conclusão (`%`),
  Produtividade. Cores: verde para positivas (concluídas/XP), coral para perdidas.
- **Gráfico 1 — `BarChart` (barras empilhadas):** por dia, **concluídas** (verde) +
  **perdidas** (coral) na mesma barra (`BarEntry(x, new float[]{conc, perd})` +
  `setStackLabels`). Legenda discreta em baixo.
- **Gráfico 2 — `LineChart`:** **XP ganho** por dia (linha verde `CUBIC_BEZIER`,
  preenchida com verde translúcido). Sem legenda (série única).
- **Estilo do tema claro** (`styleCommon`): sem descrição/moldura pesada, eixo X em baixo
  com as etiquetas dos dias (sem linhas de grelha), eixo Y à esquerda a começar em 0,
  texto dos eixos em `lifinity_text_secondary`, grelha subtil (`lifinity_border`), eixo
  direito desligado, animação `animateY`. Altura de 240dp por gráfico (respiram, ao
  contrário dos "tracinhos" minúsculos de antes).
- **Seletor de período** (7 dias / 30 dias / 1 ano) mantido; mudar o período recarrega e
  redesenha os dois gráficos. Em períodos longos os pontos da linha são ocultados e o
  número de etiquetas do eixo X é limitado (`setLabelCount(... , false)`) para não ficar ilegível.

---

Validado com `gradlew :app:assembleDebug` → **BUILD SUCCESSFUL** (1.ª build descarrega o
Glide e o MPAndroidChart do JitPack). Sem alterações ao backend.
