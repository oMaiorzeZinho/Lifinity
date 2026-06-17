# `backend/src/routes/friendRoutes.js` — rotas de amigos

## Papel no projeto
Endpoints do sistema de amizades (pesquisar, pedir, aceitar, recusar, remover). Montado em `/api/friends`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/friends/search` | `searchUsers` | Procurar pessoas para adicionar. |
| GET | `/api/friends/` | `getFriends` | Lista de amigos (status `aceite`). |
| GET | `/api/friends/requests` | `getFriendRequests` | Pedidos de amizade pendentes recebidos. |
| POST | `/api/friends/request` | `sendFriendRequest` | Enviar pedido de amizade. |
| PUT | `/api/friends/requests/:idfriendship/accept` | `acceptFriendRequest` | Aceitar um pedido. |
| DELETE | `/api/friends/requests/:idfriendship` | `declineFriendRequest` | Recusar um pedido. |
| DELETE | `/api/friends/:idfriend` | `removeFriend` | Remover uma amizade existente. |

## Nota de design
Há **dois** `searchUsers` no backend (aqui e em `userRoutes`/`userController`). Vale a pena, ao documentar os controladores, ver se a lógica é igual ou específica de cada contexto (amigos vs. utilizadores em geral).

## Ligações
- **Controlador:** `friendController.js` (`FRIENDSHIP`, `NOTIFICATION`).
- **Frontend:** `Community.jsx`.
