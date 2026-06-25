-- ============================================================================
-- Lifinity — tabela PASSWORD_RESET (recuperação de palavra-passe por código)
-- ============================================================================
-- Editar o estrutura_lifinity.sql NÃO cria a tabela na base de dados que o XAMPP
-- já está a correr. Por isso, corre ESTE ficheiro UMA vez no phpMyAdmin:
--   1) Abrir o phpMyAdmin (XAMPP) -> separador "SQL" da base de dados lifinity_db
--   2) Colar este conteúdo e executar.
-- (Usa CREATE TABLE IF NOT EXISTS, por isso é seguro correr mesmo que já exista.)
-- ============================================================================

USE lifinity_db;

CREATE TABLE IF NOT EXISTS PASSWORD_RESET (
    idreset INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);
