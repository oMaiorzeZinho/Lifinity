# Android Clay UI — Redesign Completo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o redesign claymorphism da app Android para que todos os 4 ecrãs do menu inferior (Atividades, Ranking, Inspiração, Perfil) fiquem funcionais com o design clay verde do handoff.

**Architecture:** Cada ecrã principal usa a mesma estrutura: `LinearLayout` root com `bg_app_clay` → header reutilizável → `NestedScrollView` com peso 1 → `include layout="@layout/nav_bottom"`. A navegação é gerida por um `BottomNavHelper` que extrai a lógica duplicada de `TasksActivity`. O `MainActivity` é simplificado para redirecionar diretamente para `TasksActivity`.

**Tech Stack:** Java 11, Retrofit 2 (ApiClient existente em `network/ApiClient.java`), Gson, AndroidX RecyclerView, drawables clay já existentes (`bg_app_clay`, `bg_card_clay`, `bg_card_soft_clay`, `btn_primary_clay`, `btn_secondary_clay`, `btn_danger_clay`, `bg_input_clay`, `bg_fab_clay`, `bg_nav_clay`, `bg_pill_*`).

**Base de caminhos:**
- Java: `android/LifinityAndroid/app/src/main/java/com/lifinity/app/`
- Layouts: `android/LifinityAndroid/app/src/main/res/layout/`
- Manifesto: `android/LifinityAndroid/app/src/main/AndroidManifest.xml`

---

## Estado atual (o que já existe)

| Ficheiro | Estado |
|---|---|
| `colors.xml`, `dimens.xml`, `themes.xml` | ✓ Completos |
| Todos os drawables `bg_*`, `btn_*`, `bg_pill_*` | ✓ Completos |
| `nav_bottom.xml` | ✓ Completo (4 tabs + FAB) |
| `activity_login.xml` + `LoginActivity.java` | ✓ Clay OK |
| `activity_register.xml` + `RegisterActivity.java` | ✓ Clay OK |
| `activity_tasks.xml` + `item_task.xml` + `TasksActivity.java` | ✓ Completo — referência de design |
| `activity_create_task.xml` + `CreateTaskActivity.java` | ✓ Clay OK |
| `activity_inspiration.xml` + `InspirationActivity.java` | Sem bottom nav (ScrollView root) |
| `activity_profile.xml` + `ProfileActivity.java` | Sem bottom nav (ScrollView root) |
| `RankingActivity.java` + layouts ranking | ✗ Não existe |
| `MainActivity.java` | Mostra menu antigo — deve ir direto para Tasks |

---

## Estrutura de ficheiros do plano

**Criar:**
- `java/.../BottomNavHelper.java` — lógica de bottom nav reutilizável
- `java/.../RankingActivity.java` — ecrã de ranking completo
- `java/.../adapters/RankingAdapter.java` — lista de utilizadores
- `java/.../models/RankingUser.java` — modelo de dados
- `java/.../api/UserApi.java` — endpoint `/users/ranking`
- `res/layout/activity_ranking.xml` — layout clay com pódio
- `res/layout/item_ranking.xml` — item da lista

**Modificar:**
- `res/layout/activity_inspiration.xml` — adicionar bottom nav
- `java/.../InspirationActivity.java` — usar BottomNavHelper
- `res/layout/activity_profile.xml` — adicionar bottom nav
- `java/.../ProfileActivity.java` — usar BottomNavHelper
- `java/.../TasksActivity.java` — usar BottomNavHelper, abrir RankingActivity
- `java/.../MainActivity.java` — redirecionar direto para TasksActivity
- `AndroidManifest.xml` — registar RankingActivity

---

## Task 1: BottomNavHelper + fix TasksActivity

**Files:**
- Create: `java/com/lifinity/app/BottomNavHelper.java`
- Modify: `java/com/lifinity/app/TasksActivity.java` (linhas ~176–221)
- Modify: `java/com/lifinity/app/MainActivity.java`

### 1.1 — Criar BottomNavHelper.java

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/BottomNavHelper.java`:

```java
package com.lifinity.app;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

public class BottomNavHelper {
    public enum Tab { TASKS, RANKING, INSPIRATION, PROFILE }

    public static void setup(Activity activity, Tab active) {
        View fab = activity.findViewById(R.id.navFab);
        if (fab != null) fab.setOnClickListener(v ->
                activity.startActivity(new Intent(activity, CreateTaskActivity.class)));

        int[] tabIds = {R.id.navTabTasks, R.id.navTabRanking,
                R.id.navTabInspiration, R.id.navTabProfile};
        Tab[] tabs   = {Tab.TASKS, Tab.RANKING, Tab.INSPIRATION, Tab.PROFILE};

        for (int i = 0; i < tabIds.length; i++) {
            View tab = activity.findViewById(tabIds[i]);
            if (tab == null) continue;
            boolean isActive = tabs[i] == active;
            applyState(activity, tab, isActive);
            Tab target = tabs[i];
            if (!isActive) tab.setOnClickListener(v -> navigate(activity, target));
        }
    }

