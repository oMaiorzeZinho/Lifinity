# `api/UserApi.java` — interface Retrofit de utilizador (ranking + avatar)

## Papel
Dois pedidos sobre utilizadores: obter o **ranking global** e fazer **upload da foto de perfil**.

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

## Ligações
- **Backend:** [`userRoutes.js`](../../backend/src/routes/userRoutes.js.md) (`GET /users/ranking`, `PUT /users/me/avatar` com multer) / [`userController.js`](../../backend/src/controllers/userController.js.md).
- **Models:** `RankingUser`.
- **Quem chama:** `RankingActivity` (ranking), `ProfileActivity` (avatar).
