package com.lifinity.app.adapters;

import android.text.TextUtils;
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
            // Mostra o nome do remetente só na 1.ª mensagem de uma sequência:
            // se a mensagem anterior for de OUTRO remetente (ou for minha), mostra-se.
            boolean showName = true;
            if (position > 0) {
                ChatMessage previous = messages.get(position - 1);
                boolean previousIsMine = previous.isMine(currentUserId);
                boolean sameSender = !previousIsMine
                        && previous.getIduser() != null
                        && msg.getIduser() != null
                        && previous.getIduser().intValue() == msg.getIduser().intValue();
                showName = !sameSender;
            }
            ((ReceivedViewHolder) holder).bind(msg, showName);
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
        private final TextView senderName;

        ReceivedViewHolder(@NonNull View itemView) {
            super(itemView);
            messageText = itemView.findViewById(R.id.chatMessageText);
            senderName  = itemView.findViewById(R.id.chatSenderName);
        }

        void bind(ChatMessage msg, boolean showName) {
            messageText.setText(msg.getContent() != null ? msg.getContent() : "");

            // Nome de quem enviou — visível só na 1.ª mensagem de cada sequência.
            String name = msg.getSenderName();
            if (showName && !TextUtils.isEmpty(name)) {
                senderName.setText(name);
                senderName.setVisibility(View.VISIBLE);
            } else {
                senderName.setVisibility(View.GONE);
            }
        }
    }
}
