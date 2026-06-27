package com.lifinity.app.api;

import com.google.gson.JsonObject;
import com.lifinity.app.models.ChatMessage;
import com.lifinity.app.models.Conversation;
import com.lifinity.app.models.CreatePrivateConversationRequest;
import com.lifinity.app.models.SendChatMessageRequest;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface ChatApi {
    @GET("chat/conversations")
    Call<List<Conversation>> getConversations(@Header("Authorization") String token);

    // Cria (ou obtém, se já existir) a conversa privada com um amigo.
    // Resposta: { idconversation, message }.
    @POST("chat/conversations/private")
    Call<JsonObject> createPrivateConversation(
            @Header("Authorization") String token,
            @Body CreatePrivateConversationRequest body
    );

    @GET("chat/conversations/{id}/messages")
    Call<List<ChatMessage>> getMessages(
            @Header("Authorization") String token,
            @Path("id") int conversationId
    );

    @POST("chat/conversations/{id}/messages")
    Call<ChatMessage> sendMessage(
            @Header("Authorization") String token,
            @Path("id") int conversationId,
            @Body SendChatMessageRequest body
    );
}
