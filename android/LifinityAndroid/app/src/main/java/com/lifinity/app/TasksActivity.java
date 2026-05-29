package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
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
import com.lifinity.app.models.User;
import com.lifinity.app.network.ApiClient;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TasksActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";

    private ProgressBar progressBar;
    private TextView errorText;
    private LinearLayout emptyCard;
    private TextView emptyText;
    private EditText searchInput;
    private Spinner statusFilterSpinner;
    private Spinner priorityFilterSpinner;
    private RecyclerView tasksRecyclerView;
    private TextView tasksCountLabel;

    // Cartão XP
    private TextView xpCardLevelNumber;
    private TextView xpCardXpNumber;
    private ProgressBar xpCardProgressBar;
    private TextView xpCardProgressLabel;
    private TextView headerUserPill;

    // Resumo de hoje
    private TextView summaryPendingCount;
    private TextView summaryCompletedCount;
    private TextView summaryLostCount;

    private TaskAdapter taskAdapter;
    private final List<Task> allTasks = new ArrayList<>();
    private final List<Task> filteredTasks = new ArrayList<>();
    private Call<List<Task>> tasksCall;
    private Call<CompleteTaskResponse> completeTaskCall;
    private Call<JsonObject> deleteTaskCall;
    private Call<JsonObject> hideCompletedVisibleTasksCall;
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

        bindViews();
        setupFilters();
        setupBottomNav();
        bindUserHeader();

        taskAdapter = new TaskAdapter(this::confirmCompleteTask, this::showTaskOptions);
        tasksRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        tasksRecyclerView.setAdapter(taskAdapter);
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (taskAdapter == null) return;

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        bindUserHeader();
        loadTasks(token);
    }

    private void bindViews() {
        progressBar = findViewById(R.id.tasksProgressBar);
        errorText = findViewById(R.id.tasksErrorText);
        emptyCard = findViewById(R.id.tasksEmptyCard);
        emptyText = findViewById(R.id.tasksEmptyText);
        searchInput = findViewById(R.id.tasksSearchInput);
        statusFilterSpinner = findViewById(R.id.tasksStatusFilterSpinner);
        priorityFilterSpinner = findViewById(R.id.tasksPriorityFilterSpinner);
        tasksRecyclerView = findViewById(R.id.tasksRecyclerView);
        tasksCountLabel = findViewById(R.id.tasksCountLabel);

        xpCardLevelNumber = findViewById(R.id.xpCardLevelNumber);
        xpCardXpNumber = findViewById(R.id.xpCardXpNumber);
        xpCardProgressBar = findViewById(R.id.xpCardProgressBar);
        xpCardProgressLabel = findViewById(R.id.xpCardProgressLabel);
        headerUserPill = findViewById(R.id.headerUserPill);

        summaryPendingCount = findViewById(R.id.summaryPendingCount);
        summaryCompletedCount = findViewById(R.id.summaryCompletedCount);
        summaryLostCount = findViewById(R.id.summaryLostCount);
    }

    private void bindUserHeader() {
        User user = getSavedUser();
        if (user == null) return;

        String username = user.getUsername();
        int xp = user.getXp() != null ? Math.max(user.getXp(), 0) : 0;
        int level = user.getLevel() != null ? Math.max(user.getLevel(), 1) : calculateLevelFromXp(xp);

        // Pill do header
        if (!TextUtils.isEmpty(username)) {
            headerUserPill.setText(username + " · NÍV " + level);
        }

        // Cartão XP
        xpCardLevelNumber.setText(String.valueOf(level));
        xpCardXpNumber.setText(String.valueOf(xp));

        // Barra de progresso do nível
        int currentLevelXp = calculateXpForLevel(level);
        int nextLevelXp = calculateXpForLevel(level + 1);
        int levelSpan = Math.max(nextLevelXp - currentLevelXp, 1);
        int xpInLevel = xp - currentLevelXp;
        int xpForNext = Math.max(nextLevelXp - xp, 0);
        int progress = Math.round((xpInLevel * 100f) / levelSpan);
        xpCardProgressBar.setProgress(Math.max(0, Math.min(progress, 100)));
        xpCardProgressLabel.setText("Faltam " + xpForNext + " XP para o nível " + (level + 1));

        // Saudação
        TextView greeting = findViewById(R.id.tasksHeaderGreeting);
        if (greeting != null && !TextUtils.isEmpty(username)) {
            greeting.setText("Bom trabalho, " + username);
        }
    }

    private void setupBottomNav() {
        // FAB abre criar tarefa
        View fab = findViewById(R.id.navFab);
        if (fab != null) fab.setOnClickListener(v -> openCreateTaskActivity());

        // Tabs de navegação
        View navTasks = findViewById(R.id.navTabTasks);
        View navRanking = findViewById(R.id.navTabRanking);
        View navInspiration = findViewById(R.id.navTabInspiration);
        View navProfile = findViewById(R.id.navTabProfile);

        setNavTabActive(navTasks, true);

        if (navRanking != null) navRanking.setOnClickListener(v -> {
            // Placeholder — ainda sem ecrã de Ranking
            Toast.makeText(this, "Ranking em breve!", Toast.LENGTH_SHORT).show();
        });
        if (navInspiration != null) navInspiration.setOnClickListener(v -> {
            Intent intent = new Intent(this, InspirationActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(intent);
        });
        if (navProfile != null) navProfile.setOnClickListener(v -> {
            Intent intent = new Intent(this, ProfileActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(intent);
        });
    }

    private void setNavTabActive(View tab, boolean active) {
        if (tab == null) return;
        TextView icon = null, label = null;
        if (tab.getId() == R.id.navTabTasks) {
            icon = tab.findViewById(R.id.navTabTasksIcon);
            label = tab.findViewById(R.id.navTabTasksLabel);
        }
        if (icon != null) icon.setTextColor(active
                ? getResources().getColor(R.color.lifinity_primary, null)
                : getResources().getColor(R.color.lifinity_text_secondary, null));
        if (label != null) label.setTextColor(active
                ? getResources().getColor(R.color.lifinity_primary, null)
                : getResources().getColor(R.color.lifinity_text_secondary, null));
        tab.setBackground(active
                ? getResources().getDrawable(R.drawable.bg_nav_item_active, null)
                : null);
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private User getSavedUser() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUser = preferences.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) return null;
        try {
            return gson.fromJson(savedUser, User.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private int calculateLevelFromXp(int xp) {
        int level = 1;
        while (xp >= calculateXpForLevel(level + 1)) level++;
        return level;
    }

    private int calculateXpForLevel(int level) {
        if (level <= 1) return 0;
        return (int) Math.floor(100 * Math.pow(level - 1, 1.5));
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

                allTasks.clear();
                List<Task> tasks = response.body();
                if (tasks != null) allTasks.addAll(tasks);

                updateSummary();
                applyFilters();
            }

            @Override
            public void onFailure(Call<List<Task>> call, Throwable t) {
                if (call.isCanceled()) return;
                showError("Não foi possível carregar as atividades. Confirma que o backend está ativo.");
            }
        });
    }

    private void updateSummary() {
        int pending = 0, completed = 0, lost = 0;
        for (Task task : allTasks) {
            if (isTaskCompleted(task)) completed++;
            else if (isTaskLost(task)) lost++;
            else pending++;
        }
        if (summaryPendingCount != null) summaryPendingCount.setText(String.valueOf(pending));
        if (summaryCompletedCount != null) summaryCompletedCount.setText(String.valueOf(completed));
        if (summaryLostCount != null) summaryLostCount.setText(String.valueOf(lost));
    }

    private void confirmCompleteTask(Task task) {
        new AlertDialog.Builder(this)
                .setTitle("Concluir atividade")
                .setMessage("Queres concluir esta atividade?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Concluir", (dialog, which) -> completeTask(task))
                .show();
    }

    private void showTaskOptions(Task task) {
        if (task == null || task.getIdtask() == null) {
            showError("Atividade inválida.");
            return;
        }

        boolean canEdit = canEditTask(task);
        String[] options = canEdit
                ? new String[]{"Editar", "Ocultar/Eliminar", "Cancelar"}
                : new String[]{"Ocultar/Eliminar", "Cancelar"};

        new AlertDialog.Builder(this)
                .setTitle("Opções da atividade")
                .setItems(options, (dialog, which) -> {
                    String option = options[which];
                    if ("Editar".equals(option)) {
                        openEditTaskActivity(task);
                    } else if ("Ocultar/Eliminar".equals(option)) {
                        confirmDeleteTask(task);
                    }
                })
                .show();
    }

    private void completeTask(Task task) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) { openLoginActivity(); return; }
        if (task == null || task.getIdtask() == null) { showError("Atividade inválida."); return; }

        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        completeTaskCall = taskApi.completeTask("Bearer " + token, task.getIdtask());
        completeTaskCall.enqueue(new Callback<CompleteTaskResponse>() {
            @Override
            public void onResponse(Call<CompleteTaskResponse> call, Response<CompleteTaskResponse> response) {
                progressBar.setVisibility(View.GONE);
                if (!response.isSuccessful()) { showError(getCompleteTaskErrorMessage(response)); return; }

                CompleteTaskResponse r = response.body();
                if (r == null) { showError("Resposta inválida do servidor."); return; }

                updateStoredUser(r);
                bindUserHeader();
                Toast.makeText(TasksActivity.this,
                        valueOrFallback(r.getMessage(), "Atividade concluída."),
                        Toast.LENGTH_LONG).show();
                loadTasks(token);
            }

            @Override
            public void onFailure(Call<CompleteTaskResponse> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showError("Não foi possível concluir a atividade.");
            }
        });
    }

    private void confirmDeleteTask(Task task) {
        new AlertDialog.Builder(this)
                .setTitle("Ocultar/Eliminar atividade")
                .setMessage("Queres ocultar ou eliminar esta atividade?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Confirmar", (dialog, which) -> deleteTask(task))
                .show();
    }

    private void deleteTask(Task task) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) { openLoginActivity(); return; }
        if (task == null || task.getIdtask() == null) { showError("Atividade inválida."); return; }

        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        deleteTaskCall = taskApi.deleteTask("Bearer " + token, task.getIdtask());
        deleteTaskCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                progressBar.setVisibility(View.GONE);
                if (!response.isSuccessful()) {
                    String msg = getJsonErrorMessage(response, "Erro ao ocultar/eliminar atividade.");
                    Toast.makeText(TasksActivity.this, msg, Toast.LENGTH_LONG).show();
                    showError(msg);
                    return;
                }
                String msg = getJsonSuccessMessage(response.body(), "Atividade ocultada/eliminada com sucesso.");
                Toast.makeText(TasksActivity.this, msg, Toast.LENGTH_LONG).show();
                loadTasks(token);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                String msg = "Não foi possível ocultar/eliminar a atividade.";
                Toast.makeText(TasksActivity.this, msg, Toast.LENGTH_LONG).show();
                showError(msg);
            }
        });
    }

    private void updateStoredUser(CompleteTaskResponse r) {
        if (r.getNewXP() == null && r.getNewLevel() == null) return;

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUser = prefs.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) return;

        try {
            JsonObject userObject = JsonParser.parseString(savedUser).getAsJsonObject();
            if (r.getNewXP() != null) userObject.addProperty("xp", r.getNewXP());
            if (r.getNewLevel() != null) userObject.addProperty("level", r.getNewLevel());
            prefs.edit().putString(KEY_USER, gson.toJson(userObject)).apply();
        } catch (Exception ignored) {
        }
    }

    private void setupFilters() {
        ArrayAdapter<String> statusAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_item,
                new String[]{"Todas", "Pendentes", "Concluídas", "Perdidas"});
        statusAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        statusFilterSpinner.setAdapter(statusAdapter);

        ArrayAdapter<String> priorityAdapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_item,
                new String[]{"Todas", "Baixa", "Média", "Alta"});
        priorityAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        priorityFilterSpinner.setAdapter(priorityAdapter);

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { applyFilters(); }
            @Override public void afterTextChanged(Editable s) {}
        });

        AdapterView.OnItemSelectedListener filterListener = new AdapterView.OnItemSelectedListener() {
            @Override public void onItemSelected(AdapterView<?> p, View v, int pos, long id) { applyFilters(); }
            @Override public void onNothingSelected(AdapterView<?> p) { applyFilters(); }
        };
        statusFilterSpinner.setOnItemSelectedListener(filterListener);
        priorityFilterSpinner.setOnItemSelectedListener(filterListener);
    }

    private void applyFilters() {
        filteredTasks.clear();
        String query = searchInput == null ? "" : searchInput.getText().toString().trim().toLowerCase(Locale.US);
        String statusFilter = getSelectedFilterValue(statusFilterSpinner);
        String priorityFilter = getSelectedFilterValue(priorityFilterSpinner);

        for (Task task : allTasks) {
            if (!matchesSearch(task, query)) continue;
            if (!matchesStatusFilter(task, statusFilter)) continue;
            if (!matchesPriorityFilter(task, priorityFilter)) continue;
            filteredTasks.add(task);
        }

        taskAdapter.setTasks(filteredTasks);

        if (tasksCountLabel != null) tasksCountLabel.setText(String.valueOf(filteredTasks.size()));

        if (filteredTasks.isEmpty()) showFilteredEmpty();
        else showList();
    }

    private String getSelectedFilterValue(Spinner spinner) {
        if (spinner == null || spinner.getSelectedItem() == null) return "todas";
        return spinner.getSelectedItem().toString().trim().toLowerCase(Locale.US);
    }

    private boolean matchesSearch(Task task, String query) {
        if (TextUtils.isEmpty(query)) return true;
        if (task == null || TextUtils.isEmpty(task.getTitle())) return false;
        return task.getTitle().toLowerCase(Locale.US).contains(query);
    }

    private boolean matchesStatusFilter(Task task, String statusFilter) {
        if ("todas".equals(statusFilter)) return true;
        boolean completed = isTaskCompleted(task);
        boolean lost = isTaskLost(task);
        if ("pendentes".equals(statusFilter)) return !completed && !lost;
        if ("concluídas".equals(statusFilter)) return completed;
        if ("perdidas".equals(statusFilter)) return lost;
        return true;
    }

    private boolean matchesPriorityFilter(Task task, String priorityFilter) {
        if ("todas".equals(priorityFilter)) return true;
        if (task == null || TextUtils.isEmpty(task.getPriority())) return false;
        String priority = task.getPriority().trim().toLowerCase(Locale.US);
        return priority.equals(priorityFilter) || priority.equals(priorityFilter.replace("é", "e").replace("é", "e"));
    }

    private boolean isTaskCompleted(Task task) {
        if (task == null || TextUtils.isEmpty(task.getStatus())) return false;
        return "concluida".equals(task.getStatus().trim().toLowerCase(Locale.US));
    }

    private boolean isTaskLost(Task task) {
        if (task == null || isTaskCompleted(task)) return false;
        Date dueDate = parseDate(task.getDueDate());
        return dueDate != null && dueDate.before(new Date());
    }

    private boolean canEditTask(Task task) {
        if (task == null || task.getIdtask() == null) return false;
        return !isTaskCompleted(task) && !isTaskLost(task);
    }

    private String getErrorMessage(Response<List<Task>> response) {
        if (response.code() == 401 || response.code() == 403) return "Sessão inválida. Termina sessão e volta a entrar.";
        return "Erro ao carregar atividades.";
    }

    private String getCompleteTaskErrorMessage(Response<CompleteTaskResponse> response) {
        if (response.code() == 401) return "Sessão inválida. Termina sessão e volta a entrar.";
        return "Erro ao concluir atividade.";
    }

    private String getJsonErrorMessage(Response<JsonObject> response, String fallback) {
        if (response.code() == 401) return "Sessão inválida. Termina sessão e volta a entrar.";
        return fallback;
    }

    private String getJsonSuccessMessage(JsonObject body, String fallback) {
        if (body != null && body.has("message") && !body.get("message").isJsonNull())
            return body.get("message").getAsString();
        return fallback;
    }

    private Date parseDate(String value) {
        if (TextUtils.isEmpty(value)) return null;
        String[] patterns = {
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ssXXX", "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm", "yyyy-MM-dd HH:mm:ss", "yyyy-MM-dd"
        };
        for (String pattern : patterns) {
            try { return new SimpleDateFormat(pattern, Locale.US).parse(value); }
            catch (ParseException ignored) {}
        }
        return null;
    }

    private String valueOrFallback(String value, String fallback) {
        return TextUtils.isEmpty(value) ? fallback : value;
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        if (emptyCard != null) emptyCard.setVisibility(View.GONE);
        tasksRecyclerView.setVisibility(View.GONE);
    }

    private void showError(String message) {
        progressBar.setVisibility(View.GONE);
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        if (emptyCard != null) emptyCard.setVisibility(View.GONE);
        tasksRecyclerView.setVisibility(View.GONE);
    }

    private void showFilteredEmpty() {
        progressBar.setVisibility(View.GONE);
        errorText.setVisibility(View.GONE);
        tasksRecyclerView.setVisibility(View.GONE);
        if (emptyCard != null) {
            emptyCard.setVisibility(View.VISIBLE);
            if (emptyText != null) {
                emptyText.setText(allTasks.isEmpty() ? "Tudo em dia!" : "Nenhuma atividade encontrada.");
            }
        }
    }

    private void showList() {
        progressBar.setVisibility(View.GONE);
        errorText.setVisibility(View.GONE);
        if (emptyCard != null) emptyCard.setVisibility(View.GONE);
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
        if (tasksCall != null) tasksCall.cancel();
        if (completeTaskCall != null) completeTaskCall.cancel();
        if (deleteTaskCall != null) deleteTaskCall.cancel();
        if (hideCompletedVisibleTasksCall != null) hideCompletedVisibleTasksCall.cancel();
        super.onDestroy();
    }
}