    private static void navigate(Activity from, Tab target) {
        Class<?> dest = switch (target) {
            case TASKS       -> TasksActivity.class;
            case RANKING     -> RankingActivity.class;
            case INSPIRATION -> InspirationActivity.class;
            case PROFILE     -> ProfileActivity.class;
        };
        Intent i = new Intent(from, dest);
        i.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        from.startActivity(i);
    }

    private static void applyState(Activity activity, View tab, boolean active) {
        int color = active
                ? activity.getResources().getColor(R.color.lifinity_primary, null)
                : activity.getResources().getColor(R.color.lifinity_text_secondary, null);
        tab.setBackground(active
                ? activity.getResources().getDrawable(R.drawable.bg_nav_item_active, null)
                : null);
        if (tab instanceof LinearLayout ll) {
            for (int i = 0; i < ll.getChildCount(); i++) {
                if (ll.getChildAt(i) instanceof TextView tv) tv.setTextColor(color);
            }
        }
    }
}
```

### 1.2 — Atualizar setupBottomNav em TasksActivity

- [ ] Substituir o método `setupBottomNav()` e `setNavTabActive()` em `TasksActivity.java` (remove as linhas 176–221 e substitui por):

```java
private void setupBottomNav() {
    BottomNavHelper.setup(this, BottomNavHelper.Tab.TASKS);
}
```

> O import `import com.lifinity.app.BottomNavHelper;` e `import android.content.Intent;` já existem ou devem ser adicionados no topo da classe.

### 1.3 — Simplificar MainActivity

- [ ] Substituir o corpo de `MainActivity.java` pelo seguinte (mantém apenas a lógica de redirect):

```java
package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        boolean hasToken = !TextUtils.isEmpty(prefs.getString(KEY_TOKEN, null));
        Class<?> dest = hasToken ? TasksActivity.class : LoginActivity.class;
        Intent i = new Intent(this, dest);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(i);
        finish();
    }
}
```

### 1.4 — Compilar e verificar

- [ ] Compilar o projeto no Android Studio (Build → Make Project)
- [ ] Esperado: sem erros de compilação; app continua a abrir TasksActivity normalmente

### 1.5 — Commit

```
git add android/LifinityAndroid/app/src/main/java/com/lifinity/app/BottomNavHelper.java
git add android/LifinityAndroid/app/src/main/java/com/lifinity/app/TasksActivity.java
git add android/LifinityAndroid/app/src/main/java/com/lifinity/app/MainActivity.java
git commit -m "Android: extrair BottomNavHelper, simplificar MainActivity"
```

---

## Task 2: Ecrã de Ranking

**Files:**
- Create: `java/com/lifinity/app/models/RankingUser.java`
- Create: `java/com/lifinity/app/api/UserApi.java`
- Create: `java/com/lifinity/app/adapters/RankingAdapter.java`
- Create: `res/layout/item_ranking.xml`
- Create: `res/layout/activity_ranking.xml`
- Create: `java/com/lifinity/app/RankingActivity.java`
- Modify: `AndroidManifest.xml`

### 2.1 — Criar RankingUser.java

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/models/RankingUser.java`:

```java
package com.lifinity.app.models;

public class RankingUser {
    private Integer iduser;
    private String username;
    private Integer xp;
    private Integer level;

    public Integer getIduser() { return iduser; }
    public String getUsername() { return username != null ? username : "—"; }
    public int getXp() { return xp != null ? xp : 0; }
    public int getLevel() { return level != null ? level : 1; }
}
```

### 2.2 — Criar UserApi.java

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

### 2.3 — Criar item_ranking.xml

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/item_ranking.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="10dp"
    android:background="@drawable/bg_card_soft_clay"
    android:elevation="6dp"
    android:gravity="center_vertical"
    android:orientation="horizontal"
    android:padding="14dp">

    <TextView
        android:id="@+id/rankPositionText"
        android:layout_width="44dp"
        android:layout_height="44dp"
        android:gravity="center"
        android:textColor="@color/lifinity_primary"
        android:textSize="18sp"
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
            android:textSize="15sp"
            android:textStyle="bold" />

        <TextView
            android:id="@+id/rankLevelText"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="2dp"
            android:textColor="@color/lifinity_text_secondary"
            android:textSize="12sp" />
    </LinearLayout>

    <TextView
        android:id="@+id/rankXpText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:background="@drawable/bg_pill_mint"
        android:paddingStart="10dp"
        android:paddingEnd="10dp"
        android:paddingTop="4dp"
        android:paddingBottom="4dp"
        android:textColor="@color/lifinity_primary"
        android:textSize="13sp"
        android:textStyle="bold" />
