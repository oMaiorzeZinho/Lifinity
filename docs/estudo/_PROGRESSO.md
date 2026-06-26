# Progresso da documentação de estudo — Lifinity

> Este ficheiro regista o que já foi documentado em `docs/estudo/`. Serve para **retomar exatamente onde parámos** se a sessão for interrompida.
>
> **Método:** um ficheiro de código de cada vez → escrever a explicação em `docs/estudo/<caminho-espelhado>.md` → gravar → marcar `[x]` aqui → passar ao próximo.

## ⏩ PRÓXIMO FICHEIRO A DOCUMENTAR

➡️ Frontend páginas: feitas `Login`, `Register`, `Contact`, `Dashboard`. **Próximo: `Tasks.jsx`** (a maior — vista lista+calendário, filtros, secções), depois `Ranking`, `Statistics`, `Inspiration`, `Community`, `Profile`, `Chat`, `Home`. Falta ainda `eslint.config.js` e `index.css` (tema). **Depois: toda a app Android** (config, ApiClient, api/*, models/*, activities, adapters, layouts). (Partes 2 e 3 — commits e índice — já ✅.)

---

## Legenda
- `[x]` — documentado e gravado
- `[ ]` — por fazer
- `[~]` — parcialmente feito (ver nota)

## Decisões de âmbito (o que se documenta e o que se ignora)
- **Documenta-se:** `.sql`, `.js`, `.jsx`, `.c`, `.java`, `.xml` de *layout*, `AndroidManifest.xml`, e configs relevantes (`package.json`, `binding.gyp`, `vite.config.js`, `tailwind.config.js`, `build.gradle.kts`, `libs.versions.toml`, etc.).
- **Ignora-se (não é código a estudar):** `package-lock.json` (gerado automaticamente), imagens (`.png/.jpg/.webp/.svg`), `.pptx/.docx/.drawio`, ícones launcher, `gradle-wrapper.jar`, `gradlew`/`gradlew.bat`, ficheiros `.idea/`, `.gitignore`, `.gitkeep`, `proguard-rules.pro`.
- **Android — agrupamentos:** os ~26 *drawables* clay (`res/drawable/bg_*.xml`, `btn_*.xml`) são explicados **em conjunto** num único ficheiro de padrão (`android/res/drawable/_DRAWABLES_CLAY.md`), pois repetem a mesma técnica. Os ficheiros `res/values/` (`colors`, `dimens`, `strings`, `themes`) são explicados em conjunto. Os *layouts* `res/layout/*.xml` são documentados individualmente (são os "principais").

---

## PARTE 1 — Explicação do código

### Base de Dados (1)
- [x] `docs/base_dados/estrutura_lifinity.sql`

### Backend — config e infraestrutura (9)
- [x] `backend/package.json`
- [x] `backend/binding.gyp`
- [x] `backend/src/config/db.js`
- [x] `backend/src/middlewares/authMiddleware.js`
- [x] `backend/src/middlewares/uploadMiddleware.js`
- [x] `backend/src/services/emailService.js`
- [x] `backend/src/utils/gamification.js`
- [x] `backend/src/utils/achievements.js`
- [x] `backend/index.js`

### Backend — rotas (12 — não existe `rankingRoutes`; ranking = `GET /api/users/ranking`)
- [x] `backend/src/routes/authRoutes.js`
- [x] `backend/src/routes/taskRoutes.js`
- [x] `backend/src/routes/userRoutes.js`
- [x] `backend/src/routes/statisticsRoutes.js`
- [x] `backend/src/routes/inspirationRoutes.js`
- [x] `backend/src/routes/friendRoutes.js`
- [x] `backend/src/routes/groupRoutes.js`
- [x] `backend/src/routes/chatRoutes.js`
- [x] `backend/src/routes/achievementRoutes.js`
- [x] `backend/src/routes/notificationRoutes.js`
- [x] `backend/src/routes/assistantRoutes.js`
- [x] `backend/src/routes/contactRoutes.js`

### Backend — controladores (12)
- [x] `backend/src/controllers/authController.js`
- [x] `backend/src/controllers/taskController.js`
- [x] `backend/src/controllers/userController.js`
- [x] `backend/src/controllers/statisticsController.js`
- [x] `backend/src/controllers/inspirationController.js`
- [x] `backend/src/controllers/friendController.js`
- [x] `backend/src/controllers/groupController.js`
- [x] `backend/src/controllers/chatController.js`
- [x] `backend/src/controllers/achievementController.js`
- [x] `backend/src/controllers/notificationController.js`
- [x] `backend/src/controllers/assistantController.js`
- [x] `backend/src/controllers/contactController.js`

### Módulo C nativo (1)
- [x] `backend/src/native/gamification.c`

### Frontend — config (6)
- [x] `frontend/package.json`
- [x] `frontend/vite.config.js`
- [x] `frontend/tailwind.config.js`
- [x] `frontend/postcss.config.js`
- [ ] `frontend/eslint.config.js`
- [x] `frontend/index.html`

### Frontend — entrada, routing e utilitários (4)
- [x] `frontend/src/main.jsx`
- [x] `frontend/src/App.jsx`
- [ ] `frontend/src/index.css` *(grande — tema clay/escuro; deixar para o fim do frontend)*
- [x] `frontend/src/utils/imageUrl.js`

### Frontend — componentes (5) ✅
- [x] `frontend/src/components/AccountSettingsModal.jsx`
- [x] `frontend/src/components/ChatWidget.jsx`
- [x] `frontend/src/components/DailyVerseWidget.jsx`
- [x] `frontend/src/components/ImageUploadModal.jsx`
- [x] `frontend/src/components/PublicProfileModal.jsx`

### Frontend — páginas (12)
- [x] `frontend/src/pages/Login.jsx`
- [x] `frontend/src/pages/Register.jsx`
- [ ] `frontend/src/pages/Home.jsx`
- [x] `frontend/src/pages/Dashboard.jsx`
- [ ] `frontend/src/pages/Tasks.jsx`
- [ ] `frontend/src/pages/Ranking.jsx`
- [ ] `frontend/src/pages/Statistics.jsx`
- [ ] `frontend/src/pages/Inspiration.jsx`
- [ ] `frontend/src/pages/Community.jsx`
- [ ] `frontend/src/pages/Profile.jsx`
- [ ] `frontend/src/pages/Chat.jsx`
- [x] `frontend/src/pages/Contact.jsx`

### Android — config (5) ✅ — agrupados em `android/config/_CONFIG_GRADLE_MANIFEST.md`
- [x] `android/LifinityAndroid/settings.gradle.kts`
- [x] `android/LifinityAndroid/build.gradle.kts`
- [x] `android/LifinityAndroid/app/build.gradle.kts`
- [x] `android/LifinityAndroid/gradle/libs.versions.toml`
- [x] `android/LifinityAndroid/app/src/main/AndroidManifest.xml`

### Android — rede (1) ✅
- [x] `network/ApiClient.java`

### Android — interfaces API Retrofit (10) ✅
- [x] `api/AuthApi.java`
- [x] `api/TaskApi.java`
- [x] `api/UserApi.java`
- [x] `api/AccountApi.java`
- [x] `api/StatisticsApi.java`
- [x] `api/InspirationApi.java`
- [x] `api/AchievementApi.java`
- [x] `api/NotificationApi.java`
- [x] `api/ChatApi.java`
- [x] `api/AssistantApi.java`
- *(nota: `FriendApi.java` e `GroupApi.java` ficaram explicados no doc das funcionalidades Landing/Amigos/Grupos.)*

### Android — models (28) ✅ — agrupados por domínio em 4 docs sob `android/models/`
> `_MODELS_AUTH_USER.md` · `_MODELS_TASKS.md` · `_MODELS_STATS_INSPIRATION_ACHIEVEMENTS.md` · `_MODELS_NOTIFICATIONS_CHAT_ASSISTANT.md`
- [x] `models/User.java`
- [x] `models/LoginRequest.java`
- [x] `models/LoginResponse.java`
- [x] `models/RegisterRequest.java`
- [x] `models/RegisterResponse.java`
- [x] `models/Task.java`
- [x] `models/CreateTaskRequest.java`
- [x] `models/UpdateTaskRequest.java`
- [x] `models/CompleteTaskResponse.java`
- [x] `models/RankingUser.java`
- [x] `models/StatisticsResponse.java`
- [x] `models/StatisticsSummary.java`
- [x] `models/StatisticsDay.java`
- [x] `models/Verse.java`
- [x] `models/Achievement.java`
- [x] `models/Notification.java`
- [x] `models/AppNotification.java`
- [x] `models/ChatMessage.java`
- [x] `models/Conversation.java`
- [x] `models/SendChatMessageRequest.java`
- [x] `models/AssistantMessage.java`
- [x] `models/AssistantSendRequest.java`
- [x] `models/AssistantSendResponse.java`
- [x] `models/UpdateUsernameRequest.java`
- [x] `models/UpdatePasswordRequest.java`
- [x] `models/DeleteAccountRequest.java`
- *(models de amigos/grupos — `Friend`, `FriendRequest`, `Group`, `GroupMember`, `CreateGroupRequest`, `JoinGroupRequest`, `SendFriendRequest` — explicados no doc das funcionalidades Landing/Amigos/Grupos.)*

### Android — utils (2) ✅ — `android/utils/_UTILS_IMAGENS.md`
- [x] `utils/ImageUrlHelper.java`
- [x] `utils/AvatarLoader.java`

> **Nota (2026-06-18):** funcionalidades novas Landing/Amigos/Grupos/Calendário explicadas em conjunto
> em `android/FUNCIONALIDADES_LANDING_AMIGOS_GRUPOS_CALENDARIO.md` (LandingActivity, FriendsActivity,
> GroupsActivity, adapters e models de amigos/grupos, e o calendário no TasksActivity).

> **Nota (2026-06-26):** melhorias visuais à barra de navegação e ao Perfil explicadas em
> `android/MELHORIAS_NAV_E_PERFIL_2026-06-26.md` — ícones do menu como vector drawables Material
> (`ic_nav_*`), miniatura do avatar na tab Perfil, correção real do FAB ("`<include>`" com
> `wrap_content` que colapsava os 96dp → `@dimen/nav_total_height`), cabeçalho opaco e remoção da
> secção "Mais no Lifinity". Toca em `BottomNavHelper.java`, `ProfileActivity.java`, `nav_bottom.xml`
> e nos cabeçalhos/includes das telas principais.

### Android — activities e helpers (21)
- [x] `MainActivity.java` — doc completo `android/MainActivity.java.md`
- [x] `LoginActivity.java` — `android/LoginActivity.java.md` (explica os padrões comuns das activities)
- [x] `RegisterActivity.java` — `android/RegisterActivity.java.md`
- [x] `TasksActivity.java` — doc completo `android/TasksActivity.java.md` (lista + filtros + calendário)
- [x] `LandingActivity.java` *(ver nota 2026-06-18)*
- [x] `FriendsActivity.java` *(ver nota 2026-06-18)*
- [x] `GroupsActivity.java` *(ver nota 2026-06-18)*
- [x] `CreateTaskActivity.java` — `android/CreateTaskActivity.java.md`
- [x] `EditTaskActivity.java` — `android/EditTaskActivity.java.md`
- [x] `RankingActivity.java` — `android/RankingActivity.java.md`
- [x] `StatisticsActivity.java` — `android/StatisticsActivity.java.md`
- [x] `InspirationActivity.java` — `android/InspirationActivity.java.md`
- [x] `AchievementsActivity.java` — `android/AchievementsActivity.java.md`
- [x] `NotificationsActivity.java` — `android/NotificationsActivity.java.md`
- [x] `CommunityActivity.java` — `android/CommunityActivity.java.md`
- [x] `ConversationsActivity.java` — `android/ConversationsActivity.java.md`
- [x] `ChatActivity.java` — `android/ChatActivity.java.md`
- [x] `AssistantActivity.java` — `android/AssistantActivity.java.md`
- [x] `ProfileActivity.java` — `android/ProfileActivity.java.md`
- [x] `SettingsActivity.java` — `android/SettingsActivity.java.md`
- [x] `BottomNavHelper.java` — `android/BottomNavHelper.java.md`
- [x] `HeaderHelper.java` — `android/HeaderHelper.java.md`

### Android — adapters (8)
- [ ] `adapters/TaskAdapter.java`
- [ ] `adapters/RankingAdapter.java`
- [ ] `adapters/AchievementAdapter.java`
- [ ] `adapters/NotificationAdapter.java`
- [ ] `adapters/ChatMessageAdapter.java`
- [ ] `adapters/ConversationAdapter.java`
- [ ] `adapters/AssistantAdapter.java`
- [ ] `adapters/AssistantMessageAdapter.java`

### Android — layouts e recursos (agrupados)
- [ ] `res/layout/*.xml` — layouts principais (activities + items) — documentar em vários ficheiros
- [~] `res/values/` — `colors.xml`, `dimens.xml`, `themes.xml` (+ night) — feito em `docs/estudo/android/res/values/_VALUES.md` (foco no estado refinado de 2026-06-17; falta `strings.xml`)
- [~] `res/drawable/` — drawables clay (`bg_*`, `btn_*`) — padrão + `btn_ghost_clay` em `docs/estudo/android/res/drawable/_DRAWABLES_CLAY.md`

---

## PARTE 2 — Commits
- [x] `docs/estudo/_COMMITS.md` (todos os commits explicados, agrupados por 8 fases) ✅

## PARTE 3 — Índice
- [x] `docs/estudo/00_INDICE.md` (criado; atualizar à medida que se documentam páginas/Android) ✅

---

## Notas de execução
- Inventário obtido com `git ls-files` (exclui `node_modules` e binários não versionados).
- Espelhamento de caminhos: cada explicação fica em `docs/estudo/<caminho-original>.md` (ex.: `backend/src/controllers/authController.js` → `docs/estudo/backend/src/controllers/authController.js.md`).
