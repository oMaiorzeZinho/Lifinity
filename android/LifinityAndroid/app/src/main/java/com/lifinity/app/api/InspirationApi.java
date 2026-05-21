package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.Verse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface InspirationApi {
    @GET("inspiration/daily")
    Call<Verse> getDailyVerse(@Header("Authorization") String authorization);

    @GET("inspiration/random")
    Call<Verse> getRandomVerse(@Header("Authorization") String authorization);

    @GET("inspiration/favorites")
    Call<List<Verse>> getFavorites(@Header("Authorization") String authorization);

    @POST("inspiration/favorite/{idverse}")
    Call<JsonObject> toggleFavorite(
            @Header("Authorization") String authorization,
            @Path("idverse") int idverse
    );
}
