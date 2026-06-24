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
    // TODO(backend): GET /friends e /friends/search ainda NÃO devolvem "avatar"
    // no SELECT (friendController). Enquanto não devolverem, este campo fica null
    // e o avatar mostra o placeholder (círculo + inicial). A app já está pronta.
    private String avatar;

    public Integer getIduser() {
        return iduser;
    }

    public String getAvatar() {
        return avatar;
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
