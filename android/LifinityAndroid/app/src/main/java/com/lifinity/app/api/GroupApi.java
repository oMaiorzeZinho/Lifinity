package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.CreateGroupRequest;
import com.lifinity.app.models.Group;
import com.lifinity.app.models.GroupMember;
import com.lifinity.app.models.JoinGroupRequest;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

/** Endpoints de grupos (montados em /api/groups no backend). */
public interface GroupApi {

    // Lista os grupos a que pertenço.
    @GET("groups")
    Call<List<Group>> getMyGroups(@Header("Authorization") String authorization);

    // Criar um grupo (devolve idgroup + invite_code).
    @POST("groups")
    Call<JsonObject> createGroup(
            @Header("Authorization") String authorization,
            @Body CreateGroupRequest request
    );

    // Entrar num grupo por código de convite.
    @POST("groups/join")
    Call<JsonObject> joinGroup(
            @Header("Authorization") String authorization,
            @Body JoinGroupRequest request
    );

    // Listar membros de um grupo.
    @GET("groups/{idgroup}/members")
    Call<List<GroupMember>> getMembers(
            @Header("Authorization") String authorization,
            @Path("idgroup") int idgroup
    );

    // Criar/obter a conversa associada ao grupo (devolve idconversation).
    @POST("groups/{idgroup}/conversation")
    Call<JsonObject> openConversation(
            @Header("Authorization") String authorization,
            @Path("idgroup") int idgroup
    );

    // Sair de um grupo.
    @DELETE("groups/{idgroup}/leave")
    Call<JsonObject> leaveGroup(
            @Header("Authorization") String authorization,
            @Path("idgroup") int idgroup
    );

    // Trancar/destrancar um grupo (só o dono); alterna e devolve is_locked.
    @PUT("groups/{idgroup}/lock")
    Call<JsonObject> toggleLock(
            @Header("Authorization") String authorization,
            @Path("idgroup") int idgroup
    );

    // Apagar um grupo (dono ou admin).
    @DELETE("groups/{idgroup}")
    Call<JsonObject> deleteGroup(
            @Header("Authorization") String authorization,
            @Path("idgroup") int idgroup
    );
}
