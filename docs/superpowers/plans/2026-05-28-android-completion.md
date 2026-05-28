# Android Completion — Ranking, Notificações, Estatísticas, Assistente, Chat

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 5 ecrãs em falta na app Android Lifinity (Ranking, Notificações, Estatísticas, Assistente IA, Chat) e atualizar o MainActivity para os expor todos.

**Architecture:** O projeto usa Java puro com Activities tradicionais (sem Kotlin/Compose), Retrofit 2 para API, Gson para JSON, e Material Design com tema clay personalizado. Cada novo ecrã segue o padrão: Model → API Interface → Adapter (se RecyclerView) → Layout XML → Activity.

**Tech Stack:** Java 11, Retrofit 2.11, OkHttp, Gson, AndroidX RecyclerView, ConstraintLayout, Material Design, tema clay (drawables existentes: `bg_app_clay`, `bg_card_clay`, `btn_primary_clay`, `btn_secondary_clay`, `btn_danger_clay`)

**Caminhos base:**
- Java: `android/LifinityAndroid/app/src/main/java/com/lifinity/app/`
- Layouts: `android/LifinityAndroid/app/src/main/res/layout/`
- Manifesto: `android/LifinityAndroid/app/src/main/AndroidManifest.xml`

---

## Contexto de API (Backend em http://10.0.2.2:3000/api/)

| Endpoint | Método | Descrição |
|---|---|---|
| `/users/ranking` | GET | Top 10 utilizadores por XP |
| `/notifications` | GET | Lista de notificações (máx 20) |
| `/notifications/unread-count` | GET | Contagem de não lidas |
| `/notifications/:id/read` | PUT | Marcar uma como lida |
| `/notifications/read-all` | PUT | Marcar todas como lidas |
| `/statistics/me?period=30d` | GET | Estatísticas pessoais (7d, 30d, 1y) |
| `/assistant/messages` | GET | Histórico de mensagens com assistente |
| `/assistant/messages` | POST | Enviar mensagem ao assistente |
| `/chat/conversations` | GET | Lista de conversas |
| `/chat/conversations/:id/messages` | GET | Mensagens de uma conversa |
| `/chat/conversations/:id/messages` | POST | Enviar mensagem numa conversa |

---

## Task 1: Ecrã de Ranking

**Files:**
- Create: `java/com/lifinity/app/models/RankingUser.java`
- Create: `java/com/lifinity/app/api/UserApi.java`
- Create: `java/com/lifinity/app/adapters/RankingAdapter.java`
- Create: `res/layout/activity_ranking.xml`
- Create: `res/layout/item_ranking.xml`
- Create: `java/com/lifinity/app/RankingActivity.java`

### 1.1 — Criar o modelo RankingUser

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/RankingUser.java`:

```java
package com.lifinity.app.models;

public class RankingUser {
    private Integer iduser;
    private String username;
    private Integer xp;
    private Integer level;

    public Integer getIduser() { return iduser; }
    public String getUsername() { return username; }
    public Integer getXp() { return xp; }
    public Integer getLevel() { return level; }
}
```

### 1.2 — Criar a interface UserApi

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/api/UserApi.java`:

```java
package com.lifinity.app.api;

import com.lifinity.app.models.RankingUser;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;

public interface UserApi {
    @GET("users/ranking")
    Call<List<RankingUser>> getRanking(@Header("Authorization") String token);
}
```

### 1.3 — Criar o layout do item de ranking

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_ranking.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="12dp"
    android:background="@drawable/bg_card_clay"
    android:elevation="8dp"
    android:orientation="horizontal"
    android:padding="16dp"
    android:gravity="center_vertical">

    <TextView
        android:id="@+id/rankPositionText"
        android:layout_width="48dp"
        android:layout_height="48dp"
        android:gravity="center"
        android:textColor="@color/lifinity_primary"
        android:textSize="22sp"
        android:textStyle="bold" />

    <LinearLayout
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginStart="12dp"
        android:layout_weight="1"
        android:orientation="vertical">

        <TextView
            android:id="@+id/rankUsernameText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="@color/lifinity_text"
            android:textSize="16sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/rankLevelText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:textColor="@color/lifinity_text_secondary"
            android:textSize="13sp" />
    </LinearLayout>

    <TextView
        android:id="@+id/rankXpText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textColor="@color/lifinity_primary"
        android:textSize="14sp"
        android:textStyle="bold" />
</LinearLayout>
```

### 1.4 — Criar o RankingAdapter

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/adapters/RankingAdapter.java`:

```java
package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.R;
import com.lifinity.app.models.RankingUser;
import java.util.List;

public class RankingAdapter extends RecyclerView.Adapter<RankingAdapter.ViewHolder> {
    private final List<RankingUser> users;

    public RankingAdapter(List<RankingUser> users) {
        this.users = users;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_ranking, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        RankingUser user = users.get(position);
        int rank = position + 1;
        String medal = rank == 1 ? "🥇" : rank == 2 ? "🥈" : rank == 3 ? "🥉" : String.valueOf(rank);
        holder.positionText.setText(medal);
        holder.usernameText.setText(user.getUsername());
        holder.levelText.setText("Nível " + (user.getLevel() != null ? user.getLevel() : 1));
        holder.xpText.setText(user.getXp() + " XP");
    }

    @Override
    public int getItemCount() { return users.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView positionText, usernameText, levelText, xpText;
        ViewHolder(View view) {
            super(view);
            positionText = view.findViewById(R.id.rankPositionText);
            usernameText = view.findViewById(R.id.rankUsernameText);
            levelText = view.findViewById(R.id.rankLevelText);
            xpText = view.findViewById(R.id.rankXpText);
        }
    }
}
```

### 1.5 — Criar o layout do ecrã de ranking

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_ranking.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:orientation="vertical"
    android:padding="@dimen/space_screen">

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="20dp"
        android:gravity="center"
        android:text="Ranking"
        android:textColor="@color/lifinity_text"
        android:textSize="26sp"
        android:textStyle="bold" />

    <ProgressBar
        android:id="@+id/rankingProgressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone" />

    <TextView
        android:id="@+id/rankingErrorText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:textColor="@color/lifinity_danger"
        android:textSize="15sp"
        android:visibility="gone" />

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/rankingRecyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:visibility="gone" />
</LinearLayout>
```

### 1.6 — Criar RankingActivity

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/RankingActivity.java`:

```java
package com.lifinity.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.adapters.RankingAdapter;
import com.lifinity.app.api.UserApi;
import com.lifinity.app.models.RankingUser;
import com.lifinity.app.network.ApiClient;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RankingActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private ProgressBar progressBar;
    private TextView errorText;
    private RecyclerView recyclerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ranking);

        progressBar = findViewById(R.id.rankingProgressBar);
        errorText = findViewById(R.id.rankingErrorText);
        recyclerView = findViewById(R.id.rankingRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        loadRanking();
    }

    private void loadRanking() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);

        String token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");

        ApiClient.getClient().create(UserApi.class)
                .getRanking(token)
                .enqueue(new Callback<List<RankingUser>>() {
                    @Override
                    public void onResponse(Call<List<RankingUser>> call, Response<List<RankingUser>> response) {
                        progressBar.setVisibility(View.GONE);
                        if (response.isSuccessful() && response.body() != null) {
                            recyclerView.setAdapter(new RankingAdapter(response.body()));
                            recyclerView.setVisibility(View.VISIBLE);
                        } else {
                            showError("Erro ao carregar o ranking.");
                        }
                    }

                    @Override
                    public void onFailure(Call<List<RankingUser>> call, Throwable t) {
                        progressBar.setVisibility(View.GONE);
                        showError("Sem ligação ao servidor.");
                    }
                });
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }
}
```

