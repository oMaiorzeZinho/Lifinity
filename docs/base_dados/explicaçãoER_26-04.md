# Documentação Técnica da Base de Dados — Lifinity

Este documento descreve a arquitectura de dados da aplicação **Lifinity**, explicando as entidades principais, os seus atributos e os relacionamentos representados nos diagramas:

- `modelo_er.drawio` — modelo Entidade-Relacionamento, com entidades, atributos e cardinalidades;
- `tabelas_relacionamento.drawio` — modelo relacional, com tabelas, chaves primárias, chaves estrangeiras e ligações entre tabelas.

A base de dados foi desenhada em **MySQL** e serve para suportar as principais funcionalidades da aplicação: autenticação, gestão de tarefas, gamificação, estatísticas, grupos, amizades, inspiração diária e notificações.

---

# 1. Visão Geral da Base de Dados

A base de dados do Lifinity foi organizada em várias áreas funcionais:

1. **Utilizadores e autenticação**
   - USER

2. **Gestão de tarefas**
   - TASK
   - CATEGORY
   - TASK_ASSIGNEE

3. **Gamificação e progresso**
   - XP_HISTORY
   - BADGE
   - USER_BADGE

4. **Grupos e colaboração**
   - GROUP_ENTITY
   - GROUP_MEMBER
   - GROUP_TASK

5. **Amizades e comunidade**
   - FRIENDSHIP
   - NOTIFICATION

6. **Inspiração diária**
   - BIBLE_VERSE
   - FAVORITE_VERSE

7. **Objectivos**
   - GOAL

Esta organização permite separar responsabilidades, evitar repetição de dados e manter a base de dados escalável para funcionalidades futuras.

---

# 2. Entidades e Atributos

## 2.1 USER

A tabela `USER` representa os utilizadores registados na aplicação.

### Atributos

- `iduser` — chave primária da tabela.
- `username` — nome de utilizador, único na aplicação.
- `email` — email do utilizador, também único.
- `password` — palavra-passe encriptada.
- `xp` — pontos de experiência acumulados pelo utilizador.
- `level` — nível actual do utilizador.
- `avatar` — imagem ou referência visual do perfil.
- `current_streak` — número de dias consecutivos de actividade.
- `last_streak_date` — última data em que o streak foi actualizado.
- `created_at` — data de criação da conta.

### Função no sistema

Esta é uma das tabelas centrais da aplicação. Quase todas as funcionalidades estão ligadas ao utilizador: tarefas, grupos, amizades, notificações, favoritos, estatísticas e gamificação.

---

## 2.2 TASK

A tabela `TASK` representa as tarefas criadas pelos utilizadores.

### Atributos

- `idtask` — chave primária da tarefa.
- `iduser` — utilizador que criou a tarefa.
- `idcategory` — categoria associada à tarefa.
- `title` — título da tarefa.
- `description` — descrição da tarefa.
- `status` — estado da tarefa: `pendente`, `em_progresso` ou `concluida`.
- `priority` — prioridade da tarefa: `baixa`, `media` ou `alta`.
- `due_date` — prazo da tarefa.
- `created_at` — data de criação.
- `completed_at` — data em que a tarefa foi concluída.
- `archived_at` — data em que a tarefa foi ocultada/arquivada.

### Função no sistema

A `TASK` é uma das entidades principais do Lifinity. Permite ao utilizador organizar responsabilidades, acompanhar progresso e ganhar XP ao concluir tarefas.

O campo `archived_at` permite ocultar tarefas concluídas sem as apagar da base de dados. Isto é importante porque as estatísticas e o histórico devem continuar correctos mesmo depois da tarefa deixar de aparecer na lista principal.

---

## 2.3 CATEGORY

A tabela `CATEGORY` representa categorias de tarefas.

### Atributos

- `idcategory` — chave primária.
- `name` — nome da categoria.
- `description` — descrição da categoria.

### Função no sistema

As categorias servem para organizar tarefas por áreas, como escola, trabalho, saúde, casa ou projectos pessoais. Também permitem futuras filtragens e estatísticas por categoria.

---

## 2.4 GOAL

A tabela `GOAL` representa objectivos mais gerais ou de longo prazo.

### Atributos

