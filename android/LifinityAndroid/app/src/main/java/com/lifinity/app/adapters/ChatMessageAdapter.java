package com.lifinity.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.ChatMessage;

import java.util.ArrayList;
import java.util.List;

// Adapter de chat com dois tipos de bolhas: enviada (direita) e recebida (esquerda).
public class ChatMessageAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final int TYPE_SENT     = 0;
    private static final int TYPE_RECEIVED = 1;

    private final List<ChatMessage> messages = new ArrayList<>();
    private final int currentUserId;

    public ChatMessageAdapter(int currentUserId) {
        this.currentUserId = currentUserId;
    }

    public void setMessages(List<ChatMessage> newMessages) {
        messages.clear();
        if (newMessages != null) {
            messages.addAll(newMessages);
        }
        notifyDataSetChanged();
    }

    // Acrescenta uma mensagem no fim sem recarregar toda a lista.
    public void addMessage(ChatMessage msg) {
        messages.add(msg);
        notifyItemInserted(messages.size() - 1);
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isMine(currentUserId) ? TYPE_SENT : TYPE_RECEIVED;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(parent.getContext());
        if (viewType == TYPE_SENT) {
            View view = inflater.inflate(R.layout.item_chat_sent, parent, false);
            return new SentViewHolder(view);
        } else {
            View view = inflater.inflate(R.layout.item_chat_received, parent, false);
            return new ReceivedViewHolder(view);
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        ChatMessage msg = messages.get(position);
        if (holder instanceof SentViewHolder) {
            ((SentViewHolder) holder).bind(msg);
        } else {
            ((ReceivedViewHolder) holder).bind(msg);
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    // ── ViewHolder para mensagens enviadas ───────────────────────────────────

    static class SentViewHolder extends RecyclerView.ViewHolder {
        private final TextView messageText;

        SentViewHolder(@NonNull View itemView) {
            super(itemView);
            messageText = itemView.findViewById(R.id.chatMessageText);
        }

        void bind(ChatMessage msg) {
            messageText.setText(msg.getContent() != null ? msg.getContent() : "");
        }
    }

    // ── ViewHolder para mensagens recebidas ──────────────────────────────────

    static class ReceivedViewHolder extends RecyclerView.ViewHolder {
        private final TextView messageText;

        ReceivedViewHolder(@NonNull View itemView) {
            super(itemView);
            messageText = itemView.findViewById(R.id.chatMessageText);
        }

        void bind(ChatMessage msg) {
            messageText.setText(msg.getContent() != null ? msg.getContent() : "");
        }
    }
}
