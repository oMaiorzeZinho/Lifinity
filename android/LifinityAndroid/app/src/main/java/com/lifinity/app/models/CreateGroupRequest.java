package com.lifinity.app.models;

/**
 * Corpo do pedido POST /groups: { name, description }.
 */
public class CreateGroupRequest {
    private String name;
    private String description;

    public CreateGroupRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