- `idgoal` — chave primária.
- `iduser` — utilizador associado ao objectivo.
- `title` — título do objectivo.
- `deadline` — prazo definido para o objectivo.

### Função no sistema

Os objectivos representam metas mais abrangentes do que tarefas individuais. Futuramente, podem ser ligados a várias tarefas ou rotinas.

---

## 2.5 GROUP_ENTITY

A tabela `GROUP_ENTITY` representa grupos de colaboração.

### Atributos

- `idgroup` — chave primária.
- `idowner` — utilizador que criou o grupo.
- `name` — nome do grupo.
- `description` — descrição do grupo.
- `invite_code` — código usado para outros utilizadores entrarem no grupo.
- `created_at` — data de criação do grupo.

### Função no sistema

Os grupos permitem colaboração entre utilizadores. Podem ser usados por amigos, equipas, turmas ou famílias para partilhar tarefas, comparar estatísticas e, futuramente, comunicar através de chat.

O nome `GROUP_ENTITY` foi usado para evitar conflito com a palavra reservada `GROUP` do SQL.

---

## 2.6 GROUP_MEMBER

A tabela `GROUP_MEMBER` representa a ligação entre utilizadores e grupos.

### Atributos

- `iduser` — utilizador membro do grupo.
- `idgroup` — grupo ao qual o utilizador pertence.
- `role` — papel do utilizador no grupo: `admin` ou `membro`.

### Função no sistema

Esta tabela resolve o relacionamento muitos-para-muitos entre `USER` e `GROUP_ENTITY`.

Um utilizador pode pertencer a vários grupos, e um grupo pode ter vários utilizadores.

---

## 2.7 GROUP_TASK

A tabela `GROUP_TASK` representa a associação entre tarefas e grupos.

### Atributos

- `idtask` — tarefa associada.
- `idgroup` — grupo associado.

### Função no sistema

Esta tabela permite que uma tarefa seja partilhada com um ou mais grupos. Assim, a tarefa não precisa de ter um único `idgroup` dentro da tabela `TASK`, tornando o sistema mais flexível.

---

## 2.8 TASK_ASSIGNEE

A tabela `TASK_ASSIGNEE` representa utilizadores aos quais uma tarefa foi atribuída.

### Atributos

- `idtask` — tarefa atribuída.
- `iduser` — utilizador que recebeu a tarefa.
- `assigned_by` — utilizador que atribuiu a tarefa.
- `created_at` — data da atribuição.

### Função no sistema

Esta tabela prepara a aplicação para tarefas colaborativas mais avançadas.

Com ela, uma tarefa pode ser enviada ou atribuída a vários utilizadores. Isto permite, por exemplo:

- criar uma tarefa só para o próprio utilizador;
- enviar uma tarefa a um amigo;
- atribuir uma tarefa a vários membros;
- registar quem fez a atribuição.

---

## 2.9 BADGE

A tabela `BADGE` representa conquistas ou medalhas da aplicação.

### Atributos

- `idbadge` — chave primária.
- `name` — nome da medalha.
- `icon_url` — imagem ou ícone da medalha.
- `requirements` — requisito necessário para obter a medalha.

### Função no sistema

As badges fazem parte da gamificação. Servem para recompensar progresso, consistência e participação do utilizador.

---

## 2.10 USER_BADGE

A tabela `USER_BADGE` representa as medalhas conquistadas por cada utilizador.

### Atributos

- `iduser` — utilizador que recebeu a badge.
- `idbadge` — badge conquistada.
- `earned_at` — data em que a badge foi obtida.

### Função no sistema

Esta tabela resolve o relacionamento muitos-para-muitos entre `USER` e `BADGE`.

Um utilizador pode ganhar várias badges, e uma mesma badge pode ser ganha por vários utilizadores.

---

## 2.11 XP_HISTORY

A tabela `XP_HISTORY` regista o histórico de XP ganho pelos utilizadores.

### Atributos

- `idxp` — chave primária.
- `iduser` — utilizador que recebeu XP.
- `idtask` — tarefa que originou o XP, quando aplicável.
- `amount` — quantidade de XP recebida.
- `reason` — motivo do ganho de XP.
- `created_at` — data do registo.

