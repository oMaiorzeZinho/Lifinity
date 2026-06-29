package com.lifinity.app.models;

import java.util.ArrayList;
import java.util.List;

/**
 * Corpo do POST /tasks. Além do título/descrição/prioridade/prazo, transporta
 * a quem a tarefa é atribuída — IGUAL ao que o frontend web já enviava:
 *   - assignees: lista de iduser de AMIGOS (vazia = só para mim);
 *   - groups: lista de idgroup de GRUPOS (vazia = só para mim).
 * Os nomes dos campos têm de ser EXATAMENTE "assignees" e "groups" para o GSON
 * gerar o JSON que o backend (taskController.createTask) espera. O backend valida
 * que só se atribui a amigos aceites / grupos a que pertencemos. NÃO se tocou no backend.
 */
public class CreateTaskRequest {
    private String title;
    private String description;
    private String priority;
    private String due_date;
    private List<Integer> assignees = new ArrayList<>();
    private List<Integer> groups = new ArrayList<>();

    public CreateTaskRequest(String title, String description, String priority, String dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.due_date = dueDate;
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

    public String getDueDate() {
        return due_date;
    }

    public List<Integer> getAssignees() {
        return assignees;
    }

    // Preenche os amigos destinatários (lista vazia = só para mim).
    public void setAssignees(List<Integer> assignees) {
        this.assignees = assignees != null ? assignees : new ArrayList<>();
    }

    public List<Integer> getGroups() {
        return groups;
    }

    // Preenche os grupos destinatários (lista vazia = só para mim).
    public void setGroups(List<Integer> groups) {
        this.groups = groups != null ? groups : new ArrayList<>();
    }
}
