package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Resposta ao POST /assistant/messages.
// O backend devolve { reply, messages: [...], action_type, data }, onde "reply" é a
// resposta do assistente. Os "alternate" mantêm compatibilidade caso o formato mude.
public class AssistantSendResponse {
    @SerializedName(value = "userMessage", alternate = {"user_message"})
    private AssistantMessage userMessage;

    // A resposta do assistente vem no campo "reply".
    @SerializedName(value = "reply", alternate = {"assistantMessage"})
    private AssistantMessage assistantMessage;

    public AssistantMessage getUserMessage()      { return userMessage; }
    public AssistantMessage getAssistantMessage() { return assistantMessage; }
}
