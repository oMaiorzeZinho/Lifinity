# Parte 2 — Explicação dos commits (Lifinity)

> Lista **cronológica** (mais antigo → mais recente) de todos os commits, agrupados por fases de desenvolvimento. Cada entrada: `hash` · data · mensagem + explicação inferida da mensagem e do código já documentado nas outras notas de estudo.
>
> Método: obtido com `git log --pretty=format:"%h %ad %s" --date=short`. Onde a mesma mensagem aparece repetida, é quase de certeza fruto de *amend*/*rebase*/*merge* (re-commits do mesmo trabalho) — assinalado como **[dup]**.

---

## FASE 0 — Arranque da web app (23–27 abril)
Base full-stack: autenticação, dashboard, tarefas com dados reais, ranking, inspiração e estatísticas, terminando com um redesign visual.

- `78cef8aa` · 2026-04-23 · **Primeira versão do projeto Lifinity** — Commit inicial: estrutura base do projeto (backend Express + frontend React + base de dados). O ponto de partida de tudo.
- `c1e3db34` · 2026-04-23 · **Corrige URLs da autenticação e configuração da API no frontend** — Acerta o `VITE_API_URL`/endpoints para o login/registo funcionarem entre frontend e backend.
- `a608596a` · 2026-04-24 · **Melhora dashboard e tasks com dados reais e configuração da API** — Liga o dashboard e a página de tarefas à API real (deixa de ser estático/mock).
- `e44a343e` · 2026-04-25 · **Liga ranking ao backend e corrige controlador de utilizadores** — Implementa o ranking real (top por XP) e corrige o `userController`.
- `86761634` · 2026-04-25 · **Corrige layout do dashboard e implementa ranking real** — Ajustes de layout do painel e finalização do ranking.
- `78116786` · 2026-04-25 · **Implementa inspiração diária com favoritos, widget, partilha e melhorias visuais** — Módulo de versículos: versículo do dia, favoritos e widget.
- `66c98a9d` · 2026-04-25 · **Adiciona configuração assets e SQL da inspiração diária** — Acrescenta o SQL (`BIBLE_VERSE`/`FAVORITE_VERSE`) e assets para a inspiração.
- `3fad3089` · 2026-04-25 · **Adiciona logótipo Lifinity ao menu principal** — Identidade visual no menu.
- `5c1f9546` · 2026-04-25 · **Redesenha página de ranking com estatísticas e visual profissional** — Redesign do ranking.
- `6de244ac` · 2026-04-25 · **Redesenha página de ranking...** — **[dup]** do anterior (re-commit).
- `96253633` · 2026-04-25 · **Implementa estatísticas com gráficos e histórico preservado** — Página de estatísticas com gráficos (Recharts) e `XP_HISTORY`.
- `817904c6` · 2026-04-25 · **Implementa estatísticas com gráficos...** — **[dup]** do anterior.
- `2ce6dfa5` · 2026-04-26 · **Redesenha home com identidade visual escura e premium** — Nova landing page escura.
- `51e33a10` · 2026-04-26 · **Atualiza fundos das páginas de autenticação** — Imagens de fundo do login/registo.
- `d225a50a` · 2026-04-26 · **Atualiza interface geral do Lifinity e finaliza páginas principais** — Polimento transversal das páginas.
- `2e7adb30` · 2026-04-27 · **Atualiza documentação final do projeto Lifinity** — Documentação (provavelmente `docs/OVERALL_LIFINITY.md`).

## FASE 1 — Tarefas avançadas + funcionalidades sociais web (4–17 maio)
Edição/prazos/destinos de tarefas, modo claro, comunidade, chat, partilha de versículos, estatísticas comparativas, notificações, assistente IA, grupos e conquistas.

