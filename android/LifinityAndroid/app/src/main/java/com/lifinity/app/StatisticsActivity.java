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
import androidx.core.content.ContextCompat;
import androidx.core.widget.NestedScrollView;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.Legend;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.lifinity.app.api.StatisticsApi;
import com.lifinity.app.models.StatisticsDay;
import com.lifinity.app.models.StatisticsResponse;
import com.lifinity.app.models.StatisticsSummary;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StatisticsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN  = "token";

    // Opções do spinner — índice sincronizado com PERIOD_VALUES[]
    private static final String[] PERIOD_LABELS = {"Últimos 7 dias", "Últimos 30 dias", "Último ano"};
    private static final String[] PERIOD_VALUES = {"7d", "30d", "1y"};

    private ProgressBar progressBar;
    private TextView    errorText;
    private NestedScrollView scrollView;

    // Cartões de totais
    private TextView statCompletedValue;
    private TextView statCreatedValue;
    private TextView statLostValue;
    private TextView statXpValue;
    private TextView statRateValue;
    private TextView statProductivityValue;

    // Gráficos
    private BarChart tasksChart;
    private LineChart xpChart;

    // Período actualmente carregado — evita recarregar ao inicializar o spinner
    private String currentPeriod = "7d";

    // Call activo — cancelado em onDestroy para evitar fugas de memória
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
        errorText   = findViewById(R.id.statisticsErrorText);
        scrollView  = findViewById(R.id.statisticsScrollView);

        statCompletedValue    = findViewById(R.id.statCompletedValue);
        statCreatedValue      = findViewById(R.id.statCreatedValue);
        statLostValue         = findViewById(R.id.statLostValue);
        statXpValue           = findViewById(R.id.statXpValue);
        statRateValue         = findViewById(R.id.statRateValue);
        statProductivityValue = findViewById(R.id.statProductivityValue);

        tasksChart = findViewById(R.id.statTasksChart);
        xpChart    = findViewById(R.id.statXpChart);

        findViewById(R.id.statisticsBackButton).setOnClickListener(v -> finish());

        configurarSpinner();

        // Carrega o período inicial ("7d")
        loadStatistics(currentPeriod);
    }

    private void configurarSpinner() {
        Spinner spinner = findViewById(R.id.statisticsPeriodSpinner);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this, R.layout.item_spinner, PERIOD_LABELS);
        adapter.setDropDownViewResource(R.layout.item_spinner);
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
        if (statisticsCall != null) {
            statisticsCall.cancel();
        }

        showLoading();

        StatisticsApi api = ApiClient.getClient().create(StatisticsApi.class);
        statisticsCall = api.getStatistics("Bearer " + getToken(), period);
        statisticsCall.enqueue(new Callback<StatisticsResponse>() {
            @Override
            public void onResponse(Call<StatisticsResponse> call, Response<StatisticsResponse> response) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showError("Não foi possível carregar estatísticas.");
                    return;
                }

                bindStatistics(response.body());
            }

            @Override
            public void onFailure(Call<StatisticsResponse> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    /** Preenche os cartões de totais e desenha os dois gráficos. */
    private void bindStatistics(StatisticsResponse data) {
        StatisticsSummary s = data.getSummary();
        if (s != null) {
            statCompletedValue.setText(String.valueOf(s.getCompletedTasks()));
            statCreatedValue.setText(String.valueOf(s.getTotalTasks()));
            statLostValue.setText(String.valueOf(s.getLostTasks()));
            statXpValue.setText(String.valueOf(s.getTotalXP()));
            // completionRate já vem em 0–100 (percentagem) do backend.
            statRateValue.setText(Math.round(s.getCompletionRate()) + "%");
            statProductivityValue.setText(String.valueOf(Math.round(s.getProductivityScore())));
        }

        List<StatisticsDay> chartData = data.getChartData() != null
                ? data.getChartData() : new ArrayList<>();
        setupTasksChart(chartData);
        setupXpChart(chartData);

        errorText.setVisibility(View.GONE);
        scrollView.setVisibility(View.VISIBLE);
    }

    // ===================== GRÁFICOS (MPAndroidChart) =====================

    /** Cria um formatador de eixo X que mostra a etiqueta (dd/MM) de cada dia. */
    private ValueFormatter dayLabelFormatter(List<String> labels) {
        return new ValueFormatter() {
            @Override
            public String getFormattedValue(float value) {
                int i = Math.round(value);
                if (i >= 0 && i < labels.size()) return labels.get(i);
                return "";
            }
        };
    }

    /** Gráfico de barras EMPILHADAS: concluídas (verde) + perdidas (coral) por dia. */
    private void setupTasksChart(List<StatisticsDay> days) {
        List<String> labels = new ArrayList<>();
        List<BarEntry> entries = new ArrayList<>();

        for (int i = 0; i < days.size(); i++) {
            StatisticsDay d = days.get(i);
            labels.add(d.getLabel());
            // Pilha: [concluídas, perdidas] empilhadas na mesma barra.
            entries.add(new BarEntry(i, new float[]{d.getTasksCompleted(), d.getTasksLost()}));
        }

        int green = ContextCompat.getColor(this, R.color.lifinity_primary);
        int coral = ContextCompat.getColor(this, R.color.lifinity_coral);

        BarDataSet dataSet = new BarDataSet(entries, "");
        dataSet.setColors(green, coral);
        dataSet.setStackLabels(new String[]{"Concluídas", "Perdidas"});
        dataSet.setDrawValues(false);

        BarData barData = new BarData(dataSet);
        barData.setBarWidth(0.6f);

        styleCommon(tasksChart, labels);
        tasksChart.setData(barData);

        Legend legend = tasksChart.getLegend();
        legend.setEnabled(true);
        legend.setTextColor(ContextCompat.getColor(this, R.color.lifinity_text_secondary));
        legend.setVerticalAlignment(Legend.LegendVerticalAlignment.BOTTOM);
        legend.setHorizontalAlignment(Legend.LegendHorizontalAlignment.CENTER);

        tasksChart.animateY(700);
        tasksChart.invalidate();
    }

    /** Gráfico de linhas: XP ganho por dia (verde, preenchido). */
    private void setupXpChart(List<StatisticsDay> days) {
        List<String> labels = new ArrayList<>();
        List<Entry> entries = new ArrayList<>();

        for (int i = 0; i < days.size(); i++) {
            StatisticsDay d = days.get(i);
            labels.add(d.getLabel());
            entries.add(new Entry(i, d.getXpGained()));
        }

        int green = ContextCompat.getColor(this, R.color.lifinity_primary);

        LineDataSet dataSet = new LineDataSet(entries, "XP ganho");
        dataSet.setColor(green);
        dataSet.setLineWidth(2.4f);
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setDrawValues(false);
        // Em períodos curtos mostram-se os pontos; em períodos longos ficam limpos.
        boolean fewPoints = days.size() <= 14;
        dataSet.setDrawCircles(fewPoints);
        dataSet.setCircleColor(green);
        dataSet.setCircleRadius(3.5f);
        dataSet.setDrawCircleHole(false);
        dataSet.setDrawFilled(true);
        dataSet.setFillColor(green);
        dataSet.setFillAlpha(45);
        dataSet.setHighlightEnabled(false);

        LineData lineData = new LineData(dataSet);

        styleCommon(xpChart, labels);
        xpChart.getLegend().setEnabled(false); // série única — legenda redundante
        xpChart.setData(lineData);
        xpChart.animateY(700);
        xpChart.invalidate();
    }

    /**
     * Estilo comum aos dois gráficos no tema claro: sem moldura/descrição pesada,
     * eixo X em baixo com as etiquetas dos dias, eixo Y à esquerda a começar em 0,
     * texto dos eixos em cinza secundário e sem linhas de grelha agressivas.
     */
    private void styleCommon(com.github.mikephil.charting.charts.BarLineChartBase<?> chart,
                             List<String> labels) {
        int axisText = ContextCompat.getColor(this, R.color.lifinity_text_secondary);
        int gridColor = ContextCompat.getColor(this, R.color.lifinity_border);

        chart.getDescription().setEnabled(false);
        chart.setNoDataText("Sem dados para este período.");
        chart.setNoDataTextColor(axisText);
        chart.setDrawGridBackground(false);
        chart.setScaleYEnabled(false);
        chart.setPinchZoom(false);
        chart.setExtraBottomOffset(8f);

        XAxis xAxis = chart.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setDrawAxisLine(false);
        xAxis.setGranularity(1f);
        xAxis.setTextColor(axisText);
        xAxis.setTextSize(9f);
        xAxis.setLabelRotationAngle(-45f);
        xAxis.setLabelCount(Math.min(Math.max(labels.size(), 1), 7), false);
        xAxis.setValueFormatter(dayLabelFormatter(labels));

        YAxis left = chart.getAxisLeft();
        left.setAxisMinimum(0f);
        left.setGranularity(1f);
        left.setTextColor(axisText);
        left.setDrawAxisLine(false);
        left.setGridColor(gridColor);

        chart.getAxisRight().setEnabled(false);
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
