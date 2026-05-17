-- Criar se não existir
CREATE DATABASE IF NOT EXISTS lifinity_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

-- Selecionar para uso
USE lifinity_db;

-- Criação de tabelas
-- Instruções em maiúsculas e nomes em minúsculas para questões visuais e de leitura
CREATE TABLE USER (
    iduser INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    avatar VARCHAR(255),
    current_streak INT DEFAULT 0,
    last_streak_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE CATEGORY (
    idcategory INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE GROUP_ENTITY (
    idgroup INT AUTO_INCREMENT PRIMARY KEY,
    idowner INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    invite_code VARCHAR(12) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (idowner) REFERENCES USER(iduser) ON DELETE SET NULL
);

CREATE TABLE TASK (
    idtask INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT,
    idcategory INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pendente', 'em_progresso', 'concluida') DEFAULT 'pendente',
    priority ENUM('baixa', 'media', 'alta') DEFAULT 'media',
    due_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    archived_at DATETIME DEFAULT NULL,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (idcategory) REFERENCES CATEGORY(idcategory) ON DELETE SET NULL
);

CREATE TABLE GOAL (
    idgoal INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT,
    title VARCHAR(255) NOT NULL,
    deadline DATETIME,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);

CREATE TABLE BADGE (
    idbadge INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(80) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    icon_url VARCHAR(255),
    requirements INT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE BIBLE_VERSE (
  idverse INT AUTO_INCREMENT PRIMARY KEY,
  book VARCHAR(100) NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text TEXT NOT NULL,
  theme VARCHAR(100) DEFAULT NULL
);

CREATE TABLE FAVORITE_VERSE (
  idfavorite INT AUTO_INCREMENT PRIMARY KEY,
  iduser INT NOT NULL,
  idverse INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
  FOREIGN KEY (idverse) REFERENCES BIBLE_VERSE(idverse) ON DELETE CASCADE,
  UNIQUE (iduser, idverse)
);

CREATE TABLE XP_HISTORY (
    idxp INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT NOT NULL,
    idtask INT DEFAULT NULL,
    amount INT NOT NULL,
    reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (idtask) REFERENCES TASK(idtask) ON DELETE SET NULL
);

-- Tabelas de Ligação (Relacionamentos N:M)
-- Membros de um Grupo
CREATE TABLE GROUP_MEMBER (
    iduser INT,
    idgroup INT,
    role ENUM('admin', 'membro') DEFAULT 'membro',
    PRIMARY KEY (iduser, idgroup),
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (idgroup) REFERENCES GROUP_ENTITY(idgroup) ON DELETE CASCADE
);

-- Medalhas dos Utilizadores
CREATE TABLE USER_BADGE (
    iduser INT,
    idbadge INT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (iduser, idbadge),
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (idbadge) REFERENCES BADGE(idbadge) ON DELETE CASCADE
);

CREATE TABLE USER_BADGE_HIGHLIGHT (
    iduser INT NOT NULL,
    idbadge INT NOT NULL,
    position INT NOT NULL,
    PRIMARY KEY (iduser, position),
    UNIQUE KEY unique_user_badge_highlight (iduser, idbadge),
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (idbadge) REFERENCES BADGE(idbadge) ON DELETE CASCADE,
    CHECK (position IN (1, 2, 3))
);

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

-- Tarefas Partilhadas em Grupos
CREATE TABLE GROUP_TASK (
    idtask INT,
    idgroup INT,
    PRIMARY KEY (idtask, idgroup),
    FOREIGN KEY (idtask) REFERENCES TASK(idtask) ON DELETE CASCADE,
    FOREIGN KEY (idgroup) REFERENCES GROUP_ENTITY(idgroup) ON DELETE CASCADE
);


-- 1. Tabela de Amizades (Para a aba de amigos e pesquisa)
CREATE TABLE IF NOT EXISTS FRIENDSHIP (
    idfriendship INT AUTO_INCREMENT PRIMARY KEY,
    iduser_requester INT,
    iduser_receiver INT,
    status ENUM('pendente', 'aceite', 'bloqueado') DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (iduser_requester) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (iduser_receiver) REFERENCES USER(iduser) ON DELETE CASCADE
);

-- 2. Tabela de Notificações (Essencial para avisar sobre novos amigos ou tarefas de grupo)
CREATE TABLE IF NOT EXISTS NOTIFICATION (
    idnotification INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT,
    type ENUM('amizade', 'tarefa', 'sistema') NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);

CREATE TABLE CONVERSATION (
    idconversation INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('private', 'group') DEFAULT 'private',
    name VARCHAR(100) DEFAULT NULL,
    idgroup INT DEFAULT NULL,
    idcreated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_conversation_type (type),
    KEY idx_conversation_group (idgroup),
    UNIQUE KEY unique_conversation_group (idgroup),
    KEY idx_conversation_created_by (idcreated_by),
    FOREIGN KEY (idgroup) REFERENCES GROUP_ENTITY(idgroup) ON DELETE CASCADE,
    FOREIGN KEY (idcreated_by) REFERENCES USER(iduser) ON DELETE SET NULL
);

CREATE TABLE CONVERSATION_MEMBER (
    idconversation INT,
    iduser INT,
    role ENUM('admin', 'membro') DEFAULT 'membro',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idconversation, iduser),
    KEY idx_conversation_member_user (iduser),
    FOREIGN KEY (idconversation) REFERENCES CONVERSATION(idconversation) ON DELETE CASCADE,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);

CREATE TABLE MESSAGE (
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

CREATE TABLE TASK_ASSIGNEE (
    idtask INT,
    iduser INT,
    assigned_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idtask, iduser),
    FOREIGN KEY (idtask) REFERENCES TASK(idtask) ON DELETE CASCADE,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES USER(iduser) ON DELETE SET NULL
);


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

-- Última Atualização: 16-05 às 22:28

