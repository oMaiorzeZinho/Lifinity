# `backend/src/routes/notificationRoutes.js` — rotas de notificações

## Papel no projeto
Endpoints das notificações internas (sino). Montado em `/api/notifications`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/notifications/` | `getNotifications` | Lista de notificações. |
| GET | `/api/notifications/unread-count` | `getUnreadCount` | Nº de não lidas (badge do sino). |
| PUT | `/api/notifications/:idnotification/read` | `markNotificationAsRead` | Marcar uma como lida. |
| PUT | `/api/notifications/read-all` | `markAllNotificationsAsRead` | Marcar todas como lidas. |

## Nota
`notificationController` também exporta `createNotifications`, usado **internamente** por outros módulos (ex.: `achievements.js`, `friendController`, `groupController`) — essa função não é uma rota, é chamada no servidor.

## Ligações
- **Controlador:** `notificationController.js` (`NOTIFICATION`).
- **Frontend:** sino no header (várias páginas), `NotificationsActivity` no Android.
