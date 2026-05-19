package com.lifinity.app.models;

public class Task {
    private Integer idtask;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String due_date;
    private String created_at;

    public Integer getIdtask() {
        return idtask;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public String getDueDate() {
        return due_date;
    }

    public String getCreatedAt() {
        return created_at;
    }
}
