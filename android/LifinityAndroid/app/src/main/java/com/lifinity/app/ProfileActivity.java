package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.lifinity.app.models.User;

public class ProfileActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";
    private static final String NOT_AVAILABLE = "Nao disponivel";

    private final Gson gson = new Gson();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_profile);

        User user = getSavedUser();
        bindUser(user);

        findViewById(R.id.profileTasksButton).setOnClickListener(v -> openTasksActivity());
        findViewById(R.id.profileSettingsButton).setOnClickListener(v -> openSettingsActivity());
        findViewById(R.id.profileLogoutButton).setOnClickListener(v -> logout());
    }

    @Override
    protected void onResume() {
        super.onResume();

        if (!TextUtils.isEmpty(getToken())) {
            bindUser(getSavedUser());
        }
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private User getSavedUser() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String savedUser = preferences.getString(KEY_USER, null);
        if (TextUtils.isEmpty(savedUser)) {
            return null;
        }

        try {
            return gson.fromJson(savedUser, User.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void bindUser(User user) {
        String username = user == null ? null : user.getUsername();
        String email = user == null ? null : user.getEmail();
        Integer level = user == null ? null : user.getLevel();
        Integer xp = user == null ? null : user.getXp();

        TextView avatarText = findViewById(R.id.profileAvatarText);
        TextView usernameText = findViewById(R.id.profileUsernameText);
        TextView emailText = findViewById(R.id.profileEmailText);
        TextView levelText = findViewById(R.id.profileLevelText);
        TextView xpText = findViewById(R.id.profileXpText);

        avatarText.setText(getInitial(username));
        usernameText.setText(valueOrFallback(username));
        emailText.setText(valueOrFallback(email));
        levelText.setText(level == null ? NOT_AVAILABLE : String.valueOf(level));
        xpText.setText(xp == null ? NOT_AVAILABLE : String.valueOf(xp));
    }

    private String getInitial(String username) {
        if (TextUtils.isEmpty(username)) {
            return "?";
        }

        String trimmedUsername = username.trim();
        if (TextUtils.isEmpty(trimmedUsername)) {
            return "?";
        }

        return trimmedUsername.substring(0, 1).toUpperCase();
    }

    private String valueOrFallback(String value) {
        if (TextUtils.isEmpty(value)) {
            return NOT_AVAILABLE;
        }

        return value;
    }

    private void openTasksActivity() {
        Intent intent = new Intent(this, TasksActivity.class);
        startActivity(intent);
    }

    private void openSettingsActivity() {
        Intent intent = new Intent(this, SettingsActivity.class);
        startActivity(intent);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void logout() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        preferences.edit()
                .remove(KEY_TOKEN)
                .remove(KEY_USER)
                .apply();

        openLoginActivity();
    }
}
