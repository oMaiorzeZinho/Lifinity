package com.lifinity.app.models;

public class AssistantSendRequest {
    private final String content;

    public AssistantSendRequest(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }
}
