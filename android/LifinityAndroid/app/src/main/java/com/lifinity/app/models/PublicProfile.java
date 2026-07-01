package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

import java.util.List;

/**
 * Perfil público de um utilizador (GET /users/{iduser}/public-profile), usado no
 * popup "Ver perfil" de um amigo. Espelha o que a web mostra no PublicProfileModal.
 *
 * NOTA: o endpoint NÃO devolve xp — o XP é lido do objeto {@link Friend} já
 * disponível na lista de amigos. As conquistas em destaque reutilizam o modelo
 * {@link Achievement} (os campos idbadge/name/description/... coincidem).
 */
public class PublicProfile {
    private String username;
    private Integer level;
    private String avatar;
    private String bio;

    @SerializedName("highlightedBadges")
    private List<Achievement> highlightedBadges;

    @SerializedName("totalUnlockedBadges")
    private Integer totalUnlockedBadges;

    public String getUsername() {
        return username;
    }

    public Integer getLevel() {
        return level;
    }

    public String getAvatar() {
        return avatar;
    }

    public String getBio() {
        return bio;
    }

    public List<Achievement> getHighlightedBadges() {
        return highlightedBadges;
    }

    public Integer getTotalUnlockedBadges() {
        return totalUnlockedBadges;
    }
}
