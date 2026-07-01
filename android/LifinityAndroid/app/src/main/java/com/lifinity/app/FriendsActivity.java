package com.lifinity.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.JsonObject;
import com.lifinity.app.adapters.FriendAdapter;
import com.lifinity.app.adapters.FriendRequestAdapter;
import com.lifinity.app.api.ChatApi;
import com.lifinity.app.api.FriendApi;
import com.lifinity.app.api.UserApi;
import com.lifinity.app.models.Achievement;
import com.lifinity.app.models.CreatePrivateConversationRequest;
import com.lifinity.app.models.Friend;
import com.lifinity.app.models.FriendRequest;
import com.lifinity.app.models.PublicProfile;
import com.lifinity.app.models.SendFriendRequest;
import com.lifinity.app.network.ApiClient;
import com.lifinity.app.utils.AvatarLoader;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Ecrã de Amigos: pesquisar utilizadores e enviar pedido, ver e responder a
 * pedidos recebidos, e listar/remover amigos. Replica a funcionalidade da
 * secção de amigos da web (Community.jsx) contra os endpoints /api/friends.
 */
public class FriendsActivity extends AppCompatActivity {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    private EditText searchInput;
    private Button searchButton;
    private TextView searchStatus;
    private RecyclerView searchRecyclerView;

    private LinearLayout requestsSection;
    private RecyclerView requestsRecyclerView;

    private ProgressBar progressBar;
    private TextView errorText;
    private TextView emptyText;
    private RecyclerView friendsRecyclerView;

    private FriendAdapter friendsAdapter;
    private FriendAdapter searchAdapter;
    private FriendRequestAdapter requestsAdapter;

