package com.lifinity.app.models;

public class DeleteAccountRequest {
    private final String username;
    private final String password;

    public DeleteAccountRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }
}
