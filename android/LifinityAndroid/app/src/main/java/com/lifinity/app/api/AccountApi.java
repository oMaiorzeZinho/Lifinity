package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.DeleteAccountRequest;
import com.lifinity.app.models.UpdatePasswordRequest;
import com.lifinity.app.models.UpdateUsernameRequest;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.HTTP;
import retrofit2.http.Header;
import retrofit2.http.PUT;

public interface AccountApi {
    @PUT("users/me/username")
    Call<JsonObject> updateUsername(
            @Header("Authorization") String authorization,
            @Body UpdateUsernameRequest request
    );

    @PUT("users/me/password")
    Call<JsonObject> updatePassword(
            @Header("Authorization") String authorization,
            @Body UpdatePasswordRequest request
    );

    @HTTP(method = "DELETE", path = "users/me", hasBody = true)
    Call<JsonObject> deleteAccount(
            @Header("Authorization") String authorization,
            @Body DeleteAccountRequest request
    );
}
