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
    name VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255),
    requirements INT NOT NULL
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

