# `ChatActivity.java` — ecrã de uma conversa

## Papel
Mostra as mensagens de uma conversa e permite **enviar** novas. Recebe o id e o nome da conversa por
`Intent`.

## `onCreate`
```java
conversationId = getIntent().getIntExtra(EXTRA_CONVERSATION_ID, -1);
String conversationName = getIntent().getStringExtra(EXTRA_CONVERSATION_NAME);
currentUserId = getSavedUserId();
titleText.setText(...);
LinearLayoutManager layoutManager = new LinearLayoutManager(this);
layoutManager.setStackFromEnd(true);          // mensagens recentes no FUNDO
adapter = new ChatMessageAdapter(currentUserId);
input.setOnEditorActionListener(... IME_ACTION_SEND -> send());
sendButton.setOnClickListener(v -> send());
if (conversationId != -1) loadMessages();
```
- Lê os **extras** (id + nome) — ver `ConversationsActivity`. Lê o **`currentUserId`** do user guardado: o
  adapter precisa dele para saber que mensagens são "minhas" (à direita) vs do outro (à esquerda).
- **`setStackFromEnd(true)`** — num chat queremos as mensagens **mais recentes em baixo** e o *scroll* já lá;
  é o que este flag faz no `LinearLayoutManager`.
- **`setOnEditorActionListener` + `IME_ACTION_SEND`** — permite enviar com a tecla "enviar" do **teclado**
  (não só com o botão).

## `loadMessages`
`GET /chat/conversations/{id}/messages` → `adapter.setMessages(...)` + `scrollToBottom()` (vai para a última
mensagem). Em erro, `Toast`.

## `send` — envio optimista
```java
adapter.addMessage(new ChatMessage(currentUserId, text));  // 1) mostra já a minha mensagem
scrollToBottom(); input.setText(""); sendButton.setEnabled(false);
sendCall = api.sendMessage("Bearer " + getToken(), conversationId, new SendChatMessageRequest(text));
sendCall.enqueue(... onResponse: reactiva o botão; onFailure: Toast de erro);
```
- **Optimistic UI:** a mensagem aparece **imediatamente** (criada localmente com o construtor
  `ChatMessage(iduser, content)`), antes de o servidor confirmar — o chat parece instantâneo. O `POST`
  segue em segundo plano; o botão fica desativado até responder (evita envios duplicados).

## `getSavedUserId`
Lê o `iduser` do `User` guardado nas `SharedPreferences` (ou 0 se não houver). É o que distingue as bolhas
no adapter.

## Ligações
- **API/Backend:** [`ChatApi`](api/ChatApi.java.md) → `chatController`.
- **Models/Adapter:** `ChatMessage`, `SendChatMessageRequest`, `ChatMessageAdapter`.
- **Abre a partir de:** `ConversationsActivity` (e a partilha de versículos manda mensagens para cá).
- **Manifest:** `windowSoftInputMode="adjustResize"` (o ecrã encolhe quando o teclado abre).
