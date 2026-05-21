package com.lifinity.app;

import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
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
import com.google.gson.JsonObject;
import com.lifinity.app.api.AccountApi;
import com.lifinity.app.models.DeleteAccountRequest;
import com.lifinity.app.models.UpdatePasswordRequest;
import com.lifinity.app.models.UpdateUsernameRequest;
import com.lifinity.app.models.User;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SettingsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";

    private EditText usernameInput;
    private EditText currentPasswordInput;
    private EditText newPasswordInput;
    private EditText confirmPasswordInput;
    private EditText deleteUsernameInput;
    private EditText deletePasswordInput;
    private Button updateUsernameButton;
    private Button updatePasswordButton;
    private Button deleteAccountButton;
    private ProgressBar progressBar;
    private TextView errorText;

    private Call<JsonObject> updateUsernameCall;
    private Call<JsonObject> updatePasswordCall;
    private Call<JsonObject> deleteAccountCall;
    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_settings);

        usernameInput = findViewById(R.id.settingsUsernameInput);
        currentPasswordInput = findViewById(R.id.settingsCurrentPasswordInput);
        newPasswordInput = findViewById(R.id.settingsNewPasswordInput);
        confirmPasswordInput = findViewById(R.id.settingsConfirmPasswordInput);
        deleteUsernameInput = findViewById(R.id.settingsDeleteUsernameInput);
        deletePasswordInput = findViewById(R.id.settingsDeletePasswordInput);
        updateUsernameButton = findViewById(R.id.settingsUsernameButton);
        updatePasswordButton = findViewById(R.id.settingsPasswordButton);
        deleteAccountButton = findViewById(R.id.settingsDeleteButton);
        progressBar = findViewById(R.id.settingsProgressBar);
        errorText = findViewById(R.id.settingsErrorText);

        User user = getSavedUser();
        if (user != null && !TextUtils.isEmpty(user.getUsername())) {
            deleteUsernameInput.setHint("Escreve " + user.getUsername());
        }

        updateUsernameButton.setOnClickListener(v -> confirmUsernameUpdate());
        updatePasswordButton.setOnClickListener(v -> updatePassword());
        deleteAccountButton.setOnClickListener(v -> confirmAccountDelete());
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private User getSavedUser() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUser = preferences.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) {
            return null;
        }

        try {
            return gson.fromJson(savedUser, User.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void confirmUsernameUpdate() {
        String newUsername = usernameInput.getText().toString().trim();
        if (TextUtils.isEmpty(newUsername)) {
            showError("Indica o novo nome de utilizador.");
            return;
        }

        new AlertDialog.Builder(this)
                .setTitle("Mudar nome de utilizador")
                .setMessage("Queres mudar o nome de utilizador para \"" + newUsername + "\"?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Confirmar", (dialog, which) -> updateUsername(newUsername))
                .show();
    }

    private void updateUsername(String newUsername) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        setLoading(true);
        hideError();

        AccountApi accountApi = ApiClient.getClient().create(AccountApi.class);
        updateUsernameCall = accountApi.updateUsername(
                "Bearer " + token,
                new UpdateUsernameRequest(newUsername)
        );
        updateUsernameCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response, "Erro ao mudar nome de utilizador."));
                    return;
                }

                saveUpdatedUser(response.body(), newUsername);
                usernameInput.setText("");
                Toast.makeText(
                        SettingsActivity.this,
                        getMessage(response.body(), "Nome de utilizador atualizado."),
                        Toast.LENGTH_LONG
                ).show();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel mudar o nome de utilizador. Confirma que o backend esta ativo.");
            }
        });
    }

    private void updatePassword() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        String currentPassword = currentPasswordInput.getText().toString();
        String newPassword = newPasswordInput.getText().toString();
        String confirmPassword = confirmPasswordInput.getText().toString();

        if (TextUtils.isEmpty(currentPassword) || TextUtils.isEmpty(newPassword) || TextUtils.isEmpty(confirmPassword)) {
            showError("Preenche todos os campos da palavra-passe.");
            return;
        }

        if (!newPassword.equals(confirmPassword)) {
            showError("A nova palavra-passe e a confirmacao nao coincidem.");
            return;
        }

        setLoading(true);
        hideError();

        AccountApi accountApi = ApiClient.getClient().create(AccountApi.class);
        updatePasswordCall = accountApi.updatePassword(
                "Bearer " + token,
                new UpdatePasswordRequest(currentPassword, newPassword)
        );
        updatePasswordCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response, "Erro ao mudar palavra-passe."));
                    return;
                }

                currentPasswordInput.setText("");
                newPasswordInput.setText("");
                confirmPasswordInput.setText("");
                Toast.makeText(
                        SettingsActivity.this,
                        getMessage(response.body(), "Palavra-passe atualizada."),
                        Toast.LENGTH_LONG
                ).show();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel mudar a palavra-passe. Confirma que o backend esta ativo.");
            }
        });
    }

    private void confirmAccountDelete() {
        String username = deleteUsernameInput.getText().toString().trim();
        String password = deletePasswordInput.getText().toString();

        if (TextUtils.isEmpty(username) || TextUtils.isEmpty(password)) {
            showError("Escreve o teu username e palavra-passe para apagar a conta.");
            return;
        }

        new AlertDialog.Builder(this)
                .setTitle("Apagar conta")
                .setMessage("Esta acao apaga a tua conta. Queres continuar?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Apagar conta", (dialog, which) -> deleteAccount(username, password))
                .show();
    }

    private void deleteAccount(String username, String password) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        setLoading(true);
        hideError();

        AccountApi accountApi = ApiClient.getClient().create(AccountApi.class);
        deleteAccountCall = accountApi.deleteAccount(
                "Bearer " + token,
                new DeleteAccountRequest(username, password)
        );
        deleteAccountCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response, "Erro ao apagar conta."));
                    return;
                }

                Toast.makeText(
                        SettingsActivity.this,
                        getMessage(response.body(), "Conta apagada com sucesso."),
                        Toast.LENGTH_LONG
                ).show();
                clearSessionAndOpenLogin();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel apagar a conta. Confirma que o backend esta ativo.");
            }
        });
    }

    private void saveUpdatedUser(JsonObject body, String fallbackUsername) {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        JsonObject userObject = null;

        if (body != null && body.has("user") && body.get("user").isJsonObject()) {
            userObject = body.getAsJsonObject("user");
        } else if (body != null && (body.has("iduser") || body.has("username"))) {
            userObject = body;
        }

        if (userObject != null) {
            preferences.edit()
                    .putString(KEY_USER, gson.toJson(gson.fromJson(userObject, User.class)))
                    .apply();
            return;
        }

        String savedUser = preferences.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) {
            return;
        }

        try {
            JsonObject savedObject = gson.fromJson(savedUser, JsonObject.class);
            savedObject.addProperty("username", fallbackUsername);
            preferences.edit()
                    .putString(KEY_USER, gson.toJson(savedObject))
                    .apply();
        } catch (Exception ignored) {
            // The API succeeded, so the visible profile can refresh from the next login if local JSON is invalid.
        }
    }

    private String getMessage(JsonObject body, String fallback) {
        if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
            return body.get("message").getAsString();
        }

        return fallback;
    }

    private String getErrorMessage(Response<JsonObject> response, String fallback) {
        if (response.code() == 401) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return fallback;
        }

        try {
            ErrorResponse errorResponse = gson.fromJson(response.errorBody().charStream(), ErrorResponse.class);
            if (errorResponse != null) {
                if (!TextUtils.isEmpty(errorResponse.message)) {
                    return errorResponse.message;
                }

                if (!TextUtils.isEmpty(errorResponse.error)) {
                    return errorResponse.error;
                }
            }
        } catch (Exception ignored) {
            return fallback;
        }

        return fallback;
    }

    private void setLoading(boolean loading) {
        updateUsernameButton.setEnabled(!loading);
        updatePasswordButton.setEnabled(!loading);
        deleteAccountButton.setEnabled(!loading);
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
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void clearSessionAndOpenLogin() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        preferences.edit()
                .remove(KEY_TOKEN)
                .remove(KEY_USER)
                .apply();
        openLoginActivity();
    }

    @Override
    protected void onDestroy() {
        if (updateUsernameCall != null) {
            updateUsernameCall.cancel();
        }
        if (updatePasswordCall != null) {
            updatePasswordCall.cancel();
        }
        if (deleteAccountCall != null) {
            deleteAccountCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
