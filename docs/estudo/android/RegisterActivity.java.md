# `RegisterActivity.java` — ecrã de registo

## Papel
Cria uma conta nova: recolhe username/email/password/confirmação, valida, chama `POST /auth/register` e
volta ao login. Muito parecido com o [`LoginActivity`](LoginActivity.java.md) — só muda a **validação** e
o destino final.

## `onCreate`
Liga os 4 campos (`registerUsernameInput`, `registerEmailInput`, `registerPasswordInput`,
`registerConfirmPasswordInput`), o botão de registar e o "voltar ao login" (`backToLoginButton` → apenas
`finish()`, fechando este ecrã e revelando o login por baixo).

## `register()` — validação reforçada
```java
if (TextUtils.isEmpty(username)) { showError("Indica o username."); return; }
if (TextUtils.isEmpty(email))    { showError("Indica o email."); return; }
if (TextUtils.isEmpty(password)) { showError("Indica a palavra-passe."); return; }
if (password.length() < 6)       { showError("A palavra-passe deve ter pelo menos 6 caracteres."); return; }
if (!password.equals(confirmPassword)) { showError("A palavra-passe e a confirmacao nao coincidem."); return; }
```
- Validações **passo a passo**, cada uma com mensagem específica. De notar: **mínimo 6 caracteres** e
  **confirmação igual** — coisas que só fazem sentido validar no cliente (o backend valida o resto, como o
  email/username duplicado).
- Depois é o mesmo padrão do login: `setLoading(true)`, `authApi.register(new RegisterRequest(...))`,
  `.enqueue(...)`.

## Resposta
```java
String message = "Conta criada com sucesso. Inicia sessao para continuar.";
if (registerResponse != null && !TextUtils.isEmpty(registerResponse.getMessage())) {
    message = registerResponse.getMessage();
}
Toast.makeText(RegisterActivity.this, message, Toast.LENGTH_LONG).show();
openLoginActivity();
```
- Em sucesso mostra um **`Toast`** (mensagem breve) e volta ao **login** (não entra automaticamente — o
  utilizador inicia sessão a seguir). Repara que usa a mensagem do servidor se vier, senão uma por defeito.
- **`onFailure`** é igual ao do login: distingue falha de ligação de outros erros e regista no Logcat.
- **`getErrorMessage`** aqui lê **`message` ou `error`** do JSON (o registo pode devolver qualquer um) — por
  isso a classe interna `ErrorResponse` tem os dois campos.

```java
private void openLoginActivity() {
    Intent intent = new Intent(this, LoginActivity.class);
    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    ...
}
```
- **`CLEAR_TOP | SINGLE_TOP`** — se o login já estiver na pilha, **reutiliza-o** em vez de criar outro (não
  empilha logins). Boa higiene de navegação.

## Ligações
- **API/Backend:** [`AuthApi`](api/AuthApi.java.md) → `authController.register`.
- **Models:** `RegisterRequest`, `RegisterResponse`.
- **Padrões comuns** (enqueue, SharedPreferences, onDestroy): ver [`LoginActivity`](LoginActivity.java.md).
