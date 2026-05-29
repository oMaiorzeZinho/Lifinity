package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;

import com.lifinity.app.api.StatisticsApi;
import com.lifinity.app.models.StatisticsSummary;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatisticsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN  = "token";

    // Opções do spinner — índice sincronizado com periodValues[]
    private static final String[] PERIOD_LABELS = {"Últimos 7 dias", "Últimos 30 dias", "Último ano"};
    private static final String[] PERIOD_VALUES = {"7d", "30d", "1y"};

    private ProgressBar progressBar;
    private TextView    errorText;
    private NestedScrollView scrollView;

    private TextView statTasksCompletedText;
    private TextView statTasksCreatedText;
    private TextView statTasksMissedText;
    private TextView statXpEarnedText;
    private TextView statStreakText;
    private TextView statCompletionRateText;
    private TextView statBestDayText;

    // Período actualmente carregado — evita recarregar ao inicializar o spinner
    private String currentPeriod = "7d";

    // Call activo — cancelado em onDestroy para evitar fugas de memória
    private Call<StatisticsSummary> statisticsCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Redireciona para o login se não houver token guardado
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_statistics);

        progressBar = findViewById(R.id.statisticsProgressBar);
        errorText   = findViewById(R.id.statisticsErrorText);
        scrollView  = findViewById(R.id.statisticsScrollView);

        statTasksCompletedText = findViewById(R.id.statTasksCompletedText);
        statTasksCreatedText   = findViewById(R.id.statTasksCreatedText);
        statTasksMissedText    = findViewById(R.id.statTasksMissedText);
        statXpEarnedText       = findViewById(R.id.statXpEarnedText);
        statStreakText         = findViewById(R.id.statStreakText);
        statCompletionRateText = findViewById(R.id.statCompletionRateText);
        statBestDayText        = findViewById(R.id.statBestDayText);

        findViewById(R.id.statisticsBackButton).setOnClickListener(v -> finish());

        configurarSpinner();

        // Carrega o período inicial ("7d")
        loadStatistics(currentPeriod);
    }

    private void configurarSpinner() {
        Spinner spinner = findViewById(R.id.statisticsPeriodSpinner);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_item,
                PERIOD_LABELS
        );
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);

        spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                String selected = PERIOD_VALUES[position];
                // Só recarrega se o período realmente mudou (evita chamada dupla no arranque)
                if (!selected.equals(currentPeriod)) {
                    currentPeriod = selected;
                    loadStatistics(currentPeriod);
                }
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void loadStatistics(String period) {
        // Cancela qualquer pedido anterior em voo
        if (statisticsCall != null) {
            statisticsCall.cancel();
        }

        showLoading();

        StatisticsApi api = ApiClient.getClient().create(StatisticsApi.class);
        statisticsCall = api.getStatistics("Bearer " + getToken(), period);
        statisticsCall.enqueue(new Callback<StatisticsSummary>() {
            @Override
            public void onResponse(Call<StatisticsSummary> call, Response<StatisticsSummary> response) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showError("Não foi possível carregar estatísticas.");
                    return;
                }

                bindStats(response.body());
            }

            @Override
            public void onFailure(Call<StatisticsSummary> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    // Preenche os 7 cartões com os dados recebidos; null → "—".
    private void bindStats(StatisticsSummary s) {
        statTasksCompletedText.setText(s.getTasksCompleted() != null
                ? String.valueOf(s.getTasksCompleted()) : "—");

        statTasksCreatedText.setText(s.getTasksCreated() != null
                ? String.valueOf(s.getTasksCreated()) : "—");

        statTasksMissedText.setText(s.getTasksMissed() != null
                ? String.valueOf(s.getTasksMissed()) : "—");

        statXpEarnedText.setText(s.getXpEarned() != null
                ? String.valueOf(s.getXpEarned()) : "—");

        statStreakText.setText(s.getCurrentStreak() != null
                ? String.valueOf(s.getCurrentStreak()) : "—");

        // Taxa de conclusão: Double 0.0–1.0 → percentagem inteira, ex. 0.73 → "73%"
        if (s.getCompletionRate() != null) {
            int pct = (int) (s.getCompletionRate() * 100);
            statCompletionRateText.setText(pct + "%");
        } else {
            statCompletionRateText.setText("—");
        }

        statBestDayText.setText(!TextUtils.isEmpty(s.getBestDay()) ? s.getBestDay() : "—");

        errorText.setVisibility(View.GONE);
        scrollView.setVisibility(View.VISIBLE);
    }

    private void showLoading() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        scrollView.setVisibility(View.GONE);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        scrollView.setVisibility(View.GONE);
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
        if (statisticsCall != null) statisticsCall.cancel();
        super.onDestroy();
    }
}
