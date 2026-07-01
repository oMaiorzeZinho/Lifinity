package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.PublicProfile;
import com.lifinity.app.models.RankingUser;

import java.util.List;

import okhttp3.MultipartBody;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Multipart;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.Path;

public interface UserApi {
    @GET("users/ranking")
    Call<List<RankingUser>> getRanking(@Header("Authorization") String token);

    // Perfil público de um utilizador (avatar, nível, bio e conquistas em destaque).
    // Usado no popup "Ver perfil" de um amigo. Não devolve xp (usa-se o do Friend).
    @GET("users/{iduser}/public-profile")
    Call<PublicProfile> getPublicProfile(@Header("Authorization") String token,
                                         @Path("iduser") int iduser);

    // Upload da foto de perfil (mesmo endpoint que o frontend web usa). O ficheiro
    // segue como multipart no campo "image" (single). A resposta traz o utilizador
    // atualizado, incluindo o novo caminho "avatar".
    @Multipart
    @PUT("users/me/avatar")
    Call<JsonObject> updateAvatar(@Header("Authorization") String token,
                                  @Part MultipartBody.Part image);
}