### Função no sistema

Esta tabela é essencial para as estatísticas. Em vez de depender apenas do XP total guardado no utilizador, o sistema consegue saber quando e porquê o XP foi ganho.

Isto permite gráficos como:

- XP ganho nos últimos 7 dias;
- XP ganho nos últimos 30 dias;
- evolução anual;
- comparação futura com amigos ou grupos.

O campo `idtask` pode ser nulo, porque nem todo o XP tem necessariamente de vir de uma tarefa.

---

## 2.12 BIBLE_VERSE

A tabela `BIBLE_VERSE` armazena os versículos disponíveis no módulo de inspiração diária.

### Atributos

- `idverse` — chave primária.
- `book` — livro bíblico.
- `chapter` — capítulo.
- `verse` — número do versículo.
- `text` — texto do versículo.
- `theme` — tema associado ao versículo.

### Função no sistema

Esta tabela permite ter uma colecção de versículos na base de dados. A aplicação pode seleccionar um versículo diário ou apresentar versículos aleatórios ao utilizador.

---

## 2.13 FAVORITE_VERSE

A tabela `FAVORITE_VERSE` representa os versículos favoritos dos utilizadores.

### Atributos

- `idfavorite` — chave primária.
- `iduser` — utilizador que marcou o versículo como favorito.
- `idverse` — versículo favorito.
- `created_at` — data em que foi adicionado aos favoritos.

### Função no sistema

Esta tabela resolve o relacionamento muitos-para-muitos entre `USER` e `BIBLE_VERSE`.

Um utilizador pode guardar vários versículos favoritos, e o mesmo versículo pode ser guardado por vários utilizadores diferentes.

Existe uma restrição `UNIQUE (iduser, idverse)` para impedir que o mesmo utilizador guarde o mesmo versículo mais do que uma vez.

---

## 2.14 FRIENDSHIP

A tabela `FRIENDSHIP` representa pedidos de amizade e ligações entre utilizadores.

### Atributos

- `idfriendship` — chave primária.
- `iduser_requester` — utilizador que enviou o pedido.
- `iduser_receiver` — utilizador que recebeu o pedido.
- `status` — estado da amizade: `pendente`, `aceite` ou `bloqueado`.
- `created_at` — data de criação do pedido.

### Função no sistema

Esta tabela permite implementar a parte social da aplicação.

Como uma amizade envolve dois utilizadores da mesma tabela `USER`, existem duas chaves estrangeiras para a mesma entidade:

- uma para quem envia o pedido;
- outra para quem recebe o pedido.

---

## 2.15 NOTIFICATION

A tabela `NOTIFICATION` representa notificações enviadas aos utilizadores.

### Atributos

- `idnotification` — chave primária.
- `iduser` — utilizador que recebe a notificação.
- `type` — tipo de notificação: `amizade`, `tarefa` ou `sistema`.
- `message` — conteúdo da notificação.
- `is_read` — indica se a notificação já foi lida.
- `created_at` — data de criação da notificação.

### Função no sistema

Esta tabela prepara a aplicação para alertas internos, como:

- novos pedidos de amizade;
- tarefas atribuídas;
- mensagens do sistema;
- lembretes futuros.

---

# 3. Relacionamentos do Modelo ER

## 3.1 USER — TASK

### Cardinalidade

- Um `USER` pode criar várias `TASK`.
- Uma `TASK` pertence a um `USER`.

### Tipo

1:N

### Explicação

Este relacionamento representa as tarefas pessoais criadas por um utilizador. Quando uma conta é eliminada, as suas tarefas também são removidas através de `ON DELETE CASCADE`.

---

## 3.2 USER — GOAL

### Cardinalidade

- Um `USER` pode ter vários `GOAL`.
- Um `GOAL` pertence a um `USER`.

### Tipo

1:N

### Explicação

Cada objectivo é criado por um utilizador. Isto permite que cada conta tenha os seus próprios objectivos de longo prazo.

---

## 3.3 USER — GROUP_ENTITY

### Cardinalidade

- Um `USER` pode criar vários `GROUP_ENTITY`.
- Um `GROUP_ENTITY` tem um utilizador responsável/criador.

### Tipo

1:N

### Explicação

