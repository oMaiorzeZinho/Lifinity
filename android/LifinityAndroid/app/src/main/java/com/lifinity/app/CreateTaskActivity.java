package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.api.FriendApi;
import com.lifinity.app.api.GroupApi;
import com.lifinity.app.api.TaskApi;
import com.lifinity.app.models.CreateTaskRequest;
import com.lifinity.app.models.Friend;
import com.lifinity.app.models.Group;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CreateTaskActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    // Itens do spinner de prioridade. A posição 0 ("Prioridade") é só placeholder —
    // NUNCA é enviada ao backend (que só aceita baixa/media/alta); ver createTask().
    private static final String[] PRIORITY_ITEMS = {"Prioridade", "baixa", "media", "alta"};

    private EditText titleInput;
    private EditText descriptionInput;
    private EditText dueDateInput;
    private Spinner prioritySpinner;
    private Button createButton;
    private ProgressBar progressBar;
    private TextView errorText;

    // ===== Destino (amigos/grupos), igual ao browser =====
    private TextView onlyMeButton;
    private LinearLayout friendsHeader;
    private TextView friendsHeaderText;
    private TextView friendsArrow;
    private LinearLayout friendsContainer;
    private LinearLayout groupsHeader;
    private TextView groupsHeaderText;
    private TextView groupsArrow;
    private LinearLayout groupsContainer;

    // Seleções atuais (vazias = "Só para mim").
    private final Set<Integer> selectedAssignees = new HashSet<>();
    private final Set<Integer> selectedGroups = new HashSet<>();
    // Referências às linhas criadas em runtime, para as re-pintar (selecionada/não).
    private final Map<Integer, TextView> friendRows = new HashMap<>();
    private final Map<Integer, TextView> groupRows = new HashMap<>();

    private Call<JsonObject> createTaskCall;
    private Call<List<Friend>> friendsCall;
    private Call<List<Group>> groupsCall;
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

        onlyMeButton = findViewById(R.id.createTaskOnlyMeButton);
        friendsHeader = findViewById(R.id.createTaskFriendsHeader);
        friendsHeaderText = findViewById(R.id.createTaskFriendsHeaderText);
        friendsArrow = findViewById(R.id.createTaskFriendsArrow);
        friendsContainer = findViewById(R.id.createTaskFriendsContainer);
        groupsHeader = findViewById(R.id.createTaskGroupsHeader);
        groupsHeaderText = findViewById(R.id.createTaskGroupsHeaderText);
        groupsArrow = findViewById(R.id.createTaskGroupsArrow);
        groupsContainer = findViewById(R.id.createTaskGroupsContainer);

        setupPrioritySpinner();
        setupDestination();

        createButton.setOnClickListener(v -> createTask());
    }

    /**
     * Spinner de prioridade com PLACEHOLDER "Prioridade" (Task 6).
     * Adapter custom: a posição 0 ("Prioridade") aparece com cor de hint; as restantes
     * (baixa/media/alta) com a cor de texto normal — para o 0 parecer mesmo um placeholder.
     */
    private void setupPrioritySpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(
                this, android.R.layout.simple_spinner_item, PRIORITY_ITEMS) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                View view = super.getView(position, convertView, parent);
                tintRow(view, position);
                return view;
            }

            @Override
            public View getDropDownView(int position, View convertView, ViewGroup parent) {
                View view = super.getDropDownView(position, convertView, parent);
                tintRow(view, position);
                return view;
            }

            // Pinta a posição 0 como hint; as restantes como texto normal.
            private void tintRow(View view, int position) {
                if (view instanceof TextView) {
                    int color = (position == 0)
                            ? R.color.lifinity_input_hint
                            : R.color.lifinity_input_text;
                    ((TextView) view).setTextColor(getColor(color));
                }
            }
        };
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        prioritySpinner.setAdapter(adapter);
        // Mostra "Prioridade" à partida (em vez de "media" pré-selecionada).
        prioritySpinner.setSelection(0);
    }

    /** Liga a secção "DESTINO": estado inicial, listeners e carregamento de dados. */
    private void setupDestination() {
        // Estado inicial: "Só para mim" selecionado, contentores escondidos (já no XML).
        refreshOnlyMeState();
        updateFriendsHeaderCount();
        updateGroupsHeaderCount();

        // "Só para mim": limpa tudo e repõe as linhas a não-selecionado.
        onlyMeButton.setOnClickListener(v -> {
            selectedAssignees.clear();
            selectedGroups.clear();
            for (TextView row : friendRows.values()) applyRowState(row, false);
            for (TextView row : groupRows.values()) applyRowState(row, false);
            updateFriendsHeaderCount();
            updateGroupsHeaderCount();
            refreshOnlyMeState();
        });

        // Cabeçalhos: alternam a visibilidade do respetivo contentor e a seta.
        friendsHeader.setOnClickListener(v -> toggleContainer(friendsContainer, friendsArrow));
        groupsHeader.setOnClickListener(v -> toggleContainer(groupsContainer, groupsArrow));

        loadFriendsAndGroups(getToken());
    }

    /** Mostra/esconde um contentor e troca a seta entre ▼ e ▲. */
    private void toggleContainer(LinearLayout container, TextView arrow) {
        boolean show = container.getVisibility() != View.VISIBLE;
        container.setVisibility(show ? View.VISIBLE : View.GONE);
        arrow.setText(show ? "▲" : "▼");
    }

    /** Carrega amigos e grupos e cria as linhas selecionáveis em runtime. */
    private void loadFriendsAndGroups(String token) {
        if (TextUtils.isEmpty(token)) return;

        FriendApi friendApi = ApiClient.getClient().create(FriendApi.class);
        friendsCall = friendApi.getFriends("Bearer " + token);
        friendsCall.enqueue(new Callback<List<Friend>>() {
            @Override
            public void onResponse(Call<List<Friend>> call, Response<List<Friend>> response) {
                friendsContainer.removeAllViews();
                friendRows.clear();
                List<Friend> friends = response.isSuccessful() ? response.body() : null;
                if (friends == null || friends.isEmpty()) {
                    friendsContainer.addView(makeEmptyHint("Ainda não tens amigos disponíveis."));
                    return;
                }
                for (Friend friend : friends) {
                    if (friend.getIduser() == null) continue;
                    final int id = friend.getIduser();
                    TextView row = makeSelectableRow(friend.getUsername());
                    row.setOnClickListener(v -> toggleFriend(id));
                    friendRows.put(id, row);
                    friendsContainer.addView(row);
                }
            }

            @Override
            public void onFailure(Call<List<Friend>> call, Throwable t) {
                if (call.isCanceled()) return;
                friendsContainer.removeAllViews();
                friendsContainer.addView(makeEmptyHint("Não foi possível carregar amigos."));
            }
        });

        GroupApi groupApi = ApiClient.getClient().create(GroupApi.class);
        groupsCall = groupApi.getMyGroups("Bearer " + token);
        groupsCall.enqueue(new Callback<List<Group>>() {
            @Override
            public void onResponse(Call<List<Group>> call, Response<List<Group>> response) {
                groupsContainer.removeAllViews();
                groupRows.clear();
                List<Group> groups = response.isSuccessful() ? response.body() : null;
                if (groups == null || groups.isEmpty()) {
                    groupsContainer.addView(makeEmptyHint("Ainda não pertences a nenhum grupo."));
                    return;
                }
                for (Group group : groups) {
                    if (group.getIdgroup() == null) continue;
                    final int id = group.getIdgroup();
                    TextView row = makeSelectableRow(group.getName());
                    row.setOnClickListener(v -> toggleGroup(id));
                    groupRows.put(id, row);
                    groupsContainer.addView(row);
                }
            }

            @Override
            public void onFailure(Call<List<Group>> call, Throwable t) {
                if (call.isCanceled()) return;
                groupsContainer.removeAllViews();
                groupsContainer.addView(makeEmptyHint("Não foi possível carregar grupos."));
            }
        });
    }

    /** Alterna a seleção de um amigo e atualiza a UI. */
    private void toggleFriend(int id) {
        if (selectedAssignees.contains(id)) selectedAssignees.remove(id);
        else selectedAssignees.add(id);
        TextView row = friendRows.get(id);
        if (row != null) applyRowState(row, selectedAssignees.contains(id));
        updateFriendsHeaderCount();
        // Há destino escolhido → "Só para mim" deixa de estar selecionado.
        refreshOnlyMeState();
    }

    /** Alterna a seleção de um grupo e atualiza a UI. */
    private void toggleGroup(int id) {
        if (selectedGroups.contains(id)) selectedGroups.remove(id);
        else selectedGroups.add(id);
        TextView row = groupRows.get(id);
        if (row != null) applyRowState(row, selectedGroups.contains(id));
        updateGroupsHeaderCount();
        refreshOnlyMeState();
    }

    private void updateFriendsHeaderCount() {
        friendsHeaderText.setText(selectedAssignees.isEmpty()
                ? "Amigos" : "Amigos (" + selectedAssignees.size() + ")");
    }

    private void updateGroupsHeaderCount() {
        groupsHeaderText.setText(selectedGroups.isEmpty()
                ? "Grupos" : "Grupos (" + selectedGroups.size() + ")");
    }

    /** "Só para mim" fica selecionado apenas quando não há amigos nem grupos escolhidos. */
    private void refreshOnlyMeState() {
        boolean onlyMe = selectedAssignees.isEmpty() && selectedGroups.isEmpty();
        applyRowState(onlyMeButton, onlyMe);
    }

    /** Pinta uma linha (ou o "Só para mim") consoante o estado de seleção. */
    private void applyRowState(TextView view, boolean selected) {
        if (view == null) return;
        // Selecionada = pílula menta (bg_pill_mint) + texto verde;
        // não-selecionada = sub-cartão clay (bg_card_soft_clay) + texto normal.
        view.setBackgroundResource(selected ? R.drawable.bg_pill_mint : R.drawable.bg_card_soft_clay);
        view.setTextColor(getColor(selected ? R.color.lifinity_primary : R.color.lifinity_text));
    }

    /** Cria uma linha selecionável (amigo/grupo) com o nome dado. */
    private TextView makeSelectableRow(String label) {
        TextView row = new TextView(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(44));
        lp.topMargin = dp(8);
        row.setLayoutParams(lp);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(16), 0, dp(16), 0);
        row.setText(label);
        row.setTextSize(15);
        applyRowState(row, false);
        return row;
    }

    /** Texto leve para os casos "sem amigos" / "sem grupos". */
    private TextView makeEmptyHint(String text) {
        TextView tv = new TextView(this);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(8);
        tv.setLayoutParams(lp);
        tv.setPadding(dp(8), dp(8), dp(8), dp(8));
        tv.setText(text);
        tv.setTextColor(getColor(R.color.lifinity_text_faint));
        tv.setTextSize(14);
        return tv;
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
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
        // Prioridade: posição 0 é o placeholder "Prioridade" — nesse caso usa-se o
        // defeito do sistema "media" (o backend rejeita qualquer valor fora de
        // baixa/media/alta). Caso contrário usa a opção escolhida.
        int priorityPos = prioritySpinner.getSelectedItemPosition();
        String priority = (priorityPos <= 0)
                ? "media"
                : prioritySpinner.getSelectedItem().toString();
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
        // Destino: listas SEMPRE preenchidas (vazias = só para mim).
        request.setAssignees(new ArrayList<>(selectedAssignees));
        request.setGroups(new ArrayList<>(selectedGroups));

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

                String message = "Atividade criada com sucesso!";
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
                showError("Nao foi possivel criar a atividade. Confirma que o backend esta ativo.");
            }
        });
    }

    private String getErrorMessage(Response<JsonObject> response) {
        if (response.code() == 401) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return "Erro ao criar atividade.";
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
            return "Erro ao criar atividade.";
        }

        return "Erro ao criar atividade.";
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
        if (friendsCall != null) {
            friendsCall.cancel();
        }
        if (groupsCall != null) {
            groupsCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
