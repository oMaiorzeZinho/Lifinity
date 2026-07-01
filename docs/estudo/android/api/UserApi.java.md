# `api/UserApi.java` — interface Retrofit de utilizador (ranking + avatar + perfil público)

## Papel
Pedidos sobre utilizadores: obter o **ranking global**, fazer **upload da foto de perfil** e obter o
**perfil público** de um utilizador (para o popup "Ver perfil" de um amigo).

## Código e explicação
```java
@GET("users/ranking")
Call<List<RankingUser>> getRanking(@Header("Authorization") String token);
```
- Devolve o **top de utilizadores por XP** (`List<RankingUser>` — nome, xp, nível, avatar). Usado no
  `RankingActivity` (pódio + lista).

```java
@Multipart
@PUT("users/me/avatar")
Call<JsonObject> updateAvatar(@Header("Authorization") String token, @Part MultipartBody.Part image);
```
- **Upload da foto de perfil.** É diferente dos outros pedidos: em vez de JSON, envia um **ficheiro**.
  - **`@Multipart`** — diz ao Retrofit que o corpo é *multipart/form-data* (o formato de envio de ficheiros
    nos formulários HTTP).
  - **`@Part MultipartBody.Part image`** — a "parte" que carrega o ficheiro. No `ProfileActivity` constrói-se
    com `MultipartBody.Part.createFormData("image", nome, requestBody)` — o nome do campo **"image"** tem de
    bater certo com o que o backend (multer) espera.
  - Devolve `JsonObject` com `{ message, user: { avatar } }` — a app lê o novo caminho do avatar daí.

```java
@GET("users/{iduser}/public-profile")
Call<PublicProfile> getPublicProfile(@Header("Authorization") String token, @Path("iduser") int iduser);
```
- **Perfil público de um utilizador (2026-07-01).** Devolve `{ username, level, avatar, bio,
  highlightedBadges, totalUnlockedBadges }` — **não** devolve `xp` (o popup usa o `xp` do objeto
  `Friend` já disponível). `@Path("iduser")` injeta o id na rota. Usado no popup "Ver perfil" da
  `FriendsActivity`; os `highlightedBadges` reutilizam o model `Achievement`.

## Ligações
- **Backend:** [`userRoutes.js`](../../backend/src/routes/userRoutes.js.md) (`GET /users/ranking`, `PUT /users/me/avatar` com multer, `GET /users/:iduser/public-profile`) / [`userController.js`](../../backend/src/controllers/userController.js.md).
- **Models:** `RankingUser`, `PublicProfile` (+ `Achievement`).
- **Quem chama:** `RankingActivity` (ranking), `ProfileActivity` (avatar), `FriendsActivity` (perfil público).