O campo `idowner` identifica o dono do grupo. Se o utilizador criador for eliminado, o grupo pode continuar a existir, ficando o dono como `NULL`, devido ao `ON DELETE SET NULL`.

---

## 3.4 USER — GROUP_ENTITY através de GROUP_MEMBER

### Cardinalidade

- Um `USER` pode pertencer a vários grupos.
- Um `GROUP_ENTITY` pode ter vários utilizadores.

### Tipo

N:M

### Tabela associativa

`GROUP_MEMBER`

### Explicação

Este relacionamento permite colaboração. A tabela `GROUP_MEMBER` também guarda o papel do utilizador dentro do grupo, como `admin` ou `membro`.

---

## 3.5 TASK — GROUP_ENTITY através de GROUP_TASK

### Cardinalidade

- Uma `TASK` pode ser partilhada com vários grupos.
- Um `GROUP_ENTITY` pode ter várias tarefas.

### Tipo

N:M

### Tabela associativa

`GROUP_TASK`

### Explicação

Esta estrutura é mais flexível do que guardar directamente `idgroup` dentro da tabela `TASK`, porque permite que uma tarefa esteja associada a mais do que um grupo.

---

## 3.6 TASK — CATEGORY

### Cardinalidade

- Uma `CATEGORY` pode ter várias tarefas.
- Uma `TASK` pode estar associada a uma categoria.

### Tipo

1:N

### Explicação

As categorias permitem organizar tarefas. Se uma categoria for apagada, as tarefas não desaparecem; ficam apenas sem categoria, devido ao `ON DELETE SET NULL`.

---

## 3.7 USER — BADGE através de USER_BADGE

### Cardinalidade

- Um `USER` pode conquistar várias badges.
- Uma `BADGE` pode ser conquistada por vários utilizadores.

### Tipo

N:M

### Tabela associativa

`USER_BADGE`

### Explicação

A tabela `USER_BADGE` permite registar exactamente quando cada badge foi conquistada por cada utilizador.

---

## 3.8 USER — XP_HISTORY

### Cardinalidade

- Um `USER` pode ter vários registos de XP.
- Cada registo de `XP_HISTORY` pertence a um utilizador.

### Tipo

1:N

### Explicação

Este relacionamento permite criar gráficos e estatísticas de evolução do XP ao longo do tempo.

---

## 3.9 TASK — XP_HISTORY

### Cardinalidade

- Uma `TASK` pode originar registos de XP.
- Um registo de `XP_HISTORY` pode estar associado a uma tarefa.

### Tipo

1:N, com associação opcional

### Explicação

Quando o utilizador conclui uma tarefa, pode ser registada uma entrada em `XP_HISTORY`. O campo `idtask` pode ser nulo para permitir XP atribuído por outros motivos no futuro.

---

## 3.10 USER — BIBLE_VERSE através de FAVORITE_VERSE

### Cardinalidade

- Um `USER` pode guardar vários versículos favoritos.
- Um `BIBLE_VERSE` pode ser guardado por vários utilizadores.

### Tipo

N:M

### Tabela associativa

`FAVORITE_VERSE`

### Explicação

Este relacionamento permite que cada utilizador tenha a sua própria colecção de versículos favoritos, sem duplicar os versículos na base de dados.

---

## 3.11 USER — FRIENDSHIP — USER

### Cardinalidade

- Um `USER` pode enviar vários pedidos de amizade.
- Um `USER` pode receber vários pedidos de amizade.

### Tipo

Auto-relacionamento através de tabela intermédia

### Tabela associativa

`FRIENDSHIP`

### Explicação

A tabela `FRIENDSHIP` liga dois utilizadores da própria tabela `USER`: o utilizador que enviou o pedido e o utilizador que recebeu o pedido. O campo `status` indica se o pedido está pendente, aceite ou bloqueado.

---

## 3.12 USER — NOTIFICATION

### Cardinalidade

- Um `USER` pode receber várias notificações.
- Uma `NOTIFICATION` pertence a um utilizador.

### Tipo

1:N

### Explicação

Este relacionamento permite criar notificações internas para pedidos de amizade, tarefas, mensagens do sistema e outras acções futuras.

---

