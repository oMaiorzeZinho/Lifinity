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

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView emptyText;
    private RecyclerView achievementsRecyclerView;
    private AchievementAdapter achievementAdapter;
    private Call<JsonObject> checkAchievementsCall;
    private Call<List<Achievement>> achievementsCall;

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

        achievementAdapter.setAchievements(achievements);

        if (achievements.isEmpty()) {
            emptyText.setVisibility(View.VISIBLE);
            achievementsRecyclerView.setVisibility(View.GONE);
        } else {
            emptyText.setVisibility(View.GONE);
            achievementsRecyclerView.setVisibility(View.VISIBLE);
        }
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
        super.onDestroy();
    }
}
