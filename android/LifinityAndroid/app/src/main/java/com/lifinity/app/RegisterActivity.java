package com.lifinity.app;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.lifinity.app.api.AuthApi;
import com.lifinity.app.models.RegisterRequest;
import com.lifinity.app.models.RegisterResponse;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {
    private EditText usernameInput;
    private EditText emailInput;
    private EditText passwordInput;
    private EditText confirmPasswordInput;
    private Button registerButton;
    private Button backToLoginButton;
    private ProgressBar progressBar;
    private TextView errorText;
    private Call<RegisterResponse> registerCall;
    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        usernameInput = findViewById(R.id.registerUsernameInput);
        emailInput = findViewById(R.id.registerEmailInput);
        passwordInput = findViewById(R.id.registerPasswordInput);
        confirmPasswordInput = findViewById(R.id.registerConfirmPasswordInput);
        registerButton = findViewById(R.id.registerButton);
        backToLoginButton = findViewById(R.id.backToLoginButton);
        progressBar = findViewById(R.id.registerProgressBar);
        errorText = findViewById(R.id.registerErrorText);

        registerButton.setOnClickListener(v -> register());
        backToLoginButton.setOnClickListener(v -> finish());
    }

    private void register() {
        String username = usernameInput.getText().toString().trim();
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString();
        String confirmPassword = confirmPasswordInput.getText().toString();

        if (TextUtils.isEmpty(username)) {
            showError("Indica o username.");
            return;
        }

        if (TextUtils.isEmpty(email)) {
            showError("Indica o email.");
            return;
        }

        if (TextUtils.isEmpty(password)) {
            showError("Indica a palavra-passe.");
            return;
        }

        if (password.length() < 6) {
            showError("A palavra-passe deve ter pelo menos 6 caracteres.");
            return;
        }

        if (!password.equals(confirmPassword)) {
            showError("A palavra-passe e a confirmacao nao coincidem.");
            return;
        }

        setLoading(true);
        hideError();

        AuthApi authApi = ApiClient.getClient().create(AuthApi.class);
        registerCall = authApi.register(new RegisterRequest(username, email, password));
        registerCall.enqueue(new Callback<RegisterResponse>() {
            @Override
            public void onResponse(Call<RegisterResponse> call, Response<RegisterResponse> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response));
                    return;
                }

                RegisterResponse registerResponse = response.body();
                String message = "Conta criada com sucesso. Inicia sessao para continuar.";
                if (registerResponse != null && !TextUtils.isEmpty(registerResponse.getMessage())) {
                    message = registerResponse.getMessage();
                }

                Toast.makeText(RegisterActivity.this, message, Toast.LENGTH_LONG).show();
                openLoginActivity();
            }

            @Override
            public void onFailure(Call<RegisterResponse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel criar a conta. Confirma que o backend esta ativo.");
            }
        });
    }

    private String getErrorMessage(Response<RegisterResponse> response) {
        if (response.errorBody() == null) {
            return "Erro ao criar conta.";
        }

        try {
            ErrorResponse errorResponse = gson.fromJson(response.errorBody().charStream(), ErrorResponse.class);
            if (errorResponse != null) {
                if (!TextUtils.isEmpty(errorResponse.message)) {
                    return errorResponse.message.trim();
                }

                if (!TextUtils.isEmpty(errorResponse.error)) {
                    return errorResponse.error.trim();
                }
            }
        } catch (Exception ignored) {
            return "Erro ao criar conta.";
        }

        return "Erro ao criar conta.";
    }

    private void setLoading(boolean loading) {
        registerButton.setEnabled(!loading);
        backToLoginButton.setEnabled(!loading);
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

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        if (registerCall != null) {
            registerCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
