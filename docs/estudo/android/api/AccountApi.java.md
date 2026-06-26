# `api/AccountApi.java` — interface Retrofit das definições de conta

## Papel
Pedidos de gestão da **própria conta**: mudar username, mudar password e apagar a conta. Usados no
`SettingsActivity`.

## Código e explicação
```java
@PUT("users/me/username")
Call<JsonObject> updateUsername(@Header(...) String auth, @Body UpdateUsernameRequest request);

@PUT("users/me/password")
Call<JsonObject> updatePassword(@Header(...) String auth, @Body UpdatePasswordRequest request);
```
- Dois **PUT** simples: alteram o username ou a password do utilizador autenticado. O corpo leva os dados
  novos (e, no caso da password, a atual para confirmação — ver o model).

```java
@HTTP(method = "DELETE", path = "users/me", hasBody = true)
Call<JsonObject> deleteAccount(@Header(...) String auth, @Body DeleteAccountRequest request);
```
- **Pormenor importante:** apagar a conta é um **DELETE** mas **com corpo** (a password de confirmação). O
  `@DELETE` "normal" do Retrofit **não permite** `@Body`, por isso usa-se a anotação genérica **`@HTTP`**
  com `method="DELETE"`, `path="users/me"` e **`hasBody = true`**. É a forma de fazer um DELETE com payload.

## Nota
Repara que estes endpoints estão sob `users/me/...` — partilham caminho com o `userController` do backend,
mas a app separou-os numa interface própria (`AccountApi`) por organização. O `UserApi` trata do ranking e
do avatar.

## Ligações
- **Backend:** [`userRoutes.js`](../../backend/src/routes/userRoutes.js.md) / [`userController.js`](../../backend/src/controllers/userController.js.md).
- **Models:** `UpdateUsernameRequest`, `UpdatePasswordRequest`, `DeleteAccountRequest`.
- **Quem chama:** `SettingsActivity`.
