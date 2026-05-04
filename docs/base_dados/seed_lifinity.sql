-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 27-Abr-2026 às 01:31
-- Versão do servidor: 10.4.32-MariaDB
-- versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `lifinity_db`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `badge`
--

CREATE TABLE `badge` (
  `idbadge` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `icon_url` varchar(255) DEFAULT NULL,
  `requirements` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `bible_verse`
--

CREATE TABLE `bible_verse` (
  `idverse` int(11) NOT NULL,
  `book` varchar(100) NOT NULL,
  `chapter` int(11) NOT NULL,
  `verse` int(11) NOT NULL,
  `text` text NOT NULL,
  `theme` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `bible_verse`
--

INSERT INTO `bible_verse` (`idverse`, `book`, `chapter`, `verse`, `text`, `theme`) VALUES
(1, 'João', 3, 16, 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', 'amor'),
(2, 'Filipenses', 4, 13, 'Posso todas as coisas naquele que me fortalece.', 'força'),
(3, 'Jeremias', 29, 11, 'Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz e não de mal, para vos dar um futuro e uma esperança.', 'esperança'),
(4, 'Salmos', 23, 1, 'O Senhor é o meu pastor; nada me faltará.', 'confiança'),
(5, 'Provérbios', 3, 5, 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.', 'confiança'),
(6, 'Isaías', 41, 10, 'Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.', 'coragem'),
(7, 'Romanos', 8, 28, 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.', 'esperança'),
(8, 'Mateus', 11, 28, 'Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.', 'consolo'),
(9, 'Josué', 1, 9, 'Não to mandei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes, porque o Senhor teu Deus é contigo por onde quer que andares.', 'coragem'),
(10, 'Salmos', 46, 1, 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', 'força'),
(11, '2 Timóteo', 1, 7, 'Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação.', 'força'),
(12, 'Hebreus', 11, 1, 'Ora, a fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não veem.', 'fé'),
(13, 'Romanos', 12, 12, 'Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.', 'esperança'),
(14, 'Salmos', 37, 5, 'Entrega o teu caminho ao Senhor; confia nele, e ele o fará.', 'confiança'),
(15, 'Mateus', 5, 14, 'Vós sois a luz do mundo; não se pode esconder uma cidade edificada sobre um monte.', 'propósito'),
(16, 'Gálatas', 6, 9, 'E não nos cansemos de fazer bem, porque a seu tempo ceifaremos, se não houvermos desfalecido.', 'perseverança'),
(17, 'Tiago', 1, 12, 'Bem-aventurado o homem que sofre a tentação; porque, quando for provado, receberá a coroa da vida.', 'perseverança'),
(18, 'Salmos', 121, 1, 'Elevo os meus olhos para os montes: de onde me virá o socorro?', 'esperança'),
(19, 'João', 14, 27, 'Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá.', 'paz'),
(20, 'Provérbios', 16, 3, 'Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos.', 'propósito');

-- --------------------------------------------------------

--
-- Estrutura da tabela `category`
--

CREATE TABLE `category` (
  `idcategory` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `favorite_verse`
--

CREATE TABLE `favorite_verse` (
  `idfavorite` int(11) NOT NULL,
  `iduser` int(11) NOT NULL,
  `idverse` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `favorite_verse`
--

INSERT INTO `favorite_verse` (`idfavorite`, `iduser`, `idverse`, `created_at`) VALUES
(8, 3, 16, '2026-04-25 18:37:18'),
(10, 3, 13, '2026-04-25 19:14:03'),
(11, 3, 17, '2026-04-25 19:14:14'),
(13, 3, 6, '2026-04-25 19:14:31');

-- --------------------------------------------------------

--
-- Estrutura da tabela `friendship`
--

CREATE TABLE `friendship` (
  `idfriendship` int(11) NOT NULL,
  `iduser_requester` int(11) DEFAULT NULL,
  `iduser_receiver` int(11) DEFAULT NULL,
  `status` enum('pendente','aceite','bloqueado') DEFAULT 'pendente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `friendship`
--

INSERT INTO `friendship` (`idfriendship`, `iduser_requester`, `iduser_receiver`, `status`, `created_at`) VALUES
(1, 3, 1, 'aceite', '2026-04-26 19:17:03');

-- --------------------------------------------------------

--
-- Estrutura da tabela `goal`
--

CREATE TABLE `goal` (
  `idgoal` int(11) NOT NULL,
  `iduser` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `deadline` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `group_entity`
--

CREATE TABLE `group_entity` (
  `idgroup` int(11) NOT NULL,
  `idowner` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `invite_code` varchar(12) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `group_entity`
--

INSERT INTO `group_entity` (`idgroup`, `idowner`, `name`, `description`, `invite_code`, `created_at`) VALUES
(1, 3, 'Grupo Sigma', 'Aquele grupo mesmo fixe', 'MBXOWKBF', '2026-04-26 19:17:18');

-- --------------------------------------------------------

--
-- Estrutura da tabela `group_member`
--

CREATE TABLE `group_member` (
  `iduser` int(11) NOT NULL,
  `idgroup` int(11) NOT NULL,
  `role` enum('admin','membro') DEFAULT 'membro'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `group_member`
--

INSERT INTO `group_member` (`iduser`, `idgroup`, `role`) VALUES
(1, 1, 'membro'),
(3, 1, 'admin');

-- --------------------------------------------------------

--
-- Estrutura da tabela `group_task`
--

CREATE TABLE `group_task` (
  `idtask` int(11) NOT NULL,
  `idgroup` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `notification`
--

CREATE TABLE `notification` (
  `idnotification` int(11) NOT NULL,
  `iduser` int(11) DEFAULT NULL,
  `type` enum('amizade','tarefa','sistema') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `task`
--

CREATE TABLE `task` (
  `idtask` int(11) NOT NULL,
  `iduser` int(11) DEFAULT NULL,
  `idcategory` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pendente','em_progresso','concluida') DEFAULT 'pendente',
  `priority` enum('baixa','media','alta') DEFAULT 'media',
  `due_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `task`
--

INSERT INTO `task` (`idtask`, `iduser`, `idcategory`, `title`, `description`, `status`, `priority`, `due_date`, `created_at`, `completed_at`, `archived_at`) VALUES
(50, 1, NULL, 'awdas', 'dasdad', 'concluida', 'media', NULL, '2026-04-20 10:44:48', NULL, NULL),
(53, 3, NULL, 'estudar matemática', '20 minutos', 'concluida', 'media', NULL, '2026-04-23 23:12:46', NULL, '2026-04-25 21:13:00'),
(58, 3, NULL, 'awsdawd', 'dwadswasd', 'concluida', 'baixa', NULL, '2026-04-25 19:13:26', NULL, '2026-04-25 21:13:00'),
(62, 3, NULL, 'asdas', 'dadasd', 'concluida', 'media', NULL, '2026-04-25 20:00:48', '2026-04-25 21:00:49', '2026-04-25 21:13:00'),
(63, 3, NULL, 'wadsa', 'daasdsaad', 'concluida', 'alta', NULL, '2026-04-25 20:09:32', '2026-04-25 21:11:49', '2026-04-25 21:13:00'),
(64, 3, NULL, 'asda', 'dasdsad', 'concluida', 'media', NULL, '2026-04-25 20:09:35', '2026-04-25 21:11:51', '2026-04-25 21:13:00'),
(65, 3, NULL, 'asdad', 'asdaaa', 'concluida', 'media', NULL, '2026-04-25 20:09:47', '2026-04-25 21:11:53', '2026-04-25 21:13:00'),
(66, 3, NULL, 'aaaaaa', 'aaaaaaaa', 'concluida', 'media', NULL, '2026-04-25 20:14:09', '2026-04-25 21:15:20', '2026-04-25 21:15:25'),
(67, 3, NULL, 'aa', 'aaaaaaaa', 'concluida', 'media', NULL, '2026-04-25 20:30:36', '2026-04-25 21:30:37', '2026-04-26 19:50:38'),
(68, 3, NULL, 'asd', 'asd', 'concluida', 'media', NULL, '2026-04-26 18:48:42', '2026-04-26 19:48:43', '2026-04-26 19:48:46'),
(70, 3, NULL, 'asd', 'wasd', 'concluida', 'media', NULL, '2026-04-26 18:59:07', '2026-04-26 19:59:08', '2026-04-26 19:59:13'),
(71, 3, NULL, 'asdasd', 'asdadsd', 'concluida', 'media', NULL, '2026-04-26 19:02:07', '2026-04-26 20:02:08', NULL),
(72, 3, NULL, 'aaaa', 'aasdasd', 'pendente', 'media', NULL, '2026-04-26 19:02:25', NULL, NULL),
(73, 3, NULL, 'wasd', 'asdad', 'concluida', 'media', NULL, '2026-04-26 21:08:20', '2026-04-26 22:08:22', NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `task_assignee`
--

CREATE TABLE `task_assignee` (
  `idtask` int(11) NOT NULL,
  `iduser` int(11) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `user`
--

CREATE TABLE `user` (
  `iduser` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `xp` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 1,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `current_streak` int(11) DEFAULT 0,
  `last_streak_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `user`
--

INSERT INTO `user` (`iduser`, `username`, `email`, `password`, `xp`, `level`, `avatar`, `created_at`, `current_streak`, `last_streak_date`) VALUES
(1, 'cliente', 'cliente@gmail.com', '$2b$10$LSEDY5nSUYu44y4RjsO4JuVG2I5D7gJMFG8FqZ6NZyCcBxe7NuPMi', 3174, 11, NULL, '2026-04-14 22:28:04', 0, NULL),
(3, 'teste', 'teste@lifinity.com', '$2b$10$uQzco/2KmJ7GDUmaZJF3fepr5O2MZPK3/iHWbPpI8HueLWUCfwdoy', 1465, 6, NULL, '2026-04-23 21:53:19', 0, NULL);

-- --------------------------------------------------------

--
-- Estrutura da tabela `user_badge`
--

CREATE TABLE `user_badge` (
  `iduser` int(11) NOT NULL,
  `idbadge` int(11) NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura da tabela `xp_history`
--

CREATE TABLE `xp_history` (
  `idxp` int(11) NOT NULL,
  `iduser` int(11) NOT NULL,
  `idtask` int(11) DEFAULT NULL,
  `amount` int(11) NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `xp_history`
--

INSERT INTO `xp_history` (`idxp`, `iduser`, `idtask`, `amount`, `reason`, `created_at`) VALUES
(1, 3, NULL, 71, 'task_completed', '2026-04-25 19:49:32'),
(2, 3, NULL, 143, 'task_completed', '2026-04-25 19:49:32'),
(3, 3, NULL, 28, 'task_completed', '2026-04-25 19:49:33'),
(4, 3, 62, 71, 'task_completed', '2026-04-25 20:00:49'),
(5, 3, 63, 143, 'task_completed', '2026-04-25 20:11:49'),
(6, 3, 64, 71, 'task_completed', '2026-04-25 20:11:51'),
(7, 3, 65, 71, 'task_completed', '2026-04-25 20:11:53'),
(8, 3, 66, 71, 'task_completed', '2026-04-25 20:15:20'),
(9, 3, 67, 71, 'task_completed', '2026-04-25 20:30:37'),
(10, 3, 68, 71, 'task_completed', '2026-04-26 18:48:43'),
(11, 3, 70, 71, 'task_completed', '2026-04-26 18:59:08'),
(12, 3, 71, 71, 'task_completed', '2026-04-26 19:02:08'),
(13, 3, 73, 71, 'task_completed', '2026-04-26 21:08:22');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `badge`
--
ALTER TABLE `badge`
  ADD PRIMARY KEY (`idbadge`);

--
-- Índices para tabela `bible_verse`
--
ALTER TABLE `bible_verse`
  ADD PRIMARY KEY (`idverse`);

--
-- Índices para tabela `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`idcategory`);

--
-- Índices para tabela `favorite_verse`
--
ALTER TABLE `favorite_verse`
  ADD PRIMARY KEY (`idfavorite`),
  ADD UNIQUE KEY `iduser` (`iduser`,`idverse`),
  ADD KEY `idverse` (`idverse`);

--
-- Índices para tabela `friendship`
--
ALTER TABLE `friendship`
  ADD PRIMARY KEY (`idfriendship`),
  ADD KEY `iduser_requester` (`iduser_requester`),
  ADD KEY `iduser_receiver` (`iduser_receiver`);

--
-- Índices para tabela `goal`
--
ALTER TABLE `goal`
  ADD PRIMARY KEY (`idgoal`),
  ADD KEY `iduser` (`iduser`);

--
-- Índices para tabela `group_entity`
--
ALTER TABLE `group_entity`
  ADD PRIMARY KEY (`idgroup`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `idowner` (`idowner`);

--
-- Índices para tabela `group_member`
--
ALTER TABLE `group_member`
  ADD PRIMARY KEY (`iduser`,`idgroup`),
  ADD KEY `idgroup` (`idgroup`);

--
-- Índices para tabela `group_task`
--
ALTER TABLE `group_task`
  ADD PRIMARY KEY (`idtask`,`idgroup`),
  ADD KEY `idgroup` (`idgroup`);

--
-- Índices para tabela `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`idnotification`),
  ADD KEY `iduser` (`iduser`);

--
-- Índices para tabela `task`
--
ALTER TABLE `task`
  ADD PRIMARY KEY (`idtask`),
  ADD KEY `iduser` (`iduser`),
  ADD KEY `idcategory` (`idcategory`);

--
-- Índices para tabela `task_assignee`
--
ALTER TABLE `task_assignee`
  ADD PRIMARY KEY (`idtask`,`iduser`),
  ADD KEY `iduser` (`iduser`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Índices para tabela `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`iduser`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Índices para tabela `user_badge`
--
ALTER TABLE `user_badge`
  ADD PRIMARY KEY (`iduser`,`idbadge`),
  ADD KEY `idbadge` (`idbadge`);

--
-- Índices para tabela `xp_history`
--
ALTER TABLE `xp_history`
  ADD PRIMARY KEY (`idxp`),
  ADD KEY `iduser` (`iduser`),
  ADD KEY `idtask` (`idtask`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `badge`
--
ALTER TABLE `badge`
  MODIFY `idbadge` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `bible_verse`
--
ALTER TABLE `bible_verse`
  MODIFY `idverse` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de tabela `category`
--
ALTER TABLE `category`
  MODIFY `idcategory` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `favorite_verse`
--
ALTER TABLE `favorite_verse`
  MODIFY `idfavorite` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `friendship`
--
ALTER TABLE `friendship`
  MODIFY `idfriendship` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `goal`
--
ALTER TABLE `goal`
  MODIFY `idgoal` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `group_entity`
--
ALTER TABLE `group_entity`
  MODIFY `idgroup` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `notification`
--
ALTER TABLE `notification`
  MODIFY `idnotification` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `task`
--
ALTER TABLE `task`
  MODIFY `idtask` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT de tabela `user`
--
ALTER TABLE `user`
  MODIFY `iduser` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `xp_history`
--
ALTER TABLE `xp_history`
  MODIFY `idxp` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `favorite_verse`
--
ALTER TABLE `favorite_verse`
  ADD CONSTRAINT `favorite_verse_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorite_verse_ibfk_2` FOREIGN KEY (`idverse`) REFERENCES `bible_verse` (`idverse`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `friendship`
--
ALTER TABLE `friendship`
  ADD CONSTRAINT `friendship_ibfk_1` FOREIGN KEY (`iduser_requester`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `friendship_ibfk_2` FOREIGN KEY (`iduser_receiver`) REFERENCES `user` (`iduser`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `goal`
--
ALTER TABLE `goal`
  ADD CONSTRAINT `goal_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `group_entity`
--
ALTER TABLE `group_entity`
  ADD CONSTRAINT `group_entity_ibfk_1` FOREIGN KEY (`idowner`) REFERENCES `user` (`iduser`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `group_member`
--
ALTER TABLE `group_member`
  ADD CONSTRAINT `group_member_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_member_ibfk_2` FOREIGN KEY (`idgroup`) REFERENCES `group_entity` (`idgroup`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `group_task`
--
ALTER TABLE `group_task`
  ADD CONSTRAINT `group_task_ibfk_1` FOREIGN KEY (`idtask`) REFERENCES `task` (`idtask`) ON DELETE CASCADE,
  ADD CONSTRAINT `group_task_ibfk_2` FOREIGN KEY (`idgroup`) REFERENCES `group_entity` (`idgroup`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `task`
--
ALTER TABLE `task`
  ADD CONSTRAINT `task_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_ibfk_2` FOREIGN KEY (`idcategory`) REFERENCES `category` (`idcategory`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `task_assignee`
--
ALTER TABLE `task_assignee`
  ADD CONSTRAINT `task_assignee_ibfk_1` FOREIGN KEY (`idtask`) REFERENCES `task` (`idtask`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignee_ibfk_2` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignee_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `user` (`iduser`) ON DELETE SET NULL;

--
-- Limitadores para a tabela `user_badge`
--
ALTER TABLE `user_badge`
  ADD CONSTRAINT `user_badge_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_badge_ibfk_2` FOREIGN KEY (`idbadge`) REFERENCES `badge` (`idbadge`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `xp_history`
--
ALTER TABLE `xp_history`
  ADD CONSTRAINT `xp_history_ibfk_1` FOREIGN KEY (`iduser`) REFERENCES `user` (`iduser`) ON DELETE CASCADE,
  ADD CONSTRAINT `xp_history_ibfk_2` FOREIGN KEY (`idtask`) REFERENCES `task` (`idtask`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
