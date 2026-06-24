package com.lifinity.app.models;

public class User {
    private Integer iduser;
    private String username;
    private String email;
    private Integer xp;
    private Integer level;
    // Caminho da imagem de perfil (ex: "/uploads/avatars/x.jpg"); pode ser null.
    // O backend devolve este campo no login e no perfil (/users/me).
    private String avatar;

    public Integer getIduser() {
        return iduser;
    }

    public String getAvatar() {
        return avatar;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Integer getXp() {
        return xp;
    }

    public Integer getLevel() {
        return level;
    }
}
