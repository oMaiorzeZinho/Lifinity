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

        User currentUser = getSavedUser();
        if (currentUser != null && headerUserPill != null) {
            headerUserPill.setText(currentUser.getUsername() + " · NÍV " + currentUser.getLevel());
        }

        BottomNavHelper.setup(this, BottomNavHelper.Tab.RANKING);
        HeaderHelper.setupBell(this);
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

        int currentUserId = -1;
        User u = getSavedUser();
        if (u != null && u.getIduser() != null) currentUserId = u.getIduser();

        recyclerView.setAdapter(new RankingAdapter(users, currentUserId));
        listLabel.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.VISIBLE);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private User getSavedUser() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        String json = prefs.getString(KEY_USER, null);
        if (TextUtils.isEmpty(json)) return null;
        try { return new Gson().fromJson(json, User.class); }
        catch (Exception e) { return null; }
    }
}
