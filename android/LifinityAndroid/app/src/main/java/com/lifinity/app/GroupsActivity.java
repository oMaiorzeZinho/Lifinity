package com.lifinity.app;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
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

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.adapters.GroupAdapter;
import com.lifinity.app.api.GroupApi;
import com.lifinity.app.models.CreateGroupRequest;
import com.lifinity.app.models.Group;
import com.lifinity.app.models.GroupMember;
import com.lifinity.app.models.JoinGroupRequest;
import com.lifinity.app.models.User;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Ecrã de Grupos: criar grupo, entrar por código e listar os meus grupos com
 * ações (ver membros, abrir conversa, copiar código, trancar, sair, apagar).
 * Replica a funcionalidade da web (Community.jsx) contra os endpoints /api/groups.
 */
public class GroupsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";

    private EditText createNameInput;
    private EditText createDescriptionInput;
    private Button createButton;
    private EditText joinCodeInput;
    private Button joinButton;

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView emptyText;
    private RecyclerView groupsRecyclerView;

    private GroupAdapter groupsAdapter;
    private final Gson gson = new Gson();

    private Call<List<Group>> groupsCall;
    private Call<JsonObject> actionCall;
    private Call<List<GroupMember>> membersCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_groups);

        createNameInput = findViewById(R.id.groupsCreateNameInput);
        createDescriptionInput = findViewById(R.id.groupsCreateDescriptionInput);
        createButton = findViewById(R.id.groupsCreateButton);
        joinCodeInput = findViewById(R.id.groupsJoinCodeInput);
        joinButton = findViewById(R.id.groupsJoinButton);
        progressBar = findViewById(R.id.groupsProgressBar);
        errorText = findViewById(R.id.groupsErrorText);
        emptyText = findViewById(R.id.groupsEmptyText);
        groupsRecyclerView = findViewById(R.id.groupsRecyclerView);

        findViewById(R.id.groupsBackButton).setOnClickListener(v -> finish());

        groupsAdapter = new GroupAdapter(this::showGroupOptions);
        groupsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        groupsRecyclerView.setAdapter(groupsAdapter);

        createButton.setOnClickListener(v -> createGroup());
        joinButton.setOnClickListener(v -> joinGroup());
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }
        loadGroups();
    }

    // ===== Listagem =====

    private void loadGroups() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);

        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        groupsCall = api.getMyGroups("Bearer " + getToken());
        groupsCall.enqueue(new Callback<List<Group>>() {
            @Override
            public void onResponse(Call<List<Group>> call, Response<List<Group>> response) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showGroupsError("Não foi possível carregar grupos.");
                    return;
                }

                List<Group> groups = response.body();
                groupsAdapter.setGroups(groups);
                if (groups.isEmpty()) {
                    emptyText.setVisibility(View.VISIBLE);
                    groupsRecyclerView.setVisibility(View.GONE);
                } else {
                    emptyText.setVisibility(View.GONE);
                    groupsRecyclerView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Group>> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showGroupsError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    private void showGroupsError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);
        groupsRecyclerView.setVisibility(View.GONE);
    }

    // ===== Criar / entrar =====

    private void createGroup() {
        String name = createNameInput.getText().toString().trim();
        String description = createDescriptionInput.getText().toString().trim();

        if (name.length() < 2) {
            Toast.makeText(this, "O nome do grupo precisa de pelo menos 2 letras.", Toast.LENGTH_SHORT).show();
            return;
        }

        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        actionCall = api.createGroup("Bearer " + getToken(),
                new CreateGroupRequest(name, TextUtils.isEmpty(description) ? null : description));
        actionCall.enqueue(simpleCallback("Grupo criado.", () -> {
            createNameInput.setText("");
            createDescriptionInput.setText("");
            loadGroups();
        }));
    }

    private void joinGroup() {
        String code = joinCodeInput.getText().toString().trim();
        if (TextUtils.isEmpty(code)) {
            Toast.makeText(this, "Escreve um código de convite.", Toast.LENGTH_SHORT).show();
            return;
        }

        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        actionCall = api.joinGroup("Bearer " + getToken(), new JoinGroupRequest(code));
        actionCall.enqueue(simpleCallback("Entraste no grupo.", () -> {
            joinCodeInput.setText("");
            loadGroups();
        }));
    }

    // ===== Ações por grupo =====

    private void showGroupOptions(Group group) {
        if (group == null || group.getIdgroup() == null) return;

        boolean isOwner = isCurrentUserOwner(group);

        List<String> options = new ArrayList<>();
        options.add("Ver membros");
        options.add("Abrir conversa do grupo");
        options.add("Copiar código de convite");
        if (isOwner) {
            options.add(group.isLocked() ? "Destrancar grupo" : "Trancar grupo");
        }
        if (!isOwner) {
            options.add("Sair do grupo");
        }
        if (isOwner || group.isAdmin()) {
            options.add("Apagar grupo");
        }
        options.add("Cancelar");

        String[] items = options.toArray(new String[0]);
        new AlertDialog.Builder(this)
                .setTitle(group.getName())
                .setItems(items, (dialog, which) -> {
                    String option = items[which];
                    switch (option) {
                        case "Ver membros":
                            viewMembers(group);
                            break;
                        case "Abrir conversa do grupo":
                            openGroupConversation(group);
                            break;
                        case "Copiar código de convite":
                            copyInviteCode(group);
                            break;
                        case "Trancar grupo":
                        case "Destrancar grupo":
                            toggleLock(group);
                            break;
                        case "Sair do grupo":
                            confirmLeave(group);
                            break;
                        case "Apagar grupo":
                            confirmDelete(group);
                            break;
                        default:
                            break;
                    }
                })
                .show();
    }

    private void viewMembers(Group group) {
        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        membersCall = api.getMembers("Bearer " + getToken(), group.getIdgroup());
        membersCall.enqueue(new Callback<List<GroupMember>>() {
            @Override
            public void onResponse(Call<List<GroupMember>> call, Response<List<GroupMember>> response) {
                if (call.isCanceled()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    Toast.makeText(GroupsActivity.this, "Não foi possível carregar membros.", Toast.LENGTH_SHORT).show();
                    return;
                }

                List<GroupMember> members = response.body();
                StringBuilder sb = new StringBuilder();
                for (GroupMember member : members) {
                    sb.append("• ")
                      .append(member.getUsername())
                      .append("  ·  Nível ").append(member.getLevel())
                      .append(member.isAdmin() ? "  ·  Admin" : "")
                      .append("\n");
                }
                if (members.isEmpty()) sb.append("Sem membros.");

                new AlertDialog.Builder(GroupsActivity.this)
                        .setTitle("Membros de " + group.getName())
                        .setMessage(sb.toString().trim())
                        .setPositiveButton("Fechar", null)
                        .show();
            }

            @Override
            public void onFailure(Call<List<GroupMember>> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(GroupsActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openGroupConversation(Group group) {
        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        actionCall = api.openConversation("Bearer " + getToken(), group.getIdgroup());
        actionCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (call.isCanceled()) return;
                JsonObject body = response.isSuccessful() ? response.body() : null;
                if (body == null || !body.has("idconversation") || body.get("idconversation").isJsonNull()) {
                    Toast.makeText(GroupsActivity.this, "Não foi possível abrir a conversa do grupo.", Toast.LENGTH_SHORT).show();
                    return;
                }
                int idconversation = body.get("idconversation").getAsInt();
                Intent intent = new Intent(GroupsActivity.this, ChatActivity.class);
                intent.putExtra(ChatActivity.EXTRA_CONVERSATION_ID, idconversation);
                intent.putExtra(ChatActivity.EXTRA_CONVERSATION_NAME, group.getName());
                startActivity(intent);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(GroupsActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void copyInviteCode(Group group) {
        String code = group.getInviteCode();
        if (TextUtils.isEmpty(code)) {
            Toast.makeText(this, "Este grupo não tem código de convite.", Toast.LENGTH_SHORT).show();
            return;
        }
        ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard != null) {
            clipboard.setPrimaryClip(ClipData.newPlainText("Código do grupo", code));
        }
        Toast.makeText(this, "Código copiado: " + code, Toast.LENGTH_SHORT).show();
    }

    private void toggleLock(Group group) {
        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        actionCall = api.toggleLock("Bearer " + getToken(), group.getIdgroup());
        actionCall.enqueue(simpleCallback("Estado do grupo atualizado.", this::loadGroups));
    }

    private void confirmLeave(Group group) {
        new AlertDialog.Builder(this)
                .setTitle("Sair do grupo")
                .setMessage("Queres mesmo sair de " + group.getName() + "?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Sair", (d, w) -> leaveGroup(group))
                .show();
    }

    private void leaveGroup(Group group) {
        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        actionCall = api.leaveGroup("Bearer " + getToken(), group.getIdgroup());
        actionCall.enqueue(simpleCallback("Saíste do grupo.", this::loadGroups));
    }

    private void confirmDelete(Group group) {
        new AlertDialog.Builder(this)
                .setTitle("Apagar grupo")
                .setMessage("Esta ação apaga o grupo \"" + group.getName() + "\" para todos os membros. Continuar?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Apagar", (d, w) -> deleteGroup(group))
                .show();
    }

    private void deleteGroup(Group group) {
        GroupApi api = ApiClient.getClient().create(GroupApi.class);
        actionCall = api.deleteGroup("Bearer " + getToken(), group.getIdgroup());
        actionCall.enqueue(simpleCallback("Grupo apagado.", this::loadGroups));
    }

    // ===== Utilitários =====

    private boolean isCurrentUserOwner(Group group) {
        User user = getSavedUser();
        if (user == null || user.getIduser() == null || group.getIdowner() == null) return false;
        return user.getIduser().intValue() == group.getIdowner().intValue();
    }

    private User getSavedUser() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUser = prefs.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) return null;
        try {
            return gson.fromJson(savedUser, User.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private interface OnDone {
        void run();
    }

    private Callback<JsonObject> simpleCallback(String fallbackSuccess, OnDone onSuccess) {
        return new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (call.isCanceled()) return;
                String message = extractMessage(response,
                        response.isSuccessful() ? fallbackSuccess : "Não foi possível concluir a ação.");
                Toast.makeText(GroupsActivity.this, message, Toast.LENGTH_SHORT).show();
                if (response.isSuccessful() && onSuccess != null) {
                    onSuccess.run();
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(GroupsActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        };
    }

    private String extractMessage(Response<JsonObject> response, String fallback) {
        try {
            JsonObject body = response.isSuccessful() ? response.body() : null;
            if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
                return body.get("message").getAsString();
            }
        } catch (Exception ignored) {
        }
        return fallback;
    }

    private String getToken() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return prefs.getString(KEY_TOKEN, null);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        if (groupsCall != null) groupsCall.cancel();
        if (actionCall != null) actionCall.cancel();
        if (membersCall != null) membersCall.cancel();
        super.onDestroy();
    }
}
