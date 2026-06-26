# `NotificationsActivity.java` — lista de notificações

## Papel
Mostra as notificações do utilizador e permite **marcar como lidas** (uma a uma ou todas). Abre-se pelo
**sino** do cabeçalho (ver [`HeaderHelper`](HeaderHelper.java.md)).

## `onCreate` / `onResume`
- `onCreate`: liga o botão "voltar" (`finish()`), o "marcar todas" (`markAllAsRead`), e cria o
  [`NotificationAdapter`](adapters/NotificationAdapter.java.md) com o *callback* de clique
  (`this::onNotificationClick`).
- **`onResume`** chama `loadNotifications()` — recarrega sempre que o ecrã fica visível.

## `loadNotifications`
`GET /notifications` → enche a lista local `notifications`, passa-a ao adapter e mostra/esconde o texto de
"vazio" conforme haja ou não notificações.

## Marcar como lida — *optimistic UI*
```java
private void onNotificationClick(AppNotification notification) {
    notification.markAsRead();                 // 1) muda o estado LOCAL já
    adapter.setNotifications(notifications);    //    e atualiza a lista (feedback imediato)
    markCall = api.readOne("Bearer " + getToken(), notification.getIdnotification());
    markCall.enqueue(...);                       // 2) avisa o servidor em segundo plano
}
```
- **Padrão "optimistic":** atualiza o ecrã **imediatamente** (marca como lida localmente com
  `markAsRead()`), sem esperar pela resposta do servidor. O pedido `readOne` segue em segundo plano e, se
  falhar, fica **silencioso** (a marcação repete-se na próxima abertura). Dá uma sensação de app rápida.
- **`markAllAsRead`** faz `PUT /notifications/read-all`; em sucesso marca todas localmente e mostra `Toast`.

## Ligações
- **API/Backend:** [`NotificationApi`](api/NotificationApi.java.md) → `notificationController`.
- **Model/Adapter:** `AppNotification`, `NotificationAdapter`.
- **Abre a partir de:** o sino do `HeaderHelper` (em qualquer ecrã principal).
