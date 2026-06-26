# `CommunityActivity.java` — o hub social

## Papel
Ecrã-**menu** que reúne os acessos sociais num só sítio: **Ranking**, **Conversas**, **Assistente IA**,
**Amigos** e **Grupos**. É a tab "Comunidade".

## Bloco a bloco
```java
if (TextUtils.isEmpty(getToken())) { openLoginActivity(); return; }
setContentView(R.layout.activity_community);
BottomNavHelper.setup(this, BottomNavHelper.Tab.COMMUNITY);
HeaderHelper.setupBell(this);
setupHubLinks();
```
- Guarda de sessão + barra inferior (tab Comunidade) + sino.
- **`setupHubLinks()`** liga cada **cartão** do ecrã ao respetivo destino com um `Intent`:
  ```java
  findViewById(R.id.communityRanking).setOnClickListener(v -> startActivity(new Intent(this, RankingActivity.class)));
  findViewById(R.id.communityChat).setOnClickListener(v -> startActivity(new Intent(this, ConversationsActivity.class)));
  findViewById(R.id.communityAssistant).setOnClickListener(v -> startActivity(new Intent(this, AssistantActivity.class)));
  findViewById(R.id.communityFriends).setOnClickListener(v -> startActivity(new Intent(this, FriendsActivity.class)));
  findViewById(R.id.communityGroups).setOnClickListener(v -> startActivity(new Intent(this, GroupsActivity.class)));
  ```
- É uma activity **simples** — não chama a API, só navega. É o "índice" da área social.

## Nota de estudo
O comentário do código ainda diz "(em breve) Amigos e Grupos", mas esses ecrãs **já existem** e estão
ligados (foram acrescentados em 2026-06-18). O comentário ficou desatualizado; o código real liga os 5
cartões.

## Ligações
- **Destinos:** `RankingActivity`, `ConversationsActivity`, `AssistantActivity`, `FriendsActivity`,
  `GroupsActivity`.
- **Amigos/Grupos:** ver [Landing/Amigos/Grupos](FUNCIONALIDADES_LANDING_AMIGOS_GRUPOS_CALENDARIO.md).
