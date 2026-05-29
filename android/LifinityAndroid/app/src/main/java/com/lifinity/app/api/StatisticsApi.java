package com.lifinity.app.api;

import com.lifinity.app.models.StatisticsResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Query;

public interface StatisticsApi {
    @GET("statistics/me")
    Call<StatisticsResponse> getMyStatistics(
            @Header("Authorization") String authorization,
            @Query("period") String period
    );
}
