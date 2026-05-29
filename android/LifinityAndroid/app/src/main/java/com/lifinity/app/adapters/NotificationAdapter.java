package com.lifinity.app.adapters;

import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Notification;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NotificationAdapter extends RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder> {

    public interface OnNotificationClick {
        void onClick(Notification notification);
    }

    private final List<Notification> notifications = new ArrayList<>();
    private final OnNotificationClick clickListener;

    public NotificationAdapter(OnNotificationClick clickListener) {
        this.clickListener = clickListener;
    }

    public void setNotifications(List<Notification> newNotifications) {
        notifications.clear();
        if (newNotifications != null) {
            notifications.addAll(newNotifications);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public NotificationViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_notification, parent, false);
        return new NotificationViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull NotificationViewHolder holder, int position) {
        holder.bind(notifications.get(position), clickListener);
    }

    @Override
    public int getItemCount() {
        return notifications.size();
    }

    static class NotificationViewHolder extends RecyclerView.ViewHolder {
        private final View unreadDot;
        private final TextView messageText;
        private final TextView typeText;
        private final TextView timeText;

        NotificationViewHolder(@NonNull View itemView) {
            super(itemView);
            unreadDot = itemView.findViewById(R.id.notificationUnreadDot);
            messageText = itemView.findViewById(R.id.notificationMessageText);
            typeText = itemView.findViewById(R.id.notificationTypeText);
            timeText = itemView.findViewById(R.id.notificationTimeText);
        }

        void bind(Notification notification, OnNotificationClick listener) {
            boolean read = notification != null && notification.isRead();

            messageText.setText(valueOrFallback(
                    notification == null ? null : notification.getMessage(),
                    "Notificação"
            ));
            typeText.setText(formatType(notification == null ? null : notification.getType()));
            timeText.setText(formatDate(notification == null ? null : notification.getCreatedAt()));

            unreadDot.setVisibility(read ? View.INVISIBLE : View.VISIBLE);
            itemView.setBackgroundResource(read
                    ? R.drawable.bg_card_soft_clay
                    : R.drawable.bg_card_clay);
            itemView.setAlpha(read ? 0.85f : 1f);

            itemView.setOnClickListener(v -> {
                if (listener != null && notification != null) {
                    listener.onClick(notification);
                }
            });
        }

        private String formatType(String type) {
            if (TextUtils.isEmpty(type)) {
                return "Geral";
            }
            String trimmed = type.trim();
            return trimmed.substring(0, 1).toUpperCase(Locale.US) + trimmed.substring(1);
        }

        private String formatDate(String value) {
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
                        return new SimpleDateFormat("dd/MM · HH:mm", Locale.US).format(date);
                    }
                } catch (ParseException ignored) {
                    // tenta o proximo formato
                }
            }
            return value.length() >= 10 ? value.substring(0, 10) : value;
        }

        private String valueOrFallback(String value, String fallback) {
            return TextUtils.isEmpty(value) ? fallback : value;
        }
    }
}
