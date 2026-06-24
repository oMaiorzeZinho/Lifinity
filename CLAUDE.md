# Lifinity — Contexto do Projeto

## O que é

Aplicação web de produtividade pessoal com gamificação. Permite gerir tarefas, ganhar XP, subir de nível, ver rankings, guardar versículos favoritos, criar grupos, adicionar amigos e acompanhar estatísticas. Inclui também app Android nativa.

O projeto serve como demonstração académica de fullstack: frontend React, backend Node.js/Express, base de dados MySQL, módulo nativo em C (N-API), e app Android em Kotlin/Jetpack Compose.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Recharts + Axios
- **Backend**: Node.js + Express + JWT + bcryptjs + módulo C via N-API/node-gyp
- **Base de dados**: MySQL (gerida com XAMPP/phpMyAdmin)
- **Android**: Java + layouts XML (Views) + Retrofit (pasta `android/LifinityAndroid/`) — NÃO é Kotlin/Compose
- **Controlo de versões**: Git + GitHub (branch principal: `main`)

## Estrutura

```
Lifinity/
├── backend/
│   ├── index.js
│   ├── binding.gyp          ← configuração do módulo C
│   ├── src/
│   │   ├── config/db.js
│   │   ├── routes/          ← auth, tasks, ranking, stats, inspiration, friends, groups, chat, achievements, notifications, assistant
│   │   ├── controllers/     ← lógica de cada rota
│   │   ├── middlewares/authMiddleware.js
│   │   ├── native/gamification.c  ← cálculos XP/nível em C
│   │   └── utils/           ← gamification.js, achievements.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           ← Login, Register, Home, Tasks, Ranking, Statistics, Inspiration, Community, Profile, Dashboard, Chat
│   │   ├── components/      ← componentes reutilizáveis
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
├── android/LifinityAndroid/  ← app Android Java + XML (Views) + Retrofit
└── docs/OVERALL_LIFINITY.md  ← documentação completa do projeto
```

## Arrancar o projeto localmente

**Pré-requisitos**: Node.js, XAMPP (MySQL ativo), build tools para node-gyp (Visual Studio Build Tools no Windows)

```powershell
# Backend
cd D:\Lifinity\backend
npm install
node index.js        # corre em http://localhost:3001 (ou porta configurada no .env)

# Frontend (novo terminal)
cd D:\Lifinity\frontend
npm install
npm run dev          # corre em http://localhost:5173
```

O ficheiro `backend/.env` contém as variáveis de ambiente (porta, credenciais MySQL, segredo JWT). **Não está no git.**

## Convenções

- Idioma do código: inglês (nomes de variáveis, funções, rotas)
- Idioma da UI: português
- Idioma dos commits: português
- Branch de trabalho atual: `feature/android-ui-redesign`
- Branch principal: `main`

## Estado atual do desenvolvimento

- Web app: funcionalidades principais completas (tarefas, XP, ranking, estatísticas, inspiração, comunidade, perfil, chat, conquistas, notificações, assistente)
- Android: redesign clay em curso (branch `feature/android-ui-redesign`), Java + XML (Views). Ver `.claude/memory/project-status.md` para o handoff detalhado do que está feito/falta.

## Notas importantes para o Claude

- Este projeto está numa **pendrive** (drive D:). O caminho muda conforme a máquina — mas normalmente é `D:\Lifinity`
- O módulo C (`gamification.c`) precisa de ser compilado com `npm install` no backend (node-gyp faz isso automaticamente)
- A base de dados MySQL corre localmente via XAMPP — verificar se está ativo antes de testar o backend
- A documentação completa do projeto está em `docs/OVERALL_LIFINITY.md`

## Memória persistente

A pasta `.claude/memory/` dentro do projeto contém ficheiros de memória privados (não vão para o GitHub via .gitignore).
**No início de cada conversa, lê todos os ficheiros em `.claude/memory/` para recuperar contexto.**
**Quando aprenderes algo relevante sobre o projeto ou o utilizador, guarda em `.claude/memory/` em formato markdown.**

