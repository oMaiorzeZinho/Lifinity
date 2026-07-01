package com.lifinity.app.models;

// Corpo do pedido POST /assistant/messages: { content }.
// IMPORTANTE: o backend (assistantController.sendAssistantMessage) lê req.body.content
// — o mesmo que o browser envia (Chat.jsx). Antes o campo chamava-se "message", pelo que
// o backend recebia conteúdo vazio, respondia 400 e a app caía no texto de fallback.
public class AssistantSendRequest {
    private final String content;

    public AssistantSendRequest(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }
}
