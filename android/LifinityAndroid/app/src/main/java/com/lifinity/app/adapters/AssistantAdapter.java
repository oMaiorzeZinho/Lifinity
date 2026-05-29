package com.lifinity.app.adapters;

import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.AssistantMessage;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class AssistantAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final int TYPE_USER = 0;
    private static final int TYPE_ASSISTANT = 1;

    private final List<AssistantMessage> messages = new ArrayList<>();

    public void setMessages(List<AssistantMessage> newMessages) {
        messages.clear();
        if (newMessages != null) {
            messages.addAll(newMessages);
        }
        notifyDataSetChanged();
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isFromUser() ? TYPE_USER : TYPE_ASSISTANT;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layout = viewType == TYPE_USER
                ? R.layout.item_chat_message_sent
                : R.layout.item_chat_message_received;
        View view = LayoutInflater.from(parent.getContext()).inflate(layout, parent, false);
        return new MessageViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        ((MessageViewHolder) holder).bind(messages.get(position));
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    static class MessageViewHolder extends RecyclerView.ViewHolder {
        private final TextView contentText;
        private final TextView timeText;
        private final TextView senderName;

        MessageViewHolder(@NonNull View itemView) {
            super(itemView);
            contentText = itemView.findViewById(R.id.messageContentText);
            timeText = itemView.findViewById(R.id.messageTimeText);
            senderName = itemView.findViewById(R.id.messageSenderName);
        }

        void bind(AssistantMessage message) {
            contentText.setText(message.getContent());

            String time = formatTime(message.getCreatedAt());
            if (TextUtils.isEmpty(time)) {
                timeText.setVisibility(View.GONE);
            } else {
                timeText.setVisibility(View.VISIBLE);
                timeText.setText(time);
            }

            if (senderName != null) {
                senderName.setVisibility(View.VISIBLE);
                senderName.setText("Assistente");
            }
        }

        private String formatTime(String value) {
            if (TextUtils.isEmpty(value)) {
                return "";
            }

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
                        return new SimpleDateFormat("HH:mm", Locale.US).format(date);
                    }
                } catch (ParseException ignored) {
                    // tenta o proximo formato
                }
            }
            return "";
        }
    }
}
