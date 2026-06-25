# `docs/base_dados/estrutura_lifinity.sql` — Esquema da base de dados

> ⚠️ **Atualização 2026-06-25:** nova tabela `PASSWORD_RESET` (códigos de recuperação de palavra-passe, com expiração). Há também o `docs/base_dados/password_reset.sql` para correr no phpMyAdmin. Ver [Recuperação de palavra-passe](../../RECUPERACAO_PALAVRA_PASSE_2026-06-25.md).

## Papel no projeto
É o **script de criação da base de dados MySQL** do Lifinity. Define todas as tabelas, tipos de colunas, chaves primárias/estrangeiras, restrições (constraints) e ainda insere os dados iniciais das conquistas (tabela `BADGE`). Todo o backend (`backend/src/controllers/*`) faz queries contra estas tabelas, por isso este ficheiro é o **alicerce** de tudo o resto.

> Nota: o backend assume que esta base de dados já existe. Corre-se este script uma vez no phpMyAdmin / cliente MySQL para preparar o ambiente.

---

## Preâmbulo — criar e selecionar a base de dados

```sql
CREATE DATABASE IF NOT EXISTS lifinity_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE lifinity_db;
```

- **`CREATE DATABASE IF NOT EXISTS`** — cria a BD `lifinity_db` só se ainda não existir. O `IF NOT EXISTS` evita erro se já tiver sido criada (torna o script re-executável sem rebentar logo na primeira linha).
- **`CHARACTER SET utf8mb4`** — usa o conjunto de caracteres `utf8mb4`, que é o "UTF-8 a sério" do MySQL: suporta **4 bytes por caracter**, ou seja, acentos portugueses **e emojis** 🎉. O antigo `utf8` do MySQL só usava 3 bytes e não guardava emojis — importante porque há chat e bios de utilizador onde as pessoas metem emojis.
- **`COLLATE utf8mb4_general_ci`** — define a *collation* (regras de comparação/ordenação de texto). O `_ci` = *case-insensitive*: `"Ana"` e `"ana"` são considerados iguais em comparações e ordenações.
- **`USE lifinity_db`** — passa a usar esta BD por defeito; tudo o que vem a seguir é criado dentro dela.

**Porquê assim:** o `utf8mb4` é hoje a escolha-padrão recomendada para MySQL; evita o clássico bug de "emoji parte a base de dados".

---

## Convenção de nomes (comentário no ficheiro)
O código segue a regra: **instruções SQL em MAIÚSCULAS** (`CREATE TABLE`, `NOT NULL`...) e **nomes de tabelas/colunas em minúsculas** (exceto os nomes de tabela, que aqui estão em maiúsculas para ressaltar). É puramente estético/legibilidade — o MySQL no Windows não distingue maiúsculas/minúsculas nos nomes por defeito.

---

## Tabela `USER` — utilizadores
Tabela central: cada linha é uma conta.

| Coluna | Tipo | Notas |
|---|---|---|
| `iduser` | `INT AUTO_INCREMENT PRIMARY KEY` | Identificador único, gerado automaticamente (1, 2, 3, …). |
| `username` | `VARCHAR(50) NOT NULL UNIQUE` | Nome de utilizador, obrigatório e **único** (não há dois iguais). |
| `email` | `VARCHAR(100) NOT NULL UNIQUE` | Email, obrigatório e único. Usado no login. |
| `password` | `VARCHAR(255) NOT NULL` | **Hash** da password (bcrypt), nunca a password em texto. 255 chars porque o hash bcrypt tem ~60 chars mas dá folga. |
| `xp` | `INT DEFAULT 0` | Pontos de experiência acumulados (gamificação). |
| `level` | `INT DEFAULT 1` | Nível atual; começa em 1. Calculado a partir do XP. |
| `avatar` | `VARCHAR(255)` | Caminho/URL da imagem de avatar (upload). Pode ser NULL. |
| `cover_image` | `VARCHAR(255) NULL` | Imagem de capa do perfil (adicionada na FASE B). |
| `bio` | `VARCHAR(300) NULL` | Pequena biografia/estado do utilizador (FASE B). |
| `current_streak` | `INT DEFAULT 0` | Dias seguidos com atividade (streak). |
| `last_streak_date` | `DATE DEFAULT NULL` | Último dia que contou para o streak (para saber se o streak continua ou parte). |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Data de registo, preenchida automaticamente. |

