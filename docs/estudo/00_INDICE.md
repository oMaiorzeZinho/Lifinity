# 📚 Índice — Estudo do Lifinity

Documento de estudo pessoal e exaustivo do projeto Lifinity. Cada ligação abre a explicação **bloco a bloco** do ficheiro correspondente. Organizado por área.

> Estado: **Base de Dados + Backend completos; Frontend parcial (config, entrada, componentes); Android e páginas do frontend por fazer.** Ver `_PROGRESSO.md` para o ponto exato e o próximo ficheiro a documentar.

---

## ✨ Melhorias por data (full-stack)
- [Correções do chat e melhorias sociais (2026-06-27)](CORRECOES_CHAT_E_SOCIAL_2026-06-27.md) — 6 correções: mensagens no **lado certo** (Android chat **e** assistente — campos `idsender`/`sender`/`reply` mal mapeados no GSON + comparação de `Integer` por valor), **nome do amigo** nas conversas privadas (`other_username`), **fotos** nas conversas (Android lista + cabeçalho web, com `other_avatar` novo no `SELECT`), **nome do remetente** dentro do chat e **menu de 3 opções** nos amigos (abrir conversa via `chat/conversations/private`, ver perfil, remover). Toca em `chatController`, vários `models`/`adapters`/`activities` Android e `Chat.jsx`.
- [Recuperação de palavra-passe por código (2026-06-25)](RECUPERACAO_PALAVRA_PASSE_2026-06-25.md) — fluxo "esqueci-me da palavra-passe": código de 6 dígitos por email (expira em 10 min, uso único), tabela `PASSWORD_RESET`, 3 endpoints em `/auth` e modal de 3 passos no Login. Toca em `authController`, `authRoutes`, `estrutura_lifinity.sql` (+ `password_reset.sql`), `Login.jsx` e `PasswordResetModal.jsx`.
- [Melhorias no formulário de contacto (2026-06-24)](MELHORIAS_FORMULARIO_CONTACTO_2026-06-24.md) — email inteligente (autenticado vs público), telefone e **anexos** de ficheiros (multer dedicado sem `req.user`, nodemailer attachments, FormData no frontend). Toca em `contactController`, `contactRoutes`, `emailService`, `uploadMiddleware` e `Contact.jsx`.

---

## 🗄️ Base de Dados
- [estrutura_lifinity.sql](base_dados/estrutura_lifinity.sql.md) — esquema completo (22 tabelas + seed de badges)

## ⚙️ Backend — infraestrutura e config
- [package.json](backend/package.json.md) — dependências do backend
- [binding.gyp](backend/binding.gyp.md) — build do módulo C (node-gyp)
- [index.js](backend/index.js.md) — arranque do servidor / orquestrador
- [src/config/db.js](backend/src/config/db.js.md) — pool de ligações MySQL
- [src/middlewares/authMiddleware.js](backend/src/middlewares/authMiddleware.js.md) — proteção de rotas com JWT
- [src/middlewares/uploadMiddleware.js](backend/src/middlewares/uploadMiddleware.js.md) — upload de imagens (multer)
- [src/services/emailService.js](backend/src/services/emailService.js.md) — envio de emails (com modo simulação)
- [src/utils/gamification.js](backend/src/utils/gamification.js.md) — fórmula de XP/nível (JS, fallback)
- [src/utils/achievements.js](backend/src/utils/achievements.js.md) — motor de conquistas

## 🧩 Módulo C nativo
- [src/native/gamification.c](backend/src/native/gamification.c.md) — N-API: recompensa, nível e estatísticas

## 🛣️ Backend — rotas
- [authRoutes.js](backend/src/routes/authRoutes.js.md) · [taskRoutes.js](backend/src/routes/taskRoutes.js.md) · [userRoutes.js](backend/src/routes/userRoutes.js.md) · [statisticsRoutes.js](backend/src/routes/statisticsRoutes.js.md) · [inspirationRoutes.js](backend/src/routes/inspirationRoutes.js.md)
- [friendRoutes.js](backend/src/routes/friendRoutes.js.md) · [groupRoutes.js](backend/src/routes/groupRoutes.js.md) · [chatRoutes.js](backend/src/routes/chatRoutes.js.md) · [achievementRoutes.js](backend/src/routes/achievementRoutes.js.md) · [notificationRoutes.js](backend/src/routes/notificationRoutes.js.md) · [assistantRoutes.js](backend/src/routes/assistantRoutes.js.md) · [contactRoutes.js](backend/src/routes/contactRoutes.js.md)

