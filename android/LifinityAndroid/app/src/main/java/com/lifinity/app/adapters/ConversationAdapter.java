package com.lifinity.app.adapters;

import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Conversation;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ConversationAdapter extends RecyclerView.Adapter<ConversationAdapter.ViewHolder> {

    // Callback para clique numa conversa.
    public interface OnConversationClickListener {
        void onConversationClick(Conversation conversation);
    }

    private final List<Conversation> conversations = new ArrayList<>();
    private final OnConversationClickListener clickListener;

    public ConversationAdapter(OnConversationClickListener clickListener) {
        this.clickListener = clickListener;
    }

    public void setConversations(List<Conversation> newConversations) {
        conversations.clear();
        if (newConversations != null) {
            conversations.addAll(newConversations);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_conversation, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(conversations.get(position), clickListener);
    }

    @Override
    public int getItemCount() {
        return conversations.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView nameText;
        private final TextView lastMessageText;
        private final TextView dateText;
        private final TextView unreadBadge;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            nameText        = itemView.findViewById(R.id.convNameText);
            lastMessageText = itemView.findViewById(R.id.convLastMessageText);
            dateText        = itemView.findViewById(R.id.convDateText);
            unreadBadge     = itemView.findViewById(R.id.convUnreadBadge);
        }

        void bind(Conversation conversation, OnConversationClickListener listener) {
            nameText.setText(!TextUtils.isEmpty(conversation.getName())
                    ? conversation.getName() : "Conversa");

            if (!TextUtils.isEmpty(conversation.getLastMessage())) {
                lastMessageText.setText(conversation.getLastMessage());
                lastMessageText.setVisibility(View.VISIBLE);
            } else {
                lastMessageText.setVisibility(View.GONE);
            }

            dateText.setText(formatDate(conversation.getUpdatedAt()));

            // Badge circular de mensagens não lidas
            int unread = conversation.getUnreadCount() != null ? conversation.getUnreadCount() : 0;
            if (unread > 0) {
                GradientDrawable circle = new GradientDrawable();
                circle.setShape(GradientDrawable.OVAL);
                circle.setColor(itemView.getContext().getResources()
                        .getColor(R.color.lifinity_primary, null));
                unreadBadge.setBackground(circle);
                unreadBadge.setText(String.valueOf(unread));
                unreadBadge.setVisibility(View.VISIBLE);
            } else {
                unreadBadge.setVisibility(View.GONE);
            }

            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onConversationClick(conversation);
                }
            });
        }

        private String formatDate(String value) {
            if (TextUtils.isEmpty(value)) return "";

            // Tenta vários formatos ISO enviados pelo backend
            String[] patterns = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd'T'HH:mm"
            };

            for (String pattern : patterns) {
                try {
                    Date date = new SimpleDateFormat(pattern, Locale.US).parse(value);
                    if (date != null) {
                        return new SimpleDateFormat("dd/MM · HH:mm", Locale.US).format(date);
                    }
                } catch (ParseException ignored) {
                    // tenta o próximo formato
                }
            }
            return value.length() >= 10 ? value.substring(0, 10) : value;
        }
    }
}
