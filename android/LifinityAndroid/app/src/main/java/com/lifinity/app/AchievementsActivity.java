package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lifinity.app.adapters.AchievementAdapter;
import com.lifinity.app.api.AchievementApi;
import com.lifinity.app.models.Achievement;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AchievementsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final int MAX_HIGHLIGHTS = 3;

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView emptyText;
    private RecyclerView achievementsRecyclerView;
    private AchievementAdapter achievementAdapter;
    private Call<JsonObject> checkAchievementsCall;
    private Call<List<Achievement>> achievementsCall;
    private Call<JsonObject> updateHighlightsCall;

    // Última lista de conquistas recebida — base para calcular os destaques atuais.
    private final List<Achievement> currentAchievements = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_achievements);

        // Botão voltar
        findViewById(R.id.achievementsBackButton).setOnClickListener(v -> finish());

        progressBar = findViewById(R.id.achievementsProgressBar);
        errorText = findViewById(R.id.achievementsErrorText);
        emptyText = findViewById(R.id.achievementsEmptyText);
        achievementsRecyclerView = findViewById(R.id.achievementsRecyclerView);

        achievementAdapter = new AchievementAdapter();
        // Ao tocar em "Destacar"/"Remover destaque" de uma conquista desbloqueada.
        achievementAdapter.setOnHighlightClickListener(this::onHighlightClick);
        achievementsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        achievementsRecyclerView.setAdapter(achievementAdapter);

        loadAchievements(token);
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void loadAchievements(String token) {
        showLoading();

        AchievementApi achievementApi = ApiClient.getClient().create(AchievementApi.class);
        checkAchievementsCall = achievementApi.checkAchievements("Bearer " + token);
        checkAchievementsCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                fetchAchievements(achievementApi, token);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                fetchAchievements(achievementApi, token);
            }
        });
    }

    private void fetchAchievements(AchievementApi achievementApi, String token) {
        achievementsCall = achievementApi.getAchievements("Bearer " + token);
        achievementsCall.enqueue(new Callback<List<Achievement>>() {
            @Override
            public void onResponse(Call<List<Achievement>> call, Response<List<Achievement>> response) {
                if (!response.isSuccessful()) {
                    showError("Nao foi possivel carregar conquistas.");
                    return;
                }

                List<Achievement> achievements = response.body();
                bindAchievements(achievements == null ? new ArrayList<>() : achievements);
            }

            @Override
            public void onFailure(Call<List<Achievement>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                showError("Nao foi possivel carregar conquistas. Confirma que o backend esta ativo.");
            }
        });
    }

    private void bindAchievements(List<Achievement> achievements) {
        progressBar.setVisibility(View.GONE);
        errorText.setVisibility(View.GONE);

        currentAchievements.clear();
        currentAchievements.addAll(achievements);

        achievementAdapter.setAchievements(achievements);

        if (achievements.isEmpty()) {
            emptyText.setVisibility(View.VISIBLE);
            achievementsRecyclerView.setVisibility(View.GONE);
        } else {
            emptyText.setVisibility(View.GONE);
            achievementsRecyclerView.setVisibility(View.VISIBLE);
        }
    }

    // ───────── Destacar conquistas (PUT /achievements/highlights, máx. 3) ─────────

    /** Decisão ao tocar no botão de destaque de uma conquista desbloqueada. */
    private void onHighlightClick(Achievement achievement) {
        if (achievement == null || achievement.getIdbadge() == null || !achievement.isUnlocked()) {
            return;
        }

        List<Achievement> highlights = getCurrentHighlights();

        // Já está destacada → remover (toggle).
        if (achievement.isHighlighted()) {
            List<Achievement> updated = new ArrayList<>();
            for (Achievement highlight : highlights) {
                if (!sameBadge(highlight, achievement)) {
                    updated.add(highlight);
                }
            }
            submitHighlights(updated);
            return;
        }

        // Ainda não destacada → adicionar se houver espaço...
        if (highlights.size() < MAX_HIGHLIGHTS) {
            List<Achievement> updated = new ArrayList<>(highlights);
            updated.add(achievement);
            submitHighlights(updated);
            return;
        }

        // ...senão, perguntar qual dos 3 atuais substituir.
        promptReplaceHighlight(highlights, achievement);
    }

    /** Diálogo (tema claro) que lista os 3 destaques atuais para o utilizador escolher qual substituir. */
    private void promptReplaceHighlight(List<Achievement> highlights, Achievement newAchievement) {
        CharSequence[] names = new CharSequence[highlights.size()];
        for (int i = 0; i < highlights.size(); i++) {
            Achievement highlight = highlights.get(i);
            String name = highlight == null ? null : highlight.getName();
            names[i] = TextUtils.isEmpty(name) ? "Conquista" : name;
        }

        new AlertDialog.Builder(this)
                .setTitle("Substituir destaque")
                .setItems(names, (dialog, which) -> {
                    List<Achievement> updated = new ArrayList<>(highlights);
                    // Substitui na MESMA posição da lista (as posições 1..3 são reatribuídas ao enviar).
                    updated.set(which, newAchievement);
                    submitHighlights(updated);
                })
                .setNegativeButton("Cancelar", null)
                .show();
    }

    /** Destaques atuais (desbloqueados e marcados), ordenados pela posição 1..3. */
    private List<Achievement> getCurrentHighlights() {
        List<Achievement> highlights = new ArrayList<>();
        for (Achievement achievement : currentAchievements) {
            if (achievement != null && achievement.isUnlocked() && achievement.isHighlighted()) {
                highlights.add(achievement);
            }
        }

        highlights.sort((first, second) -> Integer.compare(
                first.getPosition() == null ? 99 : first.getPosition(),
                second.getPosition() == null ? 99 : second.getPosition()
        ));
        return highlights;
    }

    /** Envia a lista final de destaques (posições reatribuídas 1..n) ao backend. */
    private void submitHighlights(List<Achievement> highlights) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        // Segurança extra (o backend também valida): nunca mais de 3.
        if (highlights.size() > MAX_HIGHLIGHTS) {
            Toast.makeText(this, "So podes destacar ate 3 conquistas.", Toast.LENGTH_LONG).show();
            return;
        }

        JsonArray array = new JsonArray();
        int position = 1;
        for (Achievement achievement : highlights) {
            if (achievement == null || achievement.getIdbadge() == null) {
                continue;
            }

            JsonObject entry = new JsonObject();
            entry.addProperty("idbadge", achievement.getIdbadge());
            entry.addProperty("position", position);
            array.add(entry);
            position++;
        }

        JsonObject body = new JsonObject();
        body.add("highlights", array);

        AchievementApi achievementApi = ApiClient.getClient().create(AchievementApi.class);
        if (updateHighlightsCall != null) {
            updateHighlightsCall.cancel();
        }
        updateHighlightsCall = achievementApi.updateHighlights("Bearer " + token, body);
        updateHighlightsCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (!response.isSuccessful()) {
                    Toast.makeText(AchievementsActivity.this,
                            "Nao foi possivel atualizar os destaques.", Toast.LENGTH_LONG).show();
                    return;
                }

                Toast.makeText(AchievementsActivity.this,
                        "Destaques atualizados.", Toast.LENGTH_SHORT).show();
                // Recarrega para refletir os novos estados (selo/lista) — o Perfil também
                // relê os destaques ao voltar (onResume), por isso mostrará as novas escolhas.
                fetchAchievements(achievementApi, token);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                Toast.makeText(AchievementsActivity.this,
                        "Falha de rede ao atualizar destaques.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private boolean sameBadge(Achievement first, Achievement second) {
        return first != null
                && second != null
                && first.getIdbadge() != null
                && first.getIdbadge().equals(second.getIdbadge());
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);
        achievementsRecyclerView.setVisibility(View.GONE);
    }

    private void showError(String message) {
        progressBar.setVisibility(View.GONE);
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);
        achievementsRecyclerView.setVisibility(View.GONE);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    protected void onDestroy() {
        if (checkAchievementsCall != null) {
            checkAchievementsCall.cancel();
        }
        if (achievementsCall != null) {
            achievementsCall.cancel();
        }
        if (updateHighlightsCall != null) {
            updateHighlightsCall.cancel();
        }
        super.onDestroy();
    }
}
