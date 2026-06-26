# `LoginActivity.java` — ecrã de login

> Esta página explica também os **padrões Android** que se repetem em quase todas as activities
> (ciclo de vida, `findViewById`, chamada Retrofit assíncrona, `SharedPreferences`, `Intent`, tratamento de
> erros). Os outros docs referem-se a este para não repetir.

## Papel
Pede email + password, chama `POST /auth/login`, guarda a sessão (token + user) e entra na app.

## `onCreate` — preparar o ecrã
```java
if (hasToken()) { openMainActivity(); return; }   // já tem sessão → não mostra login
setContentView(R.layout.activity_login);
emailInput = findViewById(R.id.emailInput);
passwordInput = findViewById(R.id.passwordInput);
loginButton = findViewById(R.id.loginButton);
...
loginButton.setOnClickListener(v -> login());
createAccountButton.setOnClickListener(v -> openRegisterActivity());
```
- **`setContentView(R.layout.activity_login)`** — liga o ecrã ao ficheiro XML de layout. A partir daqui
  existem as *views*.
- **`findViewById(R.id.xxx)`** — vai buscar cada *view* do XML pelo seu `id`, para o Java a poder
  manipular. Guarda-as em campos para reutilizar.
- **`setOnClickListener(v -> login())`** — define o que acontece ao tocar no botão: chama `login()`. O
  `v -> ...` é uma **lambda** (função curta).
- O `if (hasToken())` no topo evita mostrar o login a quem já tem sessão.

## `login()` — validar e chamar a API
```java
String email = emailInput.getText().toString().trim();
String password = passwordInput.getText().toString();
if (TextUtils.isEmpty(email) || TextUtils.isEmpty(password)) { showError("..."); return; }
setLoading(true); hideError();
AuthApi authApi = ApiClient.getClient().create(AuthApi.class);
loginCall = authApi.login(new LoginRequest(email, password));
loginCall.enqueue(new Callback<LoginResponse>() { ... });
```
- Lê o texto dos campos (`.getText().toString()`), com `.trim()` no email (tira espaços).
- **Validação local** antes de gastar rede: se faltar algo, mostra erro e sai.
- **`setLoading(true)`** desativa os botões e mostra o *spinner* (evita duplos cliques).
- **`ApiClient.getClient().create(AuthApi.class)`** — obtém a implementação Retrofit da interface (ver
  [`ApiClient`](network/ApiClient.java.md)).
- **`.enqueue(...)`** — executa o pedido **assincronamente** (numa thread de fundo). É **crucial**: chamadas
  de rede **não podem** correr na *main thread* (bloqueariam o ecrã / dariam crash). O resultado volta nos
  *callbacks*.

## O `Callback` — resposta da API
```java
public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
    setLoading(false);
    if (!response.isSuccessful()) { showError(getErrorMessage(response)); return; }
    LoginResponse loginResponse = response.body();
    if (loginResponse == null || TextUtils.isEmpty(loginResponse.getToken())) {
        showError("Resposta inválida do servidor."); return;
    }
    saveSession(loginResponse);
    openMainActivity();
}
```
- **`onResponse`** corre quando o servidor responde (mesmo que com erro HTTP). **`isSuccessful()`** é true
  para códigos 2xx. Se não, lê a mensagem de erro do corpo (`getErrorMessage`).
- Em sucesso: valida que veio `token`, **guarda a sessão** e vai para a `MainActivity` (que reencaminha).

```java
public void onFailure(Call<LoginResponse> call, Throwable t) {
    if (call.isCanceled()) return;
    setLoading(false);
    if (t instanceof ConnectException || t instanceof SocketTimeoutException) {
        Log.e(TAG, "Falha de ligacao ao servidor no login", t);
        showError("Não foi possível ligar ao servidor. Confirma que o backend está ativo, ...");
    } else {
        Log.e(TAG, "Erro inesperado no login: " + t.getClass().getName(), t);
        showError("Ocorreu um erro ao iniciar sessão. Tenta novamente.");
    }
}
```
- **`onFailure`** corre quando **nem chega** a haver resposta (servidor em baixo, IP errado, sem Wi-Fi,
  timeout). 
- **Distingue** `ConnectException`/`SocketTimeoutException` (problema de **ligação** → mensagem a lembrar de
  ligar o backend / mesma Wi-Fi / IP) de outros erros. **Regista no Logcat** (`Log.e`) a classe da exceção —
  ajuda imenso a depurar na defesa.
- **`call.isCanceled()`** — se a Activity foi destruída e o pedido cancelado (ver `onDestroy`), ignora.

## `saveSession` — guardar token e user
```java
preferences.edit()
    .putString(KEY_TOKEN, loginResponse.getToken())
    .putString(KEY_USER, gson.toJson(loginResponse.getUser()))
    .apply();
```
- Guarda o **token** e o **user serializado em JSON** (com Gson) nas `SharedPreferences`. A partir daqui,
  todos os pedidos autenticados leem este token, e os ecrãs leem o user. `.apply()` grava em segundo plano.

## `onDestroy` — limpar
```java
if (loginCall != null) loginCall.cancel();
```
- Cancela o pedido pendente se o ecrã fechar — evita *callbacks* sobre uma Activity morta (e fugas de
  memória). É um padrão repetido em todas as activities.

## `ErrorResponse` (classe interna)
Pequena classe só com `String message` — serve para o Gson **extrair a mensagem de erro** do JSON que o
backend devolve em falhas (ex.: `{ "message": "Email ou password incorretos." }`).

## Ligações
- **API/Backend:** [`AuthApi`](api/AuthApi.java.md) → `authController.login`.
- **Models:** `LoginRequest`, `LoginResponse`, `User`.
- **A seguir:** `MainActivity` (reencaminha), `RegisterActivity` (criar conta).
