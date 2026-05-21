package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lifinity.app.adapters.TaskAdapter;
import com.lifinity.app.api.TaskApi;
import com.lifinity.app.models.CompleteTaskResponse;
import com.lifinity.app.models.Task;
import com.lifinity.app.network.ApiClient;

import java.util.List;
import java.util.Date;
import java.util.Locale;
import java.text.ParseException;
import java.text.SimpleDateFormat;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TasksActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView emptyText;
    private RecyclerView tasksRecyclerView;
    private Button createTaskButton;
    private TaskAdapter taskAdapter;
    private Call<List<Task>> tasksCall;
    private Call<CompleteTaskResponse> completeTaskCall;
    private Call<JsonObject> deleteTaskCall;
    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_tasks);

        progressBar = findViewById(R.id.tasksProgressBar);
        errorText = findViewById(R.id.tasksErrorText);
        emptyText = findViewById(R.id.tasksEmptyText);
        tasksRecyclerView = findViewById(R.id.tasksRecyclerView);
        createTaskButton = findViewById(R.id.createTaskButton);

        taskAdapter = new TaskAdapter(this::confirmCompleteTask, this::showTaskOptions);
        tasksRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        tasksRecyclerView.setAdapter(taskAdapter);

        createTaskButton.setOnClickListener(v -> openCreateTaskActivity());
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (taskAdapter == null) {
            return;
        }

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        loadTasks(token);
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void loadTasks(String token) {
        showLoading();

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        tasksCall = taskApi.getTasks("Bearer " + token);
        tasksCall.enqueue(new Callback<List<Task>>() {
            @Override
            public void onResponse(Call<List<Task>> call, Response<List<Task>> response) {
                if (!response.isSuccessful()) {
                    showError(getErrorMessage(response));
                    return;
                }

                List<Task> tasks = response.body();
                if (tasks == null || tasks.isEmpty()) {
                    showEmpty();
                    return;
                }

                taskAdapter.setTasks(tasks);
                showList();
            }

            @Override
            public void onFailure(Call<List<Task>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                showError("Nao foi possivel carregar as tarefas. Confirma que o backend esta ativo.");
            }
        });
    }

    private void confirmCompleteTask(Task task) {
        new AlertDialog.Builder(this)
                .setTitle("Concluir tarefa")
                .setMessage("Queres concluir esta tarefa?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Concluir", (dialog, which) -> completeTask(task))
                .show();
    }

    private void showTaskOptions(Task task) {
        if (task == null || task.getIdtask() == null) {
            showError("Tarefa invalida.");
            return;
        }

        boolean canEdit = canEditTask(task);
        String[] options = canEdit
                ? new String[]{"Editar", "Ocultar/Eliminar", "Cancelar"}
                : new String[]{"Ocultar/Eliminar", "Cancelar"};

        new AlertDialog.Builder(this)
                .setTitle("Opcoes da tarefa")
                .setItems(options, (dialog, which) -> {
                    String option = options[which];
                    if ("Editar".equals(option)) {
                        openEditTaskActivity(task);
                    } else if ("Ocultar/Eliminar".equals(option)) {
                        confirmDeleteTask(task);
                    } else {
                        dialog.dismiss();
                    }
                })
                .show();
    }

    private void completeTask(Task task) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        if (task == null || task.getIdtask() == null) {
            showError("Tarefa invalida.");
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        completeTaskCall = taskApi.completeTask("Bearer " + token, task.getIdtask());
        completeTaskCall.enqueue(new Callback<CompleteTaskResponse>() {
            @Override
            public void onResponse(Call<CompleteTaskResponse> call, Response<CompleteTaskResponse> response) {
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful()) {
                    showError(getCompleteTaskErrorMessage(response));
                    return;
                }

                CompleteTaskResponse completeResponse = response.body();
                if (completeResponse == null) {
                    showError("Resposta invalida do servidor.");
                    return;
                }

                updateStoredUser(completeResponse);
                Toast.makeText(
                        TasksActivity.this,
                        valueOrFallback(completeResponse.getMessage(), "Tarefa concluida."),
                        Toast.LENGTH_LONG
                ).show();
                loadTasks(token);
            }

            @Override
            public void onFailure(Call<CompleteTaskResponse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                progressBar.setVisibility(View.GONE);
                showError("Nao foi possivel concluir a tarefa. Confirma que o backend esta ativo.");
            }
        });
    }

    private void confirmDeleteTask(Task task) {
        new AlertDialog.Builder(this)
                .setTitle("Ocultar/Eliminar tarefa")
                .setMessage("Queres ocultar ou eliminar esta tarefa?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Confirmar", (dialog, which) -> deleteTask(task))
                .show();
    }

    private void deleteTask(Task task) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        if (task == null || task.getIdtask() == null) {
            showError("Tarefa invalida.");
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        deleteTaskCall = taskApi.deleteTask("Bearer " + token, task.getIdtask());
        deleteTaskCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful()) {
                    String message = getJsonErrorMessage(response, "Erro ao ocultar/eliminar tarefa.");
                    Toast.makeText(TasksActivity.this, message, Toast.LENGTH_LONG).show();
                    showError(message);
                    return;
                }

                String message = getJsonSuccessMessage(response.body(), "Tarefa ocultada/eliminada com sucesso.");
                Toast.makeText(TasksActivity.this, message, Toast.LENGTH_LONG).show();
                loadTasks(token);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                progressBar.setVisibility(View.GONE);
                String message = "Nao foi possivel ocultar/eliminar a tarefa. Confirma que o backend esta ativo.";
                Toast.makeText(TasksActivity.this, message, Toast.LENGTH_LONG).show();
                showError(message);
            }
        });
    }

    private void updateStoredUser(CompleteTaskResponse completeResponse) {
        if (completeResponse.getNewXP() == null && completeResponse.getNewLevel() == null) {
            return;
        }

        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUser = preferences.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) {
            return;
        }

        try {
            JsonObject userObject = JsonParser.parseString(savedUser).getAsJsonObject();
            if (completeResponse.getNewXP() != null) {
                userObject.addProperty("xp", completeResponse.getNewXP());
            }
            if (completeResponse.getNewLevel() != null) {
                userObject.addProperty("level", completeResponse.getNewLevel());
            }
            preferences.edit().putString(KEY_USER, gson.toJson(userObject)).apply();
        } catch (Exception ignored) {
            // Keep the previous user data if it cannot be parsed.
        }
    }

    private String getErrorMessage(Response<List<Task>> response) {
        if (response.code() == 401 || response.code() == 403) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return "Erro ao carregar tarefas.";
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
            return "Erro ao carregar tarefas.";
        }

        return "Erro ao carregar tarefas.";
    }

    private String getCompleteTaskErrorMessage(Response<CompleteTaskResponse> response) {
        if (response.code() == 401) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return "Erro ao concluir tarefa.";
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
            return "Erro ao concluir tarefa.";
        }

        return "Erro ao concluir tarefa.";
    }

    private String getJsonErrorMessage(Response<JsonObject> response, String fallback) {
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

    private String getJsonSuccessMessage(JsonObject body, String fallback) {
        if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
            return body.get("message").getAsString();
        }
        return fallback;
    }

    private boolean canEditTask(Task task) {
        if (task == null || task.getIdtask() == null) {
            return false;
        }

        String status = task.getStatus();
        if (!TextUtils.isEmpty(status) && "concluida".equals(status.trim().toLowerCase(Locale.US))) {
            return false;
        }

        Date dueDate = parseDate(task.getDueDate());
        return dueDate == null || !dueDate.before(new Date());
    }

    private Date parseDate(String value) {
        if (TextUtils.isEmpty(value)) {
            return null;
        }

        String[] patterns = {
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm",
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd"
        };

        for (String pattern : patterns) {
            try {
                SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
                return format.parse(value);
            } catch (ParseException ignored) {
                // Try the next server date format.
            }
        }

        return null;
    }

    private String valueOrFallback(String value, String fallback) {
        if (TextUtils.isEmpty(value)) {
            return fallback;
        }
        return value;
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);
        tasksRecyclerView.setVisibility(View.GONE);
    }

    private void showError(String message) {
        progressBar.setVisibility(View.GONE);
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);
        tasksRecyclerView.setVisibility(View.GONE);
    }

    private void showEmpty() {
        progressBar.setVisibility(View.GONE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.VISIBLE);
        tasksRecyclerView.setVisibility(View.GONE);
    }

    private void showList() {
        progressBar.setVisibility(View.GONE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);
        tasksRecyclerView.setVisibility(View.VISIBLE);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        startActivity(intent);
        finish();
    }

    private void openCreateTaskActivity() {
        Intent intent = new Intent(this, CreateTaskActivity.class);
        startActivity(intent);
    }

    private void openEditTaskActivity(Task task) {
        Intent intent = new Intent(this, EditTaskActivity.class);
        intent.putExtra(EditTaskActivity.EXTRA_IDTASK, task.getIdtask());
        intent.putExtra(EditTaskActivity.EXTRA_TITLE, task.getTitle());
        intent.putExtra(EditTaskActivity.EXTRA_DESCRIPTION, task.getDescription());
        intent.putExtra(EditTaskActivity.EXTRA_PRIORITY, task.getPriority());
        intent.putExtra(EditTaskActivity.EXTRA_DUE_DATE, task.getDueDate());
        startActivity(intent);
    }

    @Override
    protected void onDestroy() {
        if (tasksCall != null) {
            tasksCall.cancel();
        }
        if (completeTaskCall != null) {
            completeTaskCall.cancel();
        }
        if (deleteTaskCall != null) {
            deleteTaskCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
