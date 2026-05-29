package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Mensagem do chat com o assistente IA (role = "user" | "assistant").
public class AssistantMessage {
    private Integer idmessage;
    private String role;
    private String content;

    @SerializedName("created_at")
    private String created_at;

    // Construtor para mensagens criadas localmente (sem vir da API).
    public AssistantMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public Integer getIdmessage() { return idmessage; }
    public String  getRole()      { return role; }
    public String  getContent()   { return content; }
    public String  getCreatedAt() { return created_at; }

    // Devolve true se a mensagem foi enviada pelo utilizador.
    public boolean isUser() {
        return "user".equals(role);
    }
}
