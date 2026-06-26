# `api/AuthApi.java` — interface Retrofit de autenticação

## Papel
Define os dois pedidos **públicos** (sem token) de autenticação: entrar e registar. É uma **interface**
Retrofit — não tem código de implementação; o Retrofit gera-a a partir das anotações (ver
[`network/ApiClient.java`](../network/ApiClient.java.md)).

## Código
```java
public interface AuthApi {
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);
}
```

## Explicação
- **`@POST("auth/login")`** — faz um pedido HTTP **POST** a `BASE_URL + auth/login` (→ `.../api/auth/login`).
- **`@Body LoginRequest request`** — o objeto `LoginRequest` (email + password) é convertido em **JSON** pelo
  Gson e enviado no corpo do pedido.
- **`Call<LoginResponse>`** — o tipo de retorno. `Call` representa o pedido (ainda não executado); quando
  responder, o JSON é convertido num `LoginResponse` (token + dados do user).
- `register` é igual, mas para criar conta (`RegisterRequest` → `RegisterResponse`).
- **Não há `@Header("Authorization")`** aqui — são as únicas rotas que **não** exigem token (ainda não há
  sessão).

## Ligações
- **Backend:** [`authRoutes.js`](../../backend/src/routes/authRoutes.js.md) / [`authController.js`](../../backend/src/controllers/authController.js.md).
- **Models:** `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RegisterResponse` (em `models/`).
- **Quem chama:** `LoginActivity`, `RegisterActivity`.
