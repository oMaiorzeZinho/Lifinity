package com.lifinity.app.models;

import java.util.List;

public class StatisticsResponse {
    private String period;
    private StatisticsSummary summary;
    private List<StatisticsDay> chartData;

    public String getPeriod() {
        return period;
    }

    public StatisticsSummary getSummary() {
        return summary;
    }

    public List<StatisticsDay> getChartData() {
        return chartData;
    }
}
