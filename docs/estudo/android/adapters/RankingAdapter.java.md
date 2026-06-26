# `adapters/RankingAdapter.java` — adapter da lista do ranking

## Papel
Liga a lista de `RankingUser` às linhas do ranking (posição, avatar, nome, nível, XP). Segue o padrão
explicado em [`TaskAdapter`](TaskAdapter.java.md).

## Pontos a notar
```java
public RankingAdapter(List<RankingUser> users, int currentUserId) { ... }
```
- Recebe a lista **e** o `currentUserId` — para **destacar** a linha do próprio utilizador.

```java
int rank = position + 1;
String medal = rank == 1 ? "🥇" : rank == 2 ? "🥈" : rank == 3 ? "🥉" : String.valueOf(rank);
h.position.setText(medal);
h.username.setText(u.getUsername());
h.level.setText("Nível " + u.getLevel());
h.xp.setText(u.getXp() + " XP");
AvatarLoader.load(h.avatarImage, u.getAvatar(), h.avatarText, u.getUsername());
if (u.getIduser() != null && u.getIduser() == currentUserId) {
    h.username.setTextColor(... lifinity_primary ...);   // destaca o próprio
}
```
- **Medalhas** (emoji) para os 3 primeiros; número para os restantes (a posição vem do `position` da linha).
- **Avatar:** [`AvatarLoader`](../utils/_UTILS_IMAGENS.md) põe a foto real (ou a inicial como *fallback*).
- A linha do **utilizador atual** fica com o nome **a verde** — ajuda a localizar-se no ranking.

## Diferença para os outros adapters
Este **não** tem `setData`/`notifyDataSetChanged` — recebe a lista **fixa** no construtor (o
`RankingActivity` cria um adapter novo a cada carregamento). É uma escolha mais simples, válida porque o
ranking se recarrega de uma vez.

## Ligações
- **Layout:** `res/layout/item_ranking.xml`. **Model:** `RankingUser`. **Usa:** `RankingActivity`.
