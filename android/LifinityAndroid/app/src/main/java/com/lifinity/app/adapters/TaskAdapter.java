package com.lifinity.app.adapters;

import android.content.Context;
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
        private final TextView priorityPill;
        private final TextView statusText;
        private final TextView dueDateText;
        private final TextView creatorAssigneeText;
        private final TextView createdAtText;
        private final Button completeButton;
        // optionsButton é agora um ImageView (ic_dots); declarado como View para o
        // setOnClickListener funcionar sem ClassCastException no findViewById.
        private final View optionsButton;
        private final Context context;

        TaskViewHolder(@NonNull View itemView) {
            super(itemView);
            context = itemView.getContext();
            titleText = itemView.findViewById(R.id.taskTitleText);
            descriptionText = itemView.findViewById(R.id.taskDescriptionText);
            priorityPill = itemView.findViewById(R.id.taskPriorityPill);
            statusText = itemView.findViewById(R.id.taskStatusText);
            dueDateText = itemView.findViewById(R.id.taskDueDateText);
            creatorAssigneeText = itemView.findViewById(R.id.taskCreatorAssigneeText);
            createdAtText = itemView.findViewById(R.id.taskCreatedAtText);
            completeButton = itemView.findViewById(R.id.taskCompleteButton);
            optionsButton = itemView.findViewById(R.id.taskOptionsButton);
        }

        void bind(
                Task task,
                OnTaskCompleteClickListener completeClickListener,
                OnTaskOptionsClickListener optionsClickListener
        ) {
            titleText.setText(valueOrFallback(task.getTitle(), "Atividade sem título"));

            // Cartão inteiro a coral quando a tarefa está perdida (toda a informação
            // continua legível por cima). Define-se SEMPRE nos dois casos por causa da
            // reciclagem de views (senão um cartão reciclado ficaria vermelho por engano).
            boolean lost = isLost(task);
            itemView.setBackgroundResource(lost ? R.drawable.bg_card_lost : R.drawable.bg_card_clay);

            String description = task.getDescription();
            if (!TextUtils.isEmpty(description)) {
                descriptionText.setText(description);
                descriptionText.setVisibility(View.VISIBLE);
            } else {
                descriptionText.setVisibility(View.GONE);
            }

            bindPriorityPill(task.getPriority());
            bindStatus(task);
            bindDueDate(task.getDueDate());

            // Linha "criador para destinatário" (escondida nas tarefas pessoais).
            String creatorAssignee = task.getCreatorAssigneeLabel();
            if (!TextUtils.isEmpty(creatorAssignee)) {
                creatorAssigneeText.setText(creatorAssignee);
                creatorAssigneeText.setVisibility(View.VISIBLE);
            } else {
                creatorAssigneeText.setVisibility(View.GONE);
            }

            String createdAt = formatShortDate(task.getCreatedAt());
            if (!TextUtils.isEmpty(createdAt)) {
                createdAtText.setText("Criada a " + createdAt);
                createdAtText.setVisibility(View.VISIBLE);
            } else {
                createdAtText.setVisibility(View.GONE);
            }

            if (canCompleteTask(task)) {
                completeButton.setVisibility(View.VISIBLE);
                completeButton.setOnClickListener(v -> completeClickListener.onTaskCompleteClick(task));
            } else {
                completeButton.setVisibility(View.GONE);
                completeButton.setOnClickListener(null);
            }

            optionsButton.setOnClickListener(v -> optionsClickListener.onTaskOptionsClick(task));
        }

        private void bindPriorityPill(String priority) {
            if (TextUtils.isEmpty(priority)) {
                priorityPill.setVisibility(View.GONE);
                return;
            }
            priorityPill.setVisibility(View.VISIBLE);
            switch (priority.trim().toLowerCase(Locale.US)) {
                case "alta":
                    priorityPill.setText("ALTA");
                    priorityPill.setBackgroundResource(R.drawable.bg_pill_alta);
                    break;
                case "media":
                    priorityPill.setText("MÉDIA");
                    priorityPill.setBackgroundResource(R.drawable.bg_pill_media);
                    break;
                case "baixa":
                    priorityPill.setText("BAIXA");
                    priorityPill.setBackgroundResource(R.drawable.bg_pill_baixa);
                    break;
                default:
                    priorityPill.setText(priority.toUpperCase(Locale.US));
                    priorityPill.setBackgroundResource(R.drawable.bg_card_soft_clay);
                    break;
            }
        }

        private void bindStatus(Task task) {
            // Nota: repõe-se SEMPRE fundo e cor em cada caso (reciclagem de views).
            if (isCompleted(task)) {
                statusText.setText("Concluída");
                statusText.setBackgroundResource(R.drawable.bg_card_soft_clay);
                statusText.setTextColor(context.getColor(R.color.lifinity_text_secondary));
                statusText.setVisibility(View.VISIBLE);
            } else if (isLost(task)) {
                // Perdida: o cartão inteiro já está coral, por isso o estado passa a ser
                // um rótulo VERMELHO sem chip (em vez do antigo chip cinzento "Perdida").
                statusText.setText("PERDIDA");
                statusText.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                statusText.setTextColor(context.getColor(R.color.lifinity_danger));
                statusText.setVisibility(View.VISIBLE);
            } else {
                statusText.setVisibility(View.GONE);
            }
        }

        private void bindDueDate(String dueDate) {
            if (TextUtils.isEmpty(dueDate)) {
                dueDateText.setVisibility(View.GONE);
                return;
            }
            String formatted = formatShortDate(dueDate);
            if (!TextUtils.isEmpty(formatted)) {
                dueDateText.setText("Prazo: " + formatted);
                dueDateText.setVisibility(View.VISIBLE);
            } else {
                dueDateText.setVisibility(View.GONE);
            }
        }

        private String formatShortDate(String value) {
            if (TextUtils.isEmpty(value)) return null;
            try {
                Date date = parseDate(value);
                if (date == null) return value.length() >= 10 ? value.substring(0, 10) : value;
                return new SimpleDateFormat("dd/MM/yyyy", Locale.US).format(date);
            } catch (Exception e) {
                return value.length() >= 10 ? value.substring(0, 10) : value;
            }
        }

        private String valueOrFallback(String value, String fallback) {
            return TextUtils.isEmpty(value) ? fallback : value;
        }

        private boolean canCompleteTask(Task task) {
            if (task == null || task.getIdtask() == null) return false;
            if (isCompleted(task) || isLost(task)) return false;
            // Tarefa com destinatários individuais (amigos): só o destinatário a conclui.
            // Se tem assignees e eu NÃO sou o destinatário (task_origin != 'assigned_to_me'),
            // escondo o "Concluir" para evitar o erro 403 do backend. Tarefas de grupo
            // (sem assignees individuais) mantêm o "Concluir" (qualquer membro conclui).
            boolean hasAssignees = task.hasAssignees();
            boolean iAmAssignee = "assigned_to_me".equals(task.getTaskOrigin());
            if (hasAssignees && !iAmAssignee) return false;
            return true;
        }

        private boolean isCompleted(Task task) {
            if (task == null || TextUtils.isEmpty(task.getStatus())) return false;
            return "concluida".equals(task.getStatus().trim().toLowerCase(Locale.US));
        }

        private boolean isLost(Task task) {
            if (task == null || isCompleted(task)) return false;
            Date dueDate = parseDate(task.getDueDate());
            return dueDate != null && dueDate.before(new Date());
        }

        private Date parseDate(String value) {
            if (TextUtils.isEmpty(value)) return null;
            String[] patterns = {
                    "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
                    "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                    "yyyy-MM-dd'T'HH:mm:ssXXX",
                    "yyyy-MM-dd'T'HH:mm:ss'Z'",
                    "yyyy-MM-dd'T'HH:mm",
                    "yyyy-MM-dd HH:mm:ss",
                    "yyyy-MM-dd"
            };
            for (String pattern : patterns) {
                try {
                    return new SimpleDateFormat(pattern, Locale.US).parse(value);
                } catch (ParseException ignored) {
                }
            }
            return null;
        }
    }
}
