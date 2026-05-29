package com.lifinity.app;

import android.app.Activity;
import android.content.Intent;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

public class BottomNavHelper {
    public enum Tab { TASKS, RANKING, INSPIRATION, PROFILE }

    public static void setup(Activity activity, Tab active) {
        View fab = activity.findViewById(R.id.navFab);
        if (fab != null) fab.setOnClickListener(v ->
                activity.startActivity(new Intent(activity, CreateTaskActivity.class)));

        int[] tabIds = {R.id.navTabTasks, R.id.navTabRanking,
                R.id.navTabInspiration, R.id.navTabProfile};
        Tab[] tabs   = {Tab.TASKS, Tab.RANKING, Tab.INSPIRATION, Tab.PROFILE};

        for (int i = 0; i < tabIds.length; i++) {
            View tab = activity.findViewById(tabIds[i]);
            if (tab == null) continue;
            boolean isActive = tabs[i] == active;
            applyState(activity, tab, isActive);
            Tab target = tabs[i];
            if (!isActive) tab.setOnClickListener(v -> navigate(activity, target));
        }
    }

    private static void navigate(Activity from, Tab target) {
        Class<?> dest;
        switch (target) {
            case TASKS:       dest = TasksActivity.class; break;
            case RANKING:     dest = RankingActivity.class; break;
            case INSPIRATION: dest = InspirationActivity.class; break;
            case PROFILE:     dest = ProfileActivity.class; break;
            default:          return;
        }
        Intent i = new Intent(from, dest);
        i.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        from.startActivity(i);
    }

    private static void applyState(Activity activity, View tab, boolean active) {
        int color = active
                ? activity.getResources().getColor(R.color.lifinity_primary, null)
                : activity.getResources().getColor(R.color.lifinity_text_secondary, null);
        tab.setBackground(active
                ? activity.getResources().getDrawable(R.drawable.bg_nav_item_active, null)
                : null);
        if (tab instanceof LinearLayout) {
            LinearLayout ll = (LinearLayout) tab;
            for (int i = 0; i < ll.getChildCount(); i++) {
                if (ll.getChildAt(i) instanceof TextView) {
                    ((TextView) ll.getChildAt(i)).setTextColor(color);
                }
            }
        }
    }
}