    private Call<List<Friend>> friendsCall;
    private Call<List<Friend>> searchCall;
    private Call<List<FriendRequest>> requestsCall;
    private Call<JsonObject> actionCall;
    private Call<JsonObject> privateConvCall;
    private Call<PublicProfile> publicProfileCall;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }

        setContentView(R.layout.activity_friends);

        searchInput = findViewById(R.id.friendsSearchInput);
        searchButton = findViewById(R.id.friendsSearchButton);
        searchStatus = findViewById(R.id.friendsSearchStatus);
        searchRecyclerView = findViewById(R.id.friendsSearchRecyclerView);
        requestsSection = findViewById(R.id.friendsRequestsSection);
        requestsRecyclerView = findViewById(R.id.friendsRequestsRecyclerView);
        progressBar = findViewById(R.id.friendsProgressBar);
        errorText = findViewById(R.id.friendsErrorText);
        emptyText = findViewById(R.id.friendsEmptyText);
        friendsRecyclerView = findViewById(R.id.friendsRecyclerView);

        findViewById(R.id.friendsBackButton).setOnClickListener(v -> finish());

        // Lista de amigos: botão "•••" que abre o menu de opções.
        friendsAdapter = new FriendAdapter(this::showFriendOptions);
        friendsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        friendsRecyclerView.setAdapter(friendsAdapter);

        // Resultados da pesquisa: ação "Adicionar".
        searchAdapter = new FriendAdapter("Adicionar", this::sendFriendRequest);
        searchRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        searchRecyclerView.setAdapter(searchAdapter);

        // Pedidos recebidos: aceitar/recusar.
        requestsAdapter = new FriendRequestAdapter(new FriendRequestAdapter.OnRequestActionListener() {
            @Override
            public void onAccept(FriendRequest request) {
                respondToRequest(request, true);
            }

            @Override
            public void onDecline(FriendRequest request) {
                respondToRequest(request, false);
            }
        });
        requestsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        requestsRecyclerView.setAdapter(requestsAdapter);

        searchButton.setOnClickListener(v -> performSearch());
        searchInput.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                performSearch();
                return true;
            }
            return false;
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (TextUtils.isEmpty(getToken())) {
            openLoginActivity();
            return;
        }
        loadFriends();
        loadRequests();
    }

    // ===== Amigos =====

    private void loadFriends() {
        progressBar.setVisibility(View.VISIBLE);
        errorText.setVisibility(View.GONE);
        emptyText.setVisibility(View.GONE);

        FriendApi api = ApiClient.getClient().create(FriendApi.class);
        friendsCall = api.getFriends("Bearer " + getToken());
        friendsCall.enqueue(new Callback<List<Friend>>() {
            @Override
            public void onResponse(Call<List<Friend>> call, Response<List<Friend>> response) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);

                if (!response.isSuccessful() || response.body() == null) {
                    showFriendsError("Não foi possível carregar amigos.");
                    return;
                }

                List<Friend> friends = response.body();
                friendsAdapter.setFriends(friends);
                if (friends.isEmpty()) {
                    emptyText.setVisibility(View.VISIBLE);
                    friendsRecyclerView.setVisibility(View.GONE);
                } else {
                    emptyText.setVisibility(View.GONE);
                    friendsRecyclerView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Friend>> call, Throwable t) {
                if (call.isCanceled()) return;
                progressBar.setVisibility(View.GONE);
                showFriendsError("Sem ligação ao servidor. Confirma que o backend está ativo.");
            }
        });
    }

    private void showFriendsError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
        emptyText.setVisibility(View.GONE);
        friendsRecyclerView.setVisibility(View.GONE);
    }

    private void confirmRemoveFriend(Friend friend) {
        if (friend == null || friend.getIduser() == null) return;
        new AlertDialog.Builder(this)
                .setTitle("Remover amigo")
                .setMessage("Queres remover " + friend.getUsername() + " dos teus amigos?")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Remover", (d, w) -> removeFriend(friend))
                .show();
    }

    private void removeFriend(Friend friend) {
        FriendApi api = ApiClient.getClient().create(FriendApi.class);
        actionCall = api.removeFriend("Bearer " + getToken(), friend.getIduser());
        actionCall.enqueue(simpleCallback("Amigo removido.", this::loadFriends));
    }

    // ===== Menu de opções do amigo (Abrir conversa / Ver perfil / Remover) =====

    // Abre o menu "•••" ancorado ao botão do amigo.
    private void showFriendOptions(Friend friend, View anchor) {
        if (friend == null || friend.getIduser() == null) return;

        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add(0, 1, 0, "Abrir conversa");
        menu.getMenu().add(0, 2, 1, "Ver perfil");
        menu.getMenu().add(0, 3, 2, "Remover");
        menu.setOnMenuItemClickListener(item -> {
            switch (item.getItemId()) {
                case 1:
                    openConversationWith(friend);
                    return true;
                case 2:
                    showFriendProfile(friend);
                    return true;
                case 3:
                    confirmRemoveFriend(friend);
                    return true;
                default:
                    return false;
            }
        });
        menu.show();
    }

    // Cria/obtém a conversa privada com o amigo e abre o ChatActivity.
    private void openConversationWith(Friend friend) {
        if (friend == null || friend.getIduser() == null) return;

        ChatApi api = ApiClient.getClient().create(ChatApi.class);
        privateConvCall = api.createPrivateConversation(
                "Bearer " + getToken(),
                new CreatePrivateConversationRequest(friend.getIduser()));
        privateConvCall.enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (call.isCanceled()) return;

                JsonObject body = response.body();
                if (!response.isSuccessful() || body == null
                        || !body.has("idconversation") || body.get("idconversation").isJsonNull()) {
                    Toast.makeText(FriendsActivity.this,
                            "Não foi possível abrir a conversa.", Toast.LENGTH_SHORT).show();
                    return;
                }

                int idconversation = body.get("idconversation").getAsInt();
                Intent intent = new Intent(FriendsActivity.this, ChatActivity.class);
                intent.putExtra(ChatActivity.EXTRA_CONVERSATION_ID, idconversation);
                // O cabeçalho do chat mostra o nome do amigo.
                intent.putExtra(ChatActivity.EXTRA_CONVERSATION_NAME, friend.getUsername());
                startActivity(intent);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(FriendsActivity.this,
                        "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Popup de perfil do amigo (rico, como o PublicProfileModal da web): avatar,
    // nome, "Nível X · Y XP" e as conquistas em destaque. Preenche já o que temos do
    // objeto Friend e completa com GET /users/{iduser}/public-profile (avatar + badges).
    private void showFriendProfile(Friend friend) {
        if (friend == null) return;

        View view = LayoutInflater.from(this).inflate(R.layout.dialog_friend_profile, null);
        TextView avatarText = view.findViewById(R.id.profileAvatarText);
        ImageView avatarImage = view.findViewById(R.id.profileAvatarImage);
        TextView usernameText = view.findViewById(R.id.profileUsernameText);
        TextView levelXpText = view.findViewById(R.id.profileLevelXpText);
        ProgressBar profileProgress = view.findViewById(R.id.profileProgressBar);
        LinearLayout badgesContainer = view.findViewById(R.id.profileBadgesContainer);

        // Dados imediatos, a partir do objeto Friend (o endpoint não devolve xp).
        usernameText.setText(friend.getUsername());
        levelXpText.setText("Nível " + friend.getLevel() + " · " + friend.getXp() + " XP");
        avatarText.setText(AvatarLoader.initialOf(friend.getUsername()));

        new AlertDialog.Builder(this)
                .setView(view)
                .setPositiveButton("Fechar", null)
                .show();

        if (friend.getIduser() == null) {
            showNoBadges(badgesContainer);
            return;
        }

        // Completa com o perfil público (avatar real + conquistas em destaque).
        profileProgress.setVisibility(View.VISIBLE);
        UserApi api = ApiClient.getClient().create(UserApi.class);
        publicProfileCall = api.getPublicProfile("Bearer " + getToken(), friend.getIduser());
        publicProfileCall.enqueue(new Callback<PublicProfile>() {
            @Override
            public void onResponse(Call<PublicProfile> call, Response<PublicProfile> response) {
                if (call.isCanceled()) return;
                profileProgress.setVisibility(View.GONE);

                PublicProfile profile = response.isSuccessful() ? response.body() : null;
                if (profile == null) {
                    showNoBadges(badgesContainer);
                    return;
                }

                // Foto real por cima do placeholder (círculo + inicial).
                AvatarLoader.load(avatarImage, profile.getAvatar(), avatarText, friend.getUsername());

                List<Achievement> badges = profile.getHighlightedBadges();
                badgesContainer.removeAllViews();
                if (badges == null || badges.isEmpty()) {
                    showNoBadges(badgesContainer);
                    return;
                }
                int shown = Math.min(badges.size(), 3);
                for (int i = 0; i < shown; i++) {
                    badgesContainer.addView(makeBadgeCard(badges.get(i)));
                }
            }

            @Override
            public void onFailure(Call<PublicProfile> call, Throwable t) {
                if (call.isCanceled()) return;
                profileProgress.setVisibility(View.GONE);
                showNoBadges(badgesContainer);
            }
        });
    }

    /** Mensagem "Sem conquistas em destaque." no contentor das conquistas. */
    private void showNoBadges(LinearLayout container) {
        container.removeAllViews();
        TextView tv = new TextView(this);
        tv.setText("Sem conquistas em destaque.");
        tv.setTextColor(getColor(R.color.lifinity_text_faint));
        tv.setTextSize(13);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(8);
        tv.setLayoutParams(lp);
        container.addView(tv);
    }

    /** Mini-cartão de uma conquista em destaque (★ nome + descrição). */
    private View makeBadgeCard(Achievement badge) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(R.drawable.bg_card_soft_clay);
        card.setPadding(dp(12), dp(12), dp(12), dp(12));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(8);
        card.setLayoutParams(lp);

        TextView name = new TextView(this);
        name.setText("★ " + (badge.getName() != null ? badge.getName() : "Conquista"));
        name.setTextColor(getColor(R.color.lifinity_text));
        name.setTextSize(14);
        name.setTypeface(name.getTypeface(), android.graphics.Typeface.BOLD);
        card.addView(name);

        String desc = badge.getDescription();
        if (!TextUtils.isEmpty(desc)) {
            TextView description = new TextView(this);
            description.setText(desc);
            description.setTextColor(getColor(R.color.lifinity_text_secondary));
            description.setTextSize(12);
            LinearLayout.LayoutParams dlp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            dlp.topMargin = dp(4);
            description.setLayoutParams(dlp);
            card.addView(description);
        }
        return card;
    }

    private int dp(int value) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics());
    }

    // ===== Pesquisa + pedidos =====

    private void performSearch() {
        String query = searchInput.getText().toString().trim();
        if (query.length() < 2) {
            searchAdapter.setFriends(null);
            searchRecyclerView.setVisibility(View.GONE);
            searchStatus.setText("Escreve pelo menos 2 letras para procurar.");
            searchStatus.setVisibility(View.VISIBLE);
            return;
        }

        searchStatus.setText("A procurar...");
        searchStatus.setVisibility(View.VISIBLE);

        FriendApi api = ApiClient.getClient().create(FriendApi.class);
        searchCall = api.searchUsers("Bearer " + getToken(), query);
        searchCall.enqueue(new Callback<List<Friend>>() {
            @Override
            public void onResponse(Call<List<Friend>> call, Response<List<Friend>> response) {
                if (call.isCanceled()) return;

                if (!response.isSuccessful() || response.body() == null) {
                    searchStatus.setText("Não foi possível pesquisar utilizadores.");
                    searchStatus.setVisibility(View.VISIBLE);
                    searchRecyclerView.setVisibility(View.GONE);
                    return;
                }

                List<Friend> results = response.body();
                searchAdapter.setFriends(results);
                if (results.isEmpty()) {
                    searchStatus.setText("Sem resultados para \"" + query + "\".");
                    searchStatus.setVisibility(View.VISIBLE);
                    searchRecyclerView.setVisibility(View.GONE);
                } else {
                    searchStatus.setVisibility(View.GONE);
                    searchRecyclerView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onFailure(Call<List<Friend>> call, Throwable t) {
                if (call.isCanceled()) return;
                searchStatus.setText("Sem ligação ao servidor.");
                searchStatus.setVisibility(View.VISIBLE);
                searchRecyclerView.setVisibility(View.GONE);
            }
        });
    }

    private void sendFriendRequest(Friend friend) {
        if (friend == null || friend.getIduser() == null) return;
        FriendApi api = ApiClient.getClient().create(FriendApi.class);
        actionCall = api.sendRequest("Bearer " + getToken(), new SendFriendRequest(friend.getIduser()));
        actionCall.enqueue(simpleCallback("Pedido de amizade enviado.", () -> {
            // Limpa os resultados para não reenviar e mostra estado.
            searchAdapter.setFriends(null);
            searchRecyclerView.setVisibility(View.GONE);
            searchStatus.setText("Pedido enviado a " + friend.getUsername() + ".");
            searchStatus.setVisibility(View.VISIBLE);
        }));
    }

    private void loadRequests() {
        FriendApi api = ApiClient.getClient().create(FriendApi.class);
        requestsCall = api.getRequests("Bearer " + getToken());
        requestsCall.enqueue(new Callback<List<FriendRequest>>() {
            @Override
            public void onResponse(Call<List<FriendRequest>> call, Response<List<FriendRequest>> response) {
                if (call.isCanceled()) return;
                if (!response.isSuccessful() || response.body() == null) {
                    requestsSection.setVisibility(View.GONE);
                    return;
                }
                List<FriendRequest> requests = response.body();
                requestsAdapter.setRequests(requests);
                requestsSection.setVisibility(requests.isEmpty() ? View.GONE : View.VISIBLE);
            }

            @Override
            public void onFailure(Call<List<FriendRequest>> call, Throwable t) {
                if (call.isCanceled()) return;
                requestsSection.setVisibility(View.GONE);
            }
        });
    }

    private void respondToRequest(FriendRequest request, boolean accept) {
        if (request == null || request.getIdfriendship() == null) return;
        FriendApi api = ApiClient.getClient().create(FriendApi.class);
        actionCall = accept
                ? api.acceptRequest("Bearer " + getToken(), request.getIdfriendship())
                : api.declineRequest("Bearer " + getToken(), request.getIdfriendship());
        actionCall.enqueue(simpleCallback(accept ? "Pedido aceite." : "Pedido recusado.", () -> {
            loadRequests();
            loadFriends();
        }));
    }

    // ===== Utilitários =====

    private interface OnDone {
        void run();
    }

    /** Callback genérico: mostra um toast e corre uma ação em caso de sucesso. */
    private Callback<JsonObject> simpleCallback(String fallbackSuccess, OnDone onSuccess) {
        return new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (call.isCanceled()) return;
                String message = extractMessage(response,
                        response.isSuccessful() ? fallbackSuccess : "Não foi possível concluir a ação.");
                Toast.makeText(FriendsActivity.this, message, Toast.LENGTH_SHORT).show();
                if (response.isSuccessful() && onSuccess != null) {
                    onSuccess.run();
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (call.isCanceled()) return;
                Toast.makeText(FriendsActivity.this,
                        "Sem ligação ao servidor.", Toast.LENGTH_SHORT).show();
            }
        };
    }

    private String extractMessage(Response<JsonObject> response, String fallback) {
        try {
            JsonObject body = response.isSuccessful() ? response.body() : null;
            if (body != null && body.has("message") && !body.get("message").isJsonNull()) {
                return body.get("message").getAsString();
            }
        } catch (Exception ignored) {
        }
        return fallback;
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
        if (friendsCall != null) friendsCall.cancel();
        if (searchCall != null) searchCall.cancel();
        if (requestsCall != null) requestsCall.cancel();
        if (actionCall != null) actionCall.cancel();
        if (privateConvCall != null) privateConvCall.cancel();
        if (publicProfileCall != null) publicProfileCall.cancel();
        super.onDestroy();
    }
}
