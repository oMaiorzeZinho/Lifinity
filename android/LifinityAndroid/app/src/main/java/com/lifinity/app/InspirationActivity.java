package com.lifinity.app;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.lifinity.app.api.ChatApi;
import com.lifinity.app.api.InspirationApi;
import com.lifinity.app.models.ChatMessage;
import com.lifinity.app.models.Conversation;
import com.lifinity.app.models.SendChatMessageRequest;
import com.lifinity.app.models.Verse;
import com.lifinity.app.network.ApiClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class InspirationActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private TextView cardModeText;
    private TextView themeText;
    private TextView verseText;
    private TextView referenceText;
    private TextView errorText;
    private TextView favoritesEmptyText;
    private Button randomVerseButton;
    private Button dailyVerseButton;
    private Button favoriteButton;
    private Button copyVerseButton;
    private ImageView shareVerseButton;
    private ProgressBar progressBar;
    private LinearLayout favoritesContainer;
    private LinearLayout themeFilterContainer;
    private Spinner themeSpinner;

    private Verse currentVerse;
    private Call<Verse> dailyVerseCall;
    private Call<Verse> randomVerseCall;
    private Call<List<Verse>> favoritesCall;
    private Call<JsonObject> toggleFavoriteCall;
    private Call<List<Conversation>> conversationsCall;
    private Call<ChatMessage> shareMessageCall;
    private final List<Verse> favorites = new ArrayList<>();
    private final Gson gson = new Gson();

    // Filtro por tema dos favoritos: "Todos" + temas únicos derivados dinamicamente.
    private static final String THEME_ALL = "Todos";
    private String selectedFavoriteTheme = THEME_ALL;
    // Evita reagir ao evento do Spinner enquanto o repovoamos por código.
    private boolean suppressThemeSpinnerEvent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_inspiration);

        cardModeText = findViewById(R.id.inspirationCardModeText);
        themeText = findViewById(R.id.inspirationThemeText);
        verseText = findViewById(R.id.inspirationVerseText);
        referenceText = findViewById(R.id.inspirationReferenceText);
        errorText = findViewById(R.id.inspirationErrorText);
        favoritesEmptyText = findViewById(R.id.inspirationFavoritesEmptyText);
        randomVerseButton = findViewById(R.id.randomVerseButton);
        dailyVerseButton = findViewById(R.id.dailyVerseButton);
        favoriteButton = findViewById(R.id.favoriteVerseButton);
        copyVerseButton = findViewById(R.id.copyVerseButton);
        shareVerseButton = findViewById(R.id.shareVerseButton);
        progressBar = findViewById(R.id.inspirationProgressBar);
        favoritesContainer = findViewById(R.id.inspirationFavoritesContainer);
        themeFilterContainer = findViewById(R.id.inspirationThemeFilterContainer);
        themeSpinner = findViewById(R.id.inspirationFavoritesThemeSpinner);

        randomVerseButton.setOnClickListener(v -> loadRandomVerse());
        dailyVerseButton.setOnClickListener(v -> loadDailyVerse(false));
        favoriteButton.setOnClickListener(v -> toggleCurrentFavorite());
        copyVerseButton.setOnClickListener(v -> copyCurrentVerseToClipboard());
        shareVerseButton.setOnClickListener(v -> shareVerse(currentVerse));

        setupThemeSpinnerListener();
        setupBottomNav();
        HeaderHelper.setupBell(this);
        loadInitialData();
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void loadInitialData() {
        loadDailyVerse(true);
        loadFavorites();
    }

    private void loadDailyVerse(boolean showFullLoading) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        setLoading(true);
        hideError();
        if (showFullLoading) {
            clearVerse();
        }

        InspirationApi inspirationApi = ApiClient.getClient().create(InspirationApi.class);
        dailyVerseCall = inspirationApi.getDailyVerse("Bearer " + token);
        dailyVerseCall.enqueue(new Callback<Verse>() {
            @Override
            public void onResponse(Call<Verse> call, Response<Verse> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getVerseErrorMessage(response, "Nao foi possivel carregar o versiculo do dia."));
                    return;
                }

                currentVerse = response.body();
                bindCurrentVerse("Versiculo do Dia");
            }

            @Override
            public void onFailure(Call<Verse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel carregar inspiracao. Confirma que o backend esta ativo.");
            }
        });
    }

    private void loadRandomVerse() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        setLoading(true);
        hideError();

        InspirationApi inspirationApi = ApiClient.getClient().create(InspirationApi.class);
        randomVerseCall = inspirationApi.getRandomVerse("Bearer " + token);
        randomVerseCall.enqueue(new Callback<Verse>() {
            @Override
            public void onResponse(Call<Verse> call, Response<Verse> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    showError(getVerseErrorMessage(response, "Nao foi possivel carregar um versiculo aleatorio."));
                    return;
                }

                currentVerse = response.body();
                bindCurrentVerse("Versiculo Aleatorio");
            }

            @Override
            public void onFailure(Call<Verse> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                showError("Nao foi possivel carregar um versiculo aleatorio. Confirma que o backend esta ativo.");
            }
        });
    }

    private void loadFavorites() {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        InspirationApi inspirationApi = ApiClient.getClient().create(InspirationApi.class);
        favoritesCall = inspirationApi.getFavorites("Bearer " + token);
        favoritesCall.enqueue(new Callback<List<Verse>>() {
            @Override
            public void onResponse(Call<List<Verse>> call, Response<List<Verse>> response) {
                if (!response.isSuccessful()) {
                    bindFavorites();
                    return;
                }

                favorites.clear();
                List<Verse> responseFavorites = response.body();
                if (responseFavorites != null) {
                    favorites.addAll(responseFavorites);
                }

                syncCurrentFavoriteState();
                bindFavorites();
                bindFavoriteButton();
            }

            @Override
            public void onFailure(Call<List<Verse>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                bindFavorites();
            }
        });
    }

    private void toggleCurrentFavorite() {
        if (currentVerse == null || currentVerse.getIdverse() == null) {
            showError("Versiculo invalido.");
            return;
        }

        toggleFavorite(currentVerse.getIdverse(), true);
    }

    private void toggleFavorite(Integer idverse, boolean affectsCurrentVerse) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        if (idverse == null) {
            showError("Versiculo invalido.");
            return;
        }

        setLoading(true);
        hideError();

        InspirationApi inspirationApi = ApiClient.getClient().create(InspirationApi.class);
        toggleFavoriteCall = inspirationApi.toggleFavorite("Bearer " + token, idverse);
        toggleFavoriteCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                setLoading(false);

                if (!response.isSuccessful()) {
                    String message = getJsonErrorMessage(response, "Nao foi possivel atualizar favorito.");
                    showError(message);
                    Toast.makeText(InspirationActivity.this, message, Toast.LENGTH_LONG).show();
                    return;
                }

                if (affectsCurrentVerse && currentVerse != null) {
                    Boolean favoriteState = getFavoriteState(response.body());
                    if (favoriteState == null) {
                        favoriteState = !isCurrentFavorite();
                    }
                    currentVerse.setIsFavorite(favoriteState);
                    bindFavoriteButton();
                }

                Toast.makeText(
                        InspirationActivity.this,
                        getJsonSuccessMessage(response.body(), "Favoritos atualizados."),
                        Toast.LENGTH_LONG
                ).show();
                loadFavorites();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }

                setLoading(false);
                String message = "Nao foi possivel atualizar favorito. Confirma que o backend esta ativo.";
                showError(message);
                Toast.makeText(InspirationActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void bindCurrentVerse(String modeLabel) {
        if (currentVerse == null) {
            clearVerse();
            showError("Resposta invalida do servidor.");
            return;
        }

        syncCurrentFavoriteState();

        cardModeText.setText(modeLabel);
        themeText.setText(String.format(Locale.US, "Tema: %s", valueOrFallback(currentVerse.getTheme(), "Geral")));
        verseText.setText(valueOrFallback(currentVerse.getText(), "Nao disponivel"));
        referenceText.setText(getReference(currentVerse));
        favoriteButton.setVisibility(View.VISIBLE);
        bindFavoriteButton();
    }

    private void bindFavoriteButton() {
        if (currentVerse == null) {
            favoriteButton.setText("♥ Guardar");
            favoriteButton.setEnabled(false);
            return;
        }

        favoriteButton.setEnabled(true);
        favoriteButton.setText(isCurrentFavorite() ? "♡ Remover" : "♥ Guardar");
    }

    private void bindFavorites() {
        setupThemeSpinner();
        renderFavorites();
    }

    // Reconstrói as opções do filtro a partir dos temas ÚNICOS presentes nos favoritos.
    private void setupThemeSpinner() {
        List<String> themes = new ArrayList<>();
        themes.add(THEME_ALL);
        for (Verse favorite : favorites) {
            String theme = favorite.getTheme();
            if (!TextUtils.isEmpty(theme) && !themes.contains(theme)) {
                themes.add(theme);
            }
        }

        // Se o tema selecionado já não existe nos favoritos, volta a "Todos".
        if (!themes.contains(selectedFavoriteTheme)) {
            selectedFavoriteTheme = THEME_ALL;
        }

        // Esconde o filtro quando não há temas (só "Todos") — evita um seletor inútil.
        themeFilterContainer.setVisibility(themes.size() > 1 ? View.VISIBLE : View.GONE);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, R.layout.item_spinner, themes);
        adapter.setDropDownViewResource(R.layout.item_spinner);

        // Repovoar o Spinner dispara onItemSelected; suprimimos para não duplicar o render.
        suppressThemeSpinnerEvent = true;
        themeSpinner.setAdapter(adapter);
        themeSpinner.setSelection(Math.max(themes.indexOf(selectedFavoriteTheme), 0));
        suppressThemeSpinnerEvent = false;
    }

    private void setupThemeSpinnerListener() {
        themeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                if (suppressThemeSpinnerEvent) {
                    return;
                }
                Object item = parent.getItemAtPosition(position);
                selectedFavoriteTheme = item == null ? THEME_ALL : item.toString();
                renderFavorites();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    // Filtra os favoritos pelo tema selecionado e desenha os cartões.
    private void renderFavorites() {
        favoritesContainer.removeAllViews();

        if (favorites.isEmpty()) {
            favoritesEmptyText.setText("Ainda não tens versículos favoritos.");
            favoritesEmptyText.setVisibility(View.VISIBLE);
            return;
        }

        List<Verse> displayed = new ArrayList<>();
        for (Verse favorite : favorites) {
            if (THEME_ALL.equals(selectedFavoriteTheme)
                    || selectedFavoriteTheme.equals(favorite.getTheme())) {
                displayed.add(favorite);
            }
        }

        if (displayed.isEmpty()) {
            favoritesEmptyText.setText("Nenhum favorito neste tema.");
            favoritesEmptyText.setVisibility(View.VISIBLE);
            return;
        }

        favoritesEmptyText.setVisibility(View.GONE);
        for (Verse favorite : displayed) {
            favoritesContainer.addView(createFavoriteView(favorite));
        }
    }

    private View createFavoriteView(Verse favorite) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(R.drawable.bg_card_soft_clay);
        card.setPadding(dp(16), dp(16), dp(16), dp(16));
        card.setElevation(dp(4));

        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        cardParams.setMargins(0, 0, 0, dp(12));
        card.setLayoutParams(cardParams);

        TextView text = new TextView(this);
        text.setText(valueOrFallback(favorite.getText(), "Nao disponivel"));
        text.setTextColor(getColor(R.color.lifinity_text));
        text.setTextSize(15);
        text.setTypeface(text.getTypeface(), android.graphics.Typeface.BOLD);
        card.addView(text);

        TextView reference = new TextView(this);
        reference.setText(getReference(favorite));
        reference.setTextColor(getColor(R.color.lifinity_text_secondary));
        reference.setTextSize(13);
        LinearLayout.LayoutParams referenceParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        referenceParams.setMargins(0, dp(10), 0, 0);
        reference.setLayoutParams(referenceParams);
        card.addView(reference);

        if (!TextUtils.isEmpty(favorite.getTheme())) {
            TextView theme = new TextView(this);
            theme.setText(String.format(Locale.US, "Tema: %s", favorite.getTheme()));
            theme.setTextColor(getColor(R.color.lifinity_primary));
            theme.setTextSize(12);
            theme.setTypeface(theme.getTypeface(), android.graphics.Typeface.BOLD);
            LinearLayout.LayoutParams themeParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            themeParams.setMargins(0, dp(6), 0, 0);
            theme.setLayoutParams(themeParams);
            card.addView(theme);
        }

        // Linha de ações: Partilhar (ghost) + Remover (danger), lado a lado.
        LinearLayout actionsRow = new LinearLayout(this);
        actionsRow.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams actionsParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        actionsParams.setMargins(0, dp(12), 0, 0);
        actionsRow.setLayoutParams(actionsParams);

        int secondaryHeight = getResources().getDimensionPixelSize(R.dimen.height_button_secondary);

        Button shareButton = new Button(this);
        shareButton.setText("Partilhar");
        shareButton.setTransformationMethod(null);
        shareButton.setTextColor(getColor(R.color.lifinity_primary));
        shareButton.setTextSize(14);
        shareButton.setTypeface(shareButton.getTypeface(), android.graphics.Typeface.BOLD);
        shareButton.setBackgroundResource(R.drawable.btn_ghost_clay);
        shareButton.setOnClickListener(v -> shareVerse(favorite));
        shareButton.setLayoutParams(new LinearLayout.LayoutParams(0, secondaryHeight, 1f));
        actionsRow.addView(shareButton);

        Button removeButton = new Button(this);
        removeButton.setText("Remover");
        removeButton.setTransformationMethod(null);
        removeButton.setTextColor(getColor(R.color.lifinity_text_on_primary));
        removeButton.setTextSize(14);
        removeButton.setTypeface(removeButton.getTypeface(), android.graphics.Typeface.BOLD);
        removeButton.setBackgroundResource(R.drawable.btn_danger_clay);
        removeButton.setOnClickListener(v -> toggleFavorite(favorite.getIdverse(), isSameVerse(favorite, currentVerse)));
        LinearLayout.LayoutParams removeParams = new LinearLayout.LayoutParams(0, secondaryHeight, 1f);
        removeParams.setMargins(dp(10), 0, 0, 0);
        removeButton.setLayoutParams(removeParams);
        actionsRow.addView(removeButton);

        card.addView(actionsRow);

        return card;
    }

    private void syncCurrentFavoriteState() {
        if (currentVerse == null || currentVerse.getIdverse() == null) {
            return;
        }

        for (Verse favorite : favorites) {
            if (isSameVerse(favorite, currentVerse)) {
                currentVerse.setIsFavorite(true);
                return;
            }
        }
    }

    private boolean isCurrentFavorite() {
        return currentVerse != null
                && currentVerse.getIsFavorite() != null
                && currentVerse.getIsFavorite();
    }

    private boolean isSameVerse(Verse first, Verse second) {
        return first != null
                && second != null
                && first.getIdverse() != null
                && first.getIdverse().equals(second.getIdverse());
    }

    private String getReference(Verse verse) {
        if (verse == null) {
            return "Nao disponivel";
        }

        String book = valueOrFallback(verse.getBook(), "Nao disponivel");
        String chapter = verse.getChapter() == null ? "?" : String.valueOf(verse.getChapter());
        String verseNumber = verse.getVerse() == null ? "?" : String.valueOf(verse.getVerse());
        return book + " " + chapter + ":" + verseNumber;
    }

    private Boolean getFavoriteState(JsonObject body) {
        if (body != null && body.has("isFavorite") && !body.get("isFavorite").isJsonNull()) {
            return body.get("isFavorite").getAsBoolean();
        }

        return null;
    }

    private String getVerseErrorMessage(Response<Verse> response, String fallback) {
        if (response.code() == 401 || response.code() == 403) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return fallback;
        }

        try {
            ErrorResponse errorResponse = gson.fromJson(response.errorBody().charStream(), ErrorResponse.class);
            if (errorResponse != null) {
                if (!TextUtils.isEmpty(errorResponse.message)) {
                    return errorResponse.message;
                }

                if (!TextUtils.isEmpty(errorResponse.error)) {
                    return errorResponse.error;
                }
            }
        } catch (Exception ignored) {
            return fallback;
        }

        return fallback;
    }

    private String getJsonErrorMessage(Response<JsonObject> response, String fallback) {
        if (response.code() == 401 || response.code() == 403) {
            return "Sessao invalida. Termina sessao e volta a entrar.";
        }

        if (response.errorBody() == null) {
            return fallback;
        }

        try {
            ErrorResponse errorResponse = gson.fromJson(response.errorBody().charStream(), ErrorResponse.class);
            if (errorResponse != null) {
                if (!TextUtils.isEmpty(errorResponse.message)) {
                    return errorResponse.message;
                }

                if (!TextUtils.isEmpty(errorResponse.error)) {
                    return errorResponse.error;
                }
            }
        } catch (Exception ignored) {
            return fallback;
        }

        return fallback;
    }

    private String getJsonSuccessMessage(JsonObject body, String fallback) {
        if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
            return body.get("message").getAsString();
        }

        return fallback;
    }

    private String valueOrFallback(String value, String fallback) {
        if (TextUtils.isEmpty(value)) {
            return fallback;
        }

        return value;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        randomVerseButton.setEnabled(!loading);
        dailyVerseButton.setEnabled(!loading);
        favoriteButton.setEnabled(!loading && currentVerse != null);
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private void hideError() {
        errorText.setText("");
        errorText.setVisibility(View.GONE);
    }

    private void clearVerse() {
        cardModeText.setText("Inspiracao");
        themeText.setText("Tema: Geral");
        verseText.setText("A carregar versiculo...");
        referenceText.setText("");
        favoriteButton.setVisibility(View.GONE);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        startActivity(intent);
        finish();
    }

    // ───────── Partilhar versículo para uma conversa EXISTENTE ─────────
    // Âmbito: SÓ conversas que já existem (getConversations). Não cria conversas novas
    // nem lista amigos/grupos. Envia o versículo formatado via sendMessage.

    private void shareVerse(Verse verse) {
        if (verse == null || TextUtils.isEmpty(verse.getText())) {
            Toast.makeText(this, "Versículo indisponível para partilhar.", Toast.LENGTH_SHORT).show();
            return;
        }

        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }

        String content = formatVerseForShare(verse);
        Toast.makeText(this, "A carregar conversas...", Toast.LENGTH_SHORT).show();

        ChatApi chatApi = ApiClient.getClient().create(ChatApi.class);
        if (conversationsCall != null) {
            conversationsCall.cancel();
        }
        conversationsCall = chatApi.getConversations("Bearer " + token);
        conversationsCall.enqueue(new Callback<List<Conversation>>() {
            @Override
            public void onResponse(Call<List<Conversation>> call, Response<List<Conversation>> response) {
                if (!response.isSuccessful() || response.body() == null) {
                    Toast.makeText(InspirationActivity.this,
                            "Não foi possível carregar as conversas.", Toast.LENGTH_LONG).show();
                    return;
                }

                // Só conversas válidas (com id) entram na lista de escolha.
                List<Conversation> valid = new ArrayList<>();
                for (Conversation conversation : response.body()) {
                    if (conversation != null && conversation.getIdconversation() != null) {
                        valid.add(conversation);
                    }
                }

                if (valid.isEmpty()) {
                    Toast.makeText(InspirationActivity.this,
                            "Ainda não tens conversas para partilhar.", Toast.LENGTH_LONG).show();
                    return;
                }

                showShareDialog(valid, content);
            }

            @Override
            public void onFailure(Call<List<Conversation>> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                Toast.makeText(InspirationActivity.this,
                        "Falha de rede ao carregar as conversas.", Toast.LENGTH_LONG).show();
            }
        });
    }

    // Diálogo (tema claro existente, via alertDialogTheme) que lista as conversas
    // existentes; o utilizador escolhe uma e o versículo é enviado para lá.
    private void showShareDialog(List<Conversation> conversations, String content) {
        CharSequence[] names = new CharSequence[conversations.size()];
        for (int i = 0; i < conversations.size(); i++) {
            String name = conversations.get(i).getName();
            names[i] = TextUtils.isEmpty(name) ? "Conversa" : name;
        }

        new AlertDialog.Builder(this)
                .setTitle("Partilhar para...")
                .setItems(names, (dialog, which) ->
                        sendVerseToConversation(conversations.get(which), content))
                .setNegativeButton("Cancelar", null)
                .show();
    }

    private void sendVerseToConversation(Conversation conversation, String content) {
        String token = getToken();
        if (TextUtils.isEmpty(token)) {
            openLoginActivity();
            return;
        }
        if (conversation == null || conversation.getIdconversation() == null) {
            return;
        }

        ChatApi chatApi = ApiClient.getClient().create(ChatApi.class);
        if (shareMessageCall != null) {
            shareMessageCall.cancel();
        }
        shareMessageCall = chatApi.sendMessage(
                "Bearer " + token,
                conversation.getIdconversation(),
                new SendChatMessageRequest(content));
        shareMessageCall.enqueue(new Callback<ChatMessage>() {
            @Override
            public void onResponse(Call<ChatMessage> call, Response<ChatMessage> response) {
                if (!response.isSuccessful()) {
                    Toast.makeText(InspirationActivity.this,
                            "Não foi possível enviar o versículo.", Toast.LENGTH_LONG).show();
                    return;
                }
                Toast.makeText(InspirationActivity.this,
                        "Versículo enviado.", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onFailure(Call<ChatMessage> call, Throwable t) {
                if (call.isCanceled()) {
                    return;
                }
                Toast.makeText(InspirationActivity.this,
                        "Falha de rede ao enviar o versículo.", Toast.LENGTH_LONG).show();
            }
        });
    }

    // Formato igual ao browser: «"texto" — Livro cap:verso» (aspas curvas + travessão).
    private String formatVerseForShare(Verse verse) {
        return "“" + valueOrFallback(verse.getText(), "") + "” — " + getReference(verse);
    }

    private void copyCurrentVerseToClipboard() {
        if (currentVerse == null || TextUtils.isEmpty(currentVerse.getText())) {
            Toast.makeText(this, "Versículo indisponível para copiar.", Toast.LENGTH_SHORT).show();
            return;
        }

        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
        ClipData clip = ClipData.newPlainText("Versículo", currentVerse.getText());
        clipboard.setPrimaryClip(clip);
        Toast.makeText(this, "Versículo copiado para a área de transferência.", Toast.LENGTH_SHORT).show();
    }

    private void setupBottomNav() {
        BottomNavHelper.setup(this, BottomNavHelper.Tab.INSPIRATION);
    }

    @Override
    protected void onDestroy() {
        if (dailyVerseCall != null) {
            dailyVerseCall.cancel();
        }
        if (randomVerseCall != null) {
            randomVerseCall.cancel();
        }
        if (favoritesCall != null) {
            favoritesCall.cancel();
        }
        if (toggleFavoriteCall != null) {
            toggleFavoriteCall.cancel();
        }
        if (conversationsCall != null) {
            conversationsCall.cancel();
        }
        if (shareMessageCall != null) {
            shareMessageCall.cancel();
        }
        super.onDestroy();
    }

    private static class ErrorResponse {
        String message;
        String error;
    }
}