**Porquê estas colunas:** `xp`/`level`/`current_streak`/`last_streak_date` são o coração da **gamificação**. Guardar `level` na tabela (em vez de calcular sempre a partir do XP) é uma *desnormalização* deliberada — evita recalcular o nível em todas as queries de ranking, à custa de ter de o atualizar quando o XP muda.

**Ligações:** quase todas as outras tabelas apontam para `USER(iduser)` via chave estrangeira.

---

## Tabela `CATEGORY` — categorias de tarefas
```sql
idcategory INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(50) NOT NULL,
description TEXT
```
Categorias para classificar tarefas (ex.: "Estudo", "Casa"). Simples: id, nome e descrição livre (`TEXT` = texto longo). A tabela `TASK` referencia-a opcionalmente.

---

## Tabela `GROUP_ENTITY` — grupos
```sql
idgroup INT AUTO_INCREMENT PRIMARY KEY,
idowner INT,
name VARCHAR(100) NOT NULL,
description TEXT,
invite_code VARCHAR(12) UNIQUE,
is_locked TINYINT(1) NOT NULL DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (idowner) REFERENCES USER(iduser) ON DELETE SET NULL
```
- **Nome `GROUP_ENTITY` e não `GROUP`** — porque `GROUP` é uma **palavra reservada** do SQL (`GROUP BY`). Chamar à tabela `GROUP` obrigaria a escapá-la com crases sempre; `GROUP_ENTITY` evita a dor de cabeça.
- `idowner` — quem criou/é dono do grupo. **`ON DELETE SET NULL`**: se o dono apagar a conta, o grupo **não** é apagado; o dono fica a `NULL`. Preserva o grupo para os restantes membros.
- `invite_code VARCHAR(12) UNIQUE` — código de convite único para entrar no grupo.
- `is_locked TINYINT(1) DEFAULT 0` — booleano (0/1) que **tranca** o grupo, impedindo novas entradas por código (funcionalidade FASE A2 / commit `b66a431d`). `TINYINT(1)` é como o MySQL representa booleanos.

**Ligações:** `GROUP_MEMBER` (membros), `GROUP_TASK` (tarefas partilhadas), `CONVERSATION` (chat do grupo).

---

## Tabela `TASK` — tarefas
```sql
idtask INT AUTO_INCREMENT PRIMARY KEY,
iduser INT,                -- dono/criador
idcategory INT,
title VARCHAR(255) NOT NULL,
description TEXT,
status ENUM('pendente','em_progresso','concluida') DEFAULT 'pendente',
priority ENUM('baixa','media','alta') DEFAULT 'media',
due_date DATETIME,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
completed_at DATETIME DEFAULT NULL,
archived_at DATETIME DEFAULT NULL,
FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE,
FOREIGN KEY (idcategory) REFERENCES CATEGORY(idcategory) ON DELETE SET NULL
```
- `iduser` — o **criador** da tarefa. **`ON DELETE CASCADE`**: se o utilizador for apagado, as tarefas dele desaparecem também.
- `idcategory` com **`ON DELETE SET NULL`** — apagar a categoria não apaga a tarefa, só lhe tira a categoria.
- **`status` ENUM** — só aceita um de três valores fixos: `pendente`, `em_progresso`, `concluida`. ENUM garante integridade (não entra "concluído" mal escrito) e ocupa pouco espaço.
- **`priority` ENUM** — `baixa`/`media`/`alta`. Usado para os "pills" coloridos na UI.
- `due_date` — prazo limite (data+hora).
- `completed_at` — quando foi concluída (preenchido ao concluir; serve para estatísticas e para o badge "antes do prazo").
- `archived_at` — quando foi arquivada (soft-delete a nível global da tarefa). Há também arquivo **por utilizador** noutra tabela (`TASK_USER_ARCHIVE`).

**Porquê ENUMs:** alternativa seria uma tabela separada de estados, mas para conjuntos pequenos e fixos o ENUM é mais simples e suficiente para o âmbito do projeto.

**Ligações:** `TASK_ASSIGNEE` (a quem foi atribuída), `GROUP_TASK` (partilha com grupo), `XP_HISTORY` (XP ganho ao concluir), `TASK_USER_ARCHIVE` (esconder por utilizador).

---

## Tabela `GOAL` — objetivos (longo prazo)
```sql
idgoal INT AUTO_INCREMENT PRIMARY KEY,
iduser INT,
title VARCHAR(255) NOT NULL,
deadline DATETIME,
FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
```
Objetivos de longo prazo de um utilizador. Estrutura mínima (id, dono, título, prazo). **Nota de estudo:** estava nos requisitos da PAP, mas pelo que se vê no resto do código pode estar pouco/nada usada na app — vale a pena confirmar se há controlador/rota que a use. `ON DELETE CASCADE` liga ao utilizador.

