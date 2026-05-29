package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Conversa do utilizador (lista de chats).
public class Conversation {
    @SerializedName("idconversation")
    private Integer idconversation;

    @SerializedName("name")
    private String name;

    @SerializedName("last_message")
    private String last_message;

    @SerializedName("updated_at")
    private String updated_at;

    @SerializedName("unread_count")
    private Integer unread_count;

    public Integer getIdconversation() { return idconversation; }
    public String  getName()           { return name; }
    public String  getLastMessage()    { return last_message; }
    public String  getUpdatedAt()      { return updated_at; }
    public Integer getUnreadCount()    { return unread_count; }
}
