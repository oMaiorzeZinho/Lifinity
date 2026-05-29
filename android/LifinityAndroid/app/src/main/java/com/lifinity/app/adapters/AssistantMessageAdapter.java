package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.AssistantMessage;

import java.util.ArrayList;
import java.util.List;

public class AssistantMessageAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final int TYPE_USER      = 0;
    private static final int TYPE_ASSISTANT = 1;

    private final List<AssistantMessage> messages = new ArrayList<>();

    // Substitui toda a lista e actualiza o ecrã.
    public void setMessages(List<AssistantMessage> newMessages) {
        messages.clear();
        if (newMessages != null) {
            messages.addAll(newMessages);
        }
        notifyDataSetChanged();
    }

    // Acrescenta uma mensagem no fim sem recarregar toda a lista.
    public void addMessage(AssistantMessage msg) {
        messages.add(msg);
        notifyItemInserted(messages.size() - 1);
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isUser() ? TYPE_USER : TYPE_ASSISTANT;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        if (viewType == TYPE_USER) {
            View view = inflater.inflate(R.layout.item_message_user, parent, false);
            return new UserViewHolder(view);
        } else {
            View view = inflater.inflate(R.layout.item_message_assistant, parent, false);
            return new AssistantViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        AssistantMessage msg = messages.get(position);
        if (holder instanceof UserViewHolder) {
            ((UserViewHolder) holder).bind(msg);
        } else {
            ((AssistantViewHolder) holder).bind(msg);
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    // ── ViewHolder para mensagens do utilizador ──────────────────────────────

    static class UserViewHolder extends RecyclerView.ViewHolder {
        private final TextView contentText;

        UserViewHolder(@NonNull View itemView) {
            super(itemView);
            contentText = itemView.findViewById(R.id.messageContentText);
        }

        void bind(AssistantMessage msg) {
            contentText.setText(msg.getContent() != null ? msg.getContent() : "");
        }
    }

    // ── ViewHolder para mensagens do assistente ──────────────────────────────

    static class AssistantViewHolder extends RecyclerView.ViewHolder {
        private final TextView contentText;

        AssistantViewHolder(@NonNull View itemView) {
            super(itemView);
            contentText = itemView.findViewById(R.id.messageContentText);
        }

        void bind(AssistantMessage msg) {
            contentText.setText(msg.getContent() != null ? msg.getContent() : "");
        }
    }
}
