package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Mensagem de uma conversa de chat.
public class ChatMessage {
    @SerializedName("idmessage")
    private Integer idmessage;

    // O backend devolve o autor da mensagem no campo "idsender" (ver chatController
    // getMessages/sendMessage). Antes este campo estava mapeado a "iduser", que NÃO
    // existe no JSON, pelo que ficava sempre null e TODAS as mensagens iam para a
    // esquerda (recebidas) ao reabrir a conversa. O "alternate" mantém compatível o
    // construtor local (envio optimista) que continua a usar o nome interno.
    @SerializedName(value = "idsender", alternate = {"iduser"})
    private Integer iduser;

    // Nome de quem enviou a mensagem (útil para identificar o remetente em grupos).
    @SerializedName("sender_username")
    private String sender_username;

    @SerializedName("content")
    private String content;

    @SerializedName("created_at")
    private String created_at;

    // Construtor para mensagens criadas localmente antes da confirmação da API.
    public ChatMessage(int iduser, String content) {
        this.iduser  = iduser;
        this.content = content;
    }

    public Integer getIdmessage()    { return idmessage; }
    public Integer getIduser()       { return iduser; }
    public String  getSenderName()   { return sender_username; }
    public String  getContent()      { return content; }
    public String  getCreatedAt()    { return created_at; }

    // Devolve true se a mensagem foi enviada pelo utilizador actual.
    // IMPORTANTE: compara por VALOR (intValue()). Comparar dois Integer com "=="
    // compara referências para valores > 127 (fora da cache de Integer), o que daria
    // resultados errados sobre quem enviou cada mensagem.
    public boolean isMine(int currentUserId) {
        return iduser != null && iduser.intValue() == currentUserId;
    }
}
