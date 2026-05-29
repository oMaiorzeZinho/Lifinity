package com.lifinity.app.models;

// Resumo vindo do modulo C (gamification.calculateStats).
public class StatisticsSummary {
    private int totalTasks;
    private int completedTasks;
    private int pendingTasks;
    private int lostTasks;
    private int totalXP;
    private double completionRate;
    private double productivityScore;

    public int getTotalTasks() {
        return totalTasks;
    }

    public int getCompletedTasks() {
        return completedTasks;
    }

    public int getPendingTasks() {
        return pendingTasks;
    }

    public int getLostTasks() {
        return lostTasks;
    }

    public int getTotalXP() {
        return totalXP;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public double getProductivityScore() {
        return productivityScore;
    }
}
