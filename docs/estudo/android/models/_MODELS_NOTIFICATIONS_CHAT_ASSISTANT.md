# Android — Models de notificações, chat e assistente (8 ficheiros)

> Agrupa: `Notification`, `AppNotification`, `ChatMessage`, `Conversation`,
> `SendChatMessageRequest`, `AssistantMessage`, `AssistantSendRequest`, `AssistantSendResponse`.

## Notificações — `Notification` vs `AppNotification`
Há **dois** models de notificação (importante saber distingui-los na defesa):
- **`AppNotification`** — o **realmente usado** pela API (`NotificationApi`). Chama-se "App..." de
  propósito, para **não chocar** com a classe `android.app.Notification` do sistema. Campos:
  `idnotification`, `message`, `is_read` (um **Integer**: 0/1), `created_at` (com `@SerializedName` porque o
  campo é snake_case). Métodos úteis: `isRead()` (true se `is_read == 1`) e `markAsRead()` (marca como lida
  **localmente**, sem recarregar da API).
- **`Notification`** — model mais completo (`type`, `entity_type`, `entity_id`, `link`, `is_read` como
  **Boolean**, ...) que **não** é o usado pela `NotificationApi` atual. Confirma sempre pelo `Call<...>`
  qual é o que está em uso.

## Chat
- **`Conversation`** — uma conversa na lista. Campos (com `@SerializedName`): `idconversation`, `name`,
  `last_message`, `updated_at`, `unread_count`. É o que o `ConversationsActivity` mostra e o que a partilha
  de versículos lista.
- **`ChatMessage`** — uma mensagem. Campos: `idmessage`, `iduser`, `content`, `created_at`. Tem um
  **construtor `(iduser, content)`** para criar mensagens **localmente** (mostrar logo no ecrã, antes de a
  API confirmar — *optimistic UI*). `isMine(currentUserId)` decide se a bolha é "minha" (à direita) ou do
  outro (à esquerda) no `ChatMessageAdapter`.
- **`SendChatMessageRequest`** — corpo do envio: **só `content`** (texto). Por isso, ao partilhar um
  versículo, envia-se apenas o texto já formatado.

## Assistente (chatbot IA)
- **`AssistantMessage`** — mensagem da conversa com o assistente. Campos: `idmessage`, `role`
  (`"user"`/`"assistant"`), `content`, `created_at`. Construtor `(role, content)` para criar localmente;
  `isUser()` distingue quem falou (para alinhar/colorir a bolha no adapter).
- **`AssistantSendRequest`** — corpo do envio: só **`message`** (a pergunta do utilizador). ⚠️ Repara que o
  campo aqui é `message` (não `content` como no chat normal) — são endpoints diferentes.
- **`AssistantSendResponse`** — resposta: **`userMessage`** + **`assistantMessage`** (ambos
  `AssistantMessage`, com `@SerializedName`). Ou seja, o backend devolve **as duas** mensagens de uma vez (a
  do utilizador, já guardada, e a resposta gerada pelo Gemini) — a app adiciona ambas à lista.

## Sobre `@SerializedName`
Vários destes campos usam `@SerializedName("is_read")`, `@SerializedName("created_at")`,
`@SerializedName("idconversation")`, etc. Serve para **ligar** um nome de campo Java a uma chave JSON com
nome diferente (ou para garantir o mapeamento mesmo que o nome batesse certo). É a ponte explícita entre o
JSON do backend e o objeto Java.

## Ligações
- **APIs:** [`NotificationApi`](../api/NotificationApi.java.md), [`ChatApi`](../api/ChatApi.java.md), [`AssistantApi`](../api/AssistantApi.java.md).
- **Backend:** `notificationController.js`, `chatController.js`, `assistantController.js`.
- **Quem usa:** `NotificationsActivity`/`HeaderHelper`, `ConversationsActivity`/`ChatActivity`, `AssistantActivity`, e os respetivos adapters.
