# Android — Models de autenticação e utilizador (9 ficheiros)

> Agrupa os *models* ligados a **conta/utilizador**: `User`, `LoginRequest`, `LoginResponse`,
> `RegisterRequest`, `RegisterResponse`, `RankingUser`, `UpdateUsernameRequest`,
> `UpdatePasswordRequest`, `DeleteAccountRequest`.

## O que é um "model" aqui
São **POJOs** (Plain Old Java Objects) — classes simples só com campos e *getters*. Servem de **molde**
para o Gson converter JSON ⇆ Java:
- nas **respostas** (`...Response`, `User`, ...) o Gson lê o JSON do backend e preenche os campos cujos
  **nomes batem certo** com as chaves JSON;
- nos **pedidos** (`...Request`) acontece o inverso: os campos viram JSON no corpo do pedido.
- Quando o nome do campo Java **difere** da chave JSON, usa-se `@SerializedName("chave_json")` (ver outros
  grupos). Aqui, os nomes coincidem (`email`, `password`, `username`, ...), por isso não é preciso.

---

## `User` — o utilizador autenticado
Campos: `iduser`, `username`, `email`, `xp`, `level`, `avatar` (caminho da foto, ex.:
`/uploads/avatars/x.jpg`, pode ser `null`). Só *getters*. O backend devolve este objeto **no login e no
perfil**. É guardado nas `SharedPreferences` (como JSON) e relido em vários ecrãs (perfil, barra de
navegação, etc.).

## `LoginRequest` / `RegisterRequest` — corpos dos pedidos
- **`LoginRequest(email, password)`** — construtor que recebe os dois campos; vira JSON
  `{ "email": ..., "password": ... }` no `POST /auth/login`.
- **`RegisterRequest(username, email, password)`** — igual, mas com `username`. Campos `final` (imutáveis
  depois de criados — boa prática para DTOs de pedido).

## `LoginResponse` / `RegisterResponse` — respostas da autenticação
Ambos têm **`message`, `token`, `user`** (um `User`). Depois do login/registo, a app guarda o **`token`**
(para os próximos pedidos autenticados) e o **`user`** (para mostrar logo o nome/xp sem outro pedido). São
estruturalmente idênticos — existem dois para clareza semântica.

## `RankingUser` — uma linha do ranking
Campos: `iduser`, `username`, `xp`, `level`, `avatar`. **Pormenor:** os *getters* têm **valores de
recurso** embutidos:
```java
public String getUsername() { return username != null ? username : "—"; }
public int getXp()    { return xp != null ? xp : 0; }
public int getLevel() { return level != null ? level : 1; }
```
Ou seja, se o JSON vier sem um campo, o *getter* devolve um valor seguro ("—", 0, 1) em vez de `null`/
crash. É uma defesa contra dados incompletos, útil porque o `RankingAdapter` mostra estes valores
diretamente.

## `UpdateUsernameRequest` / `UpdatePasswordRequest` / `DeleteAccountRequest` — definições de conta
Corpos dos pedidos do `SettingsActivity` (via `AccountApi`):
- **`UpdateUsernameRequest(newUsername)`** → `{ "newUsername": ... }`.
- **`UpdatePasswordRequest(currentPassword, newPassword)`** → exige a password **atual** (confirmação) +
  a nova. O backend valida a atual antes de trocar.
- **`DeleteAccountRequest(username, password)`** → confirmação dupla (nome + password) antes de apagar a
  conta. Todos com campos `final`.

## Ligações
- **APIs:** [`AuthApi`](../api/AuthApi.java.md), [`AccountApi`](../api/AccountApi.java.md), [`UserApi`](../api/UserApi.java.md).
- **Backend:** `authController.js`, `userController.js`.
- **Quem usa:** `LoginActivity`, `RegisterActivity`, `SettingsActivity`, `RankingActivity`, `ProfileActivity`.
