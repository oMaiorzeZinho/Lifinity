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
import com.lifinity.app.models.Task;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.text.ParseException;
import java.text.SimpleDateFormat;

public class TaskAdapter extends RecyclerView.Adapter<TaskAdapter.TaskViewHolder> {
    private final List<Task> tasks = new ArrayList<>();
    private final OnTaskCompleteClickListener completeClickListener;
    private final OnTaskOptionsClickListener optionsClickListener;

    public TaskAdapter(
            OnTaskCompleteClickListener completeClickListener,
            OnTaskOptionsClickListener optionsClickListener
    ) {
        this.completeClickListener = completeClickListener;
        this.optionsClickListener = optionsClickListener;
    }

    public void setTasks(List<Task> newTasks) {
        tasks.clear();
        if (newTasks != null) {
            tasks.addAll(newTasks);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public TaskViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_task, parent, false);
        return new TaskViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull TaskViewHolder holder, int position) {
        holder.bind(tasks.get(position), completeClickListener, optionsClickListener);
    }

    @Override
    public int getItemCount() {
        return tasks.size();
    }

    public interface OnTaskCompleteClickListener {
        void onTaskCompleteClick(Task task);
    }

    public interface OnTaskOptionsClickListener {
        void onTaskOptionsClick(Task task);
    }

    static class TaskViewHolder extends RecyclerView.ViewHolder {
        private final TextView titleText;
        private final TextView descriptionText;
        private final TextView priorityText;
        private final TextView statusText;
        private final TextView dueDateText;
        private final TextView createdAtText;
        private final Button completeButton;
        private final Button optionsButton;

        TaskViewHolder(@NonNull View itemView) {
            super(itemView);
            titleText = itemView.findViewById(R.id.taskTitleText);
            descriptionText = itemView.findViewById(R.id.taskDescriptionText);
            priorityText = itemView.findViewById(R.id.taskPriorityText);
            statusText = itemView.findViewById(R.id.taskStatusText);
            dueDateText = itemView.findViewById(R.id.taskDueDateText);
            createdAtText = itemView.findViewById(R.id.taskCreatedAtText);
            completeButton = itemView.findViewById(R.id.taskCompleteButton);
            optionsButton = itemView.findViewById(R.id.taskOptionsButton);
        }

        void bind(
                Task task,
                OnTaskCompleteClickListener completeClickListener,
                OnTaskOptionsClickListener optionsClickListener
        ) {
            titleText.setText(valueOrFallback(task.getTitle(), "Tarefa sem titulo"));
            descriptionText.setText(valueOrFallback(task.getDescription(), "Sem descricao."));
            priorityText.setText("Prioridade: " + valueOrFallback(task.getPriority(), "-"));
            statusText.setText("Estado: " + valueOrFallback(task.getStatus(), "-"));
            dueDateText.setText("Data limite: " + valueOrFallback(task.getDueDate(), "-"));
            createdAtText.setText("Criada em: " + valueOrFallback(task.getCreatedAt(), "-"));

            if (canCompleteTask(task)) {
                completeButton.setVisibility(View.VISIBLE);
                completeButton.setOnClickListener(v -> completeClickListener.onTaskCompleteClick(task));
            } else {
                completeButton.setVisibility(View.GONE);
                completeButton.setOnClickListener(null);
            }

            optionsButton.setOnClickListener(v -> optionsClickListener.onTaskOptionsClick(task));
        }

        private String valueOrFallback(String value, String fallback) {
            if (TextUtils.isEmpty(value)) {
                return fallback;
            }
            return value;
        }

        private boolean canCompleteTask(Task task) {
            if (task == null || task.getIdtask() == null) {
                return false;
            }

            String status = task.getStatus();
            if (!TextUtils.isEmpty(status)) {
                String normalizedStatus = status.trim().toLowerCase(Locale.US);
                if ("concluida".equals(normalizedStatus)
                        || "perdida".equals(normalizedStatus)
                        || "perdido".equals(normalizedStatus)
                        || "lost".equals(normalizedStatus)) {
                    return false;
                }
            }

            Date dueDate = parseDate(task.getDueDate());
            return dueDate == null || !dueDate.before(new Date());
        }

        private Date parseDate(String value) {
            if (TextUtils.isEmpty(value)) {
                return null;
            }

            String[] patterns = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd"
            };

            for (String pattern : patterns) {
                try {
                    SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
                    return format.parse(value);
                } catch (ParseException ignored) {
                    // Try the next server date format.
                }
            }

            return null;
        }
    }
}
