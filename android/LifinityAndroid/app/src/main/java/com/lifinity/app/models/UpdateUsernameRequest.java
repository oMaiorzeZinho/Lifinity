package com.lifinity.app.models;

public class UpdateUsernameRequest {
    private final String newUsername;

    public UpdateUsernameRequest(String newUsername) {
        this.newUsername = newUsername;
    }

    public String getNewUsername() {
        return newUsername;
    }
}
