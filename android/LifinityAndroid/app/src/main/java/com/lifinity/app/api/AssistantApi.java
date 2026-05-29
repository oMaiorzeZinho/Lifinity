package com.lifinity.app.api;

import com.lifinity.app.models.AssistantMessage;
import com.lifinity.app.models.AssistantSendRequest;
import com.lifinity.app.models.AssistantSendResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface AssistantApi {
    @GET("assistant/messages")
    Call<List<AssistantMessage>> getMessages(@Header("Authorization") String authorization);

    @POST("assistant/messages")
    Call<AssistantSendResponse> sendMessage(
            @Header("Authorization") String authorization,
            @Body AssistantSendRequest request
    );
}
