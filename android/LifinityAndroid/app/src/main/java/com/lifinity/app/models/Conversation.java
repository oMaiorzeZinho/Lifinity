package com.lifinity.app.models;

import android.text.TextUtils;

import com.google.gson.annotations.SerializedName;

// Conversa do utilizador (lista de chats).
// O backend (chatController.getConversations) preenche "name" só para GRUPOS; nas
// conversas privadas o nome e o avatar do outro utilizador vêm em campos próprios
// (other_username / other_avatar). Por isso o modelo guarda ambos e resolve o que
// mostrar em getDisplayName()/getDisplayAvatar().
public class Conversation {
    @SerializedName("idconversation")
    private Integer idconversation;

    @SerializedName("type")
    private String type;

    @SerializedName("name")
    private String name;

    @SerializedName("idgroup")
    private Integer idgroup;

    // Dados do outro utilizador (apenas em conversas privadas)
    @SerializedName("other_user_id")
    private Integer other_user_id;

    @SerializedName("other_username")
    private String other_username;

    @SerializedName("other_avatar")
    private String other_avatar;

    @SerializedName("last_message")
    private String last_message;

    @SerializedName("last_sender_username")
    private String last_sender_username;

    @SerializedName("updated_at")
    private String updated_at;

    @SerializedName("unread_count")
    private Integer unread_count;

    public Integer getIdconversation()  { return idconversation; }
    public String  getType()            { return type; }
    public String  getName()            { return name; }
    public Integer getIdgroup()         { return idgroup; }
    public Integer getOtherUserId()     { return other_user_id; }
    public String  getOtherUsername()   { return other_username; }
    public String  getOtherAvatar()     { return other_avatar; }
    public String  getLastMessage()     { return last_message; }
    public String  getLastSenderName()  { return last_sender_username; }
    public String  getUpdatedAt()       { return updated_at; }
    public Integer getUnreadCount()     { return unread_count; }

    // É uma conversa de grupo? (tem idgroup OU type == "group")
    public boolean isGroup() {
        return idgroup != null || "group".equalsIgnoreCase(type);
    }

    // Nome a mostrar: grupos -> name; privadas -> nome do outro utilizador.
    public String getDisplayName() {
        if (isGroup()) {
            return !TextUtils.isEmpty(name) ? name : "Grupo";
        }
        if (!TextUtils.isEmpty(other_username)) {
            return other_username;
        }
        // Fallback para grupos antigos sem idgroup mas com name preenchido
        return !TextUtils.isEmpty(name) ? name : "Conversa";
    }

    // Avatar a mostrar na lista: privadas -> avatar do outro utilizador;
    // grupos -> null (a lista usa o placeholder com a inicial do nome).
    public String getDisplayAvatar() {
        return isGroup() ? null : other_avatar;
    }
}
