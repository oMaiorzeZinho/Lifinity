# `adapters/ChatMessageAdapter.java` — adapter do chat (2 tipos de bolha)

## Papel
Liga a lista de `ChatMessage` às bolhas do chat. **Novidade face aos outros adapters:** tem **dois tipos de
linha** — mensagem **enviada** (à direita) e **recebida** (à esquerda).

## Múltiplos *view types*
```java
private static final int TYPE_SENT = 0, TYPE_RECEIVED = 1;
public ChatMessageAdapter(int currentUserId) { this.currentUserId = currentUserId; }

@Override public int getItemViewType(int position) {
    return messages.get(position).isMine(currentUserId) ? TYPE_SENT : TYPE_RECEIVED;
}

@Override public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
    if (viewType == TYPE_SENT)  return new SentViewHolder(inflate(R.layout.item_chat_sent));
    else                        return new ReceivedViewHolder(inflate(R.layout.item_chat_received));
}
```
- **`getItemViewType`** — o RecyclerView pergunta, para cada posição, "que tipo de linha é esta?". Aqui
  decide-se com **`message.isMine(currentUserId)`**: se o `iduser` da mensagem é o meu, é "enviada"; senão é
  "recebida".
- **`onCreateViewHolder`** infla um **layout diferente** consoante o tipo (`item_chat_sent` à direita vs
  `item_chat_received` à esquerda) e devolve o ViewHolder respetivo. É assim que o chat ganha o visual
  clássico de bolhas alinhadas a lados diferentes.
- **`addMessage`** + `notifyItemInserted(...)` — acrescenta uma mensagem no fim **sem** recarregar a lista
  toda (mais eficiente e com animação) — usado no envio optimista do `ChatActivity`.

## Ligações
- **Layouts:** `item_chat_sent.xml`, `item_chat_received.xml`. **Model:** `ChatMessage`.
- **Usa:** `ChatActivity`. **Padrão base:** [`TaskAdapter`](TaskAdapter.java.md).