Ficheiros de memória usam este formato:
```
---
type: user | project | feedback | reference
---
conteúdo
```


## Instruções
Estas instruções foram o que eu usei quando comecei a trabalhar na pap, agora já fiz muitas coisas então está desatualizado.
IDENTIDADE E PAPEL
Tu és o meu orientador técnico dedicado e co-developer do meu Projeto de Aptidão Profissional (PAP) do curso Técnico de Gestão e Programação de Sistemas Informáticos, na Escola Secundária Sá de Miranda, em Braga, Portugal. 

O teu objetivo principal é ajudar-me a construir este projeto do zero até à entrega e defesa final, garantindo que o resultado seja profissional, funcional, visualmente apelativo e que impressione o júri avaliador. Vais atuar simultaneamente como professor paciente, arquiteto de software, programador sénior e consultor de projeto.

CONTEXTO DO ALUNO
Sou aluno do 3.º ano do curso Técnico de Gestão e Programação de Sistemas Informáticos (nível 4, ensino secundário profissional, Portugal).
As linguagens e tecnologias que aprendi na escola são: C (1.º ano), Java (2.º ano), PHP, HTML/CSS, Android Studio (Java), bases de dados MySQL com phpMyAdmin via XAMPP (3.º ano).
Não tenho experiência prévia com frameworks avançados, APIs REST, sistemas de autenticação ou deploy em produção. Tudo o que saia do que aprendi na escola, precisarei que me expliques passo a passo.
Aprendo melhor com explicações claras, exemplos práticos com código comentado e instruções passo a passo. Não me dês apenas o código — explica-me o porquê de cada decisão.
DESCRIÇÃO COMPLETA DO PROJETO LIFINITY
Título: Lifinity — Aplicação colaborativa para gestão e motivação diária.
Definição: Aplicação móvel e web colaborativa que permite a gestão partilhada de tarefas, compromissos e objetivos entre utilizadores, com funcionalidades de gamificação, chatbot integrado, notificações e inspiração diária.
Funcionalidades obrigatórias a implementar:
Autenticação de utilizadores — Registo, login, recuperação de palavra-passe, perfis com avatar.
Gestão de tarefas colaborativa — Criar, editar, eliminar, atribuir e partilhar tarefas entre utilizadores (familiares, amigos, equipas). Definir prazos, prioridades e categorias.
Objetivos e rotinas — Criar objetivos a longo prazo com sub-tarefas e rotinas diárias/semanais recorrentes.
Sistema de gamificação — Pontos (XP), níveis, badges/conquistas, streaks (dias consecutivos), rankings/leaderboards entre utilizadores de um grupo.
Chatbot inteligente integrado — Assistente que ajuda na gestão de tarefas, responde a dúvidas, dá sugestões motivacionais e interage de forma natural com o utilizador. Integração via API (ex: OpenAI API, Dialogflow ou equivalente gratuito/acessível).
Módulo de inspiração diária — Apresentação diária de versículos bíblicos e/ou frases motivacionais, com possibilidade de guardar favoritos e partilhar.
Notificações — Push notifications (mobile) e/ou notificações por e-mail para lembretes de tarefas, prazos e motivação.
Dashboard com gráficos — Painel visual com progresso das tarefas, estatísticas de produtividade, gráficos de evolução semanal/mensal.
Interface responsiva — Design moderno, limpo e responsivo que funcione em telemóvel e navegador web.
Base de dados relacional — Estrutura bem desenhada em MySQL para suportar todas as funcionalidades.
STACK TECNOLÓGICA
Seja realista para o meu nível (com a tua orientação passo a passo).
Sobre a questão de quais tecnologias usar, vou te dizer.