## 🧠 Backend — controladores
- [authController.js](backend/src/controllers/authController.js.md) — registo e login
- [taskController.js](backend/src/controllers/taskController.js.md) — tarefas (o central; usa o C)
- [userController.js](backend/src/controllers/userController.js.md) — perfil, ranking, conta, uploads
- [statisticsController.js](backend/src/controllers/statisticsController.js.md) — estatísticas e comparações
- [inspirationController.js](backend/src/controllers/inspirationController.js.md) — versículos
- [friendController.js](backend/src/controllers/friendController.js.md) — amizades
- [groupController.js](backend/src/controllers/groupController.js.md) — grupos e moderação
- [chatController.js](backend/src/controllers/chatController.js.md) — chat
- [achievementController.js](backend/src/controllers/achievementController.js.md) — conquistas (endpoints)
- [notificationController.js](backend/src/controllers/notificationController.js.md) — notificações
- [assistantController.js](backend/src/controllers/assistantController.js.md) — assistente IA (Gemini)
- [contactController.js](backend/src/controllers/contactController.js.md) — formulário de contacto

## 🎨 Frontend — config e entrada
- [package.json](frontend/package.json.md) · [vite.config.js](frontend/vite.config.js.md) · [tailwind.config.js](frontend/tailwind.config.js.md) · [postcss.config.js](frontend/postcss.config.js.md) · [index.html](frontend/index.html.md)
- [src/main.jsx](frontend/src/main.jsx.md) — ponto de entrada do React
- [src/App.jsx](frontend/src/App.jsx.md) — routing (lazy + Suspense)
- [src/utils/imageUrl.js](frontend/src/utils/imageUrl.js.md) — URLs de imagens
- ⏳ *Por fazer:* `eslint.config.js`, `src/index.css` (tema clay)

## 🧱 Frontend — componentes
- [ChatWidget.jsx](frontend/src/components/ChatWidget.jsx.md) — badge de não lidas
- [DailyVerseWidget.jsx](frontend/src/components/DailyVerseWidget.jsx.md) — versículo do dia
- [ImageUploadModal.jsx](frontend/src/components/ImageUploadModal.jsx.md) — upload de imagem
- [AccountSettingsModal.jsx](frontend/src/components/AccountSettingsModal.jsx.md) — configurações da conta
- [PublicProfileModal.jsx](frontend/src/components/PublicProfileModal.jsx.md) — perfil público

## 📄 Frontend — páginas ⏳ (por fazer)
- `Login.jsx`, `Register.jsx`, `Home.jsx`, `Dashboard.jsx`, `Tasks.jsx`, `Ranking.jsx`, `Statistics.jsx`, `Inspiration.jsx`, `Community.jsx`, `Profile.jsx`, `Chat.jsx`, `Contact.jsx`

## 📱 Android

### Estudo do código (ficheiro a ficheiro)
**Configuração e rede**
- [Configuração: Gradle + Manifest](android/config/_CONFIG_GRADLE_MANIFEST.md) — `settings.gradle.kts`, `build.gradle.kts` (raiz + app), `libs.versions.toml`, `AndroidManifest.xml` (build, dependências, IP da API, ecrãs e permissões).
- [network/ApiClient.java](android/network/ApiClient.java.md) — a fábrica Singleton do Retrofit (URL base, timeouts, logging, Gson).

**APIs Retrofit** (interfaces que falam com o backend)
- [AuthApi](android/api/AuthApi.java.md) · [TaskApi](android/api/TaskApi.java.md) · [UserApi](android/api/UserApi.java.md) · [AccountApi](android/api/AccountApi.java.md) · [StatisticsApi](android/api/StatisticsApi.java.md) · [InspirationApi](android/api/InspirationApi.java.md) · [AchievementApi](android/api/AchievementApi.java.md) · [NotificationApi](android/api/NotificationApi.java.md) · [ChatApi](android/api/ChatApi.java.md) · [AssistantApi](android/api/AssistantApi.java.md)

**Models** (POJOs JSON ⇆ Java, agrupados por domínio)
- [Auth e utilizador](android/models/_MODELS_AUTH_USER.md) · [Tarefas](android/models/_MODELS_TASKS.md) · [Estatísticas/Inspiração/Conquistas](android/models/_MODELS_STATS_INSPIRATION_ACHIEVEMENTS.md) · [Notificações/Chat/Assistente](android/models/_MODELS_NOTIFICATIONS_CHAT_ASSISTANT.md)

**Utils**
- [Imagens: ImageUrlHelper + AvatarLoader](android/utils/_UTILS_IMAGENS.md) — montar URLs de avatar e carregar fotos com Glide (fallback para placeholder).

