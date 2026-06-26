package com.lifinity.app;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.text.TextUtils;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import com.google.gson.Gson;
import com.lifinity.app.models.User;
import com.lifinity.app.utils.AvatarLoader;

// Configura a barra de navegação inferior (nav_bottom.xml) em cada Activity principal:
//  - liga o FAB central (criar tarefa);
//  - aplica o estado ativo/inativo a cada tab (fundo, COR DO ÍCONE vetorial e do rótulo);
//  - na tab Perfil, carrega a MINIATURA da foto de perfil (com fallback para o ícone "person").
public class BottomNavHelper {
    public enum Tab { TASKS, COMMUNITY, INSPIRATION, PROFILE }

    private static final String PREFS_NAME = "lifinity_prefs";
    private static final String KEY_USER = "user";

    public static void setup(Activity activity, Tab active) {
        View fab = activity.findViewById(R.id.navFab);
        if (fab != null) fab.setOnClickListener(v ->
                activity.startActivity(new Intent(activity, CreateTaskActivity.class)));

        configureTab(activity, R.id.navTabTasks, R.id.navTabTasksIcon, R.id.navTabTasksLabel,
                Tab.TASKS, active);
        configureTab(activity, R.id.navTabCommunity, R.id.navTabCommunityIcon, R.id.navTabCommunityLabel,
                Tab.COMMUNITY, active);
        configureTab(activity, R.id.navTabInspiration, R.id.navTabInspirationIcon, R.id.navTabInspirationLabel,
                Tab.INSPIRATION, active);
        configureTab(activity, R.id.navTabProfile, R.id.navTabProfileIcon, R.id.navTabProfileLabel,
                Tab.PROFILE, active);

        // Miniatura do avatar na tab Perfil (foto real quando existe; senão fica o ícone "person").
        loadProfileAvatar(activity);
    }

    /** Aplica o estado ativo/inativo a uma tab: fundo realçado, ícone vetorial e rótulo recoloridos. */
    private static void configureTab(Activity activity, int tabId, int iconId, int labelId,
                                     Tab tab, Tab active) {
        View tabView = activity.findViewById(tabId);
        if (tabView == null) return;

        boolean isActive = tab == active;
        int color = activity.getResources().getColor(
                isActive ? R.color.lifinity_primary : R.color.lifinity_text_secondary, null);

        // Fundo da tab ativa (pílula menta) — null quando inativa.
        tabView.setBackground(isActive
                ? activity.getResources().getDrawable(R.drawable.bg_nav_item_active, null)
                : null);

        // Ícone vetorial: recolorido por estado (substitui o setTextColor dos antigos ícones-texto).
        View icon = activity.findViewById(iconId);
        if (icon instanceof ImageView) {
            ((ImageView) icon).setColorFilter(color);
        }

        // Rótulo de texto por baixo do ícone.
        View label = activity.findViewById(labelId);
        if (label instanceof TextView) {
            ((TextView) label).setTextColor(color);
        }

        if (!isActive) {
            tabView.setOnClickListener(v -> navigate(activity, tab));
        } else {
            // A tab ativa não navega para si própria.
            tabView.setOnClickListener(null);
        }
    }

    /** Carrega a foto de perfil guardada na ImageView circular da tab Perfil. */
    private static void loadProfileAvatar(Activity activity) {
        ImageView avatar = activity.findViewById(R.id.navTabProfileAvatar);
        if (avatar == null) return;
        // initialView/username a null: na barra não se escreve a inicial. Sem foto, a
        // ImageView fica GONE (AvatarLoader) e aparece o ícone "person" por baixo.
        AvatarLoader.load(avatar, savedAvatarPath(activity), null, null);
    }

    /** Lê o caminho do avatar do utilizador guardado (mesmo sítio que o ProfileActivity usa). */
    private static String savedAvatarPath(Activity activity) {
        try {
            SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE);
            String savedUser = prefs.getString(KEY_USER, null);
            if (TextUtils.isEmpty(savedUser)) return null;
            User user = new Gson().fromJson(savedUser, User.class);
            return user == null ? null : user.getAvatar();
        } catch (Exception ignored) {
            return null;
        }
    }

    private static void navigate(Activity from, Tab target) {
        Class<?> dest;
        switch (target) {
            case TASKS:       dest = TasksActivity.class; break;
            case COMMUNITY:   dest = CommunityActivity.class; break;
            case INSPIRATION: dest = InspirationActivity.class; break;
            case PROFILE:     dest = ProfileActivity.class; break;
            default:          return;
        }
        Intent i = new Intent(from, dest);
        i.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        from.startActivity(i);
    }
}