### 1.7 — Registar no AndroidManifest.xml

- [ ] Adicionar dentro de `<application>` em `AndroidManifest.xml`:

```xml
<activity
    android:name=".RankingActivity"
    android:exported="false" />
```

---

## Task 2: Ecrã de Notificações

**Files:**
- Create: `java/com/lifinity/app/models/AppNotification.java`
- Create: `java/com/lifinity/app/api/NotificationApi.java`
- Create: `java/com/lifinity/app/adapters/NotificationAdapter.java`
- Create: `res/layout/activity_notifications.xml`
- Create: `res/layout/item_notification.xml`
- Create: `java/com/lifinity/app/NotificationsActivity.java`

### 2.1 — Criar o modelo AppNotification

> Nota: O nome é `AppNotification` para evitar conflito com `android.app.Notification` do sistema Android.

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/AppNotification.java`:

```java
package com.lifinity.app.models;

public class AppNotification {
    private Integer idnotification;
    private Integer iduser;
    private String type;
    private String message;
    private String entity_type;
    private Integer entity_id;
    private String link;
    private Boolean is_read;
    private String created_at;

    public Integer getIdnotification() { return idnotification; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public Boolean getIsRead() { return is_read; }
    public String getCreatedAt() { return created_at; }
    public boolean isRead() { return Boolean.TRUE.equals(is_read); }
}
```

### 2.2 — Criar NotificationApi

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/api/NotificationApi.java`:

```java
package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.AppNotification;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface NotificationApi {
    @GET("notifications")
    Call<List<AppNotification>> getNotifications(@Header("Authorization") String token);

    @PUT("notifications/{id}/read")
    Call<JsonObject> markAsRead(
            @Header("Authorization") String token,
            @Path("id") int idnotification
    );

    @PUT("notifications/read-all")
    Call<JsonObject> markAllAsRead(@Header("Authorization") String token);
}
```

### 2.3 — Criar layout do item de notificação

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_notification.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/notificationCard"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="12dp"
    android:background="@drawable/bg_card_clay"
    android:elevation="8dp"
    android:orientation="vertical"
    android:padding="16dp">

    <TextView
        android:id="@+id/notificationMessageText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:textColor="@color/lifinity_text"
        android:textSize="15sp" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:orientation="horizontal">

        <TextView
            android:id="@+id/notificationDateText"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:textColor="@color/lifinity_text_secondary"
            android:textSize="12sp" />

        <TextView
            android:id="@+id/notificationStatusText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textSize="12sp"
            android:textStyle="bold" />
    </LinearLayout>
</LinearLayout>
```

### 2.4 — Criar NotificationAdapter

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/adapters/NotificationAdapter.java`:

```java
package com.lifinity.app.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.R;
import com.lifinity.app.models.AppNotification;
import java.util.List;

public class NotificationAdapter extends RecyclerView.Adapter<NotificationAdapter.ViewHolder> {
    public interface OnNotificationClickListener {
        void onNotificationClick(AppNotification notification, int position);
    }

    private final List<AppNotification> notifications;
    private final OnNotificationClickListener listener;

    public NotificationAdapter(List<AppNotification> notifications, OnNotificationClickListener listener) {
        this.notifications = notifications;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_notification, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        AppNotification n = notifications.get(position);
        holder.messageText.setText(n.getMessage());
        holder.dateText.setText(n.getCreatedAt() != null ? n.getCreatedAt().substring(0, 10) : "");

        if (n.isRead()) {
            holder.statusText.setText("Lida");
            holder.statusText.setTextColor(Color.parseColor("#888888"));
            holder.card.setAlpha(0.7f);
        } else {
            holder.statusText.setText("• Nova");
            holder.statusText.setTextColor(Color.parseColor("#7C6FE0"));
            holder.card.setAlpha(1.0f);
        }

        holder.card.setOnClickListener(v -> listener.onNotificationClick(n, position));
    }

    @Override
    public int getItemCount() { return notifications.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final LinearLayout card;
        final TextView messageText, dateText, statusText;
        ViewHolder(View view) {
            super(view);
            card = view.findViewById(R.id.notificationCard);
            messageText = view.findViewById(R.id.notificationMessageText);
            dateText = view.findViewById(R.id.notificationDateText);
            statusText = view.findViewById(R.id.notificationStatusText);
        }
    }
}
```

### 2.5 — Criar layout do ecrã de notificações

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_notifications.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:orientation="vertical"
    android:padding="@dimen/space_screen">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="16dp"
        android:gravity="center_vertical"
        android:orientation="horizontal">

        <TextView
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:text="Notificações"
            android:textColor="@color/lifinity_text"
            android:textSize="26sp"
            android:textStyle="bold" />

        <Button
            android:id="@+id/markAllReadButton"
            android:layout_width="wrap_content"
            android:layout_height="40dp"
            android:background="@drawable/btn_secondary_clay"
            android:elevation="4dp"
            android:text="Marcar todas"
            android:textAllCaps="false"
            android:textColor="@color/lifinity_text"
            android:textSize="13sp" />
    </LinearLayout>

    <ProgressBar
        android:id="@+id/notificationsProgressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone" />

    <TextView
        android:id="@+id/notificationsErrorText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:textColor="@color/lifinity_danger"
        android:textSize="15sp"
        android:visibility="gone" />

