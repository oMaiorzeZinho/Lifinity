package com.lifinity.app.models;

public class Verse {
    private Integer idverse;
    private Integer idfavorite;
    private String text;
    private String book;
    private Integer chapter;
    private Integer verse;
    private String theme;
    private Boolean isFavorite;

    public Integer getIdverse() {
        return idverse;
    }

    public Integer getIdfavorite() {
        return idfavorite;
    }

    public String getText() {
        return text;
    }

    public String getBook() {
        return book;
    }

    public Integer getChapter() {
        return chapter;
    }

    public Integer getVerse() {
        return verse;
    }

    public String getTheme() {
        return theme;
    }

    public Boolean getIsFavorite() {
        return isFavorite;
    }

    public void setIsFavorite(Boolean isFavorite) {
        this.isFavorite = isFavorite;
    }
}