---

## Tabela `BADGE` — definição das conquistas
```sql
idbadge INT AUTO_INCREMENT PRIMARY KEY,
code VARCHAR(50) UNIQUE NOT NULL,
name VARCHAR(80) NOT NULL,
description TEXT,
category VARCHAR(50),
icon_url VARCHAR(255),
requirements INT NOT NULL,
sort_order INT DEFAULT 0,
is_active BOOLEAN DEFAULT TRUE
```
- `code` — identificador textual estável e **único** (ex.: `tasks_10`). É por aqui que o código backend reconhece o badge, não pelo `idbadge` numérico (mais legível e independente da ordem de inserção).
- `category` — grupo do badge (`level`, `xp`, `tasks`, `friends`, `groups`, `chat`, `verses`, `assistant`). Diz **como interpretar** o `requirements`.
- `requirements INT` — o **limiar** genérico para desbloquear. O significado depende da `category`: para `level_5` é "nível ≥ 5", para `tasks_10` é "10 tarefas concluídas", para `xp_500` é "500 XP". Um único campo numérico serve todas as categorias.
- `sort_order` — ordem de apresentação na UI.
- `is_active BOOLEAN` — permite desligar um badge sem o apagar.

**Porquê este design:** é uma tabela de **definições/regras** (data-driven). A lógica em `backend/src/utils/achievements.js` lê estas regras e decide o que o utilizador desbloqueou — assim, adicionar um badge novo é (quase) só inserir uma linha, sem mexer em código.

**Ligações:** `USER_BADGE` (quem ganhou), `USER_BADGE_HIGHLIGHT` (destaques no perfil).

---

## Tabela `BIBLE_VERSE` — versículos
```sql
idverse INT AUTO_INCREMENT PRIMARY KEY,
book VARCHAR(100) NOT NULL,
chapter INT NOT NULL,
verse INT NOT NULL,
text TEXT NOT NULL,
theme VARCHAR(100) DEFAULT NULL
```
Catálogo de versículos para o módulo "Inspiração diária". `book`/`chapter`/`verse` localizam o versículo; `text` é o conteúdo; `theme` permite filtrar por tema (ex.: "esperança"). Ligada a `FAVORITE_VERSE`.

---

## Tabela `FAVORITE_VERSE` — favoritos do utilizador
```sql
idfavorite INT AUTO_INCREMENT PRIMARY KEY,
iduser INT NOT NULL,
idverse INT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (iduser) ... ON DELETE CASCADE,
FOREIGN KEY (idverse) ... ON DELETE CASCADE,
UNIQUE (iduser, idverse)
```
Liga utilizadores a versículos guardados (relação N:M). A restrição **`UNIQUE (iduser, idverse)`** impede que o mesmo utilizador guarde duas vezes o mesmo versículo. Ambas as FK em `CASCADE`: apagar o utilizador ou o versículo limpa os favoritos correspondentes.

> Nota de design: tem `idfavorite` como PK própria **e** uma restrição `UNIQUE` no par — poderia ter usado o par `(iduser, idverse)` diretamente como PK (como fazem outras tabelas de ligação aqui). Funciona à mesma; é só uma opção diferente.

---

## Tabela `XP_HISTORY` — histórico de XP
```sql
idxp INT AUTO_INCREMENT PRIMARY KEY,
iduser INT NOT NULL,
idtask INT DEFAULT NULL,
amount INT NOT NULL,
reason VARCHAR(100),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (iduser) ... ON DELETE CASCADE,
FOREIGN KEY (idtask) ... ON DELETE SET NULL
```
**Livro-razão (ledger) do XP**: cada vez que o utilizador ganha XP, fica aqui uma linha (`amount`, `reason` ex.: "tarefa concluída", e a `idtask` que o originou). 
- `idtask` com **`ON DELETE SET NULL`** — se a tarefa for apagada, mantém-se o registo histórico do XP (não se perde a auditoria), só se esquece a que tarefa pertencia.
- **Porquê ter um histórico** e não só o total em `USER.xp`: permite as **estatísticas** (gráficos de XP por dia/semana) e dá rasto auditável de como o utilizador chegou ao XP atual. É a fonte de dados de `statisticsController.js`.

---

## Tabelas de ligação N:M (relacionamentos muitos-para-muitos)

