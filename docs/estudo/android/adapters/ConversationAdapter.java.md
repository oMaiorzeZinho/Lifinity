# `adapters/ConversationAdapter.java` — adapter da lista de conversas

## Papel
Liga a lista de `Conversation` às linhas (nome, última mensagem, data, **badge de não lidas**). Padrão em
[`TaskAdapter`](TaskAdapter.java.md).

## Pontos a notar
- Mostra o **nome** da conversa (ou "Conversa") e a **última mensagem** (escondida se não houver).
- **Badge de não lidas:** se `unreadCount > 0`, desenha um círculo verde (`GradientDrawable` oval) com o
  número; senão esconde. É o mesmo truque do ponto das notificações.
- **`formatDate`** → `dd/MM · HH:mm` (tentando vários formatos do `updated_at`).
- **Clique** → `listener.onConversationClick(conversation)`, que a `ConversationsActivity` usa para abrir o
  `ChatActivity` com os extras certos.

## Ligações
- **Layout:** `res/layout/item_conversation.xml`. **Model:** `Conversation`. **Usa:** `ConversationsActivity`.