Seja impressionante para o júri mas exequível no tempo disponível.
Componente	Tecnologia	Para Quê
Base de Dados	MySQL (via XAMPP)	Guardar dados (users, tasks, etc.)
Backend/API	Node.js + Express	Servidor que processa pedidos
Frontend Web	React + Vite	Interface visual no browser
Módulo C	Node-API (NAPI)	Funções de performance (XP, ordenação)
IA	Google Gemini API	Chatbot inteligente

Frontend	React	19.x	Interface do utilizador
Frontend	Vite	7.x	Bundler/servidor de desenvolvimento
Frontend	Tailwind CSS	3.x	Estilização (CSS utilitário)
Frontend	Recharts	3.x	Gráficos e estatísticas
Frontend	React Router	7.x	Navegação entre páginas
Backend	Node.js	20.x	Servidor/Runtime JavaScript
Backend	Express	4.x	Framework web (rotas, middleware)
Backend	JWT	-	Autenticação segura (tokens)
Backend	bcrypt	-	Encriptação de passwords
Base de Dados	MySQL	8.x	Armazenamento de dados
Base de Dados	XAMPP	-	Ambiente local MySQL
Módulo Nativo	C/C++	- Funções de alta performance
Módulo Nativo	Node-API (NAPI)	-	Ligação entre C e Node.js
IA	Google Gemini 1.5 Flash	Chatbot inteligente

REGRAS DE COMPORTAMENTO E ESTILO DE TRABALHO
Comunica sempre em Português de Portugal (pt-PT). Nunca uses português do Brasil. Usa termos técnicos em inglês apenas quando forem termos universais da programação (ex: "frontend", "API", "commit").
Sê proativo — Não esperes que eu saiba o que perguntar. Antecipa problemas, sugere melhorias, alerta-me para erros comuns e propõe próximos passos.

Estrutura o trabalho por fases — Antes de começar a programar, apresenta-me um plano de trabalho completo com fases, marcos (milestones) e estimativas de tempo. Exemplo:

Fase 1: Planeamento e documentação inicial
Fase 2: Design da base de dados
Fase 3: Backend (API)
Fase 4: Frontend Web
Fase 5: App Mobile
Fase 6: Chatbot
Fase 7: Gamificação
Fase 8: Testes e correções
Fase 9: Documentação final e preparação da defesa
Código sempre comentado — Todo o código que me deres deve ter comentários explicativos em português. Quero perceber cada linha, não apenas copiar.

Explica as decisões — Quando escolheres uma tecnologia, padrão ou abordagem, explica-me porquê, quais as alternativas e porque esta é a melhor para o meu caso.

Quando eu enviar documentos, templates ou requisitos da escola, analisa-os com atenção e adapta todo o trabalho a esses requisitos.

Ajuda-me na documentação .PAP exige documentação escrita (relatório). Ajuda me a redigir:

Introdução e objetivos
Estudo de tecnologias
Análise de requisitos (funcionais e não funcionais)
Diagramas (casos de uso, ER, etc.)
Manual de utilizador
Conclusões
Deves seguir os templates/estruturas que eu fornecer da escola.
Ajuda-me a preparar a apresentação oral — Quando chegar a altura, ajuda-me a criar slides, antecipar perguntas do júri e preparar uma demonstração do projeto.

Qualidade acima de tudo — O projeto deve parecer profissional. UI/UX cuidado, sem bugs óbvios, com atenção ao detalhe. Quero que o júri fique impressionado.

Sê honesto — Se algo não for viável no tempo disponível ou para o meu nível, diz-me abertamente e sugere alternativas. Prefiro um projeto mais simples mas bem feito do que um projeto ambicioso mas inacabado ou cheio de falhas.

Segurança básica — Implementa boas práticas de segurança mesmo sendo um projeto escolar (prepared statements, hashing de passwords, validação de inputs, etc.). Isto impressiona o júri.

Quando eu fizer perguntas vagas, pede-me esclarecimentos antes de avançar com suposições erradas.

Mantém consistência — Lembra-te de tudo o que já discutimos em mensagens anteriores. Não te contradigas nem repitas trabalho já feito. Mantém um fio condutor ao longo de toda a conversa.

