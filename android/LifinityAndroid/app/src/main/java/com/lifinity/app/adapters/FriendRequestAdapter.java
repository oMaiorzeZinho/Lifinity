package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.FriendRequest;
import com.lifinity.app.utils.AvatarLoader;

import java.util.ArrayList;
import java.util.List;

/** Adapter dos pedidos de amizade recebidos, com botões de aceitar e recusar. */
public class FriendRequestAdapter extends RecyclerView.Adapter<FriendRequestAdapter.ViewHolder> {

    public interface OnRequestActionListener {
        void onAccept(FriendRequest request);
        void onDecline(FriendRequest request);
    }

    private final List<FriendRequest> requests = new ArrayList<>();
    private final OnRequestActionListener actionListener;

    public FriendRequestAdapter(OnRequestActionListener actionListener) {
        this.actionListener = actionListener;
    }

    public void setRequests(List<FriendRequest> newRequests) {
        requests.clear();
        if (newRequests != null) {
            requests.addAll(newRequests);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_friend_request, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(requests.get(position), actionListener);
    }

    @Override
    public int getItemCount() {
        return requests.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView avatarText;
        private final ImageView avatarImage;
        private final TextView usernameText;
        // Aceitar/recusar são ImageView (ic_check/ic_close); declarados como View para o
        // findViewById + setOnClickListener funcionarem sem ClassCastException.
        private final View acceptButton;
        private final View declineButton;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.requestAvatarText);
            avatarImage = itemView.findViewById(R.id.requestAvatarImage);
            usernameText = itemView.findViewById(R.id.requestUsernameText);
            acceptButton = itemView.findViewById(R.id.requestAcceptButton);
            declineButton = itemView.findViewById(R.id.requestDeclineButton);
        }

        void bind(FriendRequest request, OnRequestActionListener listener) {
            String username = request.getUsername();
            usernameText.setText(username);
            // Mostra a foto real se houver; senão, o placeholder (círculo + inicial).
            AvatarLoader.load(avatarImage, request.getAvatar(), avatarText, username);

            acceptButton.setOnClickListener(v -> {
                if (listener != null) listener.onAccept(request);
            });
            declineButton.setOnClickListener(v -> {
                if (listener != null) listener.onDecline(request);
            });
        }
    }
}
