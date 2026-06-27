package com.lifinity.app.models;

// Corpo do pedido POST /chat/conversations/private: { idfriend }.
// O backend (chatController.createPrivateConversation) cria ou devolve a conversa
// privada com o amigo indicado e responde com { idconversation }.
public class CreatePrivateConversationRequest {
    private final Integer idfriend;

    public CreatePrivateConversationRequest(Integer idfriend) {
        this.idfriend = idfriend;
    }

    public Integer getIdfriend() {
        return idfriend;
    }
}
