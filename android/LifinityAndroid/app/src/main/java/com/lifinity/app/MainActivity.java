package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.lifinity.app.models.User;

public class MainActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN  = "token";
    private static final String KEY_USER   = "user";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Se não houver token, redireciona para o login
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_main);

        // Mostra saudação com o nome do utilizador guardado
        TextView greetingText = findViewById(R.id.greetingText);
        greetingText.setText("Olá, " + getSavedUsername() + "!");

        // ── Grelha de navegação ──────────────────────────────────────────────
        findViewById(R.id.btnTasks).setOnClickListener(v ->
                startActivity(new Intent(this, TasksActivity.class)));

        findViewById(R.id.btnRanking).setOnClickListener(v ->
                startActivity(new Intent(this, RankingActivity.class)));

        findViewById(R.id.btnProfile).setOnClickListener(v ->
                startActivity(new Intent(this, ProfileActivity.class)));

        findViewById(R.id.btnStatistics).setOnClickListener(v ->
                startActivity(new Intent(this, StatisticsActivity.class)));

        findViewById(R.id.btnInspiration).setOnClickListener(v ->
                startActivity(new Intent(this, InspirationActivity.class)));

        findViewById(R.id.btnNotifications).setOnClickListener(v ->
                startActivity(new Intent(this, NotificationsActivity.class)));

        findViewById(R.id.btnAssistant).setOnClickListener(v ->
                startActivity(new Intent(this, AssistantActivity.class)));

        findViewById(R.id.btnChat).setOnClickListener(v ->
                startActivity(new Intent(this, ConversationsActivity.class)));

        findViewById(R.id.btnAchievements).setOnClickListener(v ->
                startActivity(new Intent(this, AchievementsActivity.class)));

        findViewById(R.id.btnSettings).setOnClickListener(v ->
                startActivity(new Intent(this, SettingsActivity.class)));

        // ── Logout ───────────────────────────────────────────────────────────
        findViewById(R.id.logoutButton).setOnClickListener(v -> logout());
    }

    // Lê o nome do utilizador guardado nas SharedPreferences.
    private String getSavedUsername() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String json = prefs.getString(KEY_USER, null);
        if (TextUtils.isEmpty(json)) return "Utilizador";
        try {
            User user = new Gson().fromJson(json, User.class);
            return (user != null && !TextUtils.isEmpty(user.getUsername()))
                    ? user.getUsername()
                    : "Utilizador";
        } catch (Exception e) {
            return "Utilizador";
        }
    }

    // Limpa as preferências guardadas e redireciona para o ecrã de login.
    private void logout() {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().clear().apply();
        openLoginActivity();
    }

    private String getToken() {
        return getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(KEY_TOKEN, null);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
