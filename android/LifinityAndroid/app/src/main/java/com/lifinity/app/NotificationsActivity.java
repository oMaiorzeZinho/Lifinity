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
import com.lifinity.app.models.AppNotification;
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
    private TextView errorText;
    private TextView emptyText;
    private TextView markAllButton;
    private RecyclerView recyclerView;
    private NotificationAdapter adapter;

    // Lista local para actualizações sem recarga completa
    private final List<AppNotification> notifications = new ArrayList<>();

    // Calls activos — cancelados em onDestroy para evitar fugas de memória
    private Call<List<AppNotification>> notificationsCall;
    private Call<JsonObject> markCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Redireciona para o login se não houver token guardado
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_notifications);

        progressBar   = findViewById(R.id.notificationsProgressBar);
        errorText     = findViewById(R.id.notificationsErrorText);
        emptyText     = findViewById(R.id.notificationsEmptyText);
        markAllButton = findViewById(R.id.notificationsMarkAllButton);
        recyclerView  = findViewById(R.id.notificationsRecyclerView);

        findViewById(R.id.notificationsBackButton).setOnClickListener(v -> finish());
        markAllButton.setOnClickListener(v -> markAllAsRead());

        adapter = new NotificationAdapter(this::onNotificationClick);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Recarrega sempre que o ecrã fica visível (inclui a primeira abertura)
        if (!TextUtils.isEmpty(getToken())) {
            loadNotifications();
        }
    }

    private void loadNotifications() {
        showLoading();

        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        notificationsCall = api.getNotifications("Bearer " + getToken());
        notificationsCall.enqueue(new Callback<List<AppNotification>>() {
            @Override
            public void onResponse(Call<List<AppNotification>> call, Response<List<AppNotification>> response) {
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showError("Não foi possível carregar notificações.");
                    return;
                }

                notifications.clear();
                notifications.addAll(response.body());
                adapter.setNotifications(notifications);

                errorText.setVisibility(View.GONE);

                if (notifications.isEmpty()) {
                    emptyText.setVisibility(View.VISIBLE);
                    recyclerView.setVisibility(View.GONE);
                } else {
                    emptyText.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<AppNotification>> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    // Chamado ao clicar numa notificação: marca como lida sem recarregar a lista inteira.
    private void onNotificationClick(AppNotification notification) {
        if (notification == null || notification.getIdnotification() == null) return;

        // Actualiza estado local imediatamente para feedback visual instantâneo
        notification.markAsRead();
        adapter.setNotifications(notifications);

        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        markCall = api.readOne("Bearer " + getToken(), notification.getIdnotification());
        markCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                // Estado local já actualizado; nada mais a fazer.
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                // Silencioso: a marcação repetir-se-á na próxima abertura.
            }
        });
    }

    private void markAllAsRead() {
        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        markCall = api.readAll("Bearer " + getToken());
        markCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (!response.isSuccessful()) return;

                for (AppNotification n : notifications) {
                    n.markAsRead();
                }
                adapter.setNotifications(notifications);
                Toast.makeText(NotificationsActivity.this,
                        "Notificações marcadas como lidas.", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(NotificationsActivity.this,
                        "Não foi possível atualizar agora.", Toast.LENGTH_SHORT).show();
            }
        });
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
        if (notificationsCall != null) notificationsCall.cancel();
        if (markCall != null) markCall.cancel();
        super.onDestroy();
    }
}
