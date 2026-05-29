package com.lifinity.app.models;

// Corpo do pedido POST /assistant/messages.
public class AssistantSendRequest {
    private final String message;

    public AssistantSendRequest(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