</LinearLayout>
```

### 2.4 — Criar activity_ranking.xml

- [ ] Criar `android/LifinityAndroid/app/src/main/res/layout/activity_ranking.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:clipChildren="false"
    android:clipToPadding="false"
    android:orientation="vertical"
    tools:context=".RankingActivity">

    <!-- Header (igual ao de TasksActivity) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:paddingStart="20dp"
        android:paddingEnd="20dp"
        android:paddingTop="16dp"
        android:paddingBottom="12dp">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center_vertical"
            android:orientation="horizontal">

            <TextView
                android:layout_width="36dp"
                android:layout_height="36dp"
                android:background="@drawable/bg_pill_mint"
                android:gravity="center"
                android:text="&#8734;"
                android:textColor="@color/lifinity_primary"
                android:textSize="18sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="8dp"
                android:text="Lifinity"
                android:textColor="@color/lifinity_text"
                android:textSize="18sp"
                android:textStyle="bold" />
        </LinearLayout>

        <TextView
            android:id="@+id/headerUserPill"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:background="@drawable/bg_card_soft_clay"
            android:elevation="4dp"
            android:paddingStart="12dp"
            android:paddingEnd="12dp"
            android:paddingTop="6dp"
            android:paddingBottom="6dp"
            android:textColor="@color/lifinity_primary"
            android:textSize="12sp"
            android:textStyle="bold"
            tools:text="Telmo · NÍV 5" />
    </LinearLayout>

    <!-- Conteúdo scrollável -->
    <androidx.core.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:clipToPadding="false"
        android:paddingStart="20dp"
        android:paddingEnd="20dp">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:paddingBottom="8dp">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="4dp"
                android:text="Ranking"
                android:textColor="@color/lifinity_text"
                android:textSize="27sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="20dp"
                android:text="Top jogadores por XP."
                android:textColor="@color/lifinity_text_secondary"
                android:textSize="14sp" />

            <!-- Loading / Erro -->
            <ProgressBar
                android:id="@+id/rankingProgressBar"
                style="?android:attr/progressBarStyleLarge"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_gravity="center_horizontal"
                android:layout_marginTop="24dp"
                android:indeterminateTint="@color/lifinity_primary"
                android:visibility="gone" />

            <TextView
                android:id="@+id/rankingErrorText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:gravity="center"
                android:textColor="@color/lifinity_danger"
                android:textSize="15sp"
                android:textStyle="bold"
                android:visibility="gone" />

            <!-- Pódio (Top 3) -->
            <LinearLayout
                android:id="@+id/rankingPodiumLayout"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="20dp"
                android:gravity="bottom|center_horizontal"
                android:orientation="horizontal"
                android:visibility="gone">

                <!-- 2º lugar -->
                <LinearLayout
                    android:id="@+id/podium2Layout"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:gravity="center"
                    android:orientation="vertical"
                    android:paddingBottom="0dp">

                    <TextView
                        android:layout_width="64dp"
                        android:layout_height="64dp"
                        android:background="@drawable/bg_avatar_clay"
                        android:gravity="center"
                        android:text="&#129352;"
                        android:textSize="26sp" />

                    <TextView
                        android:id="@+id/podium2Username"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:layout_marginTop="8dp"
                        android:gravity="center"
                        android:maxLines="1"
                        android:textColor="@color/lifinity_text"
                        android:textSize="13sp"
                        android:textStyle="bold" />

                    <TextView
                        android:id="@+id/podium2Xp"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:layout_marginTop="2dp"
                        android:gravity="center"
                        android:textColor="@color/lifinity_text_secondary"
                        android:textSize="12sp" />

                    <LinearLayout
                        android:layout_width="match_parent"
                        android:layout_height="60dp"
                        android:layout_marginTop="8dp"
                        android:background="@drawable/bg_card_soft_clay"
                        android:elevation="6dp"
                        android:gravity="center"
                        android:orientation="vertical">

                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="2"
                            android:textColor="@color/lifinity_text_secondary"
                            android:textSize="20sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                </LinearLayout>

                <!-- 1º lugar (centro, mais alto) -->
                <LinearLayout
                    android:id="@+id/podium1Layout"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_marginStart="8dp"
                    android:layout_marginEnd="8dp"
                    android:layout_weight="1"
                    android:gravity="center"
                    android:orientation="vertical">

                    <TextView
                        android:layout_width="76dp"
                        android:layout_height="76dp"
                        android:background="@drawable/bg_avatar_clay"
                        android:gravity="center"
                        android:text="&#129351;"
                        android:textSize="32sp" />

                    <TextView
                        android:id="@+id/podium1Username"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:layout_marginTop="8dp"
                        android:gravity="center"
                        android:maxLines="1"
                        android:textColor="@color/lifinity_primary"
                        android:textSize="14sp"
                        android:textStyle="bold" />

                    <TextView
                        android:id="@+id/podium1Xp"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:layout_marginTop="2dp"
                        android:gravity="center"
                        android:textColor="@color/lifinity_text_secondary"
                        android:textSize="12sp" />

                    <LinearLayout
                        android:layout_width="match_parent"
                        android:layout_height="90dp"
                        android:layout_marginTop="8dp"
                        android:background="@drawable/bg_card_clay"
                        android:elevation="10dp"
                        android:gravity="center"
                        android:orientation="vertical">

                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="1"
                            android:textColor="@color/lifinity_primary"
                            android:textSize="26sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                </LinearLayout>

                <!-- 3º lugar -->
                <LinearLayout
                    android:id="@+id/podium3Layout"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_weight="1"
                    android:gravity="center"
                    android:orientation="vertical">

                    <TextView
                        android:layout_width="64dp"
                        android:layout_height="64dp"
                        android:background="@drawable/bg_avatar_clay"
                        android:gravity="center"
                        android:text="&#129353;"
                        android:textSize="26sp" />

                    <TextView
                        android:id="@+id/podium3Username"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:layout_marginTop="8dp"
                        android:gravity="center"
                        android:maxLines="1"
                        android:textColor="@color/lifinity_text"
                        android:textSize="13sp"
                        android:textStyle="bold" />

                    <TextView
                        android:id="@+id/podium3Xp"
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:layout_marginTop="2dp"
                        android:gravity="center"
                        android:textColor="@color/lifinity_text_secondary"
                        android:textSize="12sp" />

                    <LinearLayout
                        android:layout_width="match_parent"
                        android:layout_height="45dp"
                        android:layout_marginTop="8dp"
                        android:background="@drawable/bg_card_soft_clay"
                        android:elevation="6dp"
                        android:gravity="center"
                        android:orientation="vertical">

                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="3"
                            android:textColor="@color/lifinity_text_secondary"
                            android:textSize="18sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                </LinearLayout>
            </LinearLayout>

            <!-- Label lista completa -->
            <TextView
                android:id="@+id/rankingListLabel"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="12dp"
                android:letterSpacing="0.13"
                android:text="CLASSIFICAÇÃO COMPLETA"
                android:textColor="@color/lifinity_text_secondary"
                android:textSize="11sp"
                android:textStyle="bold"
                android:visibility="gone" />

            <!-- Lista -->
            <androidx.recyclerview.widget.RecyclerView
                android:id="@+id/rankingRecyclerView"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:clipToPadding="false"
                android:nestedScrollingEnabled="false"
                android:paddingBottom="100dp"
                android:visibility="gone"
                tools:listitem="@layout/item_ranking"
                tools:visibility="visible" />
        </LinearLayout>
    </androidx.core.widget.NestedScrollView>

    <!-- Barra de navegação inferior -->
    <include
        layout="@layout/nav_bottom"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />
</LinearLayout>
```

### 2.5 — Criar RankingAdapter.java

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
    private final int currentUserId;

    public RankingAdapter(List<RankingUser> users, int currentUserId) {
        this.users = users;
        this.currentUserId = currentUserId;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_ranking, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder h, int position) {
        RankingUser u = users.get(position);
        int rank = position + 1;
        String medal = rank == 1 ? "🥇" : rank == 2 ? "🥈" : rank == 3 ? "🥉" : String.valueOf(rank);
        h.position.setText(medal);
        h.username.setText(u.getUsername());
        h.level.setText("Nível " + u.getLevel());
        h.xp.setText(u.getXp() + " XP");

        // Destaca o utilizador atual
        if (u.getIduser() != null && u.getIduser() == currentUserId) {
            h.itemView.setAlpha(1.0f);
            h.username.setTextColor(
                    h.itemView.getContext().getResources().getColor(R.color.lifinity_primary, null));
        } else {
            h.itemView.setAlpha(0.95f);
        }
    }

    @Override
    public int getItemCount() { return users.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView position, username, level, xp;
        ViewHolder(View v) {
            super(v);
            position = v.findViewById(R.id.rankPositionText);
            username = v.findViewById(R.id.rankUsernameText);
            level    = v.findViewById(R.id.rankLevelText);
            xp       = v.findViewById(R.id.rankXpText);
        }
    }
}
```

