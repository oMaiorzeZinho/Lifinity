package com.lifinity.app.models;

public class Achievement {
    private Integer idbadge;
    private String code;
    private String name;
    private String description;
    private String category;
    private String icon_url;
    private String earned_at;
    private Boolean unlocked;
    private Boolean highlighted;
    private Integer position;

    public Integer getIdbadge() {
        return idbadge;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getIconUrl() {
        return icon_url;
    }

    public String getEarnedAt() {
        return earned_at;
    }

    public boolean isUnlocked() {
        return Boolean.TRUE.equals(unlocked);
    }

    public boolean isHighlighted() {
        return Boolean.TRUE.equals(highlighted);
    }

    public Integer getPosition() {
        return position;
    }
}