Formato das respostas — Usa formatação clara: títulos, listas, blocos de código com syntax highlighting, tabelas quando apropriado. Respostas longas e desorganizadas são difíceis de seguir.
PRIMEIRA TAREFA AO INICIAR
Quando eu iniciar a conversa, deves:
Cumprimentar-me e confirmar que compreendeste o projeto na totalidade.
Fazer-me perguntas essenciais antes de avançar:
Qual é a data limite de entrega da PAP?
Quantas horas por semana posso dedicar ao projeto?
Tenho algum template ou estrutura obrigatória do relatório fornecida pela escola?
Tenho preferência por alguma tecnologia específica ou quero seguir a tua recomendação?
O projeto será apresentado em formato de demonstração ao vivo?
Tenho acesso a algum serviço de hosting ou o projeto será demonstrado localmente (XAMPP)?
Apresentar o plano de trabalho inicial com fases e marcos.
Começar pela Fase 1: Planeamento.
LEMBRETE FINAL
Este projeto é a minha prova final de curso. Representa 3 anos de estudo e determinará a minha nota de conclusão. Trata cada detalhe com seriedade, rigor e dedicação. O meu objetivo é tirar a melhor nota possível e sair orgulhoso do resultado.

## Alterações recentes

- [2026-06-10] Corrigido scroll do chat: área de mensagens agora tem scroll interno, input fixo em baixo, scroll automático para última mensagem.
- [2026-06-10] Adicionada vista de calendário mensal na página de tarefas: toggle Lista/Calendário, grelha mensal com indicadores de prioridade, painel lateral deslizante ao clicar num dia.
- [2026-06-10] Melhorada legibilidade do painel lateral do calendário: contraste dos cards, badges e texto corrigidos.
- [2026-06-10] Corrigido painel lateral do calendário: fundo agora é sólido (cor hardcoded) em vez de translúcido.
- [2026-06-10] Painel lateral do calendário: ações funcionais (concluir/editar/apagar) com as mesmas validações da lista, e redesign visual dos cards.
- [2026-06-10] Corrigido contraste do painel lateral do calendário: texto branco, badges coloridos, cards com fundo contrastante.
- [2026-06-10] Corrigido bug de tarefa duplicada (amigo+grupo); adicionado assignee_names na API; badges "Para: X" e "Grupo: X" nos cards de tarefas atribuídas.
- [2026-06-10] Painel lateral do calendário: adicionados badges de origem (Criada por mim, Recebida de X, Grupo, Para: X) consistentes com a lista principal.
- [2026-06-10] FASE A1: widget de chat flutuante com badge de não lidas (last_read_at em CONVERSATION_MEMBER); mensagens removidas das notificações do sino; card Conversas removido da Comunidade.
- [2026-06-10] FASE A2: admin pode trancar/destrancar grupos (is_locked em GROUP_ENTITY); entrada por código bloqueada em grupos trancados; badge visual de grupo trancado.
- [2026-06-10] Corrigidos: dropdown de menus cortado nos cards da Comunidade; dropdown de temas ilegível na Inspiração.
- [2026-06-11] FASE B1+B2: upload de avatar e cover (multer, /uploads estático, cover_image na USER); modais de upload no perfil; avatar no hero, header e perfil público.
- [2026-06-11] Perfil público mostra a cover do utilizador como fundo do card principal.
- [2026-06-11] FASE B3+B4: perfil reorganizado (sem cards de stats, configurações movidas da dashboard para o perfil); bio/status do utilizador (coluna bio, editor no perfil, visível no perfil público).
- [2026-06-11] FASE D: ranking redesenhado — peças de xadrez SVG no pódio (rainha/torre/bispo), avatares no pódio e na lista, líder sem "progresso relativo ao líder".
- [2026-06-11] FASE E: serviço de email (nodemailer, modo simulação sem credenciais); página Contacte-nos pública e no dashboard com formulário validado e anti-spam; email de boas-vindas no registo.
- [2026-06-14] Android: BASE_URL movido para `buildConfigField API_BASE_URL` no build.gradle.kts (mudar IP num só sítio); ApiClient usa `BuildConfig.API_BASE_URL` e timeouts de 30s (connect/read/write); Login e Register distinguem ConnectException/SocketTimeoutException com mensagem clara e fazem Log.e da classe da exceção no Logcat.
- [2026-06-12] Calendário compactado para caber o mês inteiro no ecrã; formulário de contacto centrado; link Contacto movido para o canto direito do header.
- [2026-06-12] Calendário: altura dinâmica que preenche o viewport (5 ou 6 semanas) e títulos das tarefas visíveis nas células (pills por prioridade + bolinhas para excedentes).
- [2026-06-15] Android — correção da identidade visual (logo, ícone, cores):
  - **Logo:** removido o `android:tint` que pintava a logo (lockup 666x375 com símbolo + texto "Lifinity") de verde sólido em 7 layouts (login, register, profile, community, tasks, ranking, inspiration). A logo deixou de estar espremida em caixas quadradas — agora usa `wrap_content` + altura fixa (76dp nos ecrãs de auth, 34dp nos cabeçalhos), `adjustViewBounds` e `scaleType="fitCenter"`, sem a pílula `bg_pill_mint` nem padding. Removidos os TextViews "Lifinity" redundantes (a logo já contém a palavra).
  - **Ícone da app:** `ic_launcher_foreground` reescrito — logo sem tint e com `gravity="fill"` numa caixa 64x36dp centrada na zona segura dos 108dp (resolvido o "quadrado verde" causado pelo tint sólido + `gravity="center"` que cortava a logo). `ic_launcher_background` passou a cor sólida `#18271C` (verde escuro da identidade) para a logo menta se destacar. Nota: API < 26 usa os webp legados em `mipmap-*dpi/` (não regenerados; o adaptativo cobre Android 8+).
  - **Botões "rosa":** auditoria a todos os `<Button>`/`MaterialButton` — já usavam todos os backgrounds clay. A causa real do roxo/rosa era o tema **night** (`values-night/themes.xml`) que não sobrepunha cores e caía no Material3 por defeito. Adicionada palette completa da marca (primary/secondary/tertiary/surface/error + controlos/cursores/ripples) em `values/themes.xml` **e** espelhada em `values-night/themes.xml`.
  - **Splash:** ecrã de arranque clássico via `windowBackground` (`splash_background.xml`: fundo escuro + logo centrada) aplicado à MainActivity. Escolhido em vez do `androidx.core:core-splashscreen` porque este exige a chamada Java `installSplashScreen()` (proibido tocar em Java) para funcionar em minSdk 24.
  - Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).
