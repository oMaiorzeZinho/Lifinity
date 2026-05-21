package com.lifinity.app.adapters;

import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Achievement;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class AchievementAdapter extends RecyclerView.Adapter<AchievementAdapter.AchievementViewHolder> {
    private final List<Achievement> achievements = new ArrayList<>();

    public void setAchievements(List<Achievement> newAchievements) {
        achievements.clear();
        if (newAchievements != null) {
            achievements.addAll(newAchievements);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public AchievementViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_achievement, parent, false);
        return new AchievementViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AchievementViewHolder holder, int position) {
        holder.bind(achievements.get(position));
    }

    @Override
    public int getItemCount() {
        return achievements.size();
    }

    static class AchievementViewHolder extends RecyclerView.ViewHolder {
        private final TextView nameText;
        private final TextView descriptionText;
        private final TextView categoryText;
        private final TextView stateText;
        private final TextView highlightedText;

        AchievementViewHolder(@NonNull View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.achievementNameText);
            descriptionText = itemView.findViewById(R.id.achievementDescriptionText);
            categoryText = itemView.findViewById(R.id.achievementCategoryText);
            stateText = itemView.findViewById(R.id.achievementStateText);
            highlightedText = itemView.findViewById(R.id.achievementHighlightedText);
        }

        void bind(Achievement achievement) {
            boolean unlocked = achievement != null && achievement.isUnlocked();
            boolean highlighted = achievement != null && achievement.isHighlighted();

            itemView.setAlpha(unlocked ? 1f : 0.58f);
            nameText.setText(valueOrFallback(achievement == null ? null : achievement.getName(), "Conquista"));
            descriptionText.setText(valueOrFallback(
                    achievement == null ? null : achievement.getDescription(),
                    "Continua a usar o Lifinity para desbloquear esta conquista."
            ));
            categoryText.setText("Categoria: " + formatCategory(achievement == null ? null : achievement.getCategory()));
            stateText.setText(unlocked ? "Desbloqueada" : "Bloqueada");
            stateText.setTextColor(itemView.getResources().getColor(
                    unlocked ? R.color.lifinity_primary : R.color.lifinity_text_secondary,
                    itemView.getContext().getTheme()
            ));

            highlightedText.setVisibility(highlighted ? View.VISIBLE : View.GONE);
        }

        private String formatCategory(String category) {
            if (TextUtils.isEmpty(category)) {
                return "geral";
            }

            String trimmedCategory = category.trim();
            if (TextUtils.isEmpty(trimmedCategory)) {
                return "geral";
            }

            return trimmedCategory.substring(0, 1).toUpperCase(Locale.US) + trimmedCategory.substring(1);
        }

        private String valueOrFallback(String value, String fallback) {
            if (TextUtils.isEmpty(value)) {
                return fallback;
            }

            return value;
        }
    }
}
