package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Resposta ao POST /assistant/messages.
public class AssistantSendResponse {
    @SerializedName("userMessage")
    private AssistantMessage userMessage;

    @SerializedName("assistantMessage")
    private AssistantMessage assistantMessage;

    public AssistantMessage getUserMessage()      { return userMessage; }
    public AssistantMessage getAssistantMessage() { return assistantMessage; }
}
