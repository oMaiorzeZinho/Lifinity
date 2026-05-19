package com.lifinity.app.adapters;

import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.lifinity.app.R;
import com.lifinity.app.models.Task;

import java.util.ArrayList;
import java.util.List;

public class TaskAdapter extends RecyclerView.Adapter<TaskAdapter.TaskViewHolder> {
    private final List<Task> tasks = new ArrayList<>();

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
        holder.bind(tasks.get(position));
    }

    @Override
    public int getItemCount() {
        return tasks.size();
    }

    static class TaskViewHolder extends RecyclerView.ViewHolder {
        private final TextView titleText;
        private final TextView descriptionText;
        private final TextView priorityText;
        private final TextView statusText;
        private final TextView dueDateText;
        private final TextView createdAtText;

        TaskViewHolder(@NonNull View itemView) {
            super(itemView);
            titleText = itemView.findViewById(R.id.taskTitleText);
            descriptionText = itemView.findViewById(R.id.taskDescriptionText);
            priorityText = itemView.findViewById(R.id.taskPriorityText);
            statusText = itemView.findViewById(R.id.taskStatusText);
            dueDateText = itemView.findViewById(R.id.taskDueDateText);
            createdAtText = itemView.findViewById(R.id.taskCreatedAtText);
        }

        void bind(Task task) {
            titleText.setText(valueOrFallback(task.getTitle(), "Tarefa sem titulo"));
            descriptionText.setText(valueOrFallback(task.getDescription(), "Sem descricao."));
            priorityText.setText("Prioridade: " + valueOrFallback(task.getPriority(), "-"));
            statusText.setText("Estado: " + valueOrFallback(task.getStatus(), "-"));
            dueDateText.setText("Data limite: " + valueOrFallback(task.getDueDate(), "-"));
            createdAtText.setText("Criada em: " + valueOrFallback(task.getCreatedAt(), "-"));
        }

        private String valueOrFallback(String value, String fallback) {
            if (TextUtils.isEmpty(value)) {
                return fallback;
            }
            return value;
        }
    }
}
