package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Hub social da aplicação. Reúne num só ecrã o acesso ao Ranking,
 * às Conversas, ao Assistente IA e (em breve) a Amigos e Grupos.
 */
public class CommunityActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Sem token guardado -> volta ao login.
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_community);

        // Barra inferior com o tab Comunidade ativo.
        BottomNavHelper.setup(this, BottomNavHelper.Tab.COMMUNITY);
        HeaderHelper.setupBell(this);

        setupHubLinks();
    }

    /** Liga cada cartão do hub ao respetivo ecrã. */
    private void setupHubLinks() {
        // Ranking -> classificação por XP
        findViewById(R.id.communityRanking).setOnClickListener(v ->
                startActivity(new Intent(this, RankingActivity.class)));

        // Conversas -> lista de conversas
        findViewById(R.id.communityChat).setOnClickListener(v ->
                startActivity(new Intent(this, ConversationsActivity.class)));

        // Assistente IA
        findViewById(R.id.communityAssistant).setOnClickListener(v ->
                startActivity(new Intent(this, AssistantActivity.class)));

        // Amigos -> ecrã de amigos (pesquisar, pedidos, lista)
        findViewById(R.id.communityFriends).setOnClickListener(v ->
                startActivity(new Intent(this, FriendsActivity.class)));

        // Grupos -> ecrã de grupos (criar, entrar, gerir)
        findViewById(R.id.communityGroups).setOnClickListener(v ->
                startActivity(new Intent(this, GroupsActivity.class)));
    }

    private String getToken() {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        return preferences.getString(KEY_TOKEN, null);
    }

    private void openLoginActivity() {
        Intent intent = new Intent(this, LoginActivity.class);
        startActivity(intent);
        finish();
    }
}
