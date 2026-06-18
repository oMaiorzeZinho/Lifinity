package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.Friend;
import com.lifinity.app.models.FriendRequest;
import com.lifinity.app.models.SendFriendRequest;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import retrofit2.http.Query;

/** Endpoints de amigos (montados em /api/friends no backend). */
public interface FriendApi {

    // Lista os meus amigos.
    @GET("friends")
    Call<List<Friend>> getFriends(@Header("Authorization") String authorization);

    // Pesquisa utilizadores por username (mínimo 2 caracteres no backend).
    @GET("friends/search")
    Call<List<Friend>> searchUsers(
            @Header("Authorization") String authorization,
            @Query("query") String query
    );

    // Pedidos de amizade recebidos (pendentes).
    @GET("friends/requests")
    Call<List<FriendRequest>> getRequests(@Header("Authorization") String authorization);

    // Enviar pedido de amizade.
    @POST("friends/request")
    Call<JsonObject> sendRequest(
            @Header("Authorization") String authorization,
            @Body SendFriendRequest request
    );

    // Aceitar um pedido pendente.
    @PUT("friends/requests/{idfriendship}/accept")
    Call<JsonObject> acceptRequest(
            @Header("Authorization") String authorization,
            @Path("idfriendship") int idfriendship
    );

    // Recusar um pedido pendente.
    @DELETE("friends/requests/{idfriendship}")
    Call<JsonObject> declineRequest(
            @Header("Authorization") String authorization,
            @Path("idfriendship") int idfriendship
    );

    // Remover um amigo (idfriend = iduser do amigo).
    @DELETE("friends/{idfriend}")
    Call<JsonObject> removeFriend(
            @Header("Authorization") String authorization,
            @Path("idfriend") int idfriend
    );
}
