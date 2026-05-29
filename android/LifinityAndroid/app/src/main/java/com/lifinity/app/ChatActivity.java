package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.lifinity.app.adapters.ChatMessageAdapter;
import com.lifinity.app.api.ChatApi;
import com.lifinity.app.models.ChatMessage;
import com.lifinity.app.models.SendChatMessageRequest;
import com.lifinity.app.models.User;
import com.lifinity.app.network.ApiClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChatActivity extends AppCompatActivity {
    public static final String EXTRA_CONVERSATION_ID   = "conversation_id";
    public static final String EXTRA_CONVERSATION_NAME = "conversation_name";

    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN  = "token";
    private static final String KEY_USER   = "user";

    private int  conversationId;
    private int  currentUserId;

    private RecyclerView         recyclerView;
    private EditText             input;
    private Button               sendButton;
    private ChatMessageAdapter   adapter;

    private Call<List<ChatMessage>> messagesCall;
    private Call<ChatMessage>       sendCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Redireciona para o login se não houver token guardado
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_chat);

        // Lê os extras do Intent
        conversationId = getIntent().getIntExtra(EXTRA_CONVERSATION_ID, -1);
        String conversationName = getIntent().getStringExtra(EXTRA_CONVERSATION_NAME);

        // Lê o ID do utilizador autenticado a partir das SharedPreferences
        currentUserId = getSavedUserId();

        // Define o título com o nome da conversa
        TextView titleText = findViewById(R.id.chatTitleText);
        titleText.setText(!TextUtils.isEmpty(conversationName) ? conversationName : "Conversa");

        recyclerView = findViewById(R.id.chatRecyclerView);
        input        = findViewById(R.id.chatInput);
        sendButton   = findViewById(R.id.chatSendButton);

        findViewById(R.id.chatBackButton).setOnClickListener(v -> finish());

        // StackFromEnd garante que as mensagens mais recentes ficam no fundo
        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        layoutManager.setStackFromEnd(true);
        recyclerView.setLayoutManager(layoutManager);

        adapter = new ChatMessageAdapter(currentUserId);
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

        if (conversationId != -1) {
            loadMessages();
        }
    }

    // Carrega o histórico de mensagens da conversa.
    private void loadMessages() {
        ChatApi api = ApiClient.getClient().create(ChatApi.class);
        messagesCall = api.getMessages("Bearer " + getToken(), conversationId);
        messagesCall.enqueue(new Callback<List<ChatMessage>>() {
            @Override
            public void onResponse(Call<List<ChatMessage>> call, Response<List<ChatMessage>> response) {
                if (call.isCanceled()) return;
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setMessages(response.body());
                    scrollToBottom();
                }
            }

            @Override
            public void onFailure(Call<List<ChatMessage>> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(ChatActivity.this,
                        "Não foi possível carregar as mensagens.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Envia a mensagem e adiciona-a optimisticamente ao adapter.
    private void send() {
        String text = input.getText().toString().trim();
        if (TextUtils.isEmpty(text)) return;

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        // Adiciona imediatamente a mensagem do utilizador (envio optimista)
        adapter.addMessage(new ChatMessage(currentUserId, text));
        scrollToBottom();
        input.setText("");
        sendButton.setEnabled(false);

        ChatApi api = ApiClient.getClient().create(ChatApi.class);
        sendCall = api.sendMessage("Bearer " + getToken(), conversationId,
                new SendChatMessageRequest(text));
        sendCall.enqueue(new Callback<ChatMessage>() {
            @Override
            public void onResponse(Call<ChatMessage> call, Response<ChatMessage> response) {
                if (call.isCanceled()) return;
                sendButton.setEnabled(true);
                // A mensagem já foi adicionada optimisticamente — nada mais a fazer.
            }

            @Override
            public void onFailure(Call<ChatMessage> call, Throwable t) {
                if (call.isCanceled()) return;
                sendButton.setEnabled(true);
                Toast.makeText(ChatActivity.this,
                        "Não foi possível enviar a mensagem.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void scrollToBottom() {
        int count = adapter.getItemCount();
        if (count > 0) recyclerView.scrollToPosition(count - 1);
    }

    // Lê o iduser do utilizador guardado nas SharedPreferences; devolve 0 se não encontrar.
    private int getSavedUserId() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String json = prefs.getString(KEY_USER, null);
        if (TextUtils.isEmpty(json)) return 0;
        try {
            User user = new Gson().fromJson(json, User.class);
            return user != null && user.getIduser() != null ? user.getIduser() : 0;
        } catch (Exception e) {
            return 0;
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
        if (messagesCall != null) messagesCall.cancel();
        if (sendCall != null)     sendCall.cancel();
        super.onDestroy();
    }
}
