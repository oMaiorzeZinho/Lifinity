# `backend/src/routes/groupRoutes.js` — rotas de grupos

## Papel no projeto
Endpoints de grupos: criar, entrar por código, membros, moderação (mute/kick), trancar e apagar. Montado em `/api/groups`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/groups/` | `getMyGroups` | Grupos a que pertenço. |
| POST | `/api/groups/` | `createGroup` | Criar grupo (gera `invite_code`). |
| POST | `/api/groups/join` | `joinGroupByCode` | Entrar num grupo via código. |
| POST | `/api/groups/:idgroup/conversation` | `getOrCreateConversationForGroup` | Obter/criar a conversa do grupo. |
| GET | `/api/groups/:idgroup/members` | `getGroupMembers` | Listar membros. |
| DELETE | `/api/groups/:idgroup/leave` | `leaveGroup` | Sair do grupo. |
| PUT | `/api/groups/:idgroup/members/:iduser/mute` | `muteGroupMember` | Silenciar membro (com duração/motivo). |
| PUT | `/api/groups/:idgroup/members/:iduser/unmute` | `unmuteGroupMember` | Retirar o silenciamento. |
| DELETE | `/api/groups/:idgroup/members/:iduser` | `kickGroupMember` | Expulsar membro. |
| PUT | `/api/groups/:idgroup/lock` | `toggleGroupLock` | Trancar/destrancar (bloquear entradas por código). |
| DELETE | `/api/groups/:idgroup` | `deleteGroup` | Apagar o grupo. |

## Ligações
- **Controlador:** `groupController.js` (`GROUP_ENTITY`, `GROUP_MEMBER`, `GROUP_TASK`, `CONVERSATION`, `NOTIFICATION`).
- **Tabelas-chave:** `is_locked` (lock), `muted_until` (mute), `role` (admin/membro).
- **Frontend:** `Community.jsx`.