### 2.6 — Criar RankingActivity.java

- [ ] Criar `android/LifinityAndroid/app/src/main/java/com/lifinity/app/RankingActivity.java`:

```java
package com.lifinity.app;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.adapters.RankingAdapter;
import com.lifinity.app.api.UserApi;
import com.lifinity.app.models.RankingUser;
import com.lifinity.app.models.User;
import com.lifinity.app.network.ApiClient;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RankingActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER  = "user";

    private ProgressBar progressBar;
    private TextView errorText;
    private RecyclerView recyclerView;
    private View podiumLayout;
    private TextView podium1Username, podium1Xp;
    private TextView podium2Username, podium2Xp;
    private TextView podium3Username, podium3Xp;
    private TextView listLabel;
    private TextView headerUserPill;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ranking);

        progressBar     = findViewById(R.id.rankingProgressBar);
        errorText       = findViewById(R.id.rankingErrorText);
        recyclerView    = findViewById(R.id.rankingRecyclerView);
        podiumLayout    = findViewById(R.id.rankingPodiumLayout);
        podium1Username = findViewById(R.id.podium1Username);
        podium1Xp       = findViewById(R.id.podium1Xp);
        podium2Username = findViewById(R.id.podium2Username);
        podium2Xp       = findViewById(R.id.podium2Xp);
        podium3Username = findViewById(R.id.podium3Username);
        podium3Xp       = findViewById(R.id.podium3Xp);
        listLabel       = findViewById(R.id.rankingListLabel);
        headerUserPill  = findViewById(R.id.headerUserPill);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        // Mostrar username+nível no pill do header
        User currentUser = getSavedUser();
        if (currentUser != null && headerUserPill != null) {
            headerUserPill.setText(currentUser.getUsername() + " · NÍV " + currentUser.getLevel());
        }

        BottomNavHelper.setup(this, BottomNavHelper.Tab.RANKING);

        loadRanking();
    }

    private void loadRanking() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        recyclerView.setVisibility(View.GONE);
        podiumLayout.setVisibility(View.GONE);
        listLabel.setVisibility(View.GONE);

        String token = "Bearer " + getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                .getString(KEY_TOKEN, "");

        ApiClient.getClient().create(UserApi.class)
                .getRanking(token)
                .enqueue(new Callback<List<RankingUser>>() {
                    @Override
                    public void onResponse(Call<List<RankingUser>> call, Response<List<RankingUser>> response) {
                        progressBar.setVisibility(View.GONE);
                        if (response.isSuccessful() && response.body() != null && !response.body().isEmpty()) {
                            showRanking(response.body());
                        } else {
                            showError("Sem dados de ranking.");
                        }
                    }

                    @Override
                    public void onFailure(Call<List<RankingUser>> call, Throwable t) {
                        progressBar.setVisibility(View.GONE);
                        showError("Sem ligação ao servidor.");
                    }
                });
    }

    private void showRanking(List<RankingUser> users) {
        // Pódio (até 3 utilizadores)
        if (users.size() >= 1) {
            podium1Username.setText(users.get(0).getUsername());
            podium1Xp.setText(users.get(0).getXp() + " XP");
        }
        if (users.size() >= 2) {
            podium2Username.setText(users.get(1).getUsername());
            podium2Xp.setText(users.get(1).getXp() + " XP");
        }
        if (users.size() >= 3) {
            podium3Username.setText(users.get(2).getUsername());
            podium3Xp.setText(users.get(2).getXp() + " XP");
        }
        podiumLayout.setVisibility(View.VISIBLE);

        // Lista completa
        int currentUserId = getCurrentUserId();
        recyclerView.setAdapter(new RankingAdapter(users, currentUserId));
        listLabel.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.VISIBLE);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private int getCurrentUserId() {
        try {
            User u = getSavedUser();
            return u != null ? u.getIduser() : -1;
        } catch (Exception e) { return -1; }
    }

    private User getSavedUser() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String json = prefs.getString(KEY_USER, null);
        if (TextUtils.isEmpty(json)) return null;
        try { return new Gson().fromJson(json, User.class); }
        catch (Exception e) { return null; }
    }
}
```

> **Nota:** `User.java` tem um campo `iduser` que pode já ser `Integer` ou `int`. Se o getter não existir, adicionar `public Integer getIduser() { return iduser; }` ao modelo `User.java`.

### 2.7 — Registar no AndroidManifest.xml