    <TextView
        android:id="@+id/notificationsEmptyText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:text="Sem notificações."
        android:textColor="@color/lifinity_text_secondary"
        android:textSize="15sp"
        android:visibility="gone" />

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/notificationsRecyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:visibility="gone" />
</LinearLayout>
```

### 2.6 — Criar NotificationsActivity

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/NotificationsActivity.java`:

```java
package com.lifinity.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
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
    private TextView errorText, emptyText;
    private RecyclerView recyclerView;
    private Button markAllReadButton;
    private final List<AppNotification> notifications = new ArrayList<>();
    private NotificationAdapter adapter;
    private NotificationApi api;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_notifications);

        progressBar = findViewById(R.id.notificationsProgressBar);
        errorText = findViewById(R.id.notificationsErrorText);
        emptyText = findViewById(R.id.notificationsEmptyText);
        recyclerView = findViewById(R.id.notificationsRecyclerView);
        markAllReadButton = findViewById(R.id.markAllReadButton);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new NotificationAdapter(notifications, this::onNotificationClick);
        recyclerView.setAdapter(adapter);

        token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");
        api = ApiClient.getClient().create(NotificationApi.class);

        markAllReadButton.setOnClickListener(v -> markAllAsRead());

        loadNotifications();
    }

    private void loadNotifications() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);

        api.getNotifications(token).enqueue(new Callback<List<AppNotification>>() {
            @Override
            public void onResponse(Call<List<AppNotification>> call, Response<List<AppNotification>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    notifications.clear();
                    notifications.addAll(response.body());
                    adapter.notifyDataSetChanged();
                    if (notifications.isEmpty()) {
                        emptyText.setVisibility(View.VISIBLE);
                    } else {
                        recyclerView.setVisibility(View.VISIBLE);
                    }
                } else {
                    showError("Erro ao carregar notificações.");
                }
            }

            @Override
            public void onFailure(Call<List<AppNotification>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor.");
            }
        });
    }

    private void onNotificationClick(AppNotification notification, int position) {
        if (notification.isRead()) return;

        api.markAsRead(token, notification.getIdnotification()).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful()) {
                    notifications.set(position, notification);
                    adapter.notifyItemChanged(position);
                    // Recarga para reflectir o novo estado
                    loadNotifications();
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Toast.makeText(NotificationsActivity.this, "Erro de rede.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void markAllAsRead() {
        api.markAllAsRead(token).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(NotificationsActivity.this, "Todas marcadas como lidas.", Toast.LENGTH_SHORT).show();
                    loadNotifications();
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Toast.makeText(NotificationsActivity.this, "Erro de rede.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }
}
```

### 2.7 — Registar no AndroidManifest.xml

- [ ] Adicionar dentro de `<application>`:

```xml
<activity
    android:name=".NotificationsActivity"
    android:exported="false" />
```

---

## Task 3: Ecrã de Estatísticas

**Files:**
- Create: `java/com/lifinity/app/models/StatisticsSummary.java`
- Create: `java/com/lifinity/app/models/StatisticsResponse.java`
- Create: `java/com/lifinity/app/api/StatisticsApi.java`
- Create: `res/layout/activity_statistics.xml`
- Create: `java/com/lifinity/app/StatisticsActivity.java`

### 3.1 — Criar modelos de estatísticas

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/StatisticsSummary.java`:

```java
package com.lifinity.app.models;

public class StatisticsSummary {
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer pendingTasks;
    private Integer lostTasks;
    private Integer totalXP;
    private Double completionRate;
    private Double productivityScore;

    public int getTotalTasks() { return totalTasks != null ? totalTasks : 0; }
    public int getCompletedTasks() { return completedTasks != null ? completedTasks : 0; }
    public int getPendingTasks() { return pendingTasks != null ? pendingTasks : 0; }
    public int getLostTasks() { return lostTasks != null ? lostTasks : 0; }
    public int getTotalXP() { return totalXP != null ? totalXP : 0; }
    public double getCompletionRate() { return completionRate != null ? completionRate : 0.0; }
    public double getProductivityScore() { return productivityScore != null ? productivityScore : 0.0; }
}
```

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/StatisticsResponse.java`:

```java
package com.lifinity.app.models;

public class StatisticsResponse {
    private String period;
    private StatisticsSummary summary;

    public String getPeriod() { return period; }
    public StatisticsSummary getSummary() { return summary; }
}
```

### 3.2 — Criar StatisticsApi

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/api/StatisticsApi.java`:

```java
package com.lifinity.app.api;

import com.lifinity.app.models.StatisticsResponse;
import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.Query;

public interface StatisticsApi {
    @GET("statistics/me")
    Call<StatisticsResponse> getMyStatistics(
            @Header("Authorization") String token,
            @Query("period") String period
    );
}
```

### 3.3 — Criar layout do ecrã de estatísticas

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_statistics.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:fillViewport="true">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="@dimen/space_screen">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginBottom="16dp"
            android:gravity="center_vertical"
            android:orientation="horizontal">

            <TextView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_weight="1"
                android:text="Estatísticas"
                android:textColor="@color/lifinity_text"
                android:textSize="26sp"
                android:textStyle="bold" />

            <Spinner
                android:id="@+id/periodSpinner"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content" />
        </LinearLayout>

        <ProgressBar
            android:id="@+id/statsProgressBar"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center"
            android:visibility="gone" />

        <TextView
            android:id="@+id/statsErrorText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:gravity="center"
            android:textColor="@color/lifinity_danger"
            android:textSize="15sp"
            android:visibility="gone" />

        <!-- Card resumo -->
        <LinearLayout
            android:id="@+id/statsContentLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:background="@drawable/bg_card_clay"
            android:elevation="10dp"
            android:orientation="vertical"
            android:padding="20dp"
            android:visibility="gone">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="16dp"
                android:text="Resumo"
                android:textColor="@color/lifinity_primary"
                android:textSize="18sp"
                android:textStyle="bold" />

            <TextView
                android:id="@+id/statsTotalTasksText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="8dp"
                android:textColor="@color/lifinity_text"
                android:textSize="15sp" />

            <TextView
                android:id="@+id/statsCompletedText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="8dp"
                android:textColor="@color/lifinity_text"
                android:textSize="15sp" />

            <TextView
                android:id="@+id/statsPendingText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="8dp"
                android:textColor="@color/lifinity_text"
                android:textSize="15sp" />

            <TextView
                android:id="@+id/statsLostText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="8dp"
                android:textColor="@color/lifinity_text"
                android:textSize="15sp" />

            <TextView
                android:id="@+id/statsXpText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="8dp"
                android:textColor="@color/lifinity_text"
                android:textSize="15sp" />

            <!-- Barra de taxa de conclusão -->
            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="8dp"
                android:text="Taxa de conclusão"
                android:textColor="@color/lifinity_text_secondary"
                android:textSize="13sp" />

            <ProgressBar
                android:id="@+id/completionRateBar"
                style="?android:attr/progressBarStyleHorizontal"
                android:layout_width="match_parent"
                android:layout_height="16dp"
                android:layout_marginTop="6dp"
                android:max="100"
                android:progress="0" />

            <TextView
                android:id="@+id/completionRateText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="4dp"
                android:gravity="end"
                android:textColor="@color/lifinity_primary"
                android:textSize="13sp"
                android:textStyle="bold" />

            <!-- Barra de score de produtividade -->
            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp"
                android:text="Score de produtividade"
                android:textColor="@color/lifinity_text_secondary"
                android:textSize="13sp" />

            <ProgressBar
                android:id="@+id/productivityScoreBar"
                style="?android:attr/progressBarStyleHorizontal"
                android:layout_width="match_parent"
                android:layout_height="16dp"
                android:layout_marginTop="6dp"
                android:max="100"
                android:progress="0" />

            <TextView
                android:id="@+id/productivityScoreText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="4dp"
                android:gravity="end"
                android:textColor="@color/lifinity_primary"
                android:textSize="13sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>
</ScrollView>
```

### 3.4 — Criar StatisticsActivity

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/StatisticsActivity.java`:

```java
package com.lifinity.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.lifinity.app.api.StatisticsApi;
import com.lifinity.app.models.StatisticsResponse;
import com.lifinity.app.models.StatisticsSummary;
import com.lifinity.app.network.ApiClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatisticsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private ProgressBar progressBar;
    private TextView errorText;
    private LinearLayout contentLayout;
    private TextView totalTasksText, completedText, pendingText, lostText, xpText;
    private ProgressBar completionRateBar, productivityScoreBar;
    private TextView completionRateText, productivityScoreText;
    private Spinner periodSpinner;
    private StatisticsApi api;
    private String token;
    private final String[] periods = {"30d", "7d", "1y"};
    private final String[] periodLabels = {"Últimos 30 dias", "Últimos 7 dias", "Último ano"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_statistics);

