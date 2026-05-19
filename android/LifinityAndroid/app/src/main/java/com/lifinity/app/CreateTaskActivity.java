package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.api.TaskApi;
import com.lifinity.app.models.CreateTaskRequest;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CreateTaskActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private EditText titleInput;
    private EditText descriptionInput;
    private EditText dueDateInput;
    private Spinner prioritySpinner;
    private Button createButton;
    private ProgressBar progressBar;
    private TextView errorText;
    private Call<JsonObject> createTaskCall;
    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_create_task);

        titleInput = findViewById(R.id.createTaskTitleInput);
        descriptionInput = findViewById(R.id.createTaskDescriptionInput);
        dueDateInput = findViewById(R.id.createTaskDueDateInput);
        prioritySpinner = findViewById(R.id.createTaskPrioritySpinner);
        createButton = findViewById(R.id.createTaskSubmitButton);
        progressBar = findViewById(R.id.createTaskProgressBar);
        errorText = findViewById(R.id.createTaskErrorText);

        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
                this,
                R.array.task_priorities,
                android.R.layout.simple_spinner_item
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        prioritySpinner.setAdapter(adapter);
        prioritySpinner.setSelection(1);

        createButton.setOnClickListener(v -> createTask());
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void createTask() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        String title = titleInput.getText().toString().trim();
        String description = descriptionInput.getText().toString().trim();
        String priority = prioritySpinner.getSelectedItem().toString();
        String dueDate = dueDateInput.getText().toString().trim();

        if (TextUtils.isEmpty(title)) {
            showError("O titulo e obrigatorio.");
            return;
        }

        CreateTaskRequest request = new CreateTaskRequest(
                title,
                TextUtils.isEmpty(description) ? null : description,
                priority,
                TextUtils.isEmpty(dueDate) ? null : dueDate
        );

        setLoading(true);
        hideError();

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        createTaskCall = taskApi.createTask("Bearer " + token, request);
        createTaskCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response));
                    return;
                }

                String message = "Tarefa criada com sucesso!";
                JsonObject body = response.body();
                if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
                    message = body.get("message").getAsString();
                }

                Toast.makeText(CreateTaskActivity.this, message, Toast.LENGTH_LONG).show();
                finish();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel criar a tarefa. Confirma que o backend esta ativo.");
            }
        });
    }

    private String getErrorMessage(Response<JsonObject> response) {
        if (response.code() == 401) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return "Erro ao criar tarefa.";
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
            return "Erro ao criar tarefa.";
        }

        return "Erro ao criar tarefa.";
    }

    private void setLoading(boolean loading) {
        createButton.setEnabled(!loading);
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
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        if (createTaskCall != null) {
            createTaskCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
