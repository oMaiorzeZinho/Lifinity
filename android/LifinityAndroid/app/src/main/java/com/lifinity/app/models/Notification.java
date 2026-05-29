package com.lifinity.app.models;

// Notificacao interna do utilizador (tabela NOTIFICATION do backend).
public class Notification {
    private Integer idnotification;
    private String type;
    private String message;
    private String entity_type;
    private Integer entity_id;
    private String link;
    private Boolean is_read;
    private String created_at;

    public Integer getIdnotification() {
        return idnotification;
    }

    public String getType() {
        return type;
    }

    public String getMessage() {
        return message;
    }

    public String getEntityType() {
        return entity_type;
    }

    public Integer getEntityId() {
        return entity_id;
    }

    public String getLink() {
        return link;
    }

    public boolean isRead() {
        return Boolean.TRUE.equals(is_read);
    }

    public void setRead(boolean read) {
        this.is_read = read;
    }

    public String getCreatedAt() {
        return created_at;
    }
}