- `101891e4` · 2026-05-04 · **Correção de warnings e estabilização do projeto** — Limpeza de avisos e estabilidade.
- `898110fc` · 2026-05-04 · **Adiciona edição de tarefas e prazo limite** — Editar tarefas e `due_date`.
- `edbde3fd` · 2026-05-05 · **Finaliza edição de tarefas e tarefas perdidas** — Conceito de tarefa "perdida" (fora do prazo).
- `3c04c18b` · 2026-05-05 · **Adiciona destinos ao criar tarefas** — Atribuir tarefas a amigos/grupos (`TASK_ASSIGNEE`/`GROUP_TASK`).
- `0dc55b8a` · 2026-05-06 · **Mostra tarefas recebidas e melhora seletor de destinos** — Ver tarefas que me foram atribuídas e melhor UI de destinos.
- `fcdb4790` · 2026-05-07 · **Adiciona modelo CSV para importação de tarefas** — Template/funcionalidade de importação por CSV.
- `cb18d09a` · 2026-05-11 · **Adiciona base do modo claro e confirmação ao concluir tarefas** — Tema claro inicial + confirmar conclusão.
- `cfa795b4` · 2026-05-11 · **Adiciona ações de gestão da comunidade** — Gestão de amigos/grupos na comunidade.
- `03c2efc4` · 2026-05-11 · **Adiciona estrutura inicial do chat privado** — Base do chat 1-para-1 (`CONVERSATION`/`MESSAGE`).
- `fadf7a56` · 2026-05-12 · **Adiciona partilha de versículos pelo chat** — `message_type='verse'`.
- `25e60638` · 2026-05-14 · **Adiciona estatísticas comparativas** — Comparar com amigo/grupo.
- `48e7d68d` · 2026-05-14 · **Adiciona notificações internas** — Sistema do sino (`NOTIFICATION`).
- `91cbdeeb` · 2026-05-14 · **Adiciona assistente Lifinity no chat** — Chatbot (base do `assistantController`/Gemini).
- `6727a484` · 2026-05-16 · **Ajusta deteção de intenções do assistente Lifinity** — Afina o `detectIntent` (regex de comandos).
- `916b6548` · 2026-05-16 · **Adiciona grupos de conversa no chat** — Conversas de grupo avulsas.
- `9d9b32ed` · 2026-05-16 · **Integra grupos Lifinity com chat** — Liga `GROUP_ENTITY` a `CONVERSATION` (membros sincronizados).
- `1dbc9250` · 2026-05-16 · **Permite partilhar versículos com grupos** — Partilha de versículos em conversas de grupo.
- `701a77bb` · 2026-05-17 · **Adiciona sistema de conquistas e destaques no perfil** — Badges (`BADGE`/`USER_BADGE`/`USER_BADGE_HIGHLIGHT`) e motor `achievements.js`.
- `e9b55ea5` · 2026-05-17 · **Adiciona modal de perfil público** — `PublicProfileModal` + endpoint `public-profile`.
- `054c2639` · 2026-05-17 · **Adiciona links nas notificações internas** — Deep-linking (`entity_type`/`entity_id`/`link`).
- `7e62a5d2` · 2026-05-17 · **Polimento visual de tarefas e comunidade** — Ajustes visuais.

## FASE 2 — Redesign visual da web (18 maio)
"Novo visual" aplicado ecrã a ecrã + modo claro suave.

- `ac9289d2` · 2026-05-18 · **Aplica novo visual ao chat**.
- `d9399723` · 2026-05-18 · **Aplica novo visual ao perfil**.
- `f12c8ac3` · 2026-05-18 · **Aplica novo visual à inspiração**.
- `e7619c5e` · 2026-05-18 · **Aplica novo visual a estatísticas**.
- `7e99b81c` · 2026-05-18 · **Aplica novo visual ao ranking**.
- `ea044098` · 2026-05-18 · **Aplica novo visual aos componentes do dashboard**.
- `f8fe7fcb` · 2026-05-18 · **Corrige selects e menus do dashboard** — Legibilidade de dropdowns.
- `48b4b5c3` · 2026-05-18 · **Completa modo claro suave do dashboard** — Finaliza o tema claro.

## FASE 3 — App Android (18–21 maio)
Arranque do projeto Android (Java + XML) e paridade básica com a web.