## 3.13 TASK — USER através de TASK_ASSIGNEE

### Cardinalidade

- Uma `TASK` pode ser atribuída a vários utilizadores.
- Um `USER` pode receber várias tarefas atribuídas.

### Tipo

N:M

### Tabela associativa

`TASK_ASSIGNEE`

### Explicação

Esta tabela prepara a funcionalidade de enviar tarefas a amigos ou membros de grupos. O campo `assigned_by` indica qual utilizador fez a atribuição.

---

# 4. Tabelas de Ligação

As tabelas de ligação são usadas para resolver relacionamentos muitos-para-muitos.

## 4.1 GROUP_MEMBER

Liga `USER` a `GROUP_ENTITY`.

### Campos principais

- `iduser`
- `idgroup`
- `role`

### Objectivo

Permite que um utilizador participe em vários grupos e que cada grupo tenha vários membros.

---

## 4.2 GROUP_TASK

Liga `TASK` a `GROUP_ENTITY`.

### Campos principais

- `idtask`
- `idgroup`

### Objectivo

Permite que tarefas sejam partilhadas com grupos.

---

## 4.3 USER_BADGE

Liga `USER` a `BADGE`.

### Campos principais

- `iduser`
- `idbadge`
- `earned_at`

### Objectivo

Regista as conquistas obtidas pelos utilizadores.

---

## 4.4 FAVORITE_VERSE

Liga `USER` a `BIBLE_VERSE`.

### Campos principais

- `idfavorite`
- `iduser`
- `idverse`
- `created_at`

### Objectivo

Regista os versículos favoritos de cada utilizador.

---

## 4.5 TASK_ASSIGNEE

Liga `TASK` a `USER`.

### Campos principais

- `idtask`
- `iduser`
- `assigned_by`
- `created_at`

### Objectivo

Permite atribuir tarefas a um ou vários utilizadores.

---

# 5. Integridade Referencial

A base de dados utiliza chaves estrangeiras para manter a consistência dos dados.

## 5.1 ON DELETE CASCADE

Usado quando os dados dependentes deixam de fazer sentido sem o registo principal.

Exemplos:

- Se um utilizador for eliminado, as suas tarefas são eliminadas.
- Se um utilizador for eliminado, os seus favoritos são eliminados.
- Se uma tarefa for eliminada, as suas associações a grupos também são eliminadas.

## 5.2 ON DELETE SET NULL

Usado quando o registo deve continuar a existir mesmo que a referência principal seja apagada.

Exemplos:

- Se uma categoria for eliminada, a tarefa continua a existir, mas fica sem categoria.
- Se o dono de um grupo for eliminado, o grupo pode continuar a existir sem dono.
- Se uma tarefa associada a XP for removida, o histórico de XP pode continuar sem tarefa associada.

---

# 6. Decisões de Design

## 6.1 Uso de GROUP_ENTITY

A tabela dos grupos chama-se `GROUP_ENTITY` porque `GROUP` é uma palavra reservada em SQL, usada em instruções como `GROUP BY`.

Isto evita erros e torna o código SQL mais seguro.

---

## 6.2 Separação entre TASK e GROUP_TASK

A tabela `TASK` não tem `idgroup` directamente, porque uma tarefa pode ser partilhada com vários grupos.

Por isso, foi criada a tabela `GROUP_TASK`, que resolve o relacionamento muitos-para-muitos.

---

## 6.3 Separação entre TASK e TASK_ASSIGNEE

A tabela `TASK_ASSIGNEE` permite atribuir tarefas a vários utilizadores.

Isto torna a aplicação preparada para funcionalidades colaborativas mais avançadas, como:

- tarefas enviadas a amigos;
- tarefas atribuídas a membros de grupos;
- tarefas com vários responsáveis.

---

## 6.4 Uso de XP_HISTORY

O XP total do utilizador está guardado em `USER.xp`, mas o histórico detalhado está guardado em `XP_HISTORY`.

Esta separação permite:

- mostrar o XP actual de forma rápida;
- gerar gráficos de evolução;
- saber quando o XP foi ganho;
- perceber qual tarefa ou acção originou o XP.

---

## 6.5 Uso de archived_at em TASK

As tarefas concluídas podem ser ocultadas da interface sem serem eliminadas da base de dados.

