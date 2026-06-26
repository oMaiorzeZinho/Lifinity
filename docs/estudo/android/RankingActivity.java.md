# `RankingActivity.java` — classificação por XP (pódio + lista)

## Papel
Mostra o **ranking global** (top de utilizadores por XP): um **pódio** com os 3 primeiros (avatar + nome +
XP) e, por baixo, a **lista** dos restantes. Vive dentro da Comunidade (por isso a tab ativa é COMMUNITY).

## `onCreate`
- Guarda de sessão (sem token → login). `setContentView(R.layout.activity_ranking)`.
- Apanha as *views* do **pódio** (`podium1Username/Xp/Image`, ... para os 3 lugares) e o `RecyclerView` da
  lista.
- Mostra a pílula do utilizador atual no cabeçalho (`username · NÍV level`).
- `BottomNavHelper.setup(this, Tab.COMMUNITY)` — repara: o ranking realça o tab **Comunidade**, não um tab
  próprio, porque está debaixo da Comunidade.
- `loadRanking()`.

## `loadRanking` / `showRanking`
```java
rankingCall = ApiClient.getClient().create(UserApi.class).getRanking(authToken);
... onResponse: if (sucesso e lista não vazia) showRanking(body); else showError(...)
```
- `GET /users/ranking` → `List<RankingUser>`.
- **`showRanking`** preenche o **pódio** para os 3 primeiros (cada um com `AvatarLoader.load(...)` para pôr a
  **foto real por cima** da medalha, que fica como *fallback*):
  ```java
  podium1Username.setText(users.get(0).getUsername());
  podium1Xp.setText(users.get(0).getXp() + " XP");
  AvatarLoader.load(podium1Image, users.get(0).getAvatar(), null, null);
  ```
  Note os `if (users.size() >= 1/2/3)` — defende-se contra ranking com menos de 3 pessoas.
- A **lista** usa o [`RankingAdapter`](adapters/RankingAdapter.java.md), ao qual se passa também o
  **`currentUserId`** (lido do user guardado) — assim o adapter pode **destacar a linha do próprio
  utilizador**.

## Ligações
- **API/Backend:** [`UserApi`](api/UserApi.java.md) (`GET /users/ranking`) → `userController.getRanking`.
- **Adapter/Model:** `RankingAdapter`, `RankingUser`. **Avatares:** [`AvatarLoader`](utils/_UTILS_IMAGENS.md).
- **Abre a partir de:** `CommunityActivity`.
