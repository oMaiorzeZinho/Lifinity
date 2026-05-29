package com.lifinity.app.api;

import com.lifinity.app.models.StatisticsSummary;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Query;

public interface StatisticsApi {
    @GET("statistics/me")
    Call<StatisticsSummary> getStatistics(
            @Header("Authorization") String token,
            @Query("period") String period
    );
}
