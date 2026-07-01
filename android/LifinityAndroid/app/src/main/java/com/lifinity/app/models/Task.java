package com.lifinity.app.models;

import android.text.TextUtils;

import com.google.gson.annotations.SerializedName;

public class Task {
    private Integer idtask;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String due_date;
    private String created_at;

    // Data/hora em que a tarefa foi concluída (o backend devolve via t.*). Usado no
    // "Resumo de hoje" para contar só as CONCLUÍDAS de hoje (e não as de sempre).
    @SerializedName("completed_at")
    private String completed_at;

    // Campos de origem/atribuição já devolvidos pelo backend (taskController):
    //  - creator_username: quem criou a tarefa;
    //  - assignee_names: nomes dos destinatários diretos (amigos), "A, B" ou null;
    //  - group_names: nomes dos grupos a que foi atribuída, "G1, G2" ou null;
    //  - task_origin: 'created_by_me' | 'assigned_to_me' | 'group_task'.
    @SerializedName("creator_username")
    private String creator_username;

    @SerializedName("assignee_names")
    private String assignee_names;

    @SerializedName("group_names")
    private String group_names;

    @SerializedName("task_origin")
    private String task_origin;

    // Sinalizadores (0/1) já devolvidos pelo backend: indicam se a tarefa tem
    // destinatários individuais (amigos) e/ou grupos. Usados para esconder o botão
    // "Concluir" quando a tarefa foi criada por mim para outra pessoa (só o
    // destinatário a pode concluir — o backend responde 403 caso contrário).
    @SerializedName("has_assignees")
    private Integer has_assignees;

    @SerializedName("has_groups")
    private Integer has_groups;

    public Integer getIdtask() {
        return idtask;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public String getDueDate() {
        return due_date;
    }

    public String getCreatedAt() {
        return created_at;
    }

    public String getCompletedAt() {
        return completed_at;
    }

    public String getCreatorUsername() {
        return creator_username;
    }

    /** true se a tarefa tem destinatários individuais (amigos). */
    public boolean hasAssignees() {
        return has_assignees != null && has_assignees == 1;
    }

    /** true se a tarefa foi atribuída a grupos. */
    public boolean hasGroups() {
        return has_groups != null && has_groups == 1;
    }

    public String getAssigneeNames() {
        return assignee_names;
    }

    public String getGroupNames() {
        return group_names;
    }

    public String getTaskOrigin() {
        return task_origin;
    }

    /**
     * Texto "criador para destinatário" para mostrar no cartão (ex.: "teste para cliente").
     * Destinatário = destinatários diretos (assignee_names) ou, na falta destes, os grupos
     * (group_names). Tarefas pessoais (criadas por mim só para mim) não têm destinatários
     * nem grupos → devolve null (a linha é escondida). Também esconde se criador ==
     * destinatário, para evitar "X para X".
     */
    public String getCreatorAssigneeLabel() {
        if (TextUtils.isEmpty(creator_username)) {
            return null;
        }

        String target;
        if (!TextUtils.isEmpty(assignee_names)) {
            target = assignee_names;
        } else if (!TextUtils.isEmpty(group_names)) {
            target = group_names;
        } else {
            // Sem destinatários nem grupos → tarefa pessoal → não mostrar nada.
            return null;
        }

        if (creator_username.equals(target)) {
            return null;
        }

        return creator_username + " para " + target;
    }
}