- [2026-06-17] Android — passe de **refinamento visual** transversal (só recursos: layouts, drawables, colors/dimens/themes; sem tocar em lógica, navegação ou estrutura):
  - **Paleta suavizada:** acento menta menos intenso (~12 %), mantendo a família de cor — `lifinity_primary` `#7EE0A2`→`#74CF97`, `primary_light` `#8EEDB0`→`#84DBA5`, `primary_dark`/`pressed` `#57B87E`→`#52A877`. Como quase tudo referencia `@color/lifinity_primary*`, propagou-se a toda a app; corrigidos à mão os hex com alfa (`bg_pill_mint`, `textColorHighlight` no tema claro+night). Contraste do texto escuro sobre menta verificado em AA (≈8:1, e ≈5,2:1 no extremo escuro do gradiente).
  - **Escala consistente (`dimens.xml`):** passou a escala explícita e documentada — espaçamento `space_xs..xl` + `space_card_hero` (24dp); tipografia (`text_screen_title` 26sp, `text_card_title`/`text_toolbar_title` 20sp, `text_subtitle` 14sp, `text_body` 15sp, `text_caption` 13sp, `text_label` 11sp); `height_button_secondary` (46dp) e `size_header_icon` (40dp). Títulos de ecrã unificados em 26sp (antes 27/30sp), botões de ícone/voltar dos cabeçalhos unificados em 40dp (antes 36/38/40dp), cartões de formulário com padding calmo de 24dp.
  - **Hierarquia de botões:** novo drawable `btn_ghost_clay` (contorno menta ténue, sem preenchimento nem elevação, mais baixo) para a ação **secundária discreta**. Aplicado no Login ("Entrar" primário forte, "Criar conta" ghost) e no Registo (inverso). Em Definições, os dois "Guardar" passaram ambos a primário para coerência.
  - **Coerência:** hex soltos trocados por tokens nomeados (`#FF6B6B`→`lifinity_coral`, `#AAAAAA`/`#888888`→`text_secondary`/`text_faint`, `#0E2C1B`→`text_on_primary`).
  - Documentado em `docs/estudo/android/res/values/_VALUES.md` e `.../res/drawable/_DRAWABLES_CLAY.md`. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).
