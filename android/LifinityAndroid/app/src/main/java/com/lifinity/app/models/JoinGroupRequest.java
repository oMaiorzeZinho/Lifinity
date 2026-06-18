package com.lifinity.app.models;

/**
 * Corpo do pedido POST /groups/join: { inviteCode }.
 */
public class JoinGroupRequest {
    private String inviteCode;

    public JoinGroupRequest(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public String getInviteCode() {
        return inviteCode;
    }
}
