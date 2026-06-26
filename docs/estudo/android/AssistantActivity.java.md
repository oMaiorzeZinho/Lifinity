# `AssistantActivity.java` — chatbot assistente (Gemini)

## Papel
Conversa com o **assistente inteligente** (a IA Gemini, no backend). Muito parecido com o
[`ChatActivity`](ChatActivity.java.md), mas o "outro" é o assistente, não outra pessoa.

## `onCreate`
Igual ao chat: `RecyclerView` com `setStackFromEnd(true)`, [`AssistantMessageAdapter`](adapters/_ADAPTERS_CHAT_ASSISTANT.md), envio pelo botão ou pela tecla "enviar" do teclado, e `loadHistory()`.

## `loadHistory` — histórico ou boas-vindas
```java
if (resposta com mensagens) adapter.setMessages(response.body());
else adapter.addMessage(new AssistantMessage("assistant", WELCOME));  // histórico vazio
... onFailure: também mostra a mensagem WELCOME
```
- `GET /assistant/messages`. Se **não houver histórico** (ou falhar a ligação), mostra uma **mensagem de
  boas-vindas** fixa (`WELCOME`) com exemplos de comandos — assim o ecrã nunca fica vazio/confuso.

## `send` — pergunta e resposta
```java
adapter.addMessage(new AssistantMessage("user", text));  // mostra já a minha pergunta
input.setText(""); sendButton.setEnabled(false);
sendCall = api.sendMessage("Bearer " + getToken(), new AssistantSendRequest(text));
... onResponse:
AssistantMessage assistantMsg = response.body().getAssistantMessage();
if (assistantMsg tem conteúdo) adapter.addMessage(assistantMsg);
else adapter.addMessage(new AssistantMessage("assistant", "Não consegui gerar uma resposta..."));
```
- Mostra a pergunta **optimisticamente**; envia ao backend (que fala com o Gemini) e, quando volta a
  **`AssistantSendResponse`**, adiciona a **`assistantMessage`** (a resposta gerada). Se vier vazia/erro,
  mostra um *fallback* simpático em vez de nada.
- Repara que aqui **só** se adiciona a resposta do assistente (a do utilizador já foi mostrada localmente);
  o `userMessage` da resposta é ignorado para não duplicar.

## Ligações
- **API/Backend:** [`AssistantApi`](api/AssistantApi.java.md) → `assistantController` (integração **Gemini**).
- **Models/Adapter:** `AssistantMessage`, `AssistantSendRequest`, `AssistantSendResponse`,
  `AssistantMessageAdapter`.
- **Abre a partir de:** `CommunityActivity`. **Manifest:** `adjustResize` (teclado).