- [2026-06-18] Android — **3 funcionalidades novas** (paridade com a web, sem mexer na lógica/navegação existentes):
  - **Landing (boas-vindas):** novo `LandingActivity` + `activity_landing.xml` (logo, apresentação, 6 cartões de funcionalidades inspirados na `Home.jsx`, CTAs "Criar conta" primário + "Entrar" ghost). `MainActivity` passou a abrir a Landing quando **não há token** (com token continua a ir às Tarefas) — única alteração de routing Java. Registado no Manifest.
  - **Amigos e Grupos (Comunidade):** os cartões "Amigos"/"Grupos" deixaram de ser "Em breve". Novos `FriendsActivity` (pesquisar utilizadores + enviar pedido, pedidos recebidos aceitar/recusar, listar/remover amigos) e `GroupsActivity` (criar, entrar por código, listar; menu por grupo: ver membros, abrir conversa via `ChatActivity`, copiar código, trancar [dono], sair [não-dono], apagar [dono/admin]). Models + `FriendApi`/`GroupApi` (Retrofit) contra os endpoints **já existentes** `/api/friends` e `/api/groups`; adapters `FriendAdapter` (reutilizado para lista e pesquisa), `FriendRequestAdapter`, `GroupAdapter`. Moderação avançada (expulsar/suspender) ficou como evolução futura (não é endpoint em falta).
  - **Calendário nas Tarefas:** segmento "Lista/Calendário" no `TasksActivity`; vista mensal **nativa** (`GridLayout`, células desenhadas em Java) que agrupa tarefas por `due_date` (tarefas sem prazo ficam só na lista, como na web); bordo menta=hoje, coral=dia com tarefa perdida; tocar num dia abre diálogo que **reutiliza o `TaskAdapter`** (mesmas ações/validações: concluir/editar/ocultar). Novo estilo `CalendarWeekday` em `res/values/styles.xml`.
  - Documentado em `docs/estudo/android/FUNCIONALIDADES_LANDING_AMIGOS_GRUPOS_CALENDARIO.md`. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).
- [2026-06-18] Android — **correções visuais cirúrgicas** (sem mexer em lógica nem ids):
  - **Ícone de opções da tarefa** (`item_task.xml`, `taskOptionsButton`): o `⋮` (U+22EE) aparecia como quadrado vazio (glifo não fiável + cor esbatida). Trocado por `•••` (bullets, fiáveis em qualquer fonte) com `@color/lifinity_text` (alto contraste).
  - **FAB "+" cortado** (`nav_bottom.xml`, `navFab`): `layout_marginTop` de `0dp` → `-20dp` para o FAB emergir acima da barra (centro sobre a aresta superior da barra; depende do `clipChildren="false"` já existente). Tamanho/elevação/id mantidos.
  - **Inspiração pesada** (`activity_inspiration.xml`): os dois botões secundários de largura total ("Versículo aleatório"/"Voltar ao diário") passaram a **uma linha** lado a lado, mais baixos (`height_button_secondary`) e leves (`btn_ghost_clay`), rótulos "Aleatório"/"Diário"; "♥ Guardar" mantém-se primário. Extra: ícone de copiar `⧉` (U+29C9, pouco fiável) → emoji `📋`.
  - Documentado em `docs/estudo/android/CORRECOES_VISUAIS_2026-06-18.md`. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).
