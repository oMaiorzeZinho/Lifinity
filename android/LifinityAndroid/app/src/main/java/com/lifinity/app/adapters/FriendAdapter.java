package com.lifinity.app.adapters;

import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Friend;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Adapter reutilizável para mostrar amigos OU resultados de pesquisa. O texto do
 * botão de ação ("Remover" ou "Adicionar") e o que ele faz são passados no construtor,
 * para o mesmo item servir os dois casos sem duplicação.
 */
public class FriendAdapter extends RecyclerView.Adapter<FriendAdapter.ViewHolder> {

    public interface OnFriendActionListener {
        void onFriendAction(Friend friend);
    }

    private final List<Friend> friends = new ArrayList<>();
    private final String actionLabel;
    private final OnFriendActionListener actionListener;

    public FriendAdapter(String actionLabel, OnFriendActionListener actionListener) {
        this.actionLabel = actionLabel;
        this.actionListener = actionListener;
    }

    public void setFriends(List<Friend> newFriends) {
        friends.clear();
        if (newFriends != null) {
            friends.addAll(newFriends);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_friend, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(friends.get(position), actionLabel, actionListener);
    }

    @Override
    public int getItemCount() {
        return friends.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView avatarText;
        private final TextView usernameText;
        private final TextView levelText;
        private final Button actionButton;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.friendAvatarText);
            usernameText = itemView.findViewById(R.id.friendUsernameText);
            levelText = itemView.findViewById(R.id.friendLevelText);
            actionButton = itemView.findViewById(R.id.friendActionButton);
        }

        void bind(Friend friend, String actionLabel, OnFriendActionListener listener) {
            String username = friend.getUsername();
            usernameText.setText(username);
            avatarText.setText(initialOf(username));
            levelText.setText("Nível " + friend.getLevel() + " · " + friend.getXp() + " XP");

            actionButton.setText(actionLabel);
            actionButton.setOnClickListener(v -> {
                if (listener != null) listener.onFriendAction(friend);
            });
        }

        private String initialOf(String username) {
            if (TextUtils.isEmpty(username)) return "?";
            return username.substring(0, 1).toUpperCase(Locale.getDefault());
        }
    }
}
