# `ConversationsActivity.java` — lista de conversas

## Papel
Lista as conversas do utilizador; ao tocar numa, abre o [`ChatActivity`](ChatActivity.java.md). Abre-se pela
Comunidade.

## Bloco a bloco
- `onCreate`: liga o "voltar", cria o [`ConversationAdapter`](adapters/ConversationAdapter.java.md) com o
  *callback* `this::openConversation`, e configura o `RecyclerView`.
- **`onResume`** chama `loadConversations()` — recarrega ao **voltar** de uma conversa, para refletir
  mensagens novas / contadores de não lidas.
- **`loadConversations`**: `GET /chat/conversations` → passa a lista ao adapter; mostra "vazio" se não houver
  conversas. Cancela o pedido anterior antes de pedir outro (evita respostas sobrepostas).

## Abrir uma conversa — passar dados por Intent
```java
private void openConversation(Conversation conversation) {
    if (conversation == null || conversation.getIdconversation() == null) return;
    Intent intent = new Intent(this, ChatActivity.class);
    intent.putExtra(ChatActivity.EXTRA_CONVERSATION_ID, conversation.getIdconversation());
    intent.putExtra(ChatActivity.EXTRA_CONVERSATION_NAME, conversation.getName() != null ? conversation.getName() : "Conversa");
    startActivity(intent);
}
```
- Mete o **id** e o **nome** da conversa nos **extras** do Intent, usando as constantes públicas do
  `ChatActivity` (o "contrato" entre os dois ecrãs). O Chat lê-os no seu `onCreate`.

## Ligações
- **API/Backend:** [`ChatApi`](api/ChatApi.java.md) (`getConversations`) → `chatController`.
- **Model/Adapter:** `Conversation`, `ConversationAdapter`. **Destino:** `ChatActivity`.