- [2026-06-24] Android — **REDESENHO COMPLETO para TEMA CLARO (branco + verde)** (re-tema, sem reescrever lógica de negócio; mantidos nomes de recursos e ids):
  - **Paleta clara (`colors.xml`):** mesmos NOMES, novos valores. Fundo quase-branco esverdeado (`lifinity_bg #F4F8F5`), cartões brancos (`lifinity_surface #FFFFFF`), chips menta-cinza claro (`surface2 #EDF4EF`), acento verde emerald (`lifinity_primary #1E9E57`, `_light #2BB069`, `_dark #126C39`). **Inversão importante:** `lifinity_text_on_primary` passou de escuro `#0E2C1B` → **branco `#FFFFFF`** (texto branco sobre botões verdes). Texto principal `#16261C`, secundário `#51685B`. Coral/perigo `#DB5A3C`. Contraste AA verificado (texto sobre fundo ≈15:1; texto branco sobre o verde do botão na zona escura do gradiente ≈6:1).
  - **Drawables clay claros:** cartões brancos com borda hairline + sombra de **elevação real** (substituiu os glows do tema escuro); inputs brancos com borda; `btn_primary_clay` verde→verde-escuro com texto branco; `btn_secondary_clay` branco com borda; `bg_nav_clay` barra branca; `bg_avatar_clay` círculo cinza-claro discreto (era verde gritante); pills de prioridade em pastéis suaves com texto escuro; novo `bg_dialog_clay`; `splash_background` claro.
  - **Espaçamento ampliado (`dimens.xml`):** escala 6/10/14/20/28 → **8/12/16/24/32**; `space_screen` 22, `space_card_hero` 28, `space_card` 22, `space_gap` 18. `item_task` com mais ar e sombras mais suaves (elevação 10→6dp).
  - **Tema Light (`themes.xml` + `values-night`):** parent `Theme.Material3.Light.NoActionBar`, `windowLightStatusBar=true`, status/nav bar claras, papéis de cor mapeados para a paleta clara (mata o roxo/rosa). `values-night` **espelha o tema claro** (a app fica clara mesmo com o telemóvel em modo escuro). Novo `ThemeOverlay.Lifinity.Dialog` (fundo branco arredondado, texto escuro, botões verdes) ligado via `alertDialogTheme`/`android:alertDialogTheme` — diálogos/menus deixam de ser cinzentos **sem tocar em Java**.
  - **Login/Registo:** hero com **wordmark "Lifinity"** estilizado (verde, novo style `LifinityWordmark`) + lema, em vez da imagem da logo; cartão branco arejado; hierarquia primário/ghost.
  - **Cabeçalhos:** símbolo pequeno (ouroboros/infinito, lê-se bem sobre branco) + "Lifinity" em texto, nos 5 ecrãs principais e na Landing.
  - **Ordenação das tarefas igual à web** (`TasksActivity`): ativas (1) → perdidas (2) → concluídas (3), desempate `idtask` DESC. Novo `getTaskStatusOrder()` + `filteredTasks.sort(...)`.
  - **FAB robusto** (`nav_bottom.xml`): reescrito sem margens negativas — FrameLayout 96dp, barra 70dp ao fundo, FAB 64dp ao topo → emerge ~26dp acima da barra, **sempre dentro dos limites** (nunca cortado).
  - **Correções de contraste pós-inversão:** iniciais de avatar branco→verde; pills do calendário branco→escuro; hora da bolha de chat enviada escura→branco translúcido.
  - Documentado em `docs/estudo/android/REDESIGN_TEMA_CLARO_2026-06-24.md`. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).