        progressBar = findViewById(R.id.statsProgressBar);
        errorText = findViewById(R.id.statsErrorText);
        contentLayout = findViewById(R.id.statsContentLayout);
        totalTasksText = findViewById(R.id.statsTotalTasksText);
        completedText = findViewById(R.id.statsCompletedText);
        pendingText = findViewById(R.id.statsPendingText);
        lostText = findViewById(R.id.statsLostText);
        xpText = findViewById(R.id.statsXpText);
        completionRateBar = findViewById(R.id.completionRateBar);
        completionRateText = findViewById(R.id.completionRateText);
        productivityScoreBar = findViewById(R.id.productivityScoreBar);
        productivityScoreText = findViewById(R.id.productivityScoreText);
        periodSpinner = findViewById(R.id.periodSpinner);

        token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");
        api = ApiClient.getClient().create(StatisticsApi.class);

        ArrayAdapter<String> spinnerAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_item, periodLabels);
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        periodSpinner.setAdapter(spinnerAdapter);
        periodSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                loadStatistics(periods[position]);
            }
            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void loadStatistics(String period) {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        contentLayout.setVisibility(View.GONE);

        api.getMyStatistics(token, period).enqueue(new Callback<StatisticsResponse>() {
            @Override
            public void onResponse(Call<StatisticsResponse> call, Response<StatisticsResponse> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    showStatistics(response.body().getSummary());
                } else {
                    showError("Erro ao carregar estatísticas.");
                }
            }

            @Override
            public void onFailure(Call<StatisticsResponse> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor.");
            }
        });
    }

    private void showStatistics(StatisticsSummary s) {
        totalTasksText.setText("Tarefas criadas: " + s.getTotalTasks());
        completedText.setText("Concluídas: " + s.getCompletedTasks());
        pendingText.setText("Pendentes: " + s.getPendingTasks());
        lostText.setText("Perdidas: " + s.getLostTasks());
        xpText.setText("XP ganho: " + s.getTotalXP());

        int rate = (int) s.getCompletionRate();
        completionRateBar.setProgress(rate);
        completionRateText.setText(rate + "%");

        int score = (int) s.getProductivityScore();
        productivityScoreBar.setProgress(Math.min(score, 100));
        productivityScoreText.setText(score + " pts");

        contentLayout.setVisibility(View.VISIBLE);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }
}
```

### 3.5 — Registar no AndroidManifest.xml

- [ ] Adicionar dentro de `<application>`:

```xml
<activity
    android:name=".StatisticsActivity"
    android:exported="false" />
```

---

## Task 4: Ecrã do Assistente IA

**Files:**
- Create: `java/com/lifinity/app/models/AssistantMessage.java`
- Create: `java/com/lifinity/app/models/SendMessageRequest.java`
- Create: `java/com/lifinity/app/models/AssistantSendResponse.java`
- Create: `java/com/lifinity/app/api/AssistantApi.java`
- Create: `java/com/lifinity/app/adapters/AssistantMessageAdapter.java`
- Create: `res/layout/activity_assistant.xml`
- Create: `res/layout/item_message_user.xml`
- Create: `res/layout/item_message_assistant.xml`
- Create: `java/com/lifinity/app/AssistantActivity.java`

### 4.1 — Criar modelos do assistente

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/AssistantMessage.java`:

```java
package com.lifinity.app.models;

public class AssistantMessage {
    private Integer idmessage;
    private Integer iduser;
    private String sender;  // "user" ou "assistant"
    private String content;
    private String action_type;
    private String created_at;

    public Integer getIdmessage() { return idmessage; }
    public String getSender() { return sender; }
    public String getContent() { return content; }
    public String getCreatedAt() { return created_at; }
    public boolean isFromUser() { return "user".equals(sender); }
}
```

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/SendMessageRequest.java`:

```java
package com.lifinity.app.models;

public class SendMessageRequest {
    private final String content;
    public SendMessageRequest(String content) { this.content = content; }
    public String getContent() { return content; }
}
```

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/AssistantSendResponse.java`:

```java
package com.lifinity.app.models;

import java.util.List;

public class AssistantSendResponse {
    private AssistantMessage reply;
    private List<AssistantMessage> messages;
    private String action_type;

    public AssistantMessage getReply() { return reply; }
    public List<AssistantMessage> getMessages() { return messages; }
    public String getActionType() { return action_type; }
}
```

### 4.2 — Criar AssistantApi

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/api/AssistantApi.java`:

```java
package com.lifinity.app.api;

import com.lifinity.app.models.AssistantMessage;
import com.lifinity.app.models.AssistantSendResponse;
import com.lifinity.app.models.SendMessageRequest;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;

public interface AssistantApi {
    @GET("assistant/messages")
    Call<List<AssistantMessage>> getMessages(@Header("Authorization") String token);

    @POST("assistant/messages")
    Call<AssistantSendResponse> sendMessage(
            @Header("Authorization") String token,
            @Body SendMessageRequest body
    );
}
```

### 4.3 — Criar layouts de mensagens

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_message_user.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="8dp"
    android:gravity="end"
    android:orientation="horizontal"
    android:paddingStart="48dp">

    <TextView
        android:id="@+id/messageText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/btn_primary_clay"
        android:elevation="4dp"
        android:padding="12dp"
        android:textColor="@color/lifinity_text_on_primary"
        android:textSize="15sp" />
</LinearLayout>
```

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_message_assistant.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="8dp"
    android:gravity="start"
    android:orientation="horizontal"
    android:paddingEnd="48dp">

    <TextView
        android:id="@+id/messageText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_card_clay"
        android:elevation="4dp"
        android:padding="12dp"
        android:textColor="@color/lifinity_text"
        android:textSize="15sp" />
</LinearLayout>
```

### 4.4 — Criar AssistantMessageAdapter

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/adapters/AssistantMessageAdapter.java`:

```java
package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.R;
import com.lifinity.app.models.AssistantMessage;
import java.util.List;

public class AssistantMessageAdapter extends RecyclerView.Adapter<AssistantMessageAdapter.ViewHolder> {
    private static final int TYPE_USER = 0;
    private static final int TYPE_ASSISTANT = 1;

    private final List<AssistantMessage> messages;

    public AssistantMessageAdapter(List<AssistantMessage> messages) {
        this.messages = messages;
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isFromUser() ? TYPE_USER : TYPE_ASSISTANT;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layout = viewType == TYPE_USER
                ? R.layout.item_message_user
                : R.layout.item_message_assistant;
        View view = LayoutInflater.from(parent.getContext()).inflate(layout, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.messageText.setText(messages.get(position).getContent());
    }

    @Override
    public int getItemCount() { return messages.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView messageText;
        ViewHolder(View view) {
            super(view);
            messageText = view.findViewById(R.id.messageText);
        }
    }
}
```

