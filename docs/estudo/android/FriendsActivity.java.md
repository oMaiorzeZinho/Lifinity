# `FriendsActivity.java` — amigos (pesquisar, pedidos, perfil)

## Papel
Ecrã de **Amigos**: pesquisar utilizadores e enviar pedido, ver/responder a **pedidos recebidos**
(aceitar/recusar), e **listar/remover** amigos. Réplica da secção de amigos da web (`Community.jsx`)
contra os endpoints `/api/friends`. Aberto a partir da Comunidade.

## Estrutura
- Três `RecyclerView`: resultados de pesquisa (`FriendAdapter` em modo "Adicionar"), pedidos recebidos
  (`FriendRequestAdapter`) e a lista de amigos (`FriendAdapter` em modo "•••" de opções).
- `onResume` recarrega amigos + pedidos (para refletir mudanças ao voltar de outros ecrãs).
- Cada ação (enviar/aceitar/recusar/remover) usa um `simpleCallback` genérico: `Toast` + recarregar.

## Menu "•••" do amigo (Abrir conversa / Ver perfil / Remover)
`showFriendOptions` abre um `PopupMenu` ancorado ao botão da linha, com três opções:
- **Abrir conversa** → `POST chat/conversations/private` → abre o `ChatActivity`;
- **Ver perfil** → `showFriendProfile` (ver abaixo);
- **Remover** → confirmação + `DELETE /friends/{id}`.

## `showFriendProfile` — popup de perfil rico (2026-07-01)
Antes era um `AlertDialog` simples só com "Nível X · Y XP". Agora abre o **popup rico** (como o
`PublicProfileModal` da web):
1. Infla `res/layout/dialog_friend_profile.xml` e mostra-o num `AlertDialog` (com "Fechar").
2. Preenche **já** o que temos do objeto `Friend`: nome, pill "Nível X · Y XP" (o `xp` vem do `Friend`,
   não do endpoint) e a inicial do avatar (`AvatarLoader.initialOf`).
3. Mostra o `ProgressBar` e chama `UserApi.getPublicProfile(token, iduser)`
   (`GET /users/{iduser}/public-profile`). No sucesso:
   - carrega o **avatar real** por cima do placeholder (`AvatarLoader.load`);
   - preenche até **3 conquistas em destaque** (`profile.getHighlightedBadges()`), cada uma um mini-cartão
     `bg_card_soft_clay` com "★ nome" + descrição, criados em runtime (`makeBadgeCard`).
   - Sem conquistas (lista vazia) ou em erro/`onFailure` → "Sem conquistas em destaque." (`showNoBadges`).
     **Nunca rebenta** — os dados básicos ficam sempre visíveis.

> O model é `PublicProfile` (reutiliza `Achievement` para os badges). O endpoint **já existia** no
> backend (`userController.getPublicProfile`) — não se tocou no backend.

## Ligações
- **APIs/Backend:** [`FriendApi`](api/FriendApi.java.md) (`/friends`), [`ChatApi`](api/ChatApi.java.md)
  (conversa privada), [`UserApi`](api/UserApi.java.md) (`getPublicProfile`).
- **Models:** `Friend`, `FriendRequest`, `PublicProfile` (+ `Achievement`).
- **Adapters:** [`FriendRequestAdapter`](adapters/FriendRequestAdapter.java.md) (botões aceitar/recusar,
  agora `ImageView`+vector — ver [correções 2026-07-01](CORRECOES_RESUMO_CHATBOT_PERFIL_2026-07-01.md)).
- **Layout do popup:** `res/layout/dialog_friend_profile.xml`.
