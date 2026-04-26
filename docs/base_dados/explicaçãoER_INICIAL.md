Documentação Técnica da Base de Dados -- Lifinity
    
    Este documento descreve a arquitetura de dados da aplicação Lifinity, detalha as entidades, os seus atributos e a lógica dos relacionamentos implementados.


    Entidades e Atributos

        .USER - iduser (PK), username, email, password, xp, level, avatar, created_at
        Armazena a identidade do utilizador. O xp e level são fundamentais para o sistema de gamificação. A password será guardada como hash(encriptada) para segurança.

        .TASK - idtask (PK), iduser (FK), idgroup (FK), idcategory (FK), title, description, status, priority, due_date
        O coração da aplicação. Uma tarefa pode ser pessoal (ligada apenas a um iduser) ou de grupo (ligada a um idgroup). O status e a priority usam listas pré-definidas (ENUM).

        .GROUP - idgroup (PK), idowner (FK), name, description
        Representa espaços colaborativos. O idowner identifica o criador do grupo e garante-lhe permissões de administração (apagar o grupo, expulsar membros, restrições).

        .CATEGORY - idcategory (PK), name, description
        Permite que o utilizador organize as suas tarefas por áreas da vida (ex: "Escola", "Ginásio", "Trabalho"). Ajuda na filtragem e visualização de estatísticas.

        .GOAL - idgoal (PK), iduser (FK), title, deadline
        Focado no planeamento a longo prazo. Diferencia-se da tarefa por ser algo mais abrangente e motivacional, com prazos mais alargados.

        .BADGE - idbadge (PK), name, icon_url, requirements
        Elementos de recompensa. Define os requisitos de XP necessários para que um utilizador desbloqueie uma conquista visual.


    Relacionamentos e Integridade Referencial
        Para garantir que a base de dados seja robusta e não tenha "dados órfãos", definimos as seguintes relações:

        .Utilizador ↔ Tarefa (1:N): Um utilizador pode criar inúmeras tarefas. Usamos ON DELETE CASCADE para que, se uma conta for eliminada, as suas tarefas pessoais também sejam removidas automaticamente.

        .Utilizador ↔ Grupo (N:M): Implementado através da tabela de ligação GROUP_MEMBERS. Isto permite que um utilizador participe em vários grupos (família, amigos, escola) e que cada grupo tenha múltiplos membros.

        .Tarefa ↔ Grupo (N:M): Implementado através da tabela GROUP_TASKS. Esta é a funcionalidade colaborativa: uma tarefa pode ser partilhada entre vários grupos, e um grupo gere o seu conjunto de tarefas.

        .Utilizador ↔ Medalha (N:M): Implementado pela tabela USER_BADGES. Regista o momento exato em que um utilizador conquistou uma medalha específica.

        .Tarefa ↔ Categoria (N:1): Muitas tarefas podem pertencer à mesma categoria. Usamos ON DELETE SET NULL para que, se uma categoria for apagada, as tarefas não desapareçam, apenas fiquem "sem categoria".

    Tabelas de Ligação (Relacionamentos N:M)

        .GROUP_MEMBER - iduser (FK), idgroup (FK), role
        Gere quem pertence a que grupo e qual o seu papel (admin/membro)

        .USER_BADGE - iduser (FK), idbadge (FK), earned_at
        Regista a conquista de medalhas pelos utilizadores com data/hora

        .GROUP_TASK - idtask (FK), idgroup (FK)
        Permite que uma tarefa seja partilhada e visível em múltiplos grupos


Notas de Integridade e Design (Para Defesa)
    
    A base de dados foi desenhada seguindo as regras de Normalização, garantindo a integridade dos dados e evitando a redundância. 
    Utilize Chaves Estrangeiras (FK) com restrições de integridade para automatizar a limpeza de dados e tabelas associativas para resolver relacionamentos de muitos-para-muitos, 
    o que permite uma escalabilidade profissional do sistema Lifinity.
    o script do sql é idempotente. Isto significa que pode ser executado várias vezes sem causar erros, pois ele verifica se as coisas já existem antes de tentar criá-las.

    Palavras Reservadas: A tabela de grupos foi nomeada como GROUP_ENTITY para evitar conflitos com o comando SQL GROUP BY.
    Normalização: A estrutura está na 3ª Forma Normal, eliminando redundâncias (como o idgroup dentro da TASK, que agora é gerido pela tabela de ligação).
    Flexibilidade: O campo requirements em BADGE foi simplificado para permitir metas além do XP (ex: contagem de tarefas).


-- Última atualização: 11-04 às 00:23 -- 