### 4.5 — Criar layout do ecrã do assistente

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_assistant.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:orientation="vertical">

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_card_clay"
        android:elevation="8dp"
        android:gravity="center"
        android:padding="16dp"
        android:text="Assistente Lifinity"
        android:textColor="@color/lifinity_text"
        android:textSize="20sp"
        android:textStyle="bold" />

    <ProgressBar
        android:id="@+id/assistantProgressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone" />

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/messagesRecyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:padding="@dimen/space_screen" />

    <!-- Área de input -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_card_clay"
        android:elevation="12dp"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:padding="12dp">

        <EditText
            android:id="@+id/messageInput"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:background="@drawable/bg_input_clay"
            android:hint="Escreve uma mensagem..."
            android:inputType="textMultiLine"
            android:maxLines="3"
            android:padding="12dp"
            android:textSize="15sp" />

        <Button
            android:id="@+id/sendButton"
            android:layout_width="56dp"
            android:layout_height="56dp"
            android:layout_marginStart="8dp"
            android:background="@drawable/btn_primary_clay"
            android:elevation="6dp"
            android:text="→"
            android:textColor="@color/lifinity_text_on_primary"
            android:textSize="20sp" />
    </LinearLayout>
</LinearLayout>
```

### 4.6 — Criar AssistantActivity

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/AssistantActivity.java`:

```java
package com.lifinity.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.adapters.AssistantMessageAdapter;
import com.lifinity.app.api.AssistantApi;
import com.lifinity.app.models.AssistantMessage;
import com.lifinity.app.models.AssistantSendResponse;
import com.lifinity.app.models.SendMessageRequest;
import com.lifinity.app.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AssistantActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private RecyclerView recyclerView;
    private EditText messageInput;
    private Button sendButton;
    private ProgressBar progressBar;
    private final List<AssistantMessage> messages = new ArrayList<>();
    private AssistantMessageAdapter adapter;
    private AssistantApi api;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_assistant);

        recyclerView = findViewById(R.id.messagesRecyclerView);
        messageInput = findViewById(R.id.messageInput);
        sendButton = findViewById(R.id.sendButton);
        progressBar = findViewById(R.id.assistantProgressBar);

        LinearLayoutManager layoutManager = new LinearLayoutManager(this);
        layoutManager.setStackFromEnd(true);
        recyclerView.setLayoutManager(layoutManager);
        adapter = new AssistantMessageAdapter(messages);
        recyclerView.setAdapter(adapter);

        token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");
        api = ApiClient.getClient().create(AssistantApi.class);

        sendButton.setOnClickListener(v -> sendMessage());

        loadHistory();
    }

    private void loadHistory() {
        progressBar.setVisibility(View.VISIBLE);
        sendButton.setEnabled(false);

        api.getMessages(token).enqueue(new Callback<List<AssistantMessage>>() {
            @Override
            public void onResponse(Call<List<AssistantMessage>> call, Response<List<AssistantMessage>> response) {
                progressBar.setVisibility(View.GONE);
                sendButton.setEnabled(true);
                if (response.isSuccessful() && response.body() != null) {
                    messages.clear();
                    messages.addAll(response.body());
                    adapter.notifyDataSetChanged();
                    scrollToBottom();
                }
            }

            @Override
            public void onFailure(Call<List<AssistantMessage>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                sendButton.setEnabled(true);
                Toast.makeText(AssistantActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void sendMessage() {
        String content = messageInput.getText().toString().trim();
        if (TextUtils.isEmpty(content)) return;

        messageInput.setText("");
        sendButton.setEnabled(false);
        progressBar.setVisibility(View.VISIBLE);

        api.sendMessage(token, new SendMessageRequest(content))
                .enqueue(new Callback<AssistantSendResponse>() {
                    @Override
                    public void onResponse(Call<AssistantSendResponse> call, Response<AssistantSendResponse> response) {
                        progressBar.setVisibility(View.GONE);
                        sendButton.setEnabled(true);
                        if (response.isSuccessful() && response.body() != null) {
                            List<AssistantMessage> newMessages = response.body().getMessages();
                            if (newMessages != null) {
                                messages.addAll(newMessages);
                                adapter.notifyItemRangeInserted(messages.size() - newMessages.size(), newMessages.size());
                                scrollToBottom();
                            }
                        } else {
                            Toast.makeText(AssistantActivity.this, "Erro ao enviar mensagem.", Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<AssistantSendResponse> call, Throwable t) {
                        progressBar.setVisibility(View.GONE);
                        sendButton.setEnabled(true);
                        Toast.makeText(AssistantActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void scrollToBottom() {
        if (!messages.isEmpty()) {
            recyclerView.scrollToPosition(messages.size() - 1);
        }
    }
}
```

### 4.7 — Registar no AndroidManifest.xml

- [ ] Adicionar dentro de `<application>`:

```xml
<activity
    android:name=".AssistantActivity"
    android:exported="false"
    android:windowSoftInputMode="adjustResize" />
```

> `adjustResize` faz o layout subir quando o teclado abre, importante para chat.

---

## Task 5: Ecrãs de Chat (Conversas + Mensagens)

**Files:**
- Create: `java/com/lifinity/app/models/Conversation.java`
- Create: `java/com/lifinity/app/models/ChatMessage.java`
- Create: `java/com/lifinity/app/models/SendChatMessageRequest.java`
- Create: `java/com/lifinity/app/api/ChatApi.java`
- Create: `java/com/lifinity/app/adapters/ConversationAdapter.java`
- Create: `java/com/lifinity/app/adapters/ChatMessageAdapter.java`
- Create: `res/layout/activity_conversations.xml`
- Create: `res/layout/item_conversation.xml`
- Create: `res/layout/activity_chat.xml`
- Create: `res/layout/item_chat_sent.xml`
- Create: `res/layout/item_chat_received.xml`
- Create: `java/com/lifinity/app/ConversationsActivity.java`
- Create: `java/com/lifinity/app/ChatActivity.java`

### 5.1 — Criar modelos do chat

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/Conversation.java`:

```java
package com.lifinity.app.models;

public class Conversation {
    private Integer idconversation;
    private String name;
    private String type;  // "private" ou "group"
    private String last_message;
    private String updated_at;

    public Integer getIdconversation() { return idconversation; }
    public String getName() { return name != null ? name : "Conversa"; }
    public String getType() { return type; }
    public String getLastMessage() { return last_message; }
    public String getUpdatedAt() { return updated_at; }
    public boolean isGroup() { return "group".equals(type); }
}
```

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/ChatMessage.java`:

```java
package com.lifinity.app.models;

public class ChatMessage {
    private Integer idmessage;
    private Integer idconversation;
    private Integer iduser;
    private String username;
    private String content;
    private String created_at;

    public Integer getIdmessage() { return idmessage; }
    public Integer getIduser() { return iduser; }
    public String getUsername() { return username; }
    public String getContent() { return content; }
    public String getCreatedAt() { return created_at; }
}
```

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/SendChatMessageRequest.java`:

```java
package com.lifinity.app.models;

public class SendChatMessageRequest {
    private final String content;
    public SendChatMessageRequest(String content) { this.content = content; }
    public String getContent() { return content; }
}
```

### 5.2 — Criar ChatApi

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/api/ChatApi.java`:

