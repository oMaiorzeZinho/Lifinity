# `api/ChatApi.java` — interface Retrofit do chat

## Papel
Pedidos do **chat entre utilizadores/grupos**: listar conversas, ler mensagens e enviar mensagem.

## Código e explicação
```java
@GET("chat/conversations")
Call<List<Conversation>> getConversations(@Header(...) String token);
```
- Lista as **conversas** do utilizador (`List<Conversation>` — id, nome, última mensagem, não lidas). É o
  que o `ConversationsActivity` mostra e o que a partilha de versículos usa para escolher destino.

```java
@GET("chat/conversations/{id}/messages")
Call<List<ChatMessage>> getMessages(@Header(...) String token, @Path("id") int conversationId);
```
- Lê as **mensagens** de uma conversa (`@Path("id")` = nº da conversa). Devolve `List<ChatMessage>`.

```java
@POST("chat/conversations/{id}/messages")
Call<ChatMessage> sendMessage(@Header(...) String token, @Path("id") int conversationId, @Body SendChatMessageRequest body);
```
- Envia uma **nova mensagem** para a conversa `id`. O corpo `SendChatMessageRequest` só tem o **`content`**
  (texto). Devolve o `ChatMessage` criado (para o adicionar logo à lista no ecrã).

## Ligações
- **Backend:** [`chatRoutes.js`](../../backend/src/routes/chatRoutes.js.md) / [`chatController.js`](../../backend/src/controllers/chatController.js.md).
- **Models:** `Conversation`, `ChatMessage`, `SendChatMessageRequest`.
- **Quem chama:** `ConversationsActivity`, `ChatActivity`, e `InspirationActivity` (partilhar versículo).
