package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.adapters.AssistantMessageAdapter;
import com.lifinity.app.api.AssistantApi;
import com.lifinity.app.models.AssistantMessage;
import com.lifinity.app.models.AssistantSendRequest;
import com.lifinity.app.models.AssistantSendResponse;
import com.lifinity.app.network.ApiClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AssistantActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN  = "token";

    // Mensagem de boas-vindas mostrada quando o histórico está vazio.
    private static final String WELCOME =
            "Olá! Sou o assistente Lifinity. Posso ajudar-te a organizar tarefas, ver a tua "
                    + "produtividade e dar sugestões. Experimenta: \"tarefas pendentes\" ou "
                    + "\"cria tarefa estudar\".";

    private RecyclerView recyclerView;
    private EditText     input;
    private Button       sendButton;
    private AssistantMessageAdapter adapter;

    // Calls activos — cancelados em onDestroy para evitar fugas de memória
    private Call<List<AssistantMessage>> historyCall;
    private Call<AssistantSendResponse>  sendCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Redireciona para o login se não houver token guardado
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_assistant);

        recyclerView = findViewById(R.id.assistantRecyclerView);
        input        = findViewById(R.id.assistantInput);
        sendButton   = findViewById(R.id.assistantSendButton);

        findViewById(R.id.assistantBackButton).setOnClickListener(v -> finish());

        // StackFromEnd garante que novas mensagens aparecem na parte inferior.
        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        layoutManager.setStackFromEnd(true);
        recyclerView.setLayoutManager(layoutManager);

        adapter = new AssistantMessageAdapter();
        recyclerView.setAdapter(adapter);

        // Permite enviar com a tecla do teclado (IME action Send)
        input.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                send();
                return true;
            }
            return false;
        });

        sendButton.setOnClickListener(v -> send());

        loadHistory();
    }

    // Carrega o histórico de mensagens da API.
    private void loadHistory() {
        AssistantApi api = ApiClient.getClient().create(AssistantApi.class);
        historyCall = api.getHistory("Bearer " + getToken());
        historyCall.enqueue(new Callback<List<AssistantMessage>>() {
            @Override
            public void onResponse(Call<List<AssistantMessage>> call, Response<List<AssistantMessage>> response) {
                if (call.isCanceled()) return;

                if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                    adapter.setMessages(response.body());
                } else {
                    // Sem histórico — mostra mensagem de boas-vindas
                    adapter.addMessage(new AssistantMessage("assistant", WELCOME));
                }
                scrollToBottom();
            }

            @Override
            public void onFailure(Call<List<AssistantMessage>> call, Throwable t) {
                if (call.isCanceled()) return;
                // Sem ligação — mostra mensagem de boas-vindas
                adapter.addMessage(new AssistantMessage("assistant", WELCOME));
                scrollToBottom();
            }
        });
    }

    // Envia a mensagem do utilizador e aguarda resposta do assistente.
    private void send() {
        String text = input.getText().toString().trim();
        if (TextUtils.isEmpty(text)) return;

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        // Adiciona imediatamente a mensagem do utilizador e limpa o campo
        adapter.addMessage(new AssistantMessage("user", text));
        scrollToBottom();
        input.setText("");
        sendButton.setEnabled(false);

        AssistantApi api = ApiClient.getClient().create(AssistantApi.class);
        sendCall = api.sendMessage("Bearer " + getToken(), new AssistantSendRequest(text));
        sendCall.enqueue(new Callback<AssistantSendResponse>() {
            @Override
            public void onResponse(Call<AssistantSendResponse> call, Response<AssistantSendResponse> response) {
                if (call.isCanceled()) return;
                sendButton.setEnabled(true);

                AssistantMessage assistantMsg = response.isSuccessful() && response.body() != null
                        ? response.body().getAssistantMessage()
                        : null;

                if (assistantMsg != null && !TextUtils.isEmpty(assistantMsg.getContent())) {
                    adapter.addMessage(assistantMsg);
                } else {
                    // Resposta vazia ou erro HTTP — mostra mensagem de fallback
                    adapter.addMessage(new AssistantMessage("assistant",
                            "Não consegui gerar uma resposta. Tenta reformular a mensagem."));
                }
                scrollToBottom();
            }

            @Override
            public void onFailure(Call<AssistantSendResponse> call, Throwable t) {
                if (call.isCanceled()) return;
                sendButton.setEnabled(true);
                Toast.makeText(AssistantActivity.this,
                        "Não foi possível enviar a mensagem.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void scrollToBottom() {
        int count = adapter.getItemCount();
        if (count > 0) {
            recyclerView.scrollToPosition(count - 1);
        }
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
        if (historyCall != null) historyCall.cancel();
        if (sendCall != null)    sendCall.cancel();
        super.onDestroy();
    }
}
