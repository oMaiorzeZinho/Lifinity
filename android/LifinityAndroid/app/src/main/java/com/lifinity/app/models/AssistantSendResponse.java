package com.lifinity.app.models;

import java.util.List;

public class AssistantSendResponse {
    private AssistantMessage reply;
    private List<AssistantMessage> messages;
    private String action_type;

    public AssistantMessage getReply() {
        return reply;
    }

    public List<AssistantMessage> getMessages() {
        return messages;
    }

    public String getActionType() {
        return action_type;
    }
}
