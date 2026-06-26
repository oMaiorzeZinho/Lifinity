# `HeaderHelper.java` — o "sino" de notificações no cabeçalho

## Papel
Classe utilitária (só com o método `static setupBell`) **reutilizada por todos os ecrãs principais**. Faz
duas coisas com o sino do cabeçalho (`R.id.headerNotificationBell`):
1. ao tocar, abre o ecrã de **Notificações**;
2. **realça** o sino (fundo de alerta) se houver notificações por ler.

## Bloco a bloco
```java
final View bell = activity.findViewById(R.id.headerNotificationBell);
if (bell == null) return;
bell.setOnClickListener(v -> activity.startActivity(new Intent(activity, NotificationsActivity.class)));
```
- Procura o sino no ecrã que chamou. **`if (bell == null) return;`** — se o ecrã não tiver sino, não faz
  nada (defensivo; permite chamar `setupBell` em qualquer Activity sem medo).
- Liga o clique a abrir a `NotificationsActivity`.

```java
String token = prefs.getString(KEY_TOKEN, null);
if (TextUtils.isEmpty(token)) return;
NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
api.getUnreadCount("Bearer " + token).enqueue(new Callback<JsonObject>() {
    public void onResponse(...) {
        int unread = 0;
        JsonObject body = response.body();
        if (response.isSuccessful() && body != null
                && body.has("unreadCount") && !body.get("unreadCount").isJsonNull()) {
            unread = body.get("unreadCount").getAsInt();
        }
        bell.setBackgroundResource(unread > 0 ? R.drawable.bg_bell_alert : R.drawable.bg_card_soft_clay);
    }
    public void onFailure(...) { /* mantém o aspeto por defeito */ }
});
```
- Pede o **número de não lidas** (`GET /notifications/unread-count`). Lê o campo `unreadCount` do
  `JsonObject` com cuidado (`has(...)` + `!isJsonNull()` antes de `getAsInt()` — evita *crash* se faltar).
- Se houver não lidas → troca o fundo do sino para **`bg_bell_alert`** (com o ponto/realce); senão fica o
  fundo normal **`bg_card_soft_clay`**.
- **`onFailure`** não faz nada — em caso de erro, o sino fica com o aspeto por defeito (degradação suave).

## Porque é um helper estático
Evita repetir este código em cada Activity. Basta `HeaderHelper.setupBell(this)` no `onCreate` de cada ecrã
com cabeçalho. É o mesmo princípio do `BottomNavHelper` (barra inferior).

## Ligações
- **API:** [`NotificationApi`](api/NotificationApi.java.md) (`getUnreadCount`).
- **Destino:** `NotificationsActivity`.
- **Companheiro:** [`BottomNavHelper`](BottomNavHelper.java.md) (a barra de baixo).
