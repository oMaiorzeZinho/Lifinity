USE lifinity_db;

CREATE TABLE IF NOT EXISTS ASSISTANT_MESSAGE (
    idmessage INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT NOT NULL,
    sender ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    action_type VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_assistant_message_user_created (iduser, created_at),
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);
