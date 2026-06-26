# `BottomNavHelper.java` — a barra de navegação inferior

## Papel
Classe utilitária que configura a **barra inferior** (`nav_bottom.xml`) em cada ecrã principal. Faz três
coisas: liga o **FAB central** (criar tarefa), aplica o **estado ativo/inativo** a cada tab, e mostra a
**miniatura do avatar** na tab Perfil.

## `setup(activity, active)` — o ponto de entrada
```java
View fab = activity.findViewById(R.id.navFab);
if (fab != null) fab.setOnClickListener(v ->
        activity.startActivity(new Intent(activity, CreateTaskActivity.class)));
configureTab(activity, R.id.navTabTasks, ...,  Tab.TASKS, active);
configureTab(activity, R.id.navTabCommunity, ..., Tab.COMMUNITY, active);
configureTab(activity, R.id.navTabInspiration, ..., Tab.INSPIRATION, active);
configureTab(activity, R.id.navTabProfile, ..., Tab.PROFILE, active);
loadProfileAvatar(activity);
```
- Recebe a Activity e qual a **tab ativa** (um `enum Tab { TASKS, COMMUNITY, INSPIRATION, PROFILE }`).
- O **FAB** (botão "+" central) abre sempre o `CreateTaskActivity`. É tratado como `View` genérica — por
  isso o "+" pode ser um `ImageView` (ver doc do FAB).
- Configura as 4 tabs e carrega o avatar.

## `configureTab(...)` — ativa vs inativa
```java
boolean isActive = tab == active;
int color = getColor(isActive ? lifinity_primary : lifinity_text_secondary);
tabView.setBackground(isActive ? bg_nav_item_active : null);     // pílula menta só na ativa
if (icon instanceof ImageView) ((ImageView) icon).setColorFilter(color);  // recolore o ícone vetorial
if (label instanceof TextView) ((TextView) label).setTextColor(color);    // recolore o rótulo
if (!isActive) tabView.setOnClickListener(v -> navigate(activity, tab));
else           tabView.setOnClickListener(null);   // a tab ativa não navega para si própria
```
- A tab **ativa** ganha um **fundo de pílula** e fica **verde** (ícone + rótulo); as inativas ficam cinza e
  **clicáveis** (navegam). A ativa tem o clique **a `null`** (não faz sentido reabrir o próprio ecrã).
- **`setColorFilter`** pinta o **vector drawable** do ícone com a cor do estado — substitui o antigo
  `setTextColor` de quando os ícones eram texto/emoji.

## `loadProfileAvatar(...)` — foto real na tab Perfil
```java
ImageView avatar = activity.findViewById(R.id.navTabProfileAvatar);
AvatarLoader.load(avatar, savedAvatarPath(activity), null, null);
```
- Mostra a **miniatura** da foto de perfil na tab Perfil (lendo o avatar guardado nas `SharedPreferences`
  via `savedAvatarPath`). Sem foto, a `ImageView` fica `GONE` e aparece o ícone "person" por baixo (ver
  [`AvatarLoader`](utils/_UTILS_IMAGENS.md)).

## `navigate(from, target)` — saltar entre tabs
```java
Intent i = new Intent(from, dest);   // dest = Tasks/Community/Inspiration/Profile
i.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
from.startActivity(i);
```
- **`REORDER_TO_FRONT`** — se o ecrã de destino **já existir** na pilha, **trá-lo para a frente** em vez de
  criar outro. Assim, alternar entre tabs **não empilha** dezenas de cópias (e mantém o estado de cada
  ecrã). É a escolha certa para uma barra de navegação.

## Ligações
- **Layout:** `nav_bottom.xml` (incluído no fundo de cada ecrã principal).
- **Companheiro:** [`HeaderHelper`](HeaderHelper.java.md) (sino do topo).
- **FAB/ícones:** ver os docs de melhorias do FAB e da barra (em "Melhorias por data").
