# `SettingsActivity.java` — definições de conta

## Papel
Três operações sobre a conta: **mudar username**, **mudar palavra-passe** e **apagar conta**. Usa a
[`AccountApi`](api/AccountApi.java.md). Abre-se pela engrenagem do cabeçalho do Perfil.

## `onCreate`
Liga os campos (username; password atual/nova/confirmação; username+password para apagar) e os 3 botões. Se
houver user guardado, põe a **dica** ("Escreve <username>") no campo de apagar — uma confirmação mais
segura.

## Mudar username — com confirmação
```java
private void confirmUsernameUpdate() {
    String newUsername = usernameInput.getText().toString().trim();
    if (TextUtils.isEmpty(newUsername)) { showError("..."); return; }
    new AlertDialog.Builder(this).setTitle("Mudar nome de utilizador")
        .setMessage("Queres mudar ... para \"" + newUsername + "\"?")
        .setPositiveButton("Confirmar", (d, w) -> updateUsername(newUsername)).show();
}
```
- Valida e **pede confirmação** num `AlertDialog` antes de chamar `PUT /users/me/username`.
- Em sucesso, **`saveUpdatedUser`** atualiza o `User` nas `SharedPreferences` para o resto da app ver o nome
  novo (ver abaixo).

## Mudar password
Valida que os 3 campos estão preenchidos e que **nova == confirmação**, depois `PUT /users/me/password` com
`UpdatePasswordRequest(current, new)`. O backend confirma a password atual. Limpa os campos em sucesso.

## Apagar conta — dupla confirmação
- Exige **username + password** escritos, depois um `AlertDialog` de aviso, e só então `deleteAccount` →
  `DELETE /users/me` (com corpo `DeleteAccountRequest`).
- Em sucesso, **`clearSessionAndOpenLogin`** apaga o token e o user das `SharedPreferences` e volta ao login
  (a conta já não existe).

## `saveUpdatedUser` — manter o cache coerente
```java
if (body tem "user") userObject = body.user;
else if (body tem iduser/username) userObject = body;
if (userObject != null) guarda User; return;
// senão: pega no user guardado e só troca o "username" pelo novo
```
- Robusto a **diferentes formatos** de resposta do backend: usa o `user` se vier, senão o próprio corpo,
  senão atualiza só o campo `username` no JSON guardado. Garante que o nome novo aparece sem novo login.

## Padrões
Os mesmos de sempre: `setLoading` (desativa botões + spinner), `getErrorMessage` (401 dedicado; senão
`message`/`error` do JSON), cancelamento das `Call` no `onDestroy`. Repara que aqui o `AlertDialog` é o do
pacote `android.app` (não o `androidx.appcompat`) — funciona na mesma; o tema de diálogos claro aplica-se
via tema da app.

## Ligações
- **API/Backend:** [`AccountApi`](api/AccountApi.java.md) → `userController` (`updateUsername`,
  `updatePassword`, `deleteAccount`).
- **Models:** `UpdateUsernameRequest`, `UpdatePasswordRequest`, `DeleteAccountRequest`, `User`.
- **Abre a partir de:** engrenagem do cabeçalho (Perfil/HeaderHelper-settings).