Isto é feito através do campo `archived_at`.

Esta decisão é importante porque:

- mantém o histórico;
- evita perda de estatísticas;
- permite limpar visualmente a lista de tarefas;
- conserva dados úteis para gráficos e relatórios.

---

## 6.6 Uso de FAVORITE_VERSE

Os versículos ficam guardados apenas uma vez em `BIBLE_VERSE`.

Quando um utilizador guarda um versículo, é criada uma linha em `FAVORITE_VERSE`.

Isto evita duplicação de texto e permite que vários utilizadores guardem o mesmo versículo.

---

# 7. Normalização da Base de Dados

A base de dados foi desenhada seguindo princípios de normalização, principalmente até à 3.ª Forma Normal.

## Objectivos da normalização

- Evitar repetição desnecessária de dados.
- Separar entidades por responsabilidade.
- Melhorar a integridade da informação.
- Facilitar futuras alterações.
- Permitir crescimento da aplicação.

## Exemplos de normalização no Lifinity

- Os versículos estão separados dos favoritos.
- As badges estão separadas dos utilizadores.
- Os grupos estão separados dos membros.
- As tarefas estão separadas das atribuições.
- O histórico de XP está separado do XP total do utilizador.

---

# 8. Resumo das Relações Principais

| Relação | Tipo | Tabela Intermédia |
|---|---:|---|
| USER — TASK | 1:N | Não aplicável |
| USER — GOAL | 1:N | Não aplicável |
| USER — GROUP_ENTITY | 1:N | Não aplicável |
| USER — GROUP_ENTITY | N:M | GROUP_MEMBER |
| TASK — GROUP_ENTITY | N:M | GROUP_TASK |
| USER — BADGE | N:M | USER_BADGE |
| USER — BIBLE_VERSE | N:M | FAVORITE_VERSE |
| USER — XP_HISTORY | 1:N | Não aplicável |
| TASK — XP_HISTORY | 1:N opcional | Não aplicável |
| USER — USER | N:M / auto-relacionamento | FRIENDSHIP |
| USER — NOTIFICATION | 1:N | Não aplicável |
| TASK — USER | N:M | TASK_ASSIGNEE |
| TASK — CATEGORY | N:1 | Não aplicável |

---

# 9. Observações para Defesa da PAP

Na defesa, é importante referir que a base de dados foi pensada para ser escalável.

Alguns pontos fortes que podem ser explicados ao júri:

1. **Separação de responsabilidades**
   - Cada tabela tem uma função clara.

2. **Relacionamentos muitos-para-muitos correctamente modelados**
   - Foram usadas tabelas intermédias como `GROUP_MEMBER`, `GROUP_TASK`, `USER_BADGE`, `FAVORITE_VERSE` e `TASK_ASSIGNEE`.

3. **Preparação para funcionalidades futuras**
   - A base de dados já suporta grupos, amigos, notificações, tarefas atribuídas, favoritos e estatísticas.

4. **Preservação do histórico**
   - As tarefas concluídas podem ser ocultadas sem apagar dados importantes.
   - O XP tem histórico próprio através da tabela `XP_HISTORY`.

5. **Integridade referencial**
   - As chaves estrangeiras garantem que os dados permanecem consistentes.

6. **Segurança**
   - A palavra-passe não é guardada em texto simples, mas sim de forma encriptada/hash.

7. **Evitar palavras reservadas**
   - A tabela de grupos chama-se `GROUP_ENTITY` para evitar conflito com comandos SQL.

---

# 10. Conclusão

A base de dados do Lifinity foi desenhada para suportar uma aplicação moderna de produtividade, colaboração e motivação diária.

A estrutura permite:

- gerir utilizadores;
- criar e concluir tarefas;
- acompanhar XP e níveis;
- gerar estatísticas;
- criar grupos;
- adicionar amigos;
- guardar versículos favoritos;
- preparar notificações;
- suportar funcionalidades futuras como chat, tarefas partilhadas e comparação entre utilizadores.

O modelo relacional foi construído com foco em normalização, integridade referencial e escalabilidade, tornando a base de dados adequada para uma aplicação em crescimento.

---

Última actualização: 26-04