- [ ] Adicionar dentro de `<application>` no `AndroidManifest.xml`:

```xml
<activity
    android:name=".RankingActivity"
    android:exported="false" />
```

### 2.8 — Compilar e testar no emulador

- [ ] Build → Make Project — sem erros
- [ ] Correr no emulador: tap no tab Ranking → abre `RankingActivity` com pódio e lista

### 2.9 — Commit

```
git add android/LifinityAndroid/app/src/main/java/com/lifinity/app/
git add android/LifinityAndroid/app/src/main/res/layout/activity_ranking.xml
git add android/LifinityAndroid/app/src/main/res/layout/item_ranking.xml
git add android/LifinityAndroid/app/src/main/AndroidManifest.xml
git commit -m "Android: adiciona ecrã de Ranking com pódio e design clay"
```

---

## Task 3: Inspiração — adicionar bottom nav

**Files:**
- Modify: `res/layout/activity_inspiration.xml`
- Modify: `java/com/lifinity/app/InspirationActivity.java`

### 3.1 — Reestruturar activity_inspiration.xml

A raiz actual é `ScrollView`. Precisa de ser envolvida numa `LinearLayout` root para incluir o `nav_bottom`.

- [ ] Substituir **todo** o conteúdo de `activity_inspiration.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:clipChildren="false"
    android:clipToPadding="false"
    android:orientation="vertical"
    tools:context=".InspirationActivity">

    <!-- Header (igual ao padrão) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:paddingStart="20dp"
        android:paddingEnd="20dp"
        android:paddingTop="16dp"
        android:paddingBottom="12dp">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center_vertical"
            android:orientation="horizontal">

            <TextView
                android:layout_width="36dp"
                android:layout_height="36dp"
                android:background="@drawable/bg_pill_mint"
                android:gravity="center"
                android:text="&#8734;"
                android:textColor="@color/lifinity_primary"
                android:textSize="18sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="8dp"
                android:text="Lifinity"
                android:textColor="@color/lifinity_text"
                android:textSize="18sp"
                android:textStyle="bold" />
        </LinearLayout>

        <TextView
            android:id="@+id/headerUserPill"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:background="@drawable/bg_card_soft_clay"
            android:elevation="4dp"
            android:paddingStart="12dp"
            android:paddingEnd="12dp"
            android:paddingTop="6dp"
            android:paddingBottom="6dp"
            android:textColor="@color/lifinity_primary"
            android:textSize="12sp"
            android:textStyle="bold"
            tools:text="Telmo · NÍV 5" />
    </LinearLayout>

    <!-- Conteúdo scrollável -->
    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:fillViewport="true">

        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:paddingStart="20dp"
            android:paddingEnd="20dp"
            android:paddingBottom="8dp">

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="4dp"
                android:text="Inspiração"
                android:textColor="@color/lifinity_text"
                android:textSize="27sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="18dp"
                android:text="Uma mensagem para fortalecer o teu dia."
                android:textColor="@color/lifinity_text_secondary"
                android:textSize="14sp" />

            <TextView
                android:id="@+id/inspirationErrorText"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginBottom="12dp"
                android:background="@drawable/bg_card_soft_clay"
                android:padding="14dp"
                android:textColor="@color/lifinity_danger"
                android:textSize="14sp"
                android:textStyle="bold"
                android:visibility="gone"
                tools:text="Não foi possível carregar inspiração." />

            <ProgressBar
                android:id="@+id/inspirationProgressBar"
                style="?android:attr/progressBarStyleLarge"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_gravity="center_horizontal"
                android:layout_marginTop="16dp"
                android:indeterminateTint="@color/lifinity_primary"
                android:visibility="gone" />

            <!-- Cartão do versículo -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="8dp"
                android:background="@drawable/bg_card_clay"
                android:elevation="10dp"
                android:orientation="vertical"
                android:padding="24dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:gravity="center_vertical"
                    android:orientation="horizontal">

                    <TextView
                        android:id="@+id/inspirationCardModeText"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:layout_weight="1"
                        android:text="Versículo do Dia"
                        android:textColor="@color/lifinity_primary"
                        android:textSize="12sp"
                        android:textStyle="bold"
                        android:letterSpacing="0.1" />

                    <TextView
                        android:id="@+id/inspirationThemeText"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:background="@drawable/bg_pill_mint"
                        android:paddingStart="10dp"
                        android:paddingEnd="10dp"
                        android:paddingTop="4dp"
                        android:paddingBottom="4dp"
                        android:text="Geral"
                        android:textColor="@color/lifinity_primary"
                        android:textSize="12sp"
                        android:textStyle="bold" />
                </LinearLayout>

                <!-- Citação decorativa -->
                <TextView
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="20dp"
                    android:text="&#8220;"
                    android:textColor="@color/lifinity_primary"
                    android:textSize="52sp"
                    android:lineSpacingMultiplier="0.4"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/inspirationVerseText"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:lineSpacingExtra="5dp"
                    android:text="A carregar versículo..."
                    android:textColor="@color/lifinity_text"
                    android:textSize="22sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/inspirationReferenceText"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="16dp"
                    android:textColor="@color/lifinity_text_secondary"
                    android:textSize="14sp"
                    android:textStyle="bold"
                    tools:text="João 3:16" />

                <Button
                    android:id="@+id/favoriteVerseButton"
                    android:layout_width="match_parent"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginTop="24dp"
                    android:background="@drawable/btn_primary_clay"
                    android:elevation="8dp"
                    android:text="Favoritar"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text_on_primary"
                    android:textSize="16sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/randomVerseButton"
                    android:layout_width="match_parent"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginTop="12dp"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Versículo aleatório"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="16sp"
                    android:textStyle="bold" />

                <Button
                    android:id="@+id/dailyVerseButton"
                    android:layout_width="match_parent"
                    android:layout_height="@dimen/height_button"
                    android:layout_marginTop="12dp"
                    android:background="@drawable/btn_secondary_clay"
                    android:elevation="6dp"
                    android:text="Voltar ao diário"
                    android:textAllCaps="false"
                    android:textColor="@color/lifinity_text"
                    android:textSize="16sp"
                    android:textStyle="bold" />
            </LinearLayout>

            <!-- Cartão de favoritos -->
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:layout_marginTop="16dp"
                android:layout_marginBottom="16dp"
                android:background="@drawable/bg_card_clay"
                android:elevation="10dp"
                android:orientation="vertical"
                android:padding="24dp">

                <TextView
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:letterSpacing="0.13"
                    android:text="FAVORITOS"
                    android:textColor="@color/lifinity_text_secondary"
                    android:textSize="11sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/inspirationFavoritesEmptyText"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="14dp"
                    android:background="@drawable/bg_card_soft_clay"
                    android:gravity="center"
                    android:padding="18dp"
                    android:text="Ainda não tens versículos favoritos."
                    android:textColor="@color/lifinity_text_secondary"
                    android:textSize="14sp" />

                <LinearLayout
                    android:id="@+id/inspirationFavoritesContainer"
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="14dp"
                    android:orientation="vertical" />
            </LinearLayout>

        </LinearLayout>
    </ScrollView>

    <!-- Barra de navegação inferior -->
    <include
        layout="@layout/nav_bottom"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />
</LinearLayout>
```

