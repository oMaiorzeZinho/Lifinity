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

    public String getCreatorUsername() {
        return creator_username;
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
