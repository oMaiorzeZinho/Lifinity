package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.Notification;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface NotificationApi {
    @GET("notifications")
    Call<List<Notification>> getNotifications(@Header("Authorization") String authorization);

    @GET("notifications/unread-count")
    Call<JsonObject> getUnreadCount(@Header("Authorization") String authorization);

    @PUT("notifications/{idnotification}/read")
    Call<JsonObject> markAsRead(
            @Header("Authorization") String authorization,
            @Path("idnotification") int idnotification
    );

    @PUT("notifications/read-all")
    Call<JsonObject> markAllAsRead(@Header("Authorization") String authorization);
}
