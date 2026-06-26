package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.Achievement;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;

public interface AchievementApi {
    @POST("achievements/check")
    Call<JsonObject> checkAchievements(@Header("Authorization") String authorization);

    @GET("achievements")
    Call<List<Achievement>> getAchievements(@Header("Authorization") String authorization);

    // Atualiza as conquistas em destaque (no máximo 3). O corpo é
    // { "highlights": [ { "idbadge": n, "position": 1..3 }, ... ] }.
    @PUT("achievements/highlights")
    Call<JsonObject> updateHighlights(@Header("Authorization") String authorization,
                                      @Body JsonObject body);
}
