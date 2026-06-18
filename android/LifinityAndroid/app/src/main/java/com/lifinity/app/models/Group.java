package com.lifinity.app.models;

/**
 * Um grupo do utilizador. Espelha o JSON de GET /groups:
 * {idgroup, name, description, invite_code, is_locked, idowner, role, created_at, member_count}.
 */
public class Group {
    private Integer idgroup;
    private String name;
    private String description;
    private String invite_code;
    private Integer is_locked;
    private Integer idowner;
    private String role;
    private String created_at;
    private Integer member_count;

    public Integer getIdgroup() {
        return idgroup;
    }

    public String getName() {
        return name != null ? name : "Grupo";
    }

    public String getDescription() {
        return description;
    }

    public String getInviteCode() {
        return invite_code != null ? invite_code : "";
    }

    public boolean isLocked() {
        return is_locked != null && is_locked == 1;
    }

    public Integer getIdowner() {
        return idowner;
    }

    public String getRole() {
        return role != null ? role : "membro";
    }

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(getRole());
    }

    public int getMemberCount() {
        return member_count != null ? member_count : 0;
    }
}