**Activities e helpers**
- [MainActivity](android/MainActivity.java.md) — porteiro (token → Landing ou Tarefas) · [LoginActivity](android/LoginActivity.java.md) ⭐ *(explica os padrões comuns: ciclo de vida, Retrofit enqueue, SharedPreferences, Intents)* · [RegisterActivity](android/RegisterActivity.java.md)
- [CreateTaskActivity](android/CreateTaskActivity.java.md) · [EditTaskActivity](android/EditTaskActivity.java.md) — formulários de criar/editar tarefa
- [BottomNavHelper](android/BottomNavHelper.java.md) — barra inferior (tabs + FAB + avatar) · [HeaderHelper](android/HeaderHelper.java.md) — sino de notificações
- [TasksActivity](android/TasksActivity.java.md) ⭐ — o hub: cartão XP, resumo, lista com filtros/pesquisa, e vista de calendário nativa
- [RankingActivity](android/RankingActivity.java.md) — pódio + lista por XP · [NotificationsActivity](android/NotificationsActivity.java.md) — sino/lista (optimistic UI) · [CommunityActivity](android/CommunityActivity.java.md) — hub social · [SettingsActivity](android/SettingsActivity.java.md) — username/password/apagar conta
- [ProfileActivity](android/ProfileActivity.java.md) — perfil, barra de XP, resumo, destaques, mudar foto · [StatisticsActivity](android/StatisticsActivity.java.md) — gráficos (MPAndroidChart) · [AchievementsActivity](android/AchievementsActivity.java.md) — conquistas + destacar
- [InspirationActivity](android/InspirationActivity.java.md) — versículos, favoritos, filtro de tema, partilha · [ConversationsActivity](android/ConversationsActivity.java.md) — lista de chats · [ChatActivity](android/ChatActivity.java.md) — conversa (envio optimista) · [AssistantActivity](android/AssistantActivity.java.md) — chatbot Gemini

**Adapters** (RecyclerView)
- [TaskAdapter](android/adapters/TaskAdapter.java.md) ⭐ *(explica o padrão Adapter/ViewHolder)* · [RankingAdapter](android/adapters/RankingAdapter.java.md) · [NotificationAdapter](android/adapters/NotificationAdapter.java.md) · [ConversationAdapter](android/adapters/ConversationAdapter.java.md) · [AchievementAdapter](android/adapters/AchievementAdapter.java.md)
- [ChatMessageAdapter](android/adapters/ChatMessageAdapter.java.md) *(2 tipos de bolha)* · [AssistantMessageAdapter](android/adapters/AssistantMessageAdapter.java.md) · [AssistantAdapter](android/adapters/AssistantAdapter.java.md) *(variante)*