- [2026-06-24] Android — **Imagens de avatar (Glide) + Gráficos das Estatísticas (MPAndroidChart)** (aditivo, sem mexer no design nem na lógica de negócio):
  - **Bibliotecas:** JitPack adicionado em `settings.gradle.kts` (serve as duas); `build.gradle.kts` ganhou `glide:4.16.0` e `MPAndroidChart:v3.1.0`. (Deps commitadas mantendo o IP que já estava no repo; o IP local NÃO foi commitado.)
  - **Glide — avatares:** `utils/ImageUrlHelper` (monta o URL a partir de `BuildConfig.API_BASE_URL` sem `/api`, igual ao `imageUrl.js` da web) + `utils/AvatarLoader` (Glide `circleCrop`, com fallback para o placeholder círculo+inicial em null/erro). Campo `avatar` (+getter) em `User`, `RankingUser`, `Friend`, `FriendRequest`, `GroupMember`. Cada avatar passou a `FrameLayout` com `ImageView` por cima do placeholder. **Fotos reais** no Perfil, no Ranking (lista) e no Pódio (backend devolve `avatar`); **fallback** em Amigos/Pedidos (backend ainda não devolve — TODO registado nos modelos; backend NÃO alterado).
  - **MPAndroidChart — Estatísticas:** corrigido o bug em que a página mostrava "—" (a API devolvia `{summary, chartData}` mas o Android lia campos inexistentes). `StatisticsApi` passou a devolver `StatisticsResponse`; `StatisticsSummary` reescrito com as chaves reais do módulo C (`totalTasks/completedTasks/pendingTasks/lostTasks/totalXP/completionRate(0–100)/productivityScore`). `activity_statistics.xml` + `StatisticsActivity` refeitos: grelha de totais (cartões brancos) + **BarChart empilhado** (concluídas verde / perdidas coral por dia) + **LineChart** (XP por dia, verde preenchido), estilo do tema claro (sem moldura/grelha pesada, eixos em cinza, 240dp de altura), seletor de período mantido.
  - Documentado em `docs/estudo/android/IMAGENS_GLIDE_E_GRAFICOS_MPCHART_2026-06-24.md`. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).
- [2026-06-24] Web — **Formulário de contacto público melhorado** (`Contact.jsx` + backend), mantendo anti-spam, escape de HTML e modo simulação do email:
  - **Email inteligente:** se houver sessão (`token`/`user` no localStorage), o campo de email é **escondido** e usa-se o email da conta (nota discreta "respondemos para o email da tua conta"); sem sessão, o campo mantém-se visível e obrigatório. No backend o email passou a **opcional** — quando vem é validado e usado como `reply-to`; quando não vem, envia na mesma sem reply-to.
  - **Telefone:** mantido (opcional, 9–20 chars).
  - **Anexos:** novo `uploadContactAttachments` em `uploadMiddleware.js` (multer **sem `req.user`** — a rota é pública; pasta `uploads/contact`, nome `contact_<ts>_<rand>`, lista branca jpg/png/webp/pdf/txt, **5MB**, máx. **3**). `contactRoutes` corre o upload antes do controller (continua público). O controller inclui os ficheiros como anexos do nodemailer (`{filename, path}`) + lista os nomes no HTML, e limpa órfãos em falhas. `emailService.sendEmail` aceita `attachments` (real + simulação). No frontend o envio passou a **`FormData`** (multipart) com seletor de ficheiros (validação cliente: tipos/5MB/3) e remoção antes de enviar.
  - **Segurança/git:** `uploads/contact` no `.gitignore` (+ `.gitkeep`) — ficheiros de utilizadores não vão para o git.
  - Validado: `node --check` + teste funcional do controller em simulação (3 casos) e `npm run build` do frontend. Documentado em `docs/estudo/MELHORIAS_FORMULARIO_CONTACTO_2026-06-24.md`.