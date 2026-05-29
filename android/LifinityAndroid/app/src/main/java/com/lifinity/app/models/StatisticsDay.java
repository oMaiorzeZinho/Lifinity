package com.lifinity.app.models;

public class StatisticsDay {
    private String date;
    private String label;
    private int tasksCreated;
    private int tasksCompleted;
    private int tasksLost;
    private int xpGained;

    public String getDate() {
        return date;
    }

    public String getLabel() {
        return label != null ? label : "";
    }

    public int getTasksCreated() {
        return tasksCreated;
    }

    public int getTasksCompleted() {
        return tasksCompleted;
    }

    public int getTasksLost() {
        return tasksLost;
    }

    public int getXpGained() {
        return xpGained;
    }
}