```java
package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.ChatMessage;
import com.lifinity.app.models.Conversation;
import com.lifinity.app.models.SendChatMessageRequest;
import java.util.List;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface ChatApi {
    @GET("chat/conversations")
    Call<List<Conversation>> getConversations(@Header("Authorization") String token);

    @GET("chat/conversations/{id}/messages")
    Call<List<ChatMessage>> getMessages(
            @Header("Authorization") String token,
            @Path("id") int idconversation
    );

    @POST("chat/conversations/{id}/messages")
    Call<JsonObject> sendMessage(
            @Header("Authorization") String token,
            @Path("id") int idconversation,
            @Body SendChatMessageRequest body
    );
}
```

### 5.3 — Criar layouts do chat

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_conversation.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="12dp"
    android:background="@drawable/bg_card_clay"
    android:elevation="8dp"
    android:orientation="horizontal"
    android:padding="16dp"
    android:gravity="center_vertical">

    <TextView
        android:id="@+id/conversationTypeIcon"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:gravity="center"
        android:background="@drawable/btn_secondary_clay"
        android:textColor="@color/lifinity_primary"
        android:textSize="20sp"
        android:textStyle="bold" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginStart="12dp"
        android:orientation="vertical">

        <TextView
            android:id="@+id/conversationNameText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="@color/lifinity_text"
            android:textSize="16sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/conversationLastMessageText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:ellipsize="end"
            android:maxLines="1"
            android:textColor="@color/lifinity_text_secondary"
            android:textSize="13sp" />
    </LinearLayout>
</LinearLayout>
```

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_chat_sent.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="8dp"
    android:gravity="end"
    android:orientation="horizontal"
    android:paddingStart="56dp">

    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/btn_primary_clay"
        android:elevation="4dp"
        android:orientation="vertical"
        android:padding="10dp">

        <TextView
            android:id="@+id/chatMessageText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textColor="@color/lifinity_text_on_primary"
            android:textSize="15sp" />

        <TextView
            android:id="@+id/chatMessageTime"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:textColor="@color/lifinity_text_on_primary"
            android:textSize="11sp"
            android:alpha="0.7" />
    </LinearLayout>
</LinearLayout>
```

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_chat_received.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="8dp"
    android:gravity="start"
    android:orientation="horizontal"
    android:paddingEnd="56dp">

    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_card_clay"
        android:elevation="4dp"
        android:orientation="vertical"
        android:padding="10dp">

        <TextView
            android:id="@+id/chatSenderText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:textColor="@color/lifinity_primary"
            android:textSize="12sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/chatMessageText"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:textColor="@color/lifinity_text"
            android:textSize="15sp" />

        <TextView
            android:id="@+id/chatMessageTime"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="4dp"
            android:textColor="@color/lifinity_text_secondary"
            android:textSize="11sp" />
    </LinearLayout>
</LinearLayout>
```

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_conversations.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:orientation="vertical"
    android:padding="@dimen/space_screen">

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginBottom="16dp"
        android:gravity="center"
        android:text="Mensagens"
        android:textColor="@color/lifinity_text"
        android:textSize="26sp"
        android:textStyle="bold" />

    <ProgressBar
        android:id="@+id/conversationsProgressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone" />

    <TextView
        android:id="@+id/conversationsErrorText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:textColor="@color/lifinity_danger"
        android:textSize="15sp"
        android:visibility="gone" />

    <TextView
        android:id="@+id/conversationsEmptyText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:text="Sem conversas."
        android:textColor="@color/lifinity_text_secondary"
        android:textSize="15sp"
        android:visibility="gone" />

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/conversationsRecyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:visibility="gone" />
</LinearLayout>
```

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_chat.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:orientation="vertical">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_card_clay"
        android:elevation="8dp"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:padding="16dp">

        <TextView
            android:id="@+id/chatTitleText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:textColor="@color/lifinity_text"
            android:textSize="18sp"
            android:textStyle="bold" />
    </LinearLayout>

    <ProgressBar
        android:id="@+id/chatProgressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="center"
        android:visibility="gone" />

    <androidx.recyclerview.widget.RecyclerView
        android:id="@+id/chatRecyclerView"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:padding="12dp" />

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_card_clay"
        android:elevation="12dp"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:padding="10dp">

        <EditText
            android:id="@+id/chatInput"
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:background="@drawable/bg_input_clay"
            android:hint="Mensagem..."
            android:inputType="textMultiLine"
            android:maxLines="3"
            android:padding="10dp"
            android:textSize="15sp" />

        <Button
            android:id="@+id/chatSendButton"
            android:layout_width="52dp"
            android:layout_height="52dp"
            android:layout_marginStart="8dp"
            android:background="@drawable/btn_primary_clay"
            android:elevation="6dp"
            android:text="→"
            android:textColor="@color/lifinity_text_on_primary"
            android:textSize="20sp" />
    </LinearLayout>
</LinearLayout>
```

### 5.4 — Criar ConversationAdapter

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/adapters/ConversationAdapter.java`:

```java
package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.R;
import com.lifinity.app.models.Conversation;
import java.util.List;

public class ConversationAdapter extends RecyclerView.Adapter<ConversationAdapter.ViewHolder> {
    public interface OnConversationClickListener {
        void onConversationClick(Conversation conversation);
    }

    private final List<Conversation> conversations;
    private final OnConversationClickListener listener;

    public ConversationAdapter(List<Conversation> conversations, OnConversationClickListener listener) {
        this.conversations = conversations;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_conversation, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Conversation c = conversations.get(position);
        holder.typeIcon.setText(c.isGroup() ? "G" : "P");
        holder.nameText.setText(c.getName());
        String lastMsg = c.getLastMessage();
        holder.lastMessageText.setText(lastMsg != null ? lastMsg : "Sem mensagens.");
        holder.itemView.setOnClickListener(v -> listener.onConversationClick(c));
    }

    @Override
    public int getItemCount() { return conversations.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView typeIcon, nameText, lastMessageText;
        ViewHolder(View view) {
            super(view);
            typeIcon = view.findViewById(R.id.conversationTypeIcon);
            nameText = view.findViewById(R.id.conversationNameText);
            lastMessageText = view.findViewById(R.id.conversationLastMessageText);
        }
    }
}
```

### 5.5 — Criar ChatMessageAdapter

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/adapters/ChatMessageAdapter.java`:

```java
package com.lifinity.app.adapters;

import android.content.SharedPreferences;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.R;
import com.lifinity.app.models.ChatMessage;
import java.util.List;

public class ChatMessageAdapter extends RecyclerView.Adapter<ChatMessageAdapter.ViewHolder> {
    private static final int TYPE_SENT = 0;
    private static final int TYPE_RECEIVED = 1;
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_USER = "user";

    private final List<ChatMessage> messages;
    private final int currentUserId;

    public ChatMessageAdapter(List<ChatMessage> messages, Context context) {
        this.messages = messages;
        this.currentUserId = getCurrentUserId(context);
    }

