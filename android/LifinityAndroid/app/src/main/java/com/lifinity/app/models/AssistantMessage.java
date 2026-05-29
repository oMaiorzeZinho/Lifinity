package com.lifinity.app.models;

// Mensagem do assistente (tabela ASSISTANT_MESSAGE). sender = "user" | "assistant".
public class AssistantMessage {
    private Integer idmessage;
    private String sender;
    private String content;
    private String action_type;
    private String created_at;

    public AssistantMessage() {
    }

    public AssistantMessage(String sender, String content) {
        this.sender = sender;
        this.content = content;
    }

    public Integer getIdmessage() {
        return idmessage;
    }

    public String getSender() {
        return sender;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getActionType() {
        return action_type;
    }

    public String getCreatedAt() {
        return created_at;
    }

    public boolean isFromUser() {
        return "user".equals(sender);
    }
}
