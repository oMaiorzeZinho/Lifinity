# `backend/src/routes/chatRoutes.js` — rotas de chat

## Papel no projeto
Endpoints do chat (conversas privadas e de grupo, membros, mensagens, não-lidas). Montado em `/api/chat`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/chat/unread-count` | `getUnreadCount` | Nº de mensagens não lidas (badge do widget). |
| GET | `/api/chat/conversations` | `getConversations` | Lista de conversas do utilizador. |
| POST | `/api/chat/conversations/private` | `createPrivateConversation` | Iniciar conversa 1-para-1. |
| POST | `/api/chat/conversations/group` | `createGroupConversation` | Criar conversa de grupo. |
| GET | `/api/chat/conversations/:idconversation/members` | `getConversationMembers` | Membros da conversa. |
| POST | `/api/chat/conversations/:idconversation/members` | `addConversationMembers` | Adicionar membros. |
| DELETE | `/api/chat/conversations/:idconversation/members/:iduser` | `removeConversationMember` | Remover membro. |
| GET | `/api/chat/conversations/:idconversation/messages` | `getMessages` | Carregar mensagens (cronológico). |
| POST | `/api/chat/conversations/:idconversation/messages` | `sendMessage` | Enviar mensagem. |

## Nota
O `unread-count` apoia-se em `CONVERSATION_MEMBER.last_read_at` vs. data das mensagens (ver `estrutura_lifinity.sql`). É o motor do badge "não lidas" do `ChatWidget.jsx`.

## Ligações
- **Controlador:** `chatController.js` (`CONVERSATION`, `CONVERSATION_MEMBER`, `MESSAGE`).
- **Frontend:** `Chat.jsx`, `ChatWidget.jsx`.
