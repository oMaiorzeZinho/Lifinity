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
import com.lifinity.app.models.FriendRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
        private final TextView usernameText;
        private final Button acceptButton;
        private final Button declineButton;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            avatarText = itemView.findViewById(R.id.requestAvatarText);
            usernameText = itemView.findViewById(R.id.requestUsernameText);
            acceptButton = itemView.findViewById(R.id.requestAcceptButton);
            declineButton = itemView.findViewById(R.id.requestDeclineButton);
        }

        void bind(FriendRequest request, OnRequestActionListener listener) {
            String username = request.getUsername();
            usernameText.setText(username);
            avatarText.setText(initialOf(username));

            acceptButton.setOnClickListener(v -> {
                if (listener != null) listener.onAccept(request);
            });
            declineButton.setOnClickListener(v -> {
                if (listener != null) listener.onDecline(request);
            });
        }

        private String initialOf(String username) {
            if (TextUtils.isEmpty(username)) return "?";
            return username.substring(0, 1).toUpperCase(Locale.getDefault());
        }
    }
}
