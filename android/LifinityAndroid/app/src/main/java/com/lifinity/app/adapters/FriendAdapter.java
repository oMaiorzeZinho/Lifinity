package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Friend;
import com.lifinity.app.utils.AvatarLoader;

import java.util.ArrayList;
import java.util.List;

/**
 * Adapter reutilizável para mostrar amigos OU resultados de pesquisa.
 *
 * Tem dois modos:
 *  - modo AÇÃO (construtor com actionLabel): mostra um botão de texto ("Adicionar"
 *    nos resultados de pesquisa) que dispara {@link OnFriendActionListener};
 *  - modo OPÇÕES (construtor com {@link OnFriendOptionsListener}): mostra um botão
 *    "•••" que abre o menu de opções (Abrir conversa / Ver perfil / Remover) — usado
 *    na lista de amigos.
 */
public class FriendAdapter extends RecyclerView.Adapter<FriendAdapter.ViewHolder> {

    public interface OnFriendActionListener {
        void onFriendAction(Friend friend);
    }

    // Listener do botão "•••" (mais opções) na lista de amigos.
    public interface OnFriendOptionsListener {
        void onFriendOptions(Friend friend, View anchor);
    }

    private final List<Friend> friends = new ArrayList<>();
    private final String actionLabel;
    private final OnFriendActionListener actionListener;
    private final OnFriendOptionsListener optionsListener;
    private final boolean optionsMode;

    // Construtor do modo AÇÃO (botão de texto, ex.: "Adicionar").
    public FriendAdapter(String actionLabel, OnFriendActionListener actionListener) {
        this.actionLabel = actionLabel;
        this.actionListener = actionListener;
        this.optionsListener = null;
        this.optionsMode = false;
    }

    // Construtor do modo OPÇÕES (botão "•••" que abre o menu de 3 opções).
    public FriendAdapter(OnFriendOptionsListener optionsListener) {
        this.actionLabel = null;
        this.actionListener = null;
        this.optionsListener = optionsListener;
        this.optionsMode = true;
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
        holder.bind(friends.get(position), optionsMode, actionLabel, actionListener, optionsListener);
    }

    @Override
    public int getItemCount() {
        return friends.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView avatarText;
        private final ImageView avatarImage;
        private final TextView usernameText;
        private final TextView levelText;
        private final Button actionButton;
        // optionsButton é agora um ImageView (ic_dots); declarado como View para o
        // setVisibility/setOnClickListener funcionarem sem ClassCastException.
        private final View optionsButton;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.friendAvatarText);
            avatarImage = itemView.findViewById(R.id.friendAvatarImage);
            usernameText = itemView.findViewById(R.id.friendUsernameText);
            levelText = itemView.findViewById(R.id.friendLevelText);
            actionButton = itemView.findViewById(R.id.friendActionButton);
            optionsButton = itemView.findViewById(R.id.friendOptionsButton);
        }

        void bind(Friend friend, boolean optionsMode, String actionLabel,
                  OnFriendActionListener actionListener, OnFriendOptionsListener optionsListener) {
            String username = friend.getUsername();
            usernameText.setText(username);
            // Mostra a foto real se houver; senão, o placeholder (círculo + inicial).
            AvatarLoader.load(avatarImage, friend.getAvatar(), avatarText, username);
            levelText.setText("Nível " + friend.getLevel() + " · " + friend.getXp() + " XP");

            if (optionsMode) {
                // Lista de amigos: botão "•••" que abre o menu de opções.
                actionButton.setVisibility(View.GONE);
                optionsButton.setVisibility(View.VISIBLE);
                optionsButton.setOnClickListener(v -> {
                    if (optionsListener != null) optionsListener.onFriendOptions(friend, v);
                });
            } else {
                // Resultados de pesquisa: botão de texto ("Adicionar").
                optionsButton.setVisibility(View.GONE);
                actionButton.setVisibility(View.VISIBLE);
                actionButton.setText(actionLabel);
                actionButton.setOnClickListener(v -> {
                    if (actionListener != null) actionListener.onFriendAction(friend);
                });
            }
        }
    }
}