- `f9e9d7aa` · 2026-05-18 · **Adiciona projeto Android inicial** — Esqueleto da app.
- `4ec1a3ea` · 2026-05-18 · **Adiciona projeto Android inicial** — **[dup]**.
- `a2e0b381` · 2026-05-18 · **Adiciona projeto Android inicial** — **[dup]** (3 re-commits do arranque).
- `eb1cc716` · 2026-05-19 · **Ajusta gitignore do projeto Android**.
- `593c126e` · 2026-05-19 · **Corrige configuração inicial do Android**.
- `0142e9e1` · 2026-05-19 · **Remove configuração local do Android Studio do Git** — Tira ficheiros `.idea` locais.
- `931af515` · 2026-05-19 · **Adiciona login Android com logout** — `LoginActivity` + token.
- `28bff516` · 2026-05-19 · **Adiciona listagem de tarefas no Android** — `TasksActivity`.
- `99a6e2dc` · 2026-05-19 · **Adiciona criação e conclusão de tarefas no Android** — `CreateTaskActivity` + concluir.
- `12c6974a` · 2026-05-21 · **Adiciona edição e ocultação de tarefas no Android** — `EditTaskActivity` + esconder.
- `33f7c4df` · 2026-05-21 · **Adiciona configurações de conta no dashboard** — (web) configurações da conta.
- `4813d102` · 2026-05-21 · **Corrige estado perdido e oculta tarefas concluídas no Android**.
- `8c06811e` · 2026-05-21 · **Corrige estado perdido...** — **[dup]** do anterior.
- `968f8534` · 2026-05-21 · **Adiciona perfil e visual claymorphism no Android** — `ProfileActivity` + estética clay.
- `7fb1f3c8` · 2026-05-21 · **Adiciona configurações de conta no Android** — `SettingsActivity`.
- `45523d92` · 2026-05-21 · **Adiciona registo no Android** — `RegisterActivity`.
- `e30ce38e` · 2026-05-21 · **Adiciona inspiração no Android** — `InspirationActivity`.
- `76aabb6e` · 2026-05-21 · **Atualiza interface para atividades e modal de conquistas** — "Tarefas" → "Atividades"; conquistas.
- `4d637f4e` · 2026-05-21 · **Ignora configuração local do Android Studio** — `.gitignore`.
- `d9a10732` · 2026-05-21 · **Atualiza linguagem para atividades no Android** — Terminologia "Atividades".
- `9f9bfe5a` · 2026-05-21 · **Melhora perfil Android**.
- `e83112ad` · 2026-05-21 · **Melhora perfil Android** — **[dup]**.

## FASE 4 — Setup do Claude + plano Android (28 maio)
- `7fba434c` · 2026-05-28 · **Adiciona CLAUDE.md e atualiza documentação** — Contexto do projeto para o assistente.
- `4f46a013` · 2026-05-28 · **Configura memória local do Claude e atualiza CLAUDE.md** — Pasta `.claude/memory/`.
- `44e4ba19` · 2026-05-28 · **Adiciona instruções originais do projeto ao CLAUDE.md** — As instruções da PAP.
- `3e35981e` · 2026-05-28 · **Adiciona plano de implementação Android (Ranking, Notificações, Estatísticas, Assistente, Chat)** — Roteiro de paridade Android↔web.

## FASE 5 — Redesign clay e paridade do Android (29 maio – 1 junho)
Design claymorphism completo e os ecrãs em falta (ranking, notificações, estatísticas, assistente, chat).

- `530c075b` · 2026-05-29 · **Implementa design claymorphism Android: cores, drawables, tema e inputs** — Base visual clay.
- `08de88f0` · 2026-05-29 · **Corrige erro de build: remove atributo colorBackground inválido do tema** — Fix de compilação.
- `d5f2d239` · 2026-05-29 · **Redesenho clay: drawables, nav bar e cartão de tarefa**.
- `fcdfd555` · 2026-05-29 · **Redesenho clay: ecrã Atividades com header, XP e nav inferior**.
- `e4d2905f` · 2026-05-29 · **Android: redesign clay completo — bottom nav, Ranking, correções**.
- `87d4b7cc` · 2026-05-29 · **Android: corrige FAB, logo real e spinners ilegíveis**.
- `b094be94` · 2026-05-29 · **Android: logótipo Lifinity em todos os ecrãs + ícone da app**.
- `11181a47` · 2026-05-29 · **Android: ecrã de Notificações + sino funcional no header** — `NotificationsActivity`.
- `fa41aa41` · 2026-05-29 · **Android: ecrã do Assistente (chatbot Gemini)** — `AssistantActivity`.
- `0b2f163a` · 2026-05-29 · **Android: ecrã de Estatísticas (resumo + gráfico)** — `StatisticsActivity`.
- `a7cb5d7d` · 2026-05-29 · **Docs: corrige stack Android (Java+XML, não Kotlin/Compose) e adiciona plano de paridade** — Correção importante de documentação.
- `ea0d369a` · 2026-05-29 · **mudancas** — Commit de mensagem vaga (provável trabalho intermédio; rever `git show` se necessário).
- `23eb5087` · 2026-05-29 · **feat(android): adicionar ecrã de ranking** — `RankingActivity`.
- `09b8d759` · 2026-05-29 · **feat(android): adicionar ecrã de notificações** — (consolidação do ecrã de notificações).
- `024719e1` · 2026-05-29 · **feat(android): adicionar ecrã de estatísticas**.
- `db6dc09d` · 2026-05-29 · **feat(android): adicionar ecrã do assistente IA**.
- `00803672` · 2026-05-29 · **feat(android): adicionar ecrãs de chat e conversas** — `ChatActivity`/`ConversationsActivity`.
- `ecb5be4d` · 2026-05-29 · **feat(android): actualizar MainActivity com todos os ecrãs** — Navegação central.
- `e098cb15` · 2026-05-29 · **feat(android): merge redesign com todos os ecrãs implementados** — Merge.
- `62191361` · 2026-05-29 · **style(android): aplicar design clay consistente em todos os ecrãs**.
- `127622d6` · 2026-05-29 · **style(android): merge redesign visual completo para main** — Merge para `main`.