### 3.2 — Atualizar InspirationActivity.java

- [ ] Adicionar o import de `BottomNavHelper` ao topo do ficheiro:
```java
import com.lifinity.app.BottomNavHelper;
```

- [ ] No método `onCreate`, antes do `loadVerse()` ou logo antes do fim do método, adicionar:
```java
BottomNavHelper.setup(this, BottomNavHelper.Tab.INSPIRATION);
```

- [ ] Verificar se existe um `setupHeaderUserPill()` ou similar em `InspirationActivity.java`. Se não existir, adicionar na `onCreate` após `setContentView`:
```java
User currentUser = getSavedUser();
TextView headerUserPill = findViewById(R.id.headerUserPill);
if (currentUser != null && headerUserPill != null) {
    headerUserPill.setText(currentUser.getUsername() + " · NÍV " + currentUser.getLevel());
}
```
> Se `getSavedUser()` não existir em InspirationActivity, copiar o método de `RankingActivity.java` (idêntico — lê SharedPreferences e deserializa User).

### 3.3 — Compilar e testar

- [ ] Build → Make Project
- [ ] No emulador: abrir Inspiração → confirmar que bottom nav aparece e que o tab "Inspiração" fica ativo (cor menta)

### 3.4 — Commit

```
git add android/LifinityAndroid/app/src/main/res/layout/activity_inspiration.xml
git add android/LifinityAndroid/app/src/main/java/com/lifinity/app/InspirationActivity.java
git commit -m "Android: adiciona bottom nav ao ecrã de Inspiração"
```

---

## Task 4: Perfil — adicionar bottom nav

**Files:**
- Modify: `res/layout/activity_profile.xml`
- Modify: `java/com/lifinity/app/ProfileActivity.java`

### 4.1 — Reestruturar activity_profile.xml

- [ ] Substituir **todo** o conteúdo de `activity_profile.xml`.

A lógica é a mesma da Task 3: envolver o `ScrollView` existente numa `LinearLayout` root com header + nav.

