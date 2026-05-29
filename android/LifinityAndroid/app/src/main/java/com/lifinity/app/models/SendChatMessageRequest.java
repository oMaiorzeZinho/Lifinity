package com.lifinity.app.models;

// Corpo do pedido POST /chat/conversations/:id/messages.
public class SendChatMessageRequest {
    private final String content;

    public SendChatMessageRequest(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }
}
