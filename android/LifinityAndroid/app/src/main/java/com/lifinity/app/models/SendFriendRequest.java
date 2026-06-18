package com.lifinity.app.models;

/**
 * Corpo do pedido POST /friends/request: { iduser_receiver }.
 */
public class SendFriendRequest {
    private Integer iduser_receiver;

    public SendFriendRequest(Integer idUserReceiver) {
        this.iduser_receiver = idUserReceiver;
    }

    public Integer getIduserReceiver() {
        return iduser_receiver;
    }
}
