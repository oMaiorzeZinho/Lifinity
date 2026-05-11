USE lifinity_db;

CREATE TABLE IF NOT EXISTS CONVERSATION (
    idconversation INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('private', 'group') DEFAULT 'private',
    idgroup INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_conversation_type (type),
    KEY idx_conversation_group (idgroup),
    FOREIGN KEY (idgroup) REFERENCES GROUP_ENTITY(idgroup) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CONVERSATION_MEMBER (
    idconversation INT,
    iduser INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idconversation, iduser),
    KEY idx_conversation_member_user (iduser),
    FOREIGN KEY (idconversation) REFERENCES CONVERSATION(idconversation) ON DELETE CASCADE,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS MESSAGE (
    idmessage INT AUTO_INCREMENT PRIMARY KEY,
    idconversation INT,
    idsender INT,
    content TEXT NOT NULL,
    message_type ENUM('text', 'verse', 'system') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME DEFAULT NULL,
    KEY idx_message_conversation_created (idconversation, created_at),
    FOREIGN KEY (idconversation) REFERENCES CONVERSATION(idconversation) ON DELETE CASCADE,
    FOREIGN KEY (idsender) REFERENCES USER(iduser) ON DELETE SET NULL
);
