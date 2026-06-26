# `api/NotificationApi.java` — interface Retrofit das notificações

## Papel
Pedidos do "sino" de notificações: listar, contar não lidas e marcar como lidas.

## Código e explicação
```java
@GET("notifications")
Call<List<AppNotification>> getNotifications(@Header(...) String token);
```
- Lista as notificações do utilizador (`List<AppNotification>`).

```java
@GET("notifications/unread-count")
Call<JsonObject> getUnreadCount(@Header(...) String token);
```
- Devolve o **número de não lidas** (ex.: `{ count: 3 }`). É o que o `HeaderHelper` usa para mostrar o
  badge vermelho no sino sem ter de carregar a lista toda.

```java
@PUT("notifications/read-all")
Call<JsonObject> readAll(@Header(...) String token);

@PUT("notifications/{id}/read")
Call<JsonObject> readOne(@Header(...) String token, @Path("id") int id);
```
- **`readAll`** marca **todas** como lidas; **`readOne`** marca **uma** (a do `@Path("id")`). Ambos PUT
  (atualizam estado).

## Nota de modelo
Há dois models de notificação no projeto: **`AppNotification`** (o usado aqui) e `Notification` (mais
antigo/alternativo). Confirma sempre qual o `Call<...>` usa — neste caso é `AppNotification`.

## Ligações
- **Backend:** [`notificationRoutes.js`](../../backend/src/routes/notificationRoutes.js.md) / [`notificationController.js`](../../backend/src/controllers/notificationController.js.md).
- **Quem chama:** `NotificationsActivity`, `HeaderHelper` (badge do sino).
