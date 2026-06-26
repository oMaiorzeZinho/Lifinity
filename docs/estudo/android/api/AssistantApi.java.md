# `api/AssistantApi.java` — interface Retrofit do assistente (chatbot IA)

## Papel
Os dois pedidos do **assistente inteligente** (Gemini, no backend): ler o histórico de mensagens e enviar
uma nova mensagem.

## Código e explicação
```java
@GET("assistant/messages")
Call<List<AssistantMessage>> getHistory(@Header(...) String token);
```
- Carrega o **histórico** da conversa com o assistente (`List<AssistantMessage>`) — para repovoar o ecrã
  quando se reabre.

```java
@POST("assistant/messages")
Call<AssistantSendResponse> sendMessage(@Header(...) String token, @Body AssistantSendRequest body);
```
- Envia a pergunta do utilizador (`AssistantSendRequest` com o texto) e recebe a resposta
  (`AssistantSendResponse`). É o backend que fala com a API do **Gemini** e devolve o texto gerado — a app
  só envia e mostra.

## Ligações
- **Backend:** [`assistantRoutes.js`](../../backend/src/routes/assistantRoutes.js.md) / [`assistantController.js`](../../backend/src/controllers/assistantController.js.md) (integração Gemini).
- **Models:** `AssistantMessage`, `AssistantSendRequest`, `AssistantSendResponse`.
- **Quem chama:** `AssistantActivity`.
