package com.lifinity.app.models;

/**
 * Um membro de um grupo. Espelha o JSON de GET /groups/{idgroup}/members:
 * {iduser, username, level, xp, role, muted_until}.
 */
public class GroupMember {
    private Integer iduser;
    private String username;
    private Integer level;
    private Integer xp;
    private String role;
    private String muted_until;
    // TODO(backend): GET /groups/{id}/members ainda NÃO devolve "avatar" no SELECT
    // (groupController). Enquanto não devolver, fica null → placeholder com inicial.
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

    public String getRole() {
        return role != null ? role : "membro";
    }

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(getRole());
    }

    public String getMutedUntil() {
        return muted_until;
    }
}
