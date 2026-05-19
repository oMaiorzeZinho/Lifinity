package com.lifinity.app.api;

import com.lifinity.app.models.LoginRequest;
import com.lifinity.app.models.LoginResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface AuthApi {
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);
}
