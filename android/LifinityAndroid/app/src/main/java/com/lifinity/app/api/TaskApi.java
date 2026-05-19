package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.CompleteTaskResponse;
import com.lifinity.app.models.CreateTaskRequest;
import com.lifinity.app.models.Task;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface TaskApi {
    @GET("tasks")
    Call<List<Task>> getTasks(@Header("Authorization") String authorization);

    @POST("tasks")
    Call<JsonObject> createTask(
            @Header("Authorization") String authorization,
            @Body CreateTaskRequest request
    );

    @PUT("tasks/complete/{idtask}")
    Call<CompleteTaskResponse> completeTask(
            @Header("Authorization") String authorization,
            @Path("idtask") int idtask
    );
}
