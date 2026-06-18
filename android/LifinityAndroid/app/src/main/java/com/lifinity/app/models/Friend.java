package com.lifinity.app.models;

/**
 * Um amigo (ou um resultado de pesquisa de utilizadores). Espelha o JSON
 * devolvido por GET /friends e GET /friends/search: {iduser, username, level, xp}.
 */
public class Friend {
    private Integer iduser;
    private String username;
    private Integer level;
    private Integer xp;

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
}