### `GROUP_MEMBER` — membros de um grupo
```sql
iduser INT, idgroup INT,
role ENUM('admin','membro') DEFAULT 'membro',
muted_until DATETIME DEFAULT NULL,
PRIMARY KEY (iduser, idgroup),
FOREIGN KEY ... CASCADE (ambas)
```
- **PK composta `(iduser, idgroup)`** — cada par utilizador-grupo aparece uma só vez (não se entra duas vezes no mesmo grupo).
- `role` — `admin` (pode moderar) ou `membro`.
- `muted_until DATETIME` — moderação: se preenchido com uma data futura, o membro está **silenciado (mute)** até essa data (commit `e6941405`). Estando `NULL` ou no passado, pode participar.

### `USER_BADGE` — medalhas ganhas
```sql
iduser INT, idbadge INT,
earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (iduser, idbadge)
```
Regista que um utilizador desbloqueou um badge e **quando** (`earned_at`). PK composta evita duplicados (não se ganha o mesmo badge duas vezes).

### `USER_BADGE_HIGHLIGHT` — badges em destaque no perfil
```sql
iduser INT NOT NULL, idbadge INT NOT NULL,
position INT NOT NULL,
PRIMARY KEY (iduser, position),
UNIQUE KEY unique_user_badge_highlight (iduser, idbadge),
FOREIGN KEY ... CASCADE (ambas),
CHECK (position IN (1, 2, 3))
```
Permite ao utilizador escolher **até 3 badges** para destacar no perfil.
- **PK `(iduser, position)`** — cada utilizador tem no máximo uma medalha em cada posição (1, 2 e 3).
- **`UNIQUE (iduser, idbadge)`** — o mesmo badge não pode ocupar duas posições.
- **`CHECK (position IN (1,2,3))`** — só permite as posições 1, 2 ou 3 (limita a 3 destaques). *Atenção:* o `CHECK` só é realmente aplicado no MySQL 8.0.16+; em versões antigas é ignorado silenciosamente.

---

## Seed da tabela `BADGE` (INSERT … ON DUPLICATE KEY UPDATE)
```sql
INSERT INTO BADGE (code, name, description, category, requirements, sort_order, is_active)
VALUES
    ('level_2', 'Primeiro Salto', 'Atinge o nivel 2.', 'level', 2, 10, TRUE),
    ... (19 badges no total) ...
ON DUPLICATE KEY UPDATE
    name = VALUES(name), description = VALUES(description), category = VALUES(category),
    requirements = VALUES(requirements), sort_order = VALUES(sort_order), is_active = VALUES(is_active);
```
Insere os **19 badges** iniciais, em categorias: `level` (2), `xp` (1), `tasks` (5, inclui prioridade alta e antes-do-prazo), `friends` (2), `groups` (2), `chat`/mensagens (2), `verses` (3, favoritos e partilha), `assistant` (2).

- **`ON DUPLICATE KEY UPDATE`** — é o truque-chave: como `code` é `UNIQUE`, se um badge já existir (mesmo `code`), em vez de dar erro de chave duplicada, **atualiza** os campos com os novos valores (`VALUES(coluna)` = o valor que se tentou inserir). 
- **Porquê:** torna o seed **idempotente** — pode-se correr o script as vezes que quisermos; afina as definições dos badges sem criar duplicados nem rebentar. É o padrão "upsert" (insert-or-update).

---

## Mais tabelas de ligação e funcionalidades sociais

### `GROUP_TASK` — tarefas partilhadas em grupo
```sql
idtask INT, idgroup INT,
PRIMARY KEY (idtask, idgroup),
FOREIGN KEY ... CASCADE (ambas)
```
Liga uma tarefa a um grupo (partilha N:M). **Distinta de `TASK_ASSIGNEE`**: aqui a tarefa é do grupo; ali é atribuída a pessoas concretas. O commit `b7db1254` tornou a atribuição individual e a de grupo **independentes** (uma tarefa pode estar nos dois sem duplicar).

### `FRIENDSHIP` — amizades
```sql
idfriendship INT AUTO_INCREMENT PRIMARY KEY,
iduser_requester INT,   -- quem pediu
iduser_receiver INT,    -- quem recebeu
status ENUM('pendente','aceite','bloqueado') DEFAULT 'pendente',
created_at ...
```
Modela pedidos de amizade **direcionados** (quem pediu vs. quem recebeu), com `status` para o fluxo pedido→aceite (ou bloqueado). Ter os dois lados em colunas separadas permite distinguir quem iniciou o pedido (importante para a UI mostrar "aceitar/recusar" só a quem recebeu).

