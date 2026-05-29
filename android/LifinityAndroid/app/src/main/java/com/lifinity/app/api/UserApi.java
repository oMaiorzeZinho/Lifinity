package com.lifinity.app.api;

import com.lifinity.app.models.RankingUser;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;

public interface UserApi {
    @GET("users/ranking")
    Call<List<RankingUser>> getRanking(@Header("Authorization") String token);
}
