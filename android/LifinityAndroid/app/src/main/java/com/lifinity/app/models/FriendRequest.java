package com.lifinity.app.models;

/**
 * Um pedido de amizade recebido. Espelha o JSON de GET /friends/requests:
 * {idfriendship, iduser, username, level, xp, created_at}.
 * O iduser aqui é o de quem ENVIOU o pedido (o requester).
 */
public class FriendRequest {
    private Integer idfriendship;
    private Integer iduser;
    private String username;
    private Integer level;
    private Integer xp;
    private String created_at;
    // TODO(backend): GET /friends/requests ainda NÃO devolve "avatar" no SELECT
    // (friendController). Enquanto não devolver, fica null → placeholder com inicial.
    private String avatar;

    public Integer getIdfriendship() {
        return idfriendship;
    }

    public String getAvatar() {
        return avatar;
    }

    public Integer getIduser() {
        return iduser;
    }

    public String getUsername() {
        return username != null ? username : "—";
    }

    public int getLevel() {
        return level != null ? level : 1;
    }

    public int getXp() {
        return xp != null ? xp : 0;
    }

    public String getCreatedAt() {
        return created_at;
    }
}
