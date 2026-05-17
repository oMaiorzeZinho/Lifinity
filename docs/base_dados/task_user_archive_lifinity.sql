-- Incremental para permitir ocultar tarefas colaborativas por utilizador.
-- Executar uma vez no phpMyAdmin antes de usar a nova versao do backend.
--
-- Se a tabela ja existir, o IF NOT EXISTS evita recriacao.

CREATE TABLE IF NOT EXISTS TASK_USER_ARCHIVE (
    idtask INT NOT NULL,
    iduser INT NOT NULL,
    hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idtask, iduser),
    KEY idx_task_user_archive_user (iduser),
    FOREIGN KEY (idtask) REFERENCES TASK(idtask) ON DELETE CASCADE,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);
