package com.lifinity.app;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.text.TextUtils;
import android.view.View;

import com.google.gson.JsonObject;
import com.lifinity.app.api.NotificationApi;
import com.lifinity.app.network.ApiClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

// Liga o sino do header (R.id.headerNotificationBell) ao ecra de Notificacoes
// e realca-o quando ha notificacoes por ler. Reutilizavel por todos os ecras principais.
public class HeaderHelper {
    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_TOKEN = "token";

    public static void setupBell(final Activity activity) {
        final View bell = activity.findViewById(R.id.headerNotificationBell);
        if (bell == null) {
            return;
        }

        bell.setOnClickListener(v ->
                activity.startActivity(new Intent(activity, NotificationsActivity.class)));

        SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE);
        String token = prefs.getString(KEY_TOKEN, null);
        if (TextUtils.isEmpty(token)) {
            return;
        }

        NotificationApi api = ApiClient.getClient().create(NotificationApi.class);
        api.getUnreadCount("Bearer " + token).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                int unread = 0;
                JsonObject body = response.body();
                if (response.isSuccessful() && body != null
                        && body.has("unreadCount") && !body.get("unreadCount").isJsonNull()) {
                    unread = body.get("unreadCount").getAsInt();
                }
                bell.setBackgroundResource(unread > 0
                        ? R.drawable.bg_bell_alert
                        : R.drawable.bg_card_soft_clay);
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                // Mantem o aspeto por defeito do sino.
            }
        });
    }
}
