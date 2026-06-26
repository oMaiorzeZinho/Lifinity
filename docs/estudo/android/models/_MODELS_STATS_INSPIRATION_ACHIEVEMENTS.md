# Android — Models de estatísticas, inspiração e conquistas (5 ficheiros)

> Agrupa: `StatisticsResponse`, `StatisticsSummary`, `StatisticsDay`, `Verse`, `Achievement`.

## Estatísticas (3 models encaixados)
O `GET /statistics/me` devolve um objeto com **três níveis**, espelhados por três classes:

### `StatisticsResponse` — o "envelope"
Campos: `period` (semana/mês), `summary` (um `StatisticsSummary`) e `chartData` (uma
`List<StatisticsDay>`). É o tipo de retorno do `StatisticsApi.getStatistics(...)`. Agrupar assim resolveu o
bug antigo em que a app lia campos errados (correção de 2026-06-24).

### `StatisticsSummary` — os totais (vêm do módulo C)
Campos: `totalTasks`, `completedTasks`, `pendingTasks`, `lostTasks`, `totalXP`, `completionRate` (0–100) e
`productivityScore` (0–100). O comentário no código frisa que as chaves correspondem **exatamente** às
devolvidas pelo C (`gamification.calculateStats`). Os *getters* fazem **null-safety** (devolvem 0/0.0 se
faltar), porque alimentam diretamente os cartões de números.

### `StatisticsDay` — um dia do gráfico
Campos: `date`, `label`, `tasksCreated`, `tasksCompleted`, `tasksLost`, `xpGained`. Cada item da
`chartData` é um dia; o `StatisticsActivity` usa-os para desenhar o **BarChart** (concluídas/perdidas por
dia) e o **LineChart** (XP por dia) com o MPAndroidChart. `getLabel()` devolve `""` se vier `null`.

## `Verse` — um versículo
Campos: `idverse`, `idfavorite`, `text`, `book`, `chapter`, `verse`, `theme`, `isFavorite` (com *setter*
`setIsFavorite` — único campo mutável, para a app alternar o estado localmente sem recarregar).
- `getReference()` (no ecrã) junta `book chapter:verse`. O `theme` é o que o **filtro por tema** dos
  favoritos usa. Serve tanto para o versículo do dia/aleatório como para a lista de favoritos.

## `Achievement` — uma conquista (badge)
Campos: `idbadge`, `code`, `name`, `description`, `category`, `icon_url`, `earned_at`, `unlocked`,
`highlighted`, `position`. **Pormenores úteis:**
- **`isUnlocked()`/`isHighlighted()`** usam `Boolean.TRUE.equals(...)` — assim, se o campo vier `null`,
  devolvem `false` em vez de rebentar com um *NullPointerException* (cuidado clássico com `Boolean` em
  Java).
- `position` (1..3) e `highlighted` suportam a funcionalidade de **destacar** 3 conquistas.

## Ligações
- **APIs:** [`StatisticsApi`](../api/StatisticsApi.java.md), [`InspirationApi`](../api/InspirationApi.java.md), [`AchievementApi`](../api/AchievementApi.java.md).
- **Backend:** `statisticsController.js` (+ C), `inspirationController.js`, `achievementController.js`.
- **Quem usa:** `StatisticsActivity`, `InspirationActivity`, `AchievementsActivity`, `ProfileActivity`.
