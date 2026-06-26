# `api/InspirationApi.java` — interface Retrofit da inspiração (versículos)

## Papel
Pedidos da página de **Inspiração**: versículo do dia, versículo aleatório, lista de favoritos e
guardar/remover favorito.

## Código e explicação
```java
@GET("inspiration/daily")
Call<Verse> getDailyVerse(@Header(...) String auth);

@GET("inspiration/random")
Call<Verse> getRandomVerse(@Header(...) String auth);
```
- Dois **GET** que devolvem **um** `Verse`. O "diário" é o mesmo para todos no mesmo dia (escolhido pelo
  backend); o "aleatório" muda a cada pedido.

```java
@GET("inspiration/favorites")
Call<List<Verse>> getFavorites(@Header(...) String auth);
```
- Lista os versículos **favoritos** do utilizador (`List<Verse>`).

```java
@POST("inspiration/favorite/{idverse}")
Call<JsonObject> toggleFavorite(@Header(...) String auth, @Path("idverse") int idverse);
```
- **POST** que **alterna** (toggle) o estado de favorito do versículo `idverse`: se não era favorito,
  passa a ser; se já era, deixa de ser. O backend devolve o novo estado (`{ isFavorite, message }`), que a
  app lê do `JsonObject`.

## Ligações
- **Backend:** [`inspirationRoutes.js`](../../backend/src/routes/inspirationRoutes.js.md) / [`inspirationController.js`](../../backend/src/controllers/inspirationController.js.md).
- **Model:** `Verse` (texto, livro, capítulo, verso, tema, isFavorite).
- **Quem chama:** `InspirationActivity` (+ partilha de versículo via `ChatApi`).