## FASE 6 — Moderação, filtros e secções de tarefas (1–7 junho)
- `1f56653d` · 2026-06-01 · **fix(android): corrigir gravity inválido em activity_statistics.xml**.
- `b70ee4c2` · 2026-06-01 · **fix(android): corrigir erros de compilação em AssistantAdapter e NotificationApi**.
- `cd15017e` · 2026-06-01 · **refactor(android): MainActivity redireciona para Tasks e Perfil torna-se hub de navegação** — Reorganização da navegação Android.
- `cca53b58` · 2026-06-02 · **feat(android): tab Comunidade como hub social, estatísticas nas tarefas e correção do FAB** — `CommunityActivity` como hub.
- `e167673f` · 2026-06-02 · **feat: admin pode expulsar membros de grupo com motivo e notificação** — `kickGroupMember`.
- `e6941405` · 2026-06-02 · **feat: suspender (mute) membros de grupo com duração, motivo e notificação** — `muteGroupMember` + `muted_until`.
- `65e532cc` · 2026-06-02 · **feat: filtrar tarefas por grupo e por amigo** — Filtros na página de tarefas.
- `b21647c0` · 2026-06-02 · **chore: remover relatório .docx antigo do repositório** — Limpeza.
- `1d6fba45` · 2026-06-02 · **feat: moderação de grupos (expulsar/suspender com motivo e notificação), bloqueio de membros suspensos, filtros de tarefas por grupo/amigo e limpeza de SQL antigos** — Consolidação da moderação + bloqueio do suspenso (usado em `taskController`/`chatController`).
- `7f3f49e2` · 2026-06-02 · **refactor: filtros de tarefas em painel recolhível com contador de filtros ativos** — UI dos filtros.
- `c441851a` · 2026-06-05 · **feat: mostrar data de criação e separar tarefas concluídas das pendentes**.
- `4c02172f` · 2026-06-05 · **feat: organizar tarefas em secções por origem (minhas, recebidas, criadas para outros)** — `task_origin` no `getTasks`.
- `59b6c810` · 2026-06-05 · **feat: permissões de tarefas por tipo (pessoal 1h, atribuída até concluir) e correção do filtro por amigo** — Regras de edição do `updateTask`.
- `b93af302` · 2026-06-07 · **chore: atualizar diagrama de tabelas, logo e adicionar relatório PAP** — Documentação/relatório.
- `b0229126` · 2026-06-07 · **Merge branch 'feature/tarefas-seccoes-fase1'** — Merge da fase de secções de tarefas.

## FASE 7 — FASES A–E e calendário (10–14 junho)
Entrega final: widget de chat, trancar grupos, calendário, upload de imagens, perfil reorganizado/bio, ranking xadrez, contacto/email, e configuração de rede do Android.

