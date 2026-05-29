package com.lifinity.app.models;

public class RankingUser {
    private Integer iduser;
    private String username;
    private Integer xp;
    private Integer level;

    public Integer getIduser() { return iduser; }
    public String getUsername() { return username != null ? username : "—"; }
    public int getXp() { return xp != null ? xp : 0; }
    public int getLevel() { return level != null ? level : 1; }
}
