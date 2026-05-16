USE lifinity_db;

-- Suporte para grupos de conversa criados diretamente no Chat.
-- Executar no phpMyAdmin antes de testar a funcionalidade.

ALTER TABLE CONVERSATION
    ADD COLUMN name VARCHAR(100) NULL AFTER type,
    ADD COLUMN idcreated_by INT NULL AFTER idgroup,
    ADD KEY idx_conversation_created_by (idcreated_by),
    ADD CONSTRAINT fk_conversation_created_by
        FOREIGN KEY (idcreated_by) REFERENCES USER(iduser) ON DELETE SET NULL;

ALTER TABLE CONVERSATION_MEMBER
    ADD COLUMN role ENUM('admin', 'membro') DEFAULT 'membro' AFTER iduser;

ALTER TABLE CONVERSATION
    ADD UNIQUE KEY unique_conversation_group (idgroup);