O layout actual tem `ScrollView` como raiz. A nova estrutura é:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/bg_app_clay"
    android:clipChildren="false"
    android:clipToPadding="false"
    android:orientation="vertical"
    tools:context=".ProfileActivity">

    <!-- Header (padrão) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:gravity="center_vertical"
        android:orientation="horizontal"
        android:paddingStart="20dp"
        android:paddingEnd="20dp"
        android:paddingTop="16dp"
        android:paddingBottom="12dp">

        <LinearLayout
            android:layout_width="0dp"
            android:layout_height="wrap_content"
            android:layout_weight="1"
            android:gravity="center_vertical"
            android:orientation="horizontal">

            <TextView
                android:layout_width="36dp"
                android:layout_height="36dp"
                android:background="@drawable/bg_pill_mint"
                android:gravity="center"
                android:text="&#8734;"
                android:textColor="@color/lifinity_primary"
                android:textSize="18sp"
                android:textStyle="bold" />

            <TextView
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_marginStart="8dp"
                android:text="Lifinity"
                android:textColor="@color/lifinity_text"
                android:textSize="18sp"
                android:textStyle="bold" />
        </LinearLayout>
    </LinearLayout>

    <!-- ScrollView com todo o conteúdo existente -->
    <ScrollView
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:fillViewport="true">

        <!-- MANTER O CONTEÚDO ACTUAL do ScrollView sem alterações -->
        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="vertical"
            android:padding="@dimen/space_screen">

            <!-- [TODO: colar aqui o conteúdo interior do activity_profile.xml existente]
                 Desde o TextView "Perfil" até ao Button "Terminar sessão"
                 Não apagar nenhum id existente -->

        </LinearLayout>
    </ScrollView>

    <!-- Barra de navegação inferior -->
    <include
        layout="@layout/nav_bottom"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />
</LinearLayout>
```

> **Instrução prática:** Abrir `activity_profile.xml`, copiar tudo **dentro** do `<LinearLayout>` filho do `ScrollView` (o que contém os elementos Perfil, avatar, nível, XP, etc.) e colar no lugar do comentário `[TODO]` acima. Manter todos os `android:id` existentes inalterados.

### 4.2 — Atualizar ProfileActivity.java

- [ ] Adicionar import de `BottomNavHelper`:
```java
import com.lifinity.app.BottomNavHelper;
```

- [ ] Na `onCreate`, após `setContentView`, adicionar:
```java
BottomNavHelper.setup(this, BottomNavHelper.Tab.PROFILE);
```

- [ ] Remover os botões de navegação que já não são necessários (os botões "Ver atividades", "Inspiração" no layout são substituídos pelo bottom nav). Esses botões podem ficar ou ser removidos — opcional.

### 4.3 — Compilar e testar

- [ ] Build → Make Project
- [ ] No emulador: abrir Perfil → confirmar que bottom nav aparece, tab "Perfil" ativo

### 4.4 — Commit

```
git add android/LifinityAndroid/app/src/main/res/layout/activity_profile.xml
git add android/LifinityAndroid/app/src/main/java/com/lifinity/app/ProfileActivity.java
git commit -m "Android: adiciona bottom nav ao ecrã de Perfil"
```

---

## Verificação Final

- [ ] **Testar fluxo completo no emulador:**
  1. Login → abre TasksActivity (tab Tarefas ativo)
  2. Tap no tab Ranking → abre RankingActivity (tab Ranking ativo)
  3. Tap no tab Inspiração → abre InspirationActivity (tab Inspiração ativo)
  4. Tap no tab Perfil → abre ProfileActivity (tab Perfil ativo)
  5. Em qualquer ecrã, tap no FAB "+" → abre CreateTaskActivity
  6. Voltar do FAB → regressa ao ecrã anterior com o tab correto ativo
- [ ] **Confirmar que o backend está a correr** (XAMPP MySQL + `node index.js`) antes de testar API calls (ranking, versículo)
- [ ] **Verificar User.getIduser()** existe no modelo `User.java` — necessário para o highlight do utilizador atual no Ranking

---

## Notas de implementação

- O `switch` com pattern matching de Tab no `BottomNavHelper` requer Java 14+ com preview ou Java 21. Se a versão do projeto for inferior, substituir por `if/else if`.
- A versão atual de `TasksActivity.setupBottomNav()` mostra um Toast para o Ranking — esta é substituída pelo `BottomNavHelper` na Task 1.
- Os ecrãs secundários (Achievements, Settings, EditTask, Notifications, Statistics, Assistant, Chat) não têm bottom nav — estão corretos assim, pois são acedidos via gestos de retrocesso ou botões dentro dos ecrãs principais.
