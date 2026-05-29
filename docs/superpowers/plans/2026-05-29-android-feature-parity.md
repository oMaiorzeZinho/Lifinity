# Android — Paridade de funcionalidades + polish clay

> Continuação do plano `2026-05-29-android-clay-redesign.md` (esse já está concluído: 4 ecrãs principais + nav clay).
> Objetivo: criar no Android **todos** os ecrãs que já existem no backend/web mas faltavam, manter o design claymorphism e pôr o logótipo em todo o lado.

**Stack confirmada:** Java 11 + layouts XML (NÃO Kotlin/Compose). Retrofit 2.11, Gson, OkHttp logging, RecyclerView, Material. `ApiClient` base = `http://10.0.2.2:3000/api/`. Build verifica-se com o JBR do Android Studio (`C:\Program Files\Android\Android Studio\jbr`) + `gradlew :app:assembleDebug`.

**Convenções existentes a respeitar:**
- Prefs: `lifinity_prefs`, chaves `token` e `user` (JSON do User via Gson).
- Header Authorization = `"Bearer " + token`.
- Cada API: `@Header("Authorization") String authorization`.
- Modelos com getters; campos iguais ao JSON do backend (snake_case onde aplicável).

## Mapa backend -> Android

| Funcionalidade | Endpoints | Estado Android |
|---|---|---|
| Auth / Tasks / Ranking / Inspiração / Conquistas / Perfil / Settings | — | feito (clay) |
| Notificações | GET /notifications, /unread-count, PUT /:id/read, /read-all | **criar** |
| Assistente (Gemini) | GET/POST /assistant/messages | **criar** |
| Estatísticas | GET /statistics/me | **criar** |
| Amigos | GET /friends, /requests, /search, POST /request, PUT accept, DELETE | **criar** |
| Grupos | GET /groups, POST /, /join, GET members, DELETE leave/:id | **criar** |
| Chat | GET /conversations, GET/POST messages | **criar** |

## Navegação
- Bottom nav mantém 4 tabs (Atividades, Ranking, Inspiração, Perfil) + FAB.
- Sino no header de cada ecrã principal -> Notificações (badge de não lidas).
- **Perfil = hub**: linhas para Estatísticas, Amigos, Grupos, Chat, Assistente, Conquistas, Definições.

## Fases
- [x] Fase 0 — logótipo em todos os headers + login/registo + ícone da app; corrige crash do `<NestedScrollView>` em Inspiração. (commit b094be9)
- [x] Notificações (+ wiring do sino via HeaderHelper) (commit 11181a4)
- [x] Assistente (lista de bolhas + barra de input) (commit fa41aa4)
- [x] Estatísticas (cartões de resumo + gráfico de barras simples) (commit 0b2f163)
- [ ] Amigos (pedidos, lista, pesquisa+adicionar)
- [ ] Grupos (lista, criar, entrar por código, membros)
- [ ] Chat (lista de conversas + ecrã de mensagens)
- [ ] Perfil hub + polish final
- [ ] CLAUDE.md + memória + build final

Commit por fase (mensagens em PT). Trabalhar em `feature/android-ui-redesign`.
