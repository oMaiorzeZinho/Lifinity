package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Mensagem de uma conversa de chat.
public class ChatMessage {
    @SerializedName("idmessage")
    private Integer idmessage;

    @SerializedName("iduser")
    private Integer iduser;

    @SerializedName("content")
    private String content;

    @SerializedName("created_at")
    private String created_at;

    // Construtor para mensagens criadas localmente antes da confirmação da API.
    public ChatMessage(int iduser, String content) {
        this.iduser  = iduser;
        this.content = content;
    }

    public Integer getIdmessage() { return idmessage; }
    public Integer getIduser()    { return iduser; }
    public String  getContent()   { return content; }
    public String  getCreatedAt() { return created_at; }

    // Devolve true se a mensagem foi enviada pelo utilizador actual.
    public boolean isMine(int currentUserId) {
        return iduser != null && iduser == currentUserId;
    }
}