    private int getCurrentUserId(Context context) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String userJson = prefs.getString(KEY_USER, null);
            if (userJson == null) return -1;
            JsonObject user = new Gson().fromJson(userJson, JsonObject.class);
            return user.get("iduser").getAsInt();
        } catch (Exception e) {
            return -1;
        }
    }

    @Override
    public int getItemViewType(int position) {
        ChatMessage msg = messages.get(position);
        return msg.getIduser() != null && msg.getIduser() == currentUserId
                ? TYPE_SENT : TYPE_RECEIVED;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layout = viewType == TYPE_SENT ? R.layout.item_chat_sent : R.layout.item_chat_received;
        View view = LayoutInflater.from(parent.getContext()).inflate(layout, parent, false);
        return new ViewHolder(view, viewType);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ChatMessage msg = messages.get(position);
        holder.messageText.setText(msg.getContent());
        String time = msg.getCreatedAt() != null && msg.getCreatedAt().length() >= 16
                ? msg.getCreatedAt().substring(11, 16) : "";
        holder.timeText.setText(time);
        if (holder.senderText != null) {
            holder.senderText.setText(msg.getUsername() != null ? msg.getUsername() : "");
        }
    }

    @Override
    public int getItemCount() { return messages.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView messageText, timeText;
        final TextView senderText;
        ViewHolder(View view, int viewType) {
            super(view);
            messageText = view.findViewById(R.id.chatMessageText);
            timeText = view.findViewById(R.id.chatMessageTime);
            senderText = viewType == TYPE_RECEIVED ? view.findViewById(R.id.chatSenderText) : null;
        }
    }
}
```

### 5.6 — Criar ConversationsActivity

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/ConversationsActivity.java`:

```java
package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
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
    private static final String KEY_TOKEN = "token";

    private ProgressBar progressBar;
    private TextView errorText, emptyText;
    private RecyclerView recyclerView;
    private String token;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_conversations);

        progressBar = findViewById(R.id.conversationsProgressBar);
        errorText = findViewById(R.id.conversationsErrorText);
        emptyText = findViewById(R.id.conversationsEmptyText);
        recyclerView = findViewById(R.id.conversationsRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");

        loadConversations();
    }

    private void loadConversations() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);

        ApiClient.getClient().create(ChatApi.class)
                .getConversations(token)
                .enqueue(new Callback<List<Conversation>>() {
                    @Override
                    public void onResponse(Call<List<Conversation>> call, Response<List<Conversation>> response) {
                        progressBar.setVisibility(View.GONE);
                        if (response.isSuccessful() && response.body() != null) {
                            List<Conversation> list = response.body();
                            if (list.isEmpty()) {
                                emptyText.setVisibility(View.VISIBLE);
                            } else {
                                recyclerView.setAdapter(new ConversationAdapter(list, conversation -> {
                                    Intent intent = new Intent(ConversationsActivity.this, ChatActivity.class);
                                    intent.putExtra("conversation_id", conversation.getIdconversation());
                                    intent.putExtra("conversation_name", conversation.getName());
                                    startActivity(intent);
                                }));
                                recyclerView.setVisibility(View.VISIBLE);
                            }
                        } else {
                            showError("Erro ao carregar conversas.");
                        }
                    }

                    @Override
                    public void onFailure(Call<List<Conversation>> call, Throwable t) {
                        progressBar.setVisibility(View.GONE);
                        showError("Sem ligação ao servidor.");
                    }
                });
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }
}
```

