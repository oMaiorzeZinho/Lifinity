-- Incremental para tornar as notificacoes internas clicaveis.
-- Executar uma vez no phpMyAdmin antes de arrancar o backend atualizado.
--
-- Nota para MariaDB/MySQL:
-- Algumas versoes nao suportam "ADD COLUMN IF NOT EXISTS".
-- Se uma instrucao falhar com erro de coluna ou indice duplicado, significa
-- que este incremental ja foi executado nessa base de dados.

ALTER TABLE NOTIFICATION
  ADD COLUMN entity_type VARCHAR(50) NULL AFTER message,
  ADD COLUMN entity_id INT NULL AFTER entity_type,
  ADD COLUMN link VARCHAR(255) NULL AFTER entity_id;

CREATE INDEX idx_notification_entity
  ON NOTIFICATION (entity_type, entity_id);
