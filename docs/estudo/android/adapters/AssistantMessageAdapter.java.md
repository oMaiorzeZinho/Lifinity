# `adapters/AssistantMessageAdapter.java` — adapter do assistente (2 tipos de bolha)

## Papel
Igual em espírito ao [`ChatMessageAdapter`](ChatMessageAdapter.java.md), mas para o **assistente IA**: duas
bolhas — **utilizador** vs **assistente**. É o adapter **realmente usado** pela `AssistantActivity`.

## Como decide o tipo
```java
private static final int TYPE_USER = 0, TYPE_ASSISTANT = 1;
@Override public int getItemViewType(int position) {
    return messages.get(position).isUser() ? TYPE_USER : TYPE_ASSISTANT;   // role == "user"?
}
@Override public RecyclerView.ViewHolder onCreateViewHolder(...) {
    if (viewType == TYPE_USER) return new UserViewHolder(inflate(R.layout.item_message_user));
    else                       return new AssistantViewHolder(inflate(R.layout.item_message_assistant));
}
```
- Distingue pelo **`role`** da `AssistantMessage` (`isUser()` = `"user".equals(role)`): a pergunta do
  utilizador num layout, a resposta do assistente noutro.
- Tem `setMessages` (substitui tudo) e **`addMessage`** + `notifyItemInserted` (acrescenta no fim) — usados
  no envio optimista e na chegada da resposta.

## Ligações
- **Layouts:** `item_message_user.xml`, `item_message_assistant.xml`. **Model:** `AssistantMessage`.
- **Usa:** `AssistantActivity`.
