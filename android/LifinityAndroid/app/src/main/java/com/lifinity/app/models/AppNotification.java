package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Notificação do utilizador vinda da API (evita conflito com android.app.Notification).
public class AppNotification {
    private Integer idnotification;
    private String message;

    @SerializedName("is_read")
    private Integer is_read;

    @SerializedName("created_at")
    private String created_at;

    public Integer getIdnotification() {
        return idnotification;
    }

    public String getMessage() {
        return message;
    }

    public Integer getIsRead() {
        return is_read;
    }

    public String getCreatedAt() {
        return created_at;
    }

    // Devolve true se a notificação já foi lida (is_read == 1).
    public boolean isRead() {
        return is_read != null && is_read == 1;
    }

    // Marca localmente como lida sem precisar recarregar da API.
    public void markAsRead() {
        this.is_read = 1;
    }
}