- `a6649744` · 2026-06-10 · **chore: remover pastas de trabalho interno (design handoff e superpowers) antes da entrega** — Limpeza pré-entrega.
- `6faf7ee9` · 2026-06-10 · **fix: corrigir scroll interno do chat e fixar input em baixo** — UX do chat.
- `1abec050` · 2026-06-10 · **style: atualizar classes Tailwind para sintaxe canónica v4 (corrigir warnings do editor)** — Sintaxe `(--var)` do Tailwind v4.
- `ae8ea709` · 2026-06-10 · **feat: adicionar vista de calendário mensal na página de tarefas** — Toggle Lista/Calendário.
- `094beaa5` · 2026-06-10 · **fix: melhorar legibilidade do painel lateral do calendário**.
- `38f6bc17` · 2026-06-10 · **fix: corrigir fundo translúcido do painel lateral do calendário**.
- `1b8ec253` · 2026-06-10 · **feat: ações funcionais e redesign visual no painel lateral do calendário** — Concluir/editar/apagar no painel.
- `3665c606` · 2026-06-10 · **fix: corrigir contraste e cores do painel lateral do calendário**.
- `b7db1254` · 2026-06-10 · **fix: tarefa individual e de grupo independentes; feat: badges 'Para quem' nos cards** — Fix importante: `TASK_ASSIGNEE` e `GROUP_TASK` independentes (ver `taskController`).
- `d2eda8b8` · 2026-06-10 · **chore: atualizar BASE_URL do Android para rede local e adicionar notas/ideias da PAP** — Config de rede Android.
- `d43cdf83` · 2026-06-10 · **feat: badges de origem no painel lateral do calendário** — Consistência de badges.
- `ac618776` · 2026-06-10 · **feat: widget de chat flutuante com contador de não lidas; remover chat das notificações** — FASE A1 (`ChatWidget`, `last_read_at`).
- `b66a431d` · 2026-06-10 · **feat: trancar grupos para impedir novas entradas por código** — FASE A2 (`is_locked`, `toggleGroupLock`).
- `a008c5d0` · 2026-06-10 · **fix: dropdown menus cortados na Comunidade e temas ilegíveis na Inspiração**.
- `6a77b831` · 2026-06-10 · **fix: elevar z-index da secção quando menu aberto para dropdown não ser cortado entre cards** — Continuação do fix anterior.
- `7f3548f7` · 2026-06-11 · **feat: upload de imagem de perfil e imagem de fundo do utilizador** — FASE B (multer, avatar/cover).
- `aebe5f17` · 2026-06-11 · **fix: mostrar cover do utilizador no perfil público** — Cover no `PublicProfileModal`.
- `9b8b08be` · 2026-06-11 · **feat: reorganizar perfil, mover configurações e adicionar bio do utilizador** — FASE B (bio, configurações no perfil).
- `133a5c2f` · 2026-06-11 · **feat: redesign do ranking com peças de xadrez e avatares** — FASE D (pódio com peças SVG).
- `95d17be7` · 2026-06-11 · **feat: página Contacte-nos com envio de email e boas-vindas no registo** — FASE E (`contactController`, `emailService`).
- `d65e1573` · 2026-06-12 · **fix: calendário compacto, formulário de contacto centrado e nav arrumada**.
- `f2075a9c` · 2026-06-12 · **feat: calendário em ecrã inteiro com títulos das tarefas nas células** — Calendário a preencher o viewport.
- `76948c8f` · 2026-06-14 · **fix(android): BASE_URL configurável via buildConfigField, timeouts de 30s e mensagens de erro de ligação mais claras** — `API_BASE_URL` no `build.gradle.kts`, timeouts no `ApiClient`, erros de ligação claros no Login/Register.

## FASE 8 — Identidade e refinamento visual do Android (15–17 junho)
Reta final de polimento visual da app Android (Java + XML), sem mexer em lógica nem navegação.

- `c2f08dc9` · 2026-06-15 · **fix(android): corrigir identidade visual (logo, ícone, cores) e adicionar splash** — Remove o tint que pintava a logo de verde sólido; corrige o ícone adaptativo ("quadrado verde"); completa a paleta da marca no tema **night** (origem dos "botões rosa"); ecrã de arranque (splash) via `windowBackground`.
- `(refinamento)` · 2026-06-17 · **style(android): refinamento visual transversal — menta suavizada, escala consistente e hierarquia de botões** — Passe de polimento em **todos** os ecrãs: acento menta suavizado ~12 % no `colors.xml` (com `bg_pill_mint`/`textColorHighlight` acertados à mão e contraste AA verificado); `dimens.xml` passou a escala explícita (espaçamento, tipografia, raios, alturas); títulos de ecrã unificados em 26sp e botões de ícone/voltar em 40dp; novo `btn_ghost_clay` para a ação secundária discreta (Login/Registo); hex soltos trocados por tokens nomeados. Ver [`android/res/values/_VALUES.md`](android/res/values/_VALUES.md) e [`android/res/drawable/_DRAWABLES_CLAY.md`](android/res/drawable/_DRAWABLES_CLAY.md).

---

## Leitura transversal (o "fio condutor")
1. **Abril:** nasce a web app full-stack (auth → tarefas → ranking → inspiração → estatísticas) e ganha identidade visual.
2. **Maio (início):** tarefas tornam-se colaborativas (destinos, recebidas) e nasce a camada social (comunidade, chat, assistente, conquistas, notificações).
3. **Maio (meio):** redesign visual da web + arranque e paridade da app Android.
4. **Fim de maio:** Android ganha o design clay e todos os ecrãs.
5. **Junho:** moderação de grupos, secções/permissões de tarefas e, na reta final, as "FASES A–E" (widget de chat, trancar grupos, uploads, perfil/bio, ranking xadrez, contacto/email) + calendário e afinação do Android.

> Para detalhe de *que ficheiros* cada commit tocou, correr `git show <hash> --stat`.
