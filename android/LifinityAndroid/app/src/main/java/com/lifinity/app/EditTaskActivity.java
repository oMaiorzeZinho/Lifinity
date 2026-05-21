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
import com.lifinity.app.models.UpdateTaskRequest;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EditTaskActivity extends AppCompatActivity {
    public static final String EXTRA_IDTASK = "idtask";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_DESCRIPTION = "description";
    public static final String EXTRA_PRIORITY = "priority";
    public static final String EXTRA_DUE_DATE = "due_date";

    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private int idtask;
    private EditText titleInput;
    private EditText descriptionInput;
    private EditText dueDateInput;
    private Spinner prioritySpinner;
    private Button saveButton;
    private ProgressBar progressBar;
    private TextView errorText;
    private Call<JsonObject> updateTaskCall;
    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        idtask = getIntent().getIntExtra(EXTRA_IDTASK, -1);
        if (idtask <= 0) {
            Toast.makeText(this, "Atividade invalida.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        setContentView(R.layout.activity_edit_task);

        titleInput = findViewById(R.id.editTaskTitleInput);
        descriptionInput = findViewById(R.id.editTaskDescriptionInput);
        dueDateInput = findViewById(R.id.editTaskDueDateInput);
        prioritySpinner = findViewById(R.id.editTaskPrioritySpinner);
        saveButton = findViewById(R.id.editTaskSubmitButton);
        progressBar = findViewById(R.id.editTaskProgressBar);
        errorText = findViewById(R.id.editTaskErrorText);

        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(
                this,
                R.array.task_priorities,
                android.R.layout.simple_spinner_item
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        prioritySpinner.setAdapter(adapter);

        fillForm(adapter);
        saveButton.setOnClickListener(v -> updateTask());
    }

    private void fillForm(ArrayAdapter<CharSequence> adapter) {
        Intent intent = getIntent();
        titleInput.setText(intent.getStringExtra(EXTRA_TITLE));
        descriptionInput.setText(intent.getStringExtra(EXTRA_DESCRIPTION));
        dueDateInput.setText(formatDueDateForInput(intent.getStringExtra(EXTRA_DUE_DATE)));

        String priority = intent.getStringExtra(EXTRA_PRIORITY);
        int position = adapter.getPosition(TextUtils.isEmpty(priority) ? "media" : priority);
        prioritySpinner.setSelection(position >= 0 ? position : 1);
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void updateTask() {
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
            Toast.makeText(this, "O titulo e obrigatorio.", Toast.LENGTH_LONG).show();
            return;
        }

        UpdateTaskRequest request = new UpdateTaskRequest(
                title,
                TextUtils.isEmpty(description) ? null : description,
                priority,
                TextUtils.isEmpty(dueDate) ? null : dueDate
        );

        setLoading(true);
        hideError();

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        updateTaskCall = taskApi.updateTask("Bearer " + token, idtask, request);
        updateTaskCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    String message = getErrorMessage(response);
                    showError(message);
                    Toast.makeText(EditTaskActivity.this, message, Toast.LENGTH_LONG).show();
                    return;
                }

                String message = "Atividade atualizada com sucesso.";
                JsonObject body = response.body();
                if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
                    message = body.get("message").getAsString();
                }

                Toast.makeText(EditTaskActivity.this, message, Toast.LENGTH_LONG).show();
                finish();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                String message = "Nao foi possivel editar a atividade. Confirma que o backend esta ativo.";
                showError(message);
                Toast.makeText(EditTaskActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private String getErrorMessage(Response<JsonObject> response) {
        if (response.code() == 401) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return "Erro ao editar atividade.";
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
            return "Erro ao editar atividade.";
        }

        return "Erro ao editar atividade.";
    }

    private String formatDueDateForInput(String dueDate) {
        if (TextUtils.isEmpty(dueDate)) {
            return "";
        }

        String normalized = dueDate.trim().replace(" ", "T");
        if (normalized.length() >= 16) {
            return normalized.substring(0, 16);
        }

        return normalized;
    }

    private void setLoading(boolean loading) {
        saveButton.setEnabled(!loading);
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
        if (updateTaskCall != null) {
            updateTaskCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
