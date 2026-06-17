# `backend/src/controllers/statisticsController.js` — estatísticas e comparações

## Papel no projeto
Gera os dados da página de **Estatísticas**: resumo + dados para gráficos (por dia), e comparações com um **amigo** ou a **média de um grupo**. Usa o módulo C para o resumo.

## Imports e helpers
```js
const gamification = require('../../build/Release/gamification'); // usa calculateStats (C)
const metricKeys = ['tasksCreated', 'tasksCompleted', 'tasksLost', 'xpGained'];
const getPeriodDays = (p) => p === '7d' ? 7 : p === '30d' ? 30 : p === '1y' ? 365 : 30;
const roundOne = (v) => Math.round(Number(v||0)*10)/10;  // arredonda a 1 casa decimal
```
- `getPeriodDays` traduz o período pedido (`7d`/`30d`/`1y`) em número de dias (default 30).

### `createEmptyChartData(days)`
```js
for (let i = days - 1; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    chartData.push({ date: 'YYYY-MM-DD', label: 'dd/mm' (pt-PT), tasksCreated:0, tasksCompleted:0, tasksLost:0, xpGained:0 });
}
```
Cria o "esqueleto" do gráfico: **um objeto por dia**, do mais antigo (`days-1` atrás) até hoje, com métricas a zero e uma `label` em formato português `dd/mm`. Garantir todos os dias (mesmo sem atividade) faz o gráfico não ter "buracos".

### `getUserStatisticsData(iduser, days)` — o motor
```js
// 1. tarefas do utilizador no período (com flag is_lost) — WHERE iduser = ?
// 2. XP_HISTORY do utilizador no período
// 3. totais: totalTasks, completedTasks, lostTasks, pendingTasks, totalXP (reduce)
const summary = gamification.calculateStats(totalTasks, completedTasks, pendingTasks, lostTasks, totalXP); // ← C
// 4. distribui as contagens pelos dias certos (Map por data) → chartData
```
- Lê `TASK` e `XP_HISTORY` dos últimos `days` dias (`created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`).
- ⚠️ **Âmbito:** filtra **`WHERE iduser = ?`** — ou seja, conta só as tarefas **criadas pelo utilizador**, não as que lhe foram atribuídas. (Diferente da visibilidade do `taskController`.) Bom de ter em conta ao interpretar os números.
- `summary` vem do **C** (`calculateStats`: taxa de conclusão e score de produtividade).
- `chartData` — usa um `Map` por data para somar, a cada dia, criadas/concluídas/perdidas e XP ganho.

### Helpers de agregação (para grupos)
- `averageSummaries(list)` — **média** dos resumos de vários membros (soma cada métrica e divide pelo nº de membros, arredondando).
- `averageChartData(list, days)` — média, **por dia**, das métricas de todos os membros.
- `buildComparisonChartData(meChart, otherChart)` — "junta" os dois gráficos dia-a-dia em `{ date, label, me:{...}, comparison:{...} }` (formato pronto para o gráfico comparativo do frontend).

## Endpoints

### `getMyStatistics`
Lê o `period` da query, chama `getUserStatisticsData` e devolve `summary` + `chartData` (modo `me`).

### `compareWithFriend`
- Valida `idfriend` e que **existe amizade aceite** entre os dois (senão 403).
- Calcula as estatísticas de **ambos** e devolve `summary` (eu) + `comparisonSummary` (amigo) + `chartData` comparativo.

### `compareWithGroup`
- Valida que sou **membro** do grupo (senão 403).
- Calcula as estatísticas de **todos os membros** em paralelo (`Promise.all`), **faz a média** (`averageSummaries`/`averageChartData`) e compara com as minhas.
- Devolve também `memberCount`.

## Porquê assim
- **Reutilização:** `getUserStatisticsData` é a peça central; as comparações constroem-se à volta dela.
- **C para o resumo:** mantém a coerência com o requisito do módulo nativo e com o `taskController`.

## Ligações
- **Tabelas:** `TASK`, `XP_HISTORY`, `FRIENDSHIP`, `GROUP_MEMBER`, `GROUP_ENTITY`, `USER`.
- **Módulo C:** `calculateStats`.
- **Rotas:** `statisticsRoutes.js`. **Frontend:** `Statistics.jsx` (gráficos Recharts). **Android:** `StatisticsActivity`.
