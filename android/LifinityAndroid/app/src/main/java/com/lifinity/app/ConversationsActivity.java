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

import com.lifinity.app.adapters.ConversationAdapter;
import com.lifinity.app.api.ChatApi;
import com.lifinity.app.models.Conversation;
import com.lifinity.app.network.ApiClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ConversationsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN  = "token";

    private ProgressBar progressBar;
    private TextView    errorText;
    private TextView    emptyText;
    private RecyclerView recyclerView;
    private ConversationAdapter adapter;

    private Call<List<Conversation>> conversationsCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Redireciona para o login se não houver token guardado
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_conversations);

        progressBar  = findViewById(R.id.conversationsProgressBar);
        errorText    = findViewById(R.id.conversationsErrorText);
        emptyText    = findViewById(R.id.conversationsEmptyText);
        recyclerView = findViewById(R.id.conversationsRecyclerView);

        findViewById(R.id.conversationsBackButton).setOnClickListener(v -> finish());

        adapter = new ConversationAdapter(this::openConversation);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Recarrega ao voltar de uma conversa para reflectir mensagens novas
        if (!TextUtils.isEmpty(getToken())) {
            loadConversations();
        }
    }

    private void loadConversations() {
        if (conversationsCall != null) conversationsCall.cancel();

        showLoading();

        ChatApi api = ApiClient.getClient().create(ChatApi.class);
        conversationsCall = api.getConversations("Bearer " + getToken());
        conversationsCall.enqueue(new Callback<List<Conversation>>() {
            @Override
            public void onResponse(Call<List<Conversation>> call, Response<List<Conversation>> response) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showError("Não foi possível carregar conversas.");
                    return;
                }

                List<Conversation> list = response.body();
                adapter.setConversations(list);
                errorText.setVisibility(View.GONE);

                if (list.isEmpty()) {
                    emptyText.setVisibility(View.VISIBLE);
                    recyclerView.setVisibility(View.GONE);
                } else {
                    emptyText.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Conversation>> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    // Abre o ChatActivity com os dados da conversa seleccionada.
    private void openConversation(Conversation conversation) {
        if (conversation == null || conversation.getIdconversation() == null) return;

        Intent intent = new Intent(this, ChatActivity.class);
        intent.putExtra(ChatActivity.EXTRA_CONVERSATION_ID, conversation.getIdconversation());
        intent.putExtra(ChatActivity.EXTRA_CONVERSATION_NAME,
                conversation.getName() != null ? conversation.getName() : "Conversa");
        startActivity(intent);
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);
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
        if (conversationsCall != null) conversationsCall.cancel();
        super.onDestroy();
    }
}