### 5.7 — Criar ChatActivity

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/ChatActivity.java`:

```java
package com.lifinity.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.gson.JsonObject;
import com.lifinity.app.adapters.ChatMessageAdapter;
import com.lifinity.app.api.ChatApi;
import com.lifinity.app.models.ChatMessage;
import com.lifinity.app.models.SendChatMessageRequest;
import com.lifinity.app.network.ApiClient;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChatActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private RecyclerView recyclerView;
    private EditText chatInput;
    private Button sendButton;
    private ProgressBar progressBar;
    private TextView titleText;
    private final List<ChatMessage> messages = new ArrayList<>();
    private ChatMessageAdapter adapter;
    private ChatApi api;
    private String token;
    private int conversationId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);

        conversationId = getIntent().getIntExtra("conversation_id", -1);
        String conversationName = getIntent().getStringExtra("conversation_name");

        titleText = findViewById(R.id.chatTitleText);
        titleText.setText(conversationName != null ? conversationName : "Chat");

        recyclerView = findViewById(R.id.chatRecyclerView);
        chatInput = findViewById(R.id.chatInput);
        sendButton = findViewById(R.id.chatSendButton);
        progressBar = findViewById(R.id.chatProgressBar);

        LinearLayoutManager lm = new LinearLayoutManager(this);
        lm.setStackFromEnd(true);
        recyclerView.setLayoutManager(lm);
        adapter = new ChatMessageAdapter(messages, this);
        recyclerView.setAdapter(adapter);

        token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");
        api = ApiClient.getClient().create(ChatApi.class);

        sendButton.setOnClickListener(v -> sendMessage());

        if (conversationId != -1) loadMessages();
    }

    private void loadMessages() {
        progressBar.setVisibility(View.VISIBLE);
        sendButton.setEnabled(false);

        api.getMessages(token, conversationId).enqueue(new Callback<List<ChatMessage>>() {
            @Override
            public void onResponse(Call<List<ChatMessage>> call, Response<List<ChatMessage>> response) {
                progressBar.setVisibility(View.GONE);
                sendButton.setEnabled(true);
                if (response.isSuccessful() && response.body() != null) {
                    messages.clear();
                    messages.addAll(response.body());
                    adapter.notifyDataSetChanged();
                    scrollToBottom();
                }
            }

            @Override
            public void onFailure(Call<List<ChatMessage>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                sendButton.setEnabled(true);
                Toast.makeText(ChatActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void sendMessage() {
        String content = chatInput.getText().toString().trim();
        if (TextUtils.isEmpty(content)) return;

        chatInput.setText("");
        sendButton.setEnabled(false);

        api.sendMessage(token, conversationId, new SendChatMessageRequest(content))
                .enqueue(new Callback<JsonObject>() {
                    @Override
                    public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                        sendButton.setEnabled(true);
                        if (response.isSuccessful()) {
                            loadMessages();
                        } else {
                            Toast.makeText(ChatActivity.this, "Erro ao enviar.", Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<JsonObject> call, Throwable t) {
                        sendButton.setEnabled(true);
                        Toast.makeText(ChatActivity.this, "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void scrollToBottom() {
        if (!messages.isEmpty()) {
            recyclerView.scrollToPosition(messages.size() - 1);
        }
    }
}
```

### 5.8 — Registar no AndroidManifest.xml

- [ ] Adicionar dentro de `<application>`:

```xml
<activity
    android:name=".ConversationsActivity"
    android:exported="false" />
<activity
    android:name=".ChatActivity"
    android:exported="false"
    android:windowSoftInputMode="adjustResize" />
```

---

## Task 6: Atualizar MainActivity com todos os novos ecrãs

**Files:**
- Modify: `res/layout/activity_main.xml`
- Modify: `java/com/lifinity/app/MainActivity.java`

### 6.1 — Atualizar activity_main.xml

- [ ] Substituir o conteúdo de `android/LifinityAndroid/app/src/main/res/layout/activity_main.xml` por:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/main"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:fillViewport="true"
    tools:context=".MainActivity">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center"
        android:orientation="vertical"
        android:padding="@dimen/space_screen">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:background="@drawable/bg_card_clay"
            android:elevation="10dp"
            android:gravity="center"
            android:orientation="vertical"
            android:padding="28dp">

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:text="Lifinity"
                android:textColor="@color/lifinity_primary"
                android:textSize="18sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="14dp"
                android:gravity="center"
                android:text="Bem-vindo ao Lifinity"
                android:textColor="@color/lifinity_text"
                android:textSize="28sp"
                android:textStyle="bold" />

            <!-- Fila 1: Atividades + Ranking -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="28dp"
                android:orientation="horizontal">

                <Button
                    android:id="@+id/viewTasksButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_weight="1"
                    android:background="@drawable/btn_primary_clay"
                    android:elevation="8dp"
                    android:text="Atividades"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text_on_primary"
                    android:textSize="15sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/rankingButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginStart="12dp"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Ranking"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />
            </LinearLayout>

            <!-- Fila 2: Perfil + Estatísticas -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp"
                android:orientation="horizontal">

                <Button
                    android:id="@+id/profileButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Perfil"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/statisticsButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginStart="12dp"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Estatísticas"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />
            </LinearLayout>

            <!-- Fila 3: Inspiração + Notificações -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp"
                android:orientation="horizontal">

                <Button
                    android:id="@+id/inspirationButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Inspiração"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/notificationsButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginStart="12dp"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Notificações"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />
            </LinearLayout>

            <!-- Fila 4: Assistente + Chat -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="12dp"
                android:orientation="horizontal">

                <Button
                    android:id="@+id/assistantButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Assistente"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/chatButton"
                    android:layout_width="0dp"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginStart="12dp"
                    android:layout_weight="1"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Chat"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="15sp"
                    android:textStyle="bold" />
            </LinearLayout>

            <!-- Botão de logout -->
            <Button
                android:id="@+id/logoutButton"
                android:layout_width="match_parent"
                android:layout_height="@dimen/height_button"
                android:layout_marginTop="20dp"
                android:background="@drawable/btn_danger_clay"
                android:elevation="6dp"
                android:text="Terminar sessão"
                android:textAllCaps="false"
                android:textColor="@color/lifinity_text_on_primary"
                android:textSize="16sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>
</ScrollView>
```

### 6.2 — Atualizar MainActivity.java

- [ ] Substituir o conteúdo de `android/LifinityAndroid/app/src/main/java/com/lifinity/app/MainActivity.java` por:

```java
package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!hasToken()) {
            openLoginActivity();
            return;
        }

        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        findViewById(R.id.viewTasksButton).setOnClickListener(v -> open(TasksActivity.class));
        findViewById(R.id.rankingButton).setOnClickListener(v -> open(RankingActivity.class));
        findViewById(R.id.profileButton).setOnClickListener(v -> open(ProfileActivity.class));
        findViewById(R.id.statisticsButton).setOnClickListener(v -> open(StatisticsActivity.class));
        findViewById(R.id.inspirationButton).setOnClickListener(v -> open(InspirationActivity.class));
        findViewById(R.id.notificationsButton).setOnClickListener(v -> open(NotificationsActivity.class));
        findViewById(R.id.assistantButton).setOnClickListener(v -> open(AssistantActivity.class));
        findViewById(R.id.chatButton).setOnClickListener(v -> open(ConversationsActivity.class));
        findViewById(R.id.logoutButton).setOnClickListener(v -> logout());
    }

    private boolean hasToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return !TextUtils.isEmpty(preferences.getString(KEY_TOKEN, null));
    }

    private void open(Class<?> activityClass) {
        startActivity(new Intent(this, activityClass));
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        startActivity(intent);
        finish();
    }

    private void logout() {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .edit()
                .remove(KEY_TOKEN)
                .remove("user")
                .apply();

        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
```

### 6.3 — AndroidManifest.xml final completo

- [ ] Verificar que o `AndroidManifest.xml` contém **todas** as activities declaradas. O ficheiro final deve ter (além das existentes) as novas:

```xml
<activity android:name=".RankingActivity" android:exported="false" />
<activity android:name=".NotificationsActivity" android:exported="false" />
<activity android:name=".StatisticsActivity" android:exported="false" />
<activity android:name=".AssistantActivity" android:exported="false" android:windowSoftInputMode="adjustResize" />
<activity android:name=".ConversationsActivity" android:exported="false" />
<activity android:name=".ChatActivity" android:exported="false" android:windowSoftInputMode="adjustResize" />
```

### 6.4 — Build e teste manual

- [ ] Abrir o projeto no Android Studio (`File > Open > android/LifinityAndroid`)
- [ ] Compilar com `Build > Make Project` (Ctrl+F9) e confirmar que não há erros
- [ ] Correr no emulador/dispositivo e verificar:
  - [ ] MainActivity mostra 8 botões em grelha 2x4
  - [ ] Ranking carrega lista top 10 (ou erro se backend desligado)
  - [ ] Notificações carrega lista e o botão "Marcar todas" funciona
  - [ ] Estatísticas mostra resumo e muda com o spinner de período
  - [ ] Assistente carrega histórico e envia mensagens com resposta da IA
  - [ ] Chat mostra lista de conversas e ao clicar abre mensagens

---

## Resumo dos ficheiros a criar/modificar

| Ficheiro | Ação |
|---|---|
| `models/RankingUser.java` | Criar |
| `models/AppNotification.java` | Criar |
| `models/StatisticsSummary.java` | Criar |
| `models/StatisticsResponse.java` | Criar |
| `models/AssistantMessage.java` | Criar |
| `models/SendMessageRequest.java` | Criar |
| `models/AssistantSendResponse.java` | Criar |
| `models/Conversation.java` | Criar |
| `models/ChatMessage.java` | Criar |
| `models/SendChatMessageRequest.java` | Criar |
| `api/UserApi.java` | Criar |
| `api/NotificationApi.java` | Criar |
| `api/StatisticsApi.java` | Criar |
| `api/AssistantApi.java` | Criar |
| `api/ChatApi.java` | Criar |
| `adapters/RankingAdapter.java` | Criar |
| `adapters/NotificationAdapter.java` | Criar |
| `adapters/AssistantMessageAdapter.java` | Criar |
| `adapters/ConversationAdapter.java` | Criar |
| `adapters/ChatMessageAdapter.java` | Criar |
| `RankingActivity.java` | Criar |
| `NotificationsActivity.java` | Criar |
| `StatisticsActivity.java` | Criar |
| `AssistantActivity.java` | Criar |
| `ConversationsActivity.java` | Criar |
| `ChatActivity.java` | Criar |
| `layout/activity_ranking.xml` | Criar |
| `layout/item_ranking.xml` | Criar |
| `layout/activity_notifications.xml` | Criar |
| `layout/item_notification.xml` | Criar |
| `layout/activity_statistics.xml` | Criar |
| `layout/activity_assistant.xml` | Criar |
| `layout/item_message_user.xml` | Criar |
| `layout/item_message_assistant.xml` | Criar |
| `layout/activity_conversations.xml` | Criar |
| `layout/item_conversation.xml` | Criar |
| `layout/activity_chat.xml` | Criar |
| `layout/item_chat_sent.xml` | Criar |
| `layout/item_chat_received.xml` | Criar |
| `MainActivity.java` | Modificar |
| `layout/activity_main.xml` | Modificar |
| `AndroidManifest.xml` | Modificar |

**Total: 37 ficheiros novos + 3 modificações**
