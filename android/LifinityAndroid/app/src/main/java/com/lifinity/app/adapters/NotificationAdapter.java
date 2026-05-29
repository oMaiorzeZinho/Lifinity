package com.lifinity.app.adapters;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.AppNotification;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class NotificationAdapter extends RecyclerView.Adapter<NotificationAdapter.ViewHolder> {

    // Callback para clique numa notificação.
    public interface OnNotificationClickListener {
        void onNotificationClick(AppNotification notification);
    }

    private final List<AppNotification> notifications = new ArrayList<>();
    private final OnNotificationClickListener clickListener;

    public NotificationAdapter(OnNotificationClickListener clickListener) {
        this.clickListener = clickListener;
    }

    public void setNotifications(List<AppNotification> newNotifications) {
        notifications.clear();
        if (newNotifications != null) {
            notifications.addAll(newNotifications);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_notification, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(notifications.get(position), clickListener);
    }

    @Override
    public int getItemCount() {
        return notifications.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final View dot;
        private final TextView messageText;
        private final TextView dateText;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            dot = itemView.findViewById(R.id.notificationDot);
            messageText = itemView.findViewById(R.id.notificationMessageText);
            dateText = itemView.findViewById(R.id.notificationDateText);
        }

        void bind(AppNotification notification, OnNotificationClickListener listener) {
            boolean read = notification != null && notification.isRead();

            // Texto da mensagem
            messageText.setText(notification != null && !TextUtils.isEmpty(notification.getMessage())
                    ? notification.getMessage()
                    : "Notificação");

            // Negrito se não lida, normal se lida
            messageText.setTypeface(null, read ? Typeface.NORMAL : Typeface.BOLD);

            // Data formatada
            dateText.setText(formatDate(notification != null ? notification.getCreatedAt() : null));

            // Indicador circular: menta (#7EE0A2) se não lida, cinzento (#888888) se lida
            GradientDrawable circle = new GradientDrawable();
            circle.setShape(GradientDrawable.OVAL);
            circle.setColor(read ? Color.parseColor("#888888")
                    : itemView.getContext().getResources().getColor(R.color.lifinity_primary, null));
            dot.setBackground(circle);

            // Clique: só aciona o listener se a notificação ainda não foi lida
            itemView.setOnClickListener(v -> {
                if (listener != null && notification != null && !notification.isRead()) {
                    listener.onNotificationClick(notification);
                }
            });
        }

        private String formatDate(String value) {
            if (TextUtils.isEmpty(value)) return "";

            // Tenta vários formatos ISO que o backend pode enviar
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

            // Fallback: mostra os primeiros 10 caracteres (yyyy-MM-dd)
            return value.length() >= 10 ? value.substring(0, 10) : value;
        }
    }
}
