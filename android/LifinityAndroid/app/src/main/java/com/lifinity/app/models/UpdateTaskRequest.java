package com.lifinity.app.models;

public class UpdateTaskRequest {
    private String title;
    private String description;
    private String priority;
    private String due_date;

    public UpdateTaskRequest(String title, String description, String priority, String dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.due_date = dueDate;
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

    public String getDueDate() {
        return due_date;
    }
}
