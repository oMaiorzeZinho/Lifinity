package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.lifinity.app.api.AuthApi;
import com.lifinity.app.models.LoginRequest;
import com.lifinity.app.models.LoginResponse;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";

    private EditText emailInput;
    private EditText passwordInput;
    private Button loginButton;
    private Button createAccountButton;
    private ProgressBar progressBar;
    private TextView errorText;
    private Call<LoginResponse> loginCall;
    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (hasToken()) {
            openMainActivity();
            return;
        }

        setContentView(R.layout.activity_login);

        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        loginButton = findViewById(R.id.loginButton);
        createAccountButton = findViewById(R.id.createAccountButton);
        progressBar = findViewById(R.id.progressBar);
        errorText = findViewById(R.id.errorText);

        loginButton.setOnClickListener(v -> login());
        createAccountButton.setOnClickListener(v -> openRegisterActivity());
    }

    private boolean hasToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return !TextUtils.isEmpty(preferences.getString(KEY_TOKEN, null));
    }

    private void login() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString();

        if (TextUtils.isEmpty(email) || TextUtils.isEmpty(password)) {
            showError("Preenche o email e a palavra-passe.");
            return;
        }

        setLoading(true);
        hideError();

        AuthApi authApi = ApiClient.getClient().create(AuthApi.class);
        loginCall = authApi.login(new LoginRequest(email, password));
        loginCall.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response));
                    return;
                }

                LoginResponse loginResponse = response.body();
                if (loginResponse == null || TextUtils.isEmpty(loginResponse.getToken())) {
                    showError("Resposta inválida do servidor.");
                    return;
                }

                saveSession(loginResponse);
                openMainActivity();
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Não foi possível ligar ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    private void saveSession(LoginResponse loginResponse) {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        preferences.edit()
                .putString(KEY_TOKEN, loginResponse.getToken())
                .putString(KEY_USER, gson.toJson(loginResponse.getUser()))
                .apply();
    }

    private String getErrorMessage(Response<LoginResponse> response) {
        if (response.errorBody() == null) {
            return "Erro ao iniciar sessão.";
        }

        try {
            ErrorResponse errorResponse = gson.fromJson(response.errorBody().charStream(), ErrorResponse.class);
            if (errorResponse != null && !TextUtils.isEmpty(errorResponse.message)) {
                return errorResponse.message.trim();
            }
        } catch (Exception ignored) {
            return "Erro ao iniciar sessão.";
        }

        return "Erro ao iniciar sessão.";
    }

    private void setLoading(boolean loading) {
        loginButton.setEnabled(!loading);
        createAccountButton.setEnabled(!loading);
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private void hideError() {
        errorText.setText("");
        errorText.setVisibility(View.GONE);
    }

    private void openMainActivity() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void openRegisterActivity() {
        Intent intent = new Intent(this, RegisterActivity.class);
        startActivity(intent);
    }

    @Override
    protected void onDestroy() {
        if (loginCall != null) {
            loginCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
    }
}
