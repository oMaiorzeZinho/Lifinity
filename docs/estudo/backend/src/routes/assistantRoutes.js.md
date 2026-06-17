# `backend/src/routes/assistantRoutes.js` — rotas do assistente IA

## Papel no projeto
Endpoints do assistente (chatbot Gemini): histórico e enviar mensagem. Montado em `/api/assistant`. Todas privadas.

## Endpoints
| Método | Caminho | Função | Para quê |
|---|---|---|---|
| GET | `/api/assistant/messages` | `getAssistantMessages` | Histórico da conversa com o assistente. |
| POST | `/api/assistant/messages` | `sendAssistantMessage` | Enviar mensagem e obter resposta da IA. |

## Ligações
- **Controlador:** `assistantController.js` (chama a API do Google Gemini; grava em `ASSISTANT_MESSAGE`).
- **Frontend:** `Chat.jsx` (modo assistente), `AssistantActivity` no Android.
