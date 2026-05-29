package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.lifinity.app.api.StatisticsApi;
import com.lifinity.app.models.StatisticsDay;
import com.lifinity.app.models.StatisticsResponse;
import com.lifinity.app.models.StatisticsSummary;
import com.lifinity.app.network.ApiClient;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatisticsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView completionRateText;
    private TextView productivityScoreText;
    private TextView statTotalText;
    private TextView statCompletedText;
    private TextView statPendingText;
    private TextView statLostText;
    private TextView statXpText;
    private LinearLayout chartContainer;
    private TextView chartEmptyText;

    private Call<StatisticsResponse> statisticsCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_statistics);

        progressBar = findViewById(R.id.statisticsProgressBar);
        errorText = findViewById(R.id.statisticsErrorText);
        completionRateText = findViewById(R.id.completionRateText);
        productivityScoreText = findViewById(R.id.productivityScoreText);
        statTotalText = findViewById(R.id.statTotalText);
        statCompletedText = findViewById(R.id.statCompletedText);
        statPendingText = findViewById(R.id.statPendingText);
        statLostText = findViewById(R.id.statLostText);
        statXpText = findViewById(R.id.statXpText);
        chartContainer = findViewById(R.id.statisticsChartContainer);
        chartEmptyText = findViewById(R.id.statisticsChartEmptyText);

        findViewById(R.id.statisticsBackButton).setOnClickListener(v -> finish());

        loadStatistics();
    }

    private void loadStatistics() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);

        StatisticsApi api = ApiClient.getClient().create(StatisticsApi.class);
        statisticsCall = api.getMyStatistics("Bearer " + token, "30d");
        statisticsCall.enqueue(new Callback<StatisticsResponse>() {
            @Override
            public void onResponse(Call<StatisticsResponse> call, Response<StatisticsResponse> response) {
                progressBar.setVisibility(View.GONE);
                if (!response.isSuccessful() || response.body() == null || response.body().getSummary() == null) {
                    showError("Não foi possível carregar estatísticas.");
                    return;
                }
                bindSummary(response.body().getSummary());
                buildChart(response.body().getChartData());
            }

            @Override
            public void onFailure(Call<StatisticsResponse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    private void bindSummary(StatisticsSummary summary) {
        completionRateText.setText(String.valueOf(Math.round(summary.getCompletionRate())));
        productivityScoreText.setText("Produtividade " + Math.round(summary.getProductivityScore()));
        statTotalText.setText(String.valueOf(summary.getTotalTasks()));
        statCompletedText.setText(String.valueOf(summary.getCompletedTasks()));
        statPendingText.setText(String.valueOf(summary.getPendingTasks()));
        statLostText.setText(String.valueOf(summary.getLostTasks()));
        statXpText.setText(String.valueOf(summary.getTotalXP()));
    }

    private void buildChart(List<StatisticsDay> days) {
        chartContainer.removeAllViews();

        if (days == null || days.isEmpty()) {
            chartEmptyText.setVisibility(View.VISIBLE);
            return;
        }

        List<StatisticsDay> last7 = days.size() > 7
                ? days.subList(days.size() - 7, days.size())
                : days;

        int max = 0;
        for (StatisticsDay day : last7) {
            max = Math.max(max, day.getTasksCompleted());
        }

        chartEmptyText.setVisibility(max > 0 ? View.GONE : View.VISIBLE);

        int maxBarPx = dp(110);
        int textColor = getResources().getColor(R.color.lifinity_primary, getTheme());
        int labelColor = getResources().getColor(R.color.lifinity_text_secondary, getTheme());

        for (StatisticsDay day : last7) {
            LinearLayout column = new LinearLayout(this);
            column.setOrientation(LinearLayout.VERTICAL);
            column.setGravity(Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
            LinearLayout.LayoutParams columnParams = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.MATCH_PARENT, 1f);
            column.setLayoutParams(columnParams);

            TextView value = new TextView(this);
            value.setText(String.valueOf(day.getTasksCompleted()));
            value.setTextColor(textColor);
            value.setTextSize(11);
            value.setTypeface(value.getTypeface(), android.graphics.Typeface.BOLD);
            value.setGravity(Gravity.CENTER);
            column.addView(value);

            View bar = new View(this);
            int barHeight = max > 0
                    ? Math.max(dp(4), Math.round((day.getTasksCompleted() / (float) max) * maxBarPx))
                    : dp(4);
            LinearLayout.LayoutParams barParams = new LinearLayout.LayoutParams(dp(18), barHeight);
            barParams.gravity = Gravity.CENTER_HORIZONTAL;
            barParams.topMargin = dp(4);
            barParams.bottomMargin = dp(6);
            bar.setLayoutParams(barParams);
            bar.setBackgroundResource(R.drawable.bg_bar_clay);
            column.addView(bar);

            TextView label = new TextView(this);
            label.setText(day.getLabel());
            label.setTextColor(labelColor);
            label.setTextSize(9);
            label.setMaxLines(1);
            label.setGravity(Gravity.CENTER);
            column.addView(label);

            chartContainer.addView(column);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
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
        if (statisticsCall != null) {
            statisticsCall.cancel();
        }
        super.onDestroy();
    }
}