### Melhorias por data
- [**Inspiração/Comunidade: banner e cabeçalhos sobrepostos — 2026-06-27**](android/CABECALHOS_E_BANNER_2026-06-27.md) — banner do versículo finalmente **pequeno** (causa real: `ImageView` `match_parent` a inflar a faixa `wrap_content` → **altura fixa** de 200dp) e **cabeçalhos** da Inspiração e da Comunidade que se sobrepunham ao conteúdo (faltava `background` opaco + `elevation`, agora iguais ao Perfil/Tarefas).
- [**Inspiração: 3 retoques visuais — 2026-06-27**](android/INSPIRACAO_RETOQUES_2026-06-27.md) — banner do versículo **mais baixo** (faixa contida: `minHeight` 200→150dp, aspas 56→34sp, padding/texto reduzidos, sem cortar versículos), **ícone de copiar** reconhecível (novo `ic_copy.xml` com dois retângulos sobrepostos; `copyVerseButton` Button→ImageView, igual ao de partilhar) e **favoritos com "Mostrar mais/menos"** (4 mais recentes por defeito — backend já ordena por `created_at DESC` —, expansível, coerente com o filtro de tema).
- [**Inspiração: banner do versículo, filtro de temas e partilha — 2026-06-26**](android/INSPIRACAO_BANNER_FILTRO_PARTILHA_2026-06-26.md) — três melhorias na página de Inspiração: **imagem de fundo** atrás do versículo do dia (mesma `bible-banner.jpg` da web, com overlay escuro + texto branco e cantos via `clipToOutline`), **filtro por tema** nos favoritos (Spinner com temas dinâmicos + "Todos") e **partilhar versículo** para uma conversa **existente** (diálogo com `getConversations` + `sendMessage`, conteúdo «"texto" — Livro cap:verso»).
- [**FAB "+", barra de XP, foto de perfil e destaque de conquistas — 2026-06-26**](android/FAB_BARRA_XP_FOTO_PERFIL_DESTAQUES_2026-06-26.md) — quatro melhorias: **"+" garantido no FAB** (`<Button>`→`ImageView` com vector `ic_add`, fugindo ao `MaterialButton`), **barra de XP** com aspeto de jogo (`xp_progress_bar` drawable + `maxHeight`; nível derivado do XP para a fração ser correta), **mudar foto de perfil pela galeria** (photo picker `GetContent` sem permissões + multipart `PUT /users/me/avatar`) e **destacar conquistas** (botão ghost distinto do selo verde, diálogo de substituição quando já há 3, `PUT /achievements/highlights`).
- [**Melhorias na barra de navegação e no Perfil — 2026-06-26**](android/MELHORIAS_NAV_E_PERFIL_2026-06-26.md) — ícones do menu coerentes (Material como vector drawables, sem o emoji a cores), **miniatura do avatar** na tab Perfil, **correção real do FAB "+"** (o `<include>` com `wrap_content` colapsava os 96dp → fixado com `@dimen/nav_total_height`), cabeçalho das Tarefas opaco (sem sobreposição ao scroll) e secção "Mais no Lifinity" removida (Conquistas com botão "Ver todas").
- [**Redesenho para TEMA CLARO (branco + verde) — 2026-06-24**](android/REDESIGN_TEMA_CLARO_2026-06-24.md) — mudança visual completa de tema escuro → claro: nova paleta, drawables clay suaves, mais espaço, login/registo com wordmark, cabeçalhos, diálogos com tema, FAB robusto e ordenação das tarefas igual à web. **(estado visual atual)**
- [**Imagens de avatar (Glide) + Gráficos (MPAndroidChart) — 2026-06-24**](android/IMAGENS_GLIDE_E_GRAFICOS_MPCHART_2026-06-24.md) — fotos reais de perfil com Glide (helpers de URL e de avatar, com fallback) e a página de Estatísticas refeita com gráficos a sério (MPAndroidChart), incluindo a correção do modelo de estatísticas.
- [res/values/ — colors · dimens · themes](android/res/values/_VALUES.md) — paleta da marca, escala de tamanhos/tipografia, tema; inclui as **decisões do refinamento visual de 2026-06-17** (menta suavizada, escala consistente). ⚠️ *Paleta atualizada para CLARA em 2026-06-24 — ver doc acima.*
- [res/drawable/ — drawables clay](android/res/drawable/_DRAWABLES_CLAY.md) — padrão clay (cartões, inputs, botões, pills) + `btn_ghost_clay` (hierarquia de botões).
- [Landing, Amigos/Grupos e Calendário](android/FUNCIONALIDADES_LANDING_AMIGOS_GRUPOS_CALENDARIO.md) — três funcionalidades novas (2026-06-18): ecrã de boas-vindas, ecrãs de amigos e grupos, e vista de calendário nas tarefas.
- [Correções visuais (2026-06-18)](android/CORRECOES_VISUAIS_2026-06-18.md) — ícone de opções da tarefa, FAB "+" a emergir da barra, e ações da Inspiração mais leves.
- ⏳ *Por fazer:* Config (`build.gradle.kts`, `libs.versions.toml`, `AndroidManifest.xml`), `network/ApiClient.java`, `api/*` (Retrofit), `models/*`, activities, adapters, restantes layouts XML.

---

## 📜 Outras partes
- [**_COMMITS.md**](_COMMITS.md) — Parte 2: explicação cronológica de **todos os commits** (por fases) ✅
- [**_PROGRESSO.md**](_PROGRESSO.md) — rastreador do que está feito / por fazer (retomar a partir daqui)

---

## 🔑 Conceitos transversais (para reler rápido)
- **Gamificação:** XP/nível calculados em **C** (`gamification.c`, via `taskController`/`statisticsController`); fallback JS em `utils/gamification.js`; histórico em `XP_HISTORY`; conquistas em `utils/achievements.js`.
- **Autenticação:** JWT criado no `authController` (login), validado no `authMiddleware`; token guardado no `localStorage` do frontend e enviado como `Authorization: Bearer`.
- **Tarefas:** 3 tipos (pessoal / atribuída / de grupo), com visibilidade e arquivo por-utilizador — toda a lógica em `taskController`.
- **Social:** amigos (`friendController`), grupos + moderação (`groupController`), chat (`chatController`), notificações (`notificationController`).
- **Frontend sem store global:** comunicação por **eventos `window`** (`lifinity-user-updated`, `lifinity-chat-read`) e estado em `localStorage`. Tema "clay/escuro" em `index.css` (variáveis `--lifinity-*`).