### `NOTIFICATION` — notificações internas
```sql
idnotification INT AUTO_INCREMENT PRIMARY KEY,
iduser INT,                                  -- destinatário
type ENUM('amizade','tarefa','sistema') NOT NULL,
message TEXT NOT NULL,
entity_type VARCHAR(50) NULL,                -- ex.: 'group', 'task'
entity_id INT NULL,                          -- id da entidade relacionada
link VARCHAR(255) NULL,                      -- destino ao clicar
is_read BOOLEAN DEFAULT FALSE,
created_at ...,
KEY idx_notification_entity (entity_type, entity_id)
```
Notificações que aparecem no sino. `entity_type`+`entity_id`+`link` permitem **deep-linking** (clicar na notificação leva à entidade certa — commit `054c2639`). O índice `idx_notification_entity` acelera procuras por entidade. `is_read` controla o badge de "não lidas".

### `CONVERSATION` — conversas (chat)
```sql
idconversation INT AUTO_INCREMENT PRIMARY KEY,
type ENUM('private','group') DEFAULT 'private',
name VARCHAR(100) DEFAULT NULL,
idgroup INT DEFAULT NULL,
idcreated_by INT DEFAULT NULL,
created_at ..., updated_at ... ON UPDATE CURRENT_TIMESTAMP,
KEY idx_conversation_type, KEY idx_conversation_group, KEY idx_conversation_created_by,
UNIQUE KEY unique_conversation_group (idgroup),
FOREIGN KEY (idgroup) ... CASCADE,
FOREIGN KEY (idcreated_by) ... SET NULL
```
Cada linha é uma conversa, **privada** (1-para-1) ou de **grupo**.
- `updated_at ... ON UPDATE CURRENT_TIMESTAMP` — atualiza-se sozinho a cada alteração; serve para **ordenar conversas pela mais recente**.
- **`UNIQUE KEY unique_conversation_group (idgroup)`** — garante que cada grupo tem **no máximo uma** conversa associada (a "sala" do grupo). Como `idgroup` é `NULL` nas conversas privadas, o UNIQUE não as afeta (vários NULL são permitidos no MySQL).
- `idcreated_by` com `SET NULL` — apagar o criador não apaga a conversa.

### `CONVERSATION_MEMBER` — participantes de uma conversa
```sql
idconversation INT, iduser INT,
role ENUM('admin','membro') DEFAULT 'membro',
joined_at ...,
last_read_at DATETIME NULL,
PRIMARY KEY (idconversation, iduser),
KEY idx_conversation_member_user (iduser),
FOREIGN KEY ... CASCADE (ambas)
```
Quem participa em cada conversa.
- **`last_read_at`** — momento em que o utilizador leu a conversa pela última vez. Comparando com a data das mensagens, calcula-se o **contador de não lidas** do widget de chat (FASE A1, commit `ac618776`).

### `MESSAGE` — mensagens
```sql
idmessage INT AUTO_INCREMENT PRIMARY KEY,
idconversation INT, idsender INT,
content TEXT NOT NULL,
message_type ENUM('text','verse','system') DEFAULT 'text',
created_at ..., read_at DATETIME DEFAULT NULL,
KEY idx_message_conversation_created (idconversation, created_at),
FOREIGN KEY (idconversation) ... CASCADE,
FOREIGN KEY (idsender) ... SET NULL
```
Mensagens de chat. `message_type` distingue texto normal, **partilha de versículo** (`verse`, commit `fadf7a56`) e mensagens de **sistema**. O índice composto `(idconversation, created_at)` é importante: torna rápido "dar as mensagens desta conversa por ordem cronológica" (o padrão de leitura do chat). `idsender` em `SET NULL`: se o autor apagar a conta, a mensagem fica anónima mas não desaparece.

### `TASK_ASSIGNEE` — atribuição de tarefas a pessoas
```sql
idtask INT, iduser INT,        -- a quem foi atribuída
assigned_by INT,               -- quem atribuiu
created_at ...,
PRIMARY KEY (idtask, iduser),
FOREIGN KEY (idtask) ... CASCADE,
FOREIGN KEY (iduser) ... CASCADE,
FOREIGN KEY (assigned_by) ... SET NULL
```
Relação N:M entre tarefas e os utilizadores **a quem foram atribuídas**, guardando ainda **quem atribuiu** (`assigned_by`). Permite a funcionalidade "criar tarefa para um amigo" e os badges/avisos de tarefa recebida. PK composta evita atribuir a mesma pessoa duas vezes à mesma tarefa.

