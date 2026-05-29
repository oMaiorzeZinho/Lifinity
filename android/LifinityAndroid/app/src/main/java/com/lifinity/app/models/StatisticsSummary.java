package com.lifinity.app.models;

import com.google.gson.annotations.SerializedName;

// Resumo de estatísticas do utilizador vindo da API (/statistics/me).
public class StatisticsSummary {
    @SerializedName("tasksCompleted")
    private Integer tasksCompleted;

    @SerializedName("tasksCreated")
    private Integer tasksCreated;

    @SerializedName("tasksMissed")
    private Integer tasksMissed;

    @SerializedName("xpEarned")
    private Integer xpEarned;

    @SerializedName("bestDay")
    private String bestDay;

    @SerializedName("currentStreak")
    private Integer currentStreak;

    @SerializedName("completionRate")
    private Double completionRate;

    public Integer getTasksCompleted() { return tasksCompleted; }
    public Integer getTasksCreated()   { return tasksCreated; }
    public Integer getTasksMissed()    { return tasksMissed; }
    public Integer getXpEarned()       { return xpEarned; }
    public String  getBestDay()        { return bestDay; }
    public Integer getCurrentStreak()  { return currentStreak; }
    public Double  getCompletionRate() { return completionRate; }
}
