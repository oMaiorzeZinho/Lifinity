-- Migration segura para conquistas/medalhas do Lifinity.
-- Pensada para phpMyAdmin em bases de dados que podem ja ter a tabela BADGE.
-- Se a tua versao de MySQL/MariaDB suportar ADD COLUMN IF NOT EXISTS,
-- tambem podes adaptar estes comandos para uma forma mais curta.

USE lifinity_db;

-- 1) Adicionar colunas em BADGE apenas se ainda nao existirem.
-- code fica primeiro NULL para nao falhar em tabelas existentes com dados antigos.
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE BADGE ADD COLUMN code VARCHAR(50) NULL AFTER idbadge',
        'SELECT "BADGE.code ja existe"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BADGE'
      AND COLUMN_NAME = 'code'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE BADGE ADD COLUMN description TEXT AFTER name',
        'SELECT "BADGE.description ja existe"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BADGE'
      AND COLUMN_NAME = 'description'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE BADGE ADD COLUMN category VARCHAR(50) AFTER description',
        'SELECT "BADGE.category ja existe"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BADGE'
      AND COLUMN_NAME = 'category'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE BADGE ADD COLUMN sort_order INT DEFAULT 0 AFTER requirements',
        'SELECT "BADGE.sort_order ja existe"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BADGE'
      AND COLUMN_NAME = 'sort_order'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE BADGE ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER sort_order',
        'SELECT "BADGE.is_active ja existe"'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BADGE'
      AND COLUMN_NAME = 'is_active'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Alargar o nome da conquista, se necessario.
ALTER TABLE BADGE MODIFY COLUMN name VARCHAR(80) NOT NULL;

-- 3) Garantir indice unico em code, se ainda nao existir.
-- MySQL permite varios NULL num indice UNIQUE, por isso isto e seguro antes do NOT NULL.
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE BADGE ADD UNIQUE KEY unique_badge_code (code)',
        'SELECT "Indice unico para BADGE.code ja existe"'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'BADGE'
      AND COLUMN_NAME = 'code'
      AND NON_UNIQUE = 0
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Criar tabela de destaques.
CREATE TABLE IF NOT EXISTS USER_BADGE_HIGHLIGHT (
    iduser INT NOT NULL,
    idbadge INT NOT NULL,
    position INT NOT NULL,
    PRIMARY KEY (iduser, position),
    UNIQUE KEY unique_user_badge_highlight (iduser, idbadge),
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (idbadge) REFERENCES BADGE(idbadge) ON DELETE CASCADE,
    CHECK (position IN (1, 2, 3))
);

-- 5) Seeds iniciais. code e o identificador estavel.
INSERT INTO BADGE
    (code, name, description, category, requirements, sort_order, is_active)
VALUES
    ('level_2', 'Primeiro Salto', 'Atinge o nivel 2.', 'level', 2, 10, TRUE),
    ('level_5', 'Ritmo Consistente', 'Atinge o nivel 5.', 'level', 5, 20, TRUE),
    ('xp_500', '500 XP', 'Acumula 500 XP.', 'xp', 500, 30, TRUE),
    ('tasks_1', 'Primeira Tarefa', 'Conclui a primeira tarefa.', 'tasks', 1, 40, TRUE),
    ('tasks_10', 'Dez Feitas', 'Conclui 10 tarefas.', 'tasks', 10, 50, TRUE),
    ('tasks_50', 'Maratonista', 'Conclui 50 tarefas.', 'tasks', 50, 60, TRUE),
    ('high_priority_5', 'Prioridade Maxima', 'Conclui 5 tarefas de prioridade alta.', 'tasks', 5, 70, TRUE),
    ('before_deadline_5', 'Antes do Prazo', 'Conclui 5 tarefas antes do prazo.', 'tasks', 5, 80, TRUE),
    ('friends_1', 'Primeira Ligacao', 'Tem 1 amigo aceite.', 'friends', 1, 90, TRUE),
    ('friends_5', 'Circulo Proximo', 'Tem 5 amigos aceites.', 'friends', 5, 100, TRUE),
    ('groups_1', 'Em Equipa', 'Pertence a 1 grupo.', 'groups', 1, 110, TRUE),
    ('groups_3', 'Rede Ativa', 'Pertence a 3 grupos.', 'groups', 3, 120, TRUE),
    ('messages_1', 'Primeira Mensagem', 'Envia a primeira mensagem.', 'chat', 1, 130, TRUE),
    ('messages_25', 'Conversa Fluida', 'Envia 25 mensagens.', 'chat', 25, 140, TRUE),
    ('verses_favorite_1', 'Versiculo Guardado', 'Adiciona 1 versiculo aos favoritos.', 'verses', 1, 150, TRUE),
    ('verses_favorite_5', 'Colecao Inspiradora', 'Adiciona 5 versiculos aos favoritos.', 'verses', 5, 160, TRUE),
    ('verses_shared_1', 'Inspiracao Partilhada', 'Partilha 1 versiculo no chat.', 'verses', 1, 170, TRUE),
    ('assistant_1', 'Primeira Ajuda', 'Usa o assistente pela primeira vez.', 'assistant', 1, 180, TRUE),
    ('assistant_10', 'Assistente Habitual', 'Usa o assistente 10 vezes.', 'assistant', 10, 190, TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    category = VALUES(category),
    requirements = VALUES(requirements),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active);

-- 6) Tornar code NOT NULL apenas se for seguro.
-- Se existirem medalhas antigas com code NULL, este passo e ignorado.
-- Para concluir manualmente: atribui um code unico a essas linhas e volta a correr este bloco.
SET @badge_code_nulls = (
    SELECT COUNT(*)
    FROM BADGE
    WHERE code IS NULL OR code = ''
);

SET @sql = IF(
    @badge_code_nulls = 0,
    'ALTER TABLE BADGE MODIFY COLUMN code VARCHAR(50) NOT NULL',
    'SELECT "BADGE.code manteve-se NULLable porque existem medalhas antigas sem code"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
