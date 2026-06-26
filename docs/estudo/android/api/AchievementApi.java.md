# `api/AchievementApi.java` — interface Retrofit das conquistas

## Papel
Pedidos das **conquistas (badges)**: forçar a verificação de novas, listar todas e atualizar os destaques.

## Código e explicação
```java
@POST("achievements/check")
Call<JsonObject> checkAchievements(@Header(...) String authorization);
```
- **POST** que pede ao backend para **reavaliar** as conquistas do utilizador (desbloquear as que já tiver
  mérito). Chama-se **antes** de listar, para a lista vir atualizada. Devolve `{ unlockedCount, unlocked }`.

```java
@GET("achievements")
Call<List<Achievement>> getAchievements(@Header(...) String authorization);
```
- Lista **todas** as conquistas, cada uma com `unlocked` (desbloqueada?), `highlighted` (em destaque?) e
  `position` (1..3 do destaque). É o `getAchievements` que a `AchievementsActivity` e o `ProfileActivity`
  consomem.

```java
@PUT("achievements/highlights")
Call<JsonObject> updateHighlights(@Header(...) String authorization, @Body JsonObject body);
```
- **PUT** para guardar os **3 destaques**. O corpo é construído à mão como `JsonObject`:
  `{ "highlights": [ { "idbadge": n, "position": 1..3 }, ... ] }`. Usa-se `JsonObject` (em vez de um model)
  porque a estrutura é simples e dinâmica.

## Ligações
- **Backend:** [`achievementRoutes.js`](../../backend/src/routes/achievementRoutes.js.md) / [`achievementController.js`](../../backend/src/controllers/achievementController.js.md).
- **Model:** `Achievement`.
- **Quem chama:** `AchievementsActivity` (lista + destacar), `ProfileActivity` (resumo/destaques).
- **Funcionalidade de destacar:** ver [`FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md`](../FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md).
