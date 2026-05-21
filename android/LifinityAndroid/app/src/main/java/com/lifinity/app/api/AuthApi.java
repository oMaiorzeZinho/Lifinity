package com.lifinity.app.api;

import com.lifinity.app.models.LoginRequest;
import com.lifinity.app.models.LoginResponse;
import com.lifinity.app.models.RegisterRequest;
import com.lifinity.app.models.RegisterResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface AuthApi {
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);
}
