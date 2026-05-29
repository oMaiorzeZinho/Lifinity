package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.api.AchievementApi;
import com.lifinity.app.api.TaskApi;
import com.lifinity.app.models.Achievement;
import com.lifinity.app.models.Task;
import com.lifinity.app.models.User;
import com.lifinity.app.network.ApiClient;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user";
    private static final String NOT_AVAILABLE = "Nao disponivel";

    private final Gson gson = new Gson();

    private TextView avatarText;
    private TextView usernameText;
    private TextView emailText;
    private TextView levelText;
    private TextView xpText;
    private TextView levelProgressLabel;
    private ProgressBar levelProgressBar;
    private TextView activitySummaryStatusText;
    private TextView totalActivitiesText;
    private TextView completedActivitiesText;
    private TextView pendingActivitiesText;
    private TextView lostActivitiesText;
    private TextView achievementsSummaryText;
    private LinearLayout achievement1Container;
    private LinearLayout achievement2Container;
    private LinearLayout achievement3Container;
    private TextView achievement1Title;
    private TextView achievement1Description;
    private TextView achievement2Title;
    private TextView achievement2Description;
    private TextView achievement3Title;
    private TextView achievement3Description;

    private Call<List<Task>> tasksCall;
    private Call<JsonObject> checkAchievementsCall;
    private Call<List<Achievement>> achievementsCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_profile);
        BottomNavHelper.setup(this, BottomNavHelper.Tab.PROFILE);
        HeaderHelper.setupBell(this);
        bindViews();
        setupButtons();
        bindUser(getSavedUser());
        showActivitySummaryLoading();
        showAchievementsLoading();
    }

    @Override
    protected void onResume() {
        super.onResume();

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        if (avatarText == null) {
            return;
        }

        bindUser(getSavedUser());
        loadActivitySummary(token);
        loadAchievements(token);
    }

    private void bindViews() {
        avatarText = findViewById(R.id.profileAvatarText);
        usernameText = findViewById(R.id.profileUsernameText);
        emailText = findViewById(R.id.profileEmailText);
        levelText = findViewById(R.id.profileLevelText);
        xpText = findViewById(R.id.profileXpText);
        levelProgressLabel = findViewById(R.id.profileLevelProgressLabel);
        levelProgressBar = findViewById(R.id.profileLevelProgressBar);
        activitySummaryStatusText = findViewById(R.id.profileActivitySummaryStatusText);
        totalActivitiesText = findViewById(R.id.profileTotalActivitiesText);
        completedActivitiesText = findViewById(R.id.profileCompletedActivitiesText);
        pendingActivitiesText = findViewById(R.id.profilePendingActivitiesText);
        lostActivitiesText = findViewById(R.id.profileLostActivitiesText);
        achievementsSummaryText = findViewById(R.id.profileAchievementsSummaryText);
        achievement1Container = findViewById(R.id.profileAchievement1Container);
        achievement2Container = findViewById(R.id.profileAchievement2Container);
        achievement3Container = findViewById(R.id.profileAchievement3Container);
        achievement1Title = findViewById(R.id.profileAchievement1Title);
        achievement1Description = findViewById(R.id.profileAchievement1Description);
        achievement2Title = findViewById(R.id.profileAchievement2Title);
        achievement2Description = findViewById(R.id.profileAchievement2Description);
        achievement3Title = findViewById(R.id.profileAchievement3Title);
        achievement3Description = findViewById(R.id.profileAchievement3Description);
    }

    private void setupButtons() {
        findViewById(R.id.profileTasksButton).setOnClickListener(v -> openTasksActivity());
        findViewById(R.id.profileAchievementsButton).setOnClickListener(v -> openAchievementsActivity());
        findViewById(R.id.profileInspirationButton).setOnClickListener(v -> openInspirationActivity());
        findViewById(R.id.profileSettingsButton).setOnClickListener(v -> openSettingsActivity());
        findViewById(R.id.profileLogoutButton).setOnClickListener(v -> logout());

        findViewById(R.id.headerSettingsIcon).setOnClickListener(v -> openSettingsActivity());
        findViewById(R.id.profileMenuAssistant).setOnClickListener(v ->
                startActivity(new Intent(ProfileActivity.this, AssistantActivity.class)));
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
        Integer xp = user == null ? null : user.getXp();
        Integer level = user == null ? null : user.getLevel();
        int safeXp = xp == null ? 0 : Math.max(xp, 0);
        int displayLevel = level == null ? calculateLevelFromXp(safeXp) : Math.max(level, 1);

        avatarText.setText(getInitial(username));
        usernameText.setText(valueOrFallback(username));
        emailText.setText(valueOrFallback(email));
        levelText.setText(String.valueOf(displayLevel));
        xpText.setText(xp == null ? NOT_AVAILABLE : String.valueOf(safeXp));
        bindLevelProgress(safeXp, displayLevel, xp != null);
    }

    private void bindLevelProgress(int xp, int level, boolean hasXp) {
        if (!hasXp) {
            levelProgressBar.setProgress(0);
            levelProgressLabel.setText("Progresso de nivel indisponivel.");
            return;
        }

        int currentLevelXp = calculateXpForLevel(level);
        int nextLevelXp = calculateXpForLevel(level + 1);
        int levelSpan = Math.max(nextLevelXp - currentLevelXp, 1);
        int progress = Math.round(((xp - currentLevelXp) * 100f) / levelSpan);
        progress = Math.max(0, Math.min(progress, 100));

        levelProgressBar.setProgress(progress);
        levelProgressLabel.setText(Math.max(nextLevelXp - xp, 0) + " XP para nivel " + (level + 1));
    }

    private int calculateLevelFromXp(int xp) {
        int level = 1;
        while (xp >= calculateXpForLevel(level + 1)) {
            level++;
        }
        return level;
    }

    private int calculateXpForLevel(int level) {
        if (level <= 1) {
            return 0;
        }

        return (int) Math.floor(100 * Math.pow(level - 1, 1.5));
    }

    private void showActivitySummaryLoading() {
        activitySummaryStatusText.setText("A carregar atividades...");
        totalActivitiesText.setText("-");
        completedActivitiesText.setText("-");
        pendingActivitiesText.setText("-");
        lostActivitiesText.setText("-");
    }

    private void loadActivitySummary(String token) {
        if (tasksCall != null) {
            tasksCall.cancel();
        }

        showActivitySummaryLoading();

        TaskApi taskApi = ApiClient.getClient().create(TaskApi.class);
        tasksCall = taskApi.getTasks("Bearer " + token);
        tasksCall.enqueue(new Callback<List<Task>>() {
            @Override
            public void onResponse(Call<List<Task>> call, Response<List<Task>> response) {
                if (!response.isSuccessful()) {
                    activitySummaryStatusText.setText("Nao foi possivel carregar atividades.");
                    return;
                }

                List<Task> tasks = response.body();
                bindActivitySummary(tasks == null ? new ArrayList<>() : tasks);
            }

            @Override
            public void onFailure(Call<List<Task>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                activitySummaryStatusText.setText("Nao foi possivel carregar atividades.");
            }
        });
    }

    private void bindActivitySummary(List<Task> tasks) {
        int completed = 0;
        int pending = 0;
        int lost = 0;

        for (Task task : tasks) {
            if (isTaskCompleted(task)) {
                completed++;
            } else if (isTaskLost(task)) {
                lost++;
            } else {
                pending++;
            }
        }

        totalActivitiesText.setText(String.valueOf(tasks.size()));
        completedActivitiesText.setText(String.valueOf(completed));
        pendingActivitiesText.setText(String.valueOf(pending));
        lostActivitiesText.setText(String.valueOf(lost));
        activitySummaryStatusText.setText(tasks.isEmpty()
                ? "Ainda nao tens atividades visiveis."
                : "Resumo calculado a partir das atividades visiveis.");
    }

    private void showAchievementsLoading() {
        achievementsSummaryText.setText("A carregar conquistas...");
        hideAchievementRows();
    }

    private void loadAchievements(String token) {
        if (checkAchievementsCall != null) {
            checkAchievementsCall.cancel();
        }
        if (achievementsCall != null) {
            achievementsCall.cancel();
        }

        showAchievementsLoading();

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
                    showAchievementsUnavailable();
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

                showAchievementsUnavailable();
            }
        });
    }

    private void bindAchievements(List<Achievement> achievements) {
        List<Achievement> unlocked = new ArrayList<>();
        List<Achievement> highlighted = new ArrayList<>();

        for (Achievement achievement : achievements) {
            if (achievement == null || !achievement.isUnlocked()) {
                continue;
            }

            unlocked.add(achievement);
            if (achievement.isHighlighted()) {
                highlighted.add(achievement);
            }
        }

        highlighted.sort((first, second) -> Integer.compare(
                first.getPosition() == null ? 99 : first.getPosition(),
                second.getPosition() == null ? 99 : second.getPosition()
        ));
        unlocked.sort((first, second) -> compareEarnedAtDescending(first, second));

        List<Achievement> displayedAchievements = new ArrayList<>();
        Set<Integer> displayedIds = new HashSet<>();
        addDisplayAchievements(displayedAchievements, displayedIds, highlighted);
        addDisplayAchievements(displayedAchievements, displayedIds, unlocked);

        achievementsSummaryText.setText(unlocked.size()
                + " de "
                + achievements.size()
                + " conquistas desbloqueadas.");

        if (displayedAchievements.isEmpty()) {
            hideAchievementRows();
            return;
        }

        bindAchievementRow(achievement1Container, achievement1Title, achievement1Description, displayedAchievements, 0);
        bindAchievementRow(achievement2Container, achievement2Title, achievement2Description, displayedAchievements, 1);
        bindAchievementRow(achievement3Container, achievement3Title, achievement3Description, displayedAchievements, 2);
    }

    private void addDisplayAchievements(
            List<Achievement> displayedAchievements,
            Set<Integer> displayedIds,
            List<Achievement> source
    ) {
        for (Achievement achievement : source) {
            if (displayedAchievements.size() >= 3) {
                return;
            }

            Integer idbadge = achievement.getIdbadge();
            if (idbadge != null && displayedIds.contains(idbadge)) {
                continue;
            }

            displayedAchievements.add(achievement);
            if (idbadge != null) {
                displayedIds.add(idbadge);
            }
        }
    }

    private void bindAchievementRow(
            LinearLayout container,
            TextView titleText,
            TextView descriptionText,
            List<Achievement> achievements,
            int position
    ) {
        if (position >= achievements.size()) {
            container.setVisibility(View.GONE);
            return;
        }

        Achievement achievement = achievements.get(position);
        titleText.setText(valueOrFallback(achievement.getName(), "Conquista desbloqueada"));
        descriptionText.setText(valueOrFallback(achievement.getDescription(), "Continua a crescer no Lifinity."));
        container.setVisibility(View.VISIBLE);
    }

    private void hideAchievementRows() {
        achievement1Container.setVisibility(View.GONE);
        achievement2Container.setVisibility(View.GONE);
        achievement3Container.setVisibility(View.GONE);
    }

    private void showAchievementsUnavailable() {
        achievementsSummaryText.setText("Conquistas indisponiveis de momento.");
        hideAchievementRows();
    }

    private int compareEarnedAtDescending(Achievement first, Achievement second) {
        Date firstDate = parseDate(first.getEarnedAt());
        Date secondDate = parseDate(second.getEarnedAt());

        if (firstDate != null && secondDate != null) {
            return secondDate.compareTo(firstDate);
        }

        if (firstDate != null) {
            return -1;
        }

        if (secondDate != null) {
            return 1;
        }

        return Integer.compare(
                second.getIdbadge() == null ? 0 : second.getIdbadge(),
                first.getIdbadge() == null ? 0 : first.getIdbadge()
        );
    }

    private boolean isTaskCompleted(Task task) {
        if (task == null || TextUtils.isEmpty(task.getStatus())) {
            return false;
        }

        return "concluida".equals(task.getStatus().trim().toLowerCase(Locale.US));
    }

    private boolean isTaskLost(Task task) {
        if (task == null || isTaskCompleted(task)) {
            return false;
        }

        Date dueDate = parseDate(task.getDueDate());
        return dueDate != null && dueDate.before(new Date());
    }

    private Date parseDate(String value) {
        if (TextUtils.isEmpty(value)) {
            return null;
        }

        String[] patterns = {
                "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ssXXX",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm",
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd"
        };

        for (String pattern : patterns) {
            try {
                SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
                return format.parse(value);
            } catch (ParseException ignored) {
                // Try the next server date format.
            }
        }

        return null;
    }

    private String getInitial(String username) {
        if (TextUtils.isEmpty(username)) {
            return "?";
        }

        String trimmedUsername = username.trim();
        if (TextUtils.isEmpty(trimmedUsername)) {
            return "?";
        }

        return trimmedUsername.substring(0, 1).toUpperCase(Locale.US);
    }

    private String valueOrFallback(String value) {
        if (TextUtils.isEmpty(value)) {
            return NOT_AVAILABLE;
        }

        return value;
    }

    private String valueOrFallback(String value, String fallback) {
        if (TextUtils.isEmpty(value)) {
            return fallback;
        }

        return value;
    }

    private void openTasksActivity() {
        Intent intent = new Intent(this, TasksActivity.class);
        startActivity(intent);
    }

    private void openAchievementsActivity() {
        Intent intent = new Intent(this, AchievementsActivity.class);
        startActivity(intent);
    }

    private void openInspirationActivity() {
        Intent intent = new Intent(this, InspirationActivity.class);
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

    @Override
    protected void onDestroy() {
        if (tasksCall != null) {
            tasksCall.cancel();
        }
        if (checkAchievementsCall != null) {
            checkAchievementsCall.cancel();
        }
        if (achievementsCall != null) {
            achievementsCall.cancel();
        }
        super.onDestroy();
    }
}
