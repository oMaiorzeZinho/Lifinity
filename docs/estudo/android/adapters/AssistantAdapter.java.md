# `adapters/AssistantAdapter.java` — adapter do assistente (variante alternativa)

## Papel
Outro adapter para mensagens do assistente (`AssistantMessage`), com **dois tipos de linha** (utilizador vs
assistente) tal como o [`AssistantMessageAdapter`](AssistantMessageAdapter.java.md).

## Nota de estudo (importante)
⚠️ **Quem a `AssistantActivity` usa é o `AssistantMessageAdapter`, não este.** O `AssistantAdapter` é uma
**variante** (provavelmente anterior/alternativa) que:
- infla layouts **diferentes** (`item_chat_message_sent` / `item_chat_message_received`);
- mostra também a **hora** (`formatTime` → `HH:mm`) e um rótulo de **remetente** fixo "Assistente"
  (`senderName.setText("Assistente")`);
- **não** tem `addMessage` (só `setMessages`).

Saber distinguir os dois na defesa mostra atenção ao detalhe. O comportamento descrito aqui corresponde ao
código real, mas este adapter **não está no caminho ativo** do ecrã do assistente.

## Ligações
- **Layouts:** `item_chat_message_sent.xml`, `item_chat_message_received.xml`. **Model:** `AssistantMessage`.
- **Ativo em uso:** [`AssistantMessageAdapter`](AssistantMessageAdapter.java.md).
