package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.AppNotification;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface NotificationApi {
    @GET("notifications")
    Call<List<AppNotification>> getNotifications(@Header("Authorization") String token);

    @PUT("notifications/read-all")
    Call<JsonObject> readAll(@Header("Authorization") String token);

    @PUT("notifications/{id}/read")
    Call<JsonObject> readOne(@Header("Authorization") String token, @Path("id") int id);
}
