package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Mensagem do chat com o assistente IA (role = "user" | "assistant").
public class AssistantMessage {
    private Integer idmessage;

    // O backend devolve o autor no campo "sender" (valores "user" | "assistant"),
    // não "role". Antes, ao reabrir o assistente, este campo ficava null e todas as
    // mensagens (incluindo as minhas) eram tratadas como sendo da IA. O "alternate"
    // mantém compatível o construtor local que continua a usar o nome interno "role".
    @SerializedName(value = "sender", alternate = {"role"})
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