### `TASK_USER_ARCHIVE` — esconder tarefa por utilizador
```sql
idtask INT NOT NULL, iduser INT NOT NULL,
hidden_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (idtask, iduser),
KEY idx_task_user_archive_user (iduser),
FOREIGN KEY ... CASCADE (ambas)
```
Permite que **cada utilizador** esconda uma tarefa **só para si** sem a apagar para os outros. Crucial em tarefas partilhadas/atribuídas: se eu escondo uma tarefa de grupo, os outros continuam a vê-la. `TASK.archived_at` é global; esta tabela é **por utilizador** — não confundir.

### `ASSISTANT_MESSAGE` — histórico do assistente (chatbot)
```sql
idmessage INT AUTO_INCREMENT PRIMARY KEY,
iduser INT NOT NULL,
sender ENUM('user','assistant') NOT NULL,
content TEXT NOT NULL,
action_type VARCHAR(50) DEFAULT NULL,
created_at ...,
KEY idx_assistant_message_user_created (iduser, created_at),
FOREIGN KEY (iduser) ... CASCADE
```
Guarda a conversa com o **assistente IA (Gemini)**. `sender` diz se a mensagem é do utilizador ou do assistente. `action_type` regista uma eventual **ação detetada** (ex.: o assistente percebeu intenção de "criar tarefa" — ligado à deteção de intenções do commit `6727a484`). O índice `(iduser, created_at)` torna rápido carregar o histórico de um utilizador por ordem.

---

## Visão geral do modelo relacional (como tudo se liga)
- **`USER`** é o centro: praticamente tudo referencia `iduser`.
- **Gamificação:** `USER.xp/level` ← alimentado por `XP_HISTORY` ← gerado ao concluir `TASK`. `BADGE` (definições) + `USER_BADGE` (ganhos) + `USER_BADGE_HIGHLIGHT` (destaques).
- **Tarefas:** `TASK` (núcleo) + `CATEGORY` + `TASK_ASSIGNEE` (pessoas) + `GROUP_TASK` (grupos) + `TASK_USER_ARCHIVE` (esconder por pessoa).
- **Social:** `FRIENDSHIP`, `GROUP_ENTITY` + `GROUP_MEMBER`, `NOTIFICATION`.
- **Chat:** `CONVERSATION` + `CONVERSATION_MEMBER` + `MESSAGE` (+ ligação opcional a `GROUP_ENTITY`).
- **Inspiração:** `BIBLE_VERSE` + `FAVORITE_VERSE`.
- **Assistente:** `ASSISTANT_MESSAGE`.

### Padrão das políticas `ON DELETE`
- **`CASCADE`** quando o filho não faz sentido sem o pai (tarefas de um user, membros de um grupo, mensagens de uma conversa).
- **`SET NULL`** quando se quer **preservar histórico/entidade** mesmo perdendo a referência (dono do grupo, autor da mensagem, categoria da tarefa, tarefa no `XP_HISTORY`).

Esta distinção é uma das coisas que mais "impressiona júri": mostra que as decisões de integridade referencial foram pensadas caso a caso.

---

## Ligações com o resto do código
- **Lido/escrito por:** todos os controladores em `backend/src/controllers/`. Ex.: `taskController` (TASK, TASK_ASSIGNEE, GROUP_TASK, TASK_USER_ARCHIVE, XP_HISTORY), `authController`/`userController` (USER), `groupController`/`friendController` (GROUP_*, FRIENDSHIP), `chatController` (CONVERSATION/MESSAGE), `inspirationController` (BIBLE_VERSE/FAVORITE_VERSE), `achievementController` (BADGE/USER_BADGE), `assistantController` (ASSISTANT_MESSAGE), `notificationController` (NOTIFICATION), `statisticsController` (XP_HISTORY).
- **Regras de gamificação:** `backend/src/utils/achievements.js` lê `BADGE`/`USER_BADGE`; `backend/src/utils/gamification.js` + módulo C `gamification.c` calculam XP/nível guardados em `USER`.
- A ligação à BD é configurada em `backend/src/config/db.js`.

## Pontos a rever no futuro
- Confirmar se a tabela **`GOAL`** é realmente usada por algum controlador/rota (pode ter ficado como requisito não totalmente implementado).
- O `CHECK (position IN (1,2,3))` em `USER_BADGE_HIGHLIGHT` só vigora em MySQL ≥ 8.0.16.
