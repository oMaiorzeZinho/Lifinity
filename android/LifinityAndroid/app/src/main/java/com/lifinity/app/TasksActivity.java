package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.lifinity.app.adapters.TaskAdapter;
import com.lifinity.app.api.TaskApi;
import com.lifinity.app.models.Task;
import com.lifinity.app.network.ApiClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TasksActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView emptyText;
    private RecyclerView tasksRecyclerView;
    private TaskAdapter taskAdapter;
    private Call<List<Task>> tasksCall;
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

        taskAdapter = new TaskAdapter();
        tasksRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        tasksRecyclerView.setAdapter(taskAdapter);

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

    @Override
    protected void onDestroy() {
        if (tasksCall != null) {
            tasksCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
