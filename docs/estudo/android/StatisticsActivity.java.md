# `StatisticsActivity.java` — estatísticas com gráficos (MPAndroidChart)

## Papel
Mostra os **números** de produtividade (cartões) e dois **gráficos**: barras empilhadas
(concluídas/perdidas por dia) e linha (XP por dia). Permite escolher o **período** (7/30 dias, 1 ano). Usa a
biblioteca **MPAndroidChart**.

## `onCreate` + `configurarSpinner`
- Apanha os 6 cartões de totais, os dois gráficos e o spinner de período.
- **`PERIOD_LABELS`/`PERIOD_VALUES`** — dois arrays "paralelos": o que se mostra ("Últimos 7 dias") e o que
  se envia à API (`"7d"`). O índice escolhido no spinner liga um ao outro.
- O *listener* do spinner só recarrega **se o período mudou** (`!selected.equals(currentPeriod)`) — evita uma
  chamada dupla no arranque (o spinner dispara o evento ao ser criado).

## `loadStatistics` / `bindStatistics`
- `GET /statistics/me?period=...` → `StatisticsResponse`. Cancela o pedido anterior antes de pedir outro.
- **`bindStatistics`** preenche os cartões a partir do **`summary`**:
  ```java
  statCompletedValue.setText(String.valueOf(s.getCompletedTasks()));
  statRateValue.setText(Math.round(s.getCompletionRate()) + "%");  // já vem 0–100
  statProductivityValue.setText(String.valueOf(Math.round(s.getProductivityScore())));
  ```
  e desenha os gráficos com o **`chartData`** (lista de `StatisticsDay`).

## Os gráficos (MPAndroidChart)
- **`setupTasksChart`** — **BarChart empilhado**: cada barra é um dia com `new BarEntry(i, new float[]{concluídas, perdidas})`. Cores: verde (concluídas) + coral (perdidas), com legenda em baixo.
- **`setupXpChart`** — **LineChart**: `new Entry(i, xpGained)` por dia, linha verde curva
  (`CUBIC_BEZIER`), **preenchida** por baixo (`setDrawFilled`); mostra **círculos** só se houver poucos
  pontos (`days.size() <= 14`) — em períodos longos fica limpo.
- **`styleCommon`** — estilo partilhado: sem descrição/moldura pesada, eixo X em baixo com as etiquetas dos
  dias (via `ValueFormatter` que mapeia o índice → `dd/MM`), eixo Y a começar em 0, cores discretas do tema
  claro. `animateY(700)` dá a animação de entrada.
- **`dayLabelFormatter`** resolve um detalhe do MPAndroidChart: o eixo X usa **índices** (0,1,2,...) e este
  formatador troca cada índice pela etiqueta do dia correspondente.

## Nota de estudo (correção importante)
Esta tela só funcionou bem depois de o modelo passar a ler **`summary` + `chartData`** (a API devolve esse
formato; antes lia campos errados e mostrava "—"). Ver
[Imagens Glide + Gráficos](IMAGENS_GLIDE_E_GRAFICOS_MPCHART_2026-06-24.md).

## Ligações
- **API/Backend:** [`StatisticsApi`](api/StatisticsApi.java.md) → `statisticsController` (+ módulo C).
- **Models:** `StatisticsResponse`, `StatisticsSummary`, `StatisticsDay`.
- **Abre a partir de:** botão no topo da `TasksActivity`. **Biblioteca:** MPAndroidChart (JitPack).
