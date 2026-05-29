package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.lifinity.app.R;
import com.lifinity.app.models.RankingUser;
import java.util.List;

public class RankingAdapter extends RecyclerView.Adapter<RankingAdapter.ViewHolder> {
    private final List<RankingUser> users;
    private final int currentUserId;

    public RankingAdapter(List<RankingUser> users, int currentUserId) {
        this.users = users;
        this.currentUserId = currentUserId;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_ranking, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder h, int position) {
        RankingUser u = users.get(position);
        int rank = position + 1;
        String medal = rank == 1 ? "🥇" : rank == 2 ? "🥈" : rank == 3 ? "🥉" : String.valueOf(rank);
        h.position.setText(medal);
        h.username.setText(u.getUsername());
        h.level.setText("Nível " + u.getLevel());
        h.xp.setText(u.getXp() + " XP");
        if (u.getIduser() != null && u.getIduser() == currentUserId) {
            h.username.setTextColor(
                    h.itemView.getContext().getResources().getColor(R.color.lifinity_primary, null));
        }
    }

    @Override
    public int getItemCount() { return users.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        final TextView position, username, level, xp;
        ViewHolder(View v) {
            super(v);
            position = v.findViewById(R.id.rankPositionText);
            username = v.findViewById(R.id.rankUsernameText);
            level    = v.findViewById(R.id.rankLevelText);
            xp       = v.findViewById(R.id.rankXpText);
        }
    }
}
