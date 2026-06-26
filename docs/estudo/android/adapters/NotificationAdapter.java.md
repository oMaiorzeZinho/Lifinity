# `adapters/NotificationAdapter.java` — adapter das notificações

## Papel
Liga a lista de `AppNotification` às linhas (mensagem, data, ponto de "não lida"). Padrão em
[`TaskAdapter`](TaskAdapter.java.md).

## Pontos a notar
- **Callback de clique** por interface (`OnNotificationClickListener`), como nos outros.
- **Estado lido/não lido:**
  ```java
  messageText.setTypeface(null, read ? Typeface.NORMAL : Typeface.BOLD);   // não lida = negrito
  GradientDrawable circle = new GradientDrawable(); circle.setShape(OVAL);
  circle.setColor(read ? Color.parseColor("#888888") : lifinity_primary);   // ponto cinza vs menta
  dot.setBackground(circle);
  ```
  As não lidas ficam **a negrito** e com um **ponto verde**; as lidas ficam normais e com ponto cinza. O
  ponto é desenhado em código (`GradientDrawable` oval) — não precisa de drawable XML.
- **Clique só se não lida:**
  ```java
  itemView.setOnClickListener(v -> { if (... && !notification.isRead()) listener.onNotificationClick(notification); });
  ```
  Tocar numa já lida não faz nada (não vale a pena re-marcar). É isto que liga ao *optimistic UI* da
  `NotificationsActivity`.
- **`formatDate`** tenta vários formatos ISO e mostra `dd/MM · HH:mm` (com *fallback* aos 10 primeiros
  caracteres).

## Ligações
- **Layout:** `res/layout/item_notification.xml`. **Model:** `AppNotification`. **Usa:** `NotificationsActivity`.
