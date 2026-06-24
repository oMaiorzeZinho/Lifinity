package com.lifinity.app.api;

import com.lifinity.app.models.StatisticsResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Query;

public interface StatisticsApi {
    // Devolve o objeto completo: { period, summary, chartData, ... }.
    @GET("statistics/me")
    Call<StatisticsResponse> getStatistics(
            @Header("Authorization") String token,
            @Query("period") String period
    );
}
