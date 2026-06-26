# `api/StatisticsApi.java` — interface Retrofit das estatísticas

## Papel
Um único pedido: buscar as estatísticas do utilizador para um dado **período** (semana/mês/…).

## Código
```java
@GET("statistics/me")
Call<StatisticsResponse> getStatistics(@Header("Authorization") String token, @Query("period") String period);
```

## Explicação
- **`@GET("statistics/me")`** — lê as estatísticas do próprio utilizador.
- **`@Query("period")`** — acrescenta o período como **parâmetro de query** no URL:
  `.../api/statistics/me?period=week`. É diferente do `@Path` (que substitui dentro do caminho); o `@Query`
  acrescenta `?chave=valor` no fim.
- **`Call<StatisticsResponse>`** — devolve o objeto completo `{ period, summary, chartData, ... }`. O
  comentário no código frisa-o; é por isso que o model `StatisticsResponse` agrupa `summary` (totais) +
  `chartData` (dias para os gráficos). Esta foi a correção de 2026-06-24 (a app lia campos errados antes).

## Ligações
- **Backend:** [`statisticsRoutes.js`](../../backend/src/routes/statisticsRoutes.js.md) / [`statisticsController.js`](../../backend/src/controllers/statisticsController.js.md) (que usa o módulo C).
- **Models:** `StatisticsResponse`, `StatisticsSummary`, `StatisticsDay`.
- **Quem chama:** `StatisticsActivity` (gráficos com MPAndroidChart).
