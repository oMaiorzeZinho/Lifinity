package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.adapters.AssistantAdapter;
import com.lifinity.app.api.AssistantApi;
import com.lifinity.app.models.AssistantMessage;
import com.lifinity.app.models.AssistantSendRequest;
import com.lifinity.app.models.AssistantSendResponse;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AssistantActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String WELCOME =
            "Olá! Sou o assistente Lifinity. Posso ajudar-te a organizar tarefas, ver a tua "
                    + "produtividade e dar sugestões. Experimenta: \"tarefas pendentes\" ou "
                    + "\"cria tarefa estudar\".";

    private RecyclerView recyclerView;
    private EditText input;
    private Button sendButton;
    private AssistantAdapter adapter;

    private final List<AssistantMessage> messages = new ArrayList<>();
    private Call<List<AssistantMessage>> messagesCall;
    private Call<AssistantSendResponse> sendCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_assistant);

        recyclerView = findViewById(R.id.assistantRecyclerView);
        input = findViewById(R.id.assistantInput);
        sendButton = findViewById(R.id.assistantSendButton);

        findViewById(R.id.assistantBackButton).setOnClickListener(v -> finish());

        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        layoutManager.setStackFromEnd(true);
        recyclerView.setLayoutManager(layoutManager);
        adapter = new AssistantAdapter();
        recyclerView.setAdapter(adapter);

        sendButton.setOnClickListener(v -> send());
        input.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                send();
                return true;
            }
            return false;
        });

        loadMessages();
    }

    private void loadMessages() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        AssistantApi api = ApiClient.getClient().create(AssistantApi.class);
        messagesCall = api.getMessages("Bearer " + token);
        messagesCall.enqueue(new Callback<List<AssistantMessage>>() {
            @Override
            public void onResponse(Call<List<AssistantMessage>> call, Response<List<AssistantMessage>> response) {
                messages.clear();
                if (response.isSuccessful() && response.body() != null) {
                    messages.addAll(response.body());
                }
                if (messages.isEmpty()) {
                    messages.add(new AssistantMessage("assistant", WELCOME));
                }
                adapter.setMessages(messages);
                scrollToBottom();
            }

            @Override
            public void onFailure(Call<List<AssistantMessage>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                messages.clear();
                messages.add(new AssistantMessage("assistant", WELCOME));
                adapter.setMessages(messages);
                scrollToBottom();
            }
        });
    }

    private void send() {
        String content = input.getText().toString().trim();
        if (TextUtils.isEmpty(content)) {
            return;
        }

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        input.setText("");
        sendButton.setEnabled(false);

        messages.add(new AssistantMessage("user", content));
        final AssistantMessage pending = new AssistantMessage("assistant", "A escrever…");
        messages.add(pending);
        adapter.setMessages(messages);
        scrollToBottom();

        AssistantApi api = ApiClient.getClient().create(AssistantApi.class);
        sendCall = api.sendMessage("Bearer " + token, new AssistantSendRequest(content));
        sendCall.enqueue(new Callback<AssistantSendResponse>() {
            @Override
            public void onResponse(Call<AssistantSendResponse> call, Response<AssistantSendResponse> response) {
                sendButton.setEnabled(true);
                String reply = null;
                if (response.isSuccessful() && response.body() != null && response.body().getReply() != null) {
                    reply = response.body().getReply().getContent();
                }
                pending.setContent(TextUtils.isEmpty(reply)
                        ? "Não consegui gerar uma resposta agora. Tenta reformular a mensagem."
                        : reply);
                adapter.setMessages(messages);
                scrollToBottom();
            }

            @Override
            public void onFailure(Call<AssistantSendResponse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                sendButton.setEnabled(true);
                pending.setContent("Não consegui responder agora. Confirma que o backend está ativo e tenta novamente.");
                adapter.setMessages(messages);
                scrollToBottom();
            }
        });
    }

    private void scrollToBottom() {
        if (adapter.getItemCount() > 0) {
            recyclerView.scrollToPosition(adapter.getItemCount() - 1);
        }
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        if (messagesCall != null) {
            messagesCall.cancel();
        }
        if (sendCall != null) {
            sendCall.cancel();
        }
        super.onDestroy();
    }
}
