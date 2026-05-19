package com.lifinity.app.api;

import com.lifinity.app.models.Task;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;

public interface TaskApi {
    @GET("tasks")
    Call<List<Task>> getTasks(@Header("Authorization") String authorization);
}
