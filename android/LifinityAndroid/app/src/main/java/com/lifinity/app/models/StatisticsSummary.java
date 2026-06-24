package com.lifinity.app.models;

/**
 * Resumo de estatísticas vindo de /statistics/me (objeto "summary").
 * As chaves correspondem EXATAMENTE às devolvidas pelo módulo C
 * (gamification.calculateStats): totalTasks, completedTasks, pendingTasks,
 * lostTasks, totalXP, completionRate (0–100) e productivityScore (0–100).
 */
public class StatisticsSummary {
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer pendingTasks;
    private Integer lostTasks;
    private Integer totalXP;
    private Double completionRate;     // percentagem 0–100
    private Double productivityScore;  // pontuação 0–100

    public int getTotalTasks()     { return totalTasks != null ? totalTasks : 0; }
    public int getCompletedTasks() { return completedTasks != null ? completedTasks : 0; }
    public int getPendingTasks()   { return pendingTasks != null ? pendingTasks : 0; }
    public int getLostTasks()      { return lostTasks != null ? lostTasks : 0; }
    public int getTotalXP()        { return totalXP != null ? totalXP : 0; }
    public double getCompletionRate()    { return completionRate != null ? completionRate : 0.0; }
    public double getProductivityScore() { return productivityScore != null ? productivityScore : 0.0; }
}
