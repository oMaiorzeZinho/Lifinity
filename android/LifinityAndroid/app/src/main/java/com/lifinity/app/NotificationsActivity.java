package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.JsonObject;
import com.lifinity.app.adapters.NotificationAdapter;
import com.lifinity.app.api.NotificationApi;
import com.lifinity.app.models.Notification;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class NotificationsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private ProgressBar progressBar;
    private TextView emptyText;
    private TextView markAllButton;
    private RecyclerView recyclerView;
    private NotificationAdapter adapter;

    private final List<Notification> notifications = new ArrayList<>();
    private Call<List<Notification>> notificationsCall;
    private Call<JsonObject> markCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_notifications);

        progressBar = findViewById(R.id.notificationsProgressBar);
        emptyText = findViewById(R.id.notificationsEmptyText);
        markAllButton = findViewById(R.id.notificationsMarkAllButton);
        recyclerView = findViewById(R.id.notificationsRecyclerView);

        findViewById(R.id.notificationsBackButton).setOnClickListener(v -> finish());
        markAllButton.setOnClickListener(v -> markAllAsRead());

        adapter = new NotificationAdapter(this::onNotificationClick);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);

        loadNotifications();
    }

    private void loadNotifications() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);

        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        notificationsCall = api.getNotifications("Bearer " + token);
        notificationsCall.enqueue(new Callback<List<Notification>>() {
            @Override
            public void onResponse(Call<List<Notification>> call, Response<List<Notification>> response) {
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showEmpty("Não foi possível carregar notificações.");
                    return;
                }

                notifications.clear();
                notifications.addAll(response.body());
                adapter.setNotifications(notifications);

                if (notifications.isEmpty()) {
                    showEmpty("Ainda não tens notificações.");
                } else {
                    emptyText.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Notification>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                progressBar.setVisibility(View.GONE);
                showEmpty("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    private void onNotificationClick(Notification notification) {
        if (notification == null || notification.getIdnotification() == null || notification.isRead()) {
            return;
        }

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        notification.setRead(true);
        adapter.setNotifications(notifications);

        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        markCall = api.markAsRead("Bearer " + token, notification.getIdnotification());
        markCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                // Estado local ja atualizado; nada mais a fazer.
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                // Silencioso: a marcacao tentara novamente na proxima abertura.
            }
        });
    }

    private void markAllAsRead() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        markCall = api.markAllAsRead("Bearer " + token);
        markCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful()) {
                    for (Notification notification : notifications) {
                        notification.setRead(true);
                    }
                    adapter.setNotifications(notifications);
                    Toast.makeText(NotificationsActivity.this,
                            "Notificações marcadas como lidas.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                Toast.makeText(NotificationsActivity.this,
                        "Não foi possível atualizar agora.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showEmpty(String message) {
        recyclerView.setVisibility(View.GONE);
        emptyText.setText(message);
        emptyText.setVisibility(View.VISIBLE);
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
        if (notificationsCall != null) {
            notificationsCall.cancel();
        }
        if (markCall != null) {
            markCall.cancel();
        }
        super.onDestroy();
    }
}
