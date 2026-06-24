# Android — Redesenho para TEMA CLARO (branco + verde) — 2026-06-24

> Mudança visual **completa** da app Android: de um tema escuro (tudo verde-escuro)
> para um **tema claro elegante** com paleta **BRANCO + VERDE**, claymorphism suave e —
> a prioridade nº1 — **muito mais espaço e clareza** (o utilizador queixava-se de
> "amontoado/confuso"). É um **re-tema**: a estrutura, a navegação e toda a lógica de
> negócio mantêm-se; mudaram cores, drawables, espaçamentos, temas e alguns ajustes
> cirúrgicos de layout/Java.
>
> A app é **centralizada**: quase tudo referencia `@color/lifinity_*`, drawables clay
> partilhados e tokens de `dimens.xml`. Redefinir estes recursos centrais propagou a
> mudança a **todos os ecrãs de uma vez**.

---

## Abordagem em 2 passos

- **PASSO A — Sistema de design claro + Login.** Redefinir `colors.xml`, drawables clay,
  `dimens.xml` e `themes.xml`; deixar o **Login** impecável como referência visual.
- **PASSO B — Propagar + corrigir transversais.** Garantir coerência em todos os ecrãs,
  cabeçalhos com wordmark, ordenação das tarefas igual à web, diálogos com tema, e o FAB.

---

## 1. Paleta clara (`res/values/colors.xml`)

Mantiveram-se **exatamente os mesmos NOMES** de cor (para não partir as referências
espalhadas pelos layouts) — só mudaram os **valores**. Predominância de **branco** nas
superfícies/fundo; o **verde** aparece em botões primários, destaques, ícones e acentos.

| Token | Antes (escuro) | Depois (claro) | Papel |
|---|---|---|---|
| `lifinity_bg` | `#18271C` | `#F4F8F5` | fundo da app (quase-branco esverdeado) |
| `lifinity_bg_deep` | `#112015` | `#E7EFE9` | extremo do gradiente de fundo |
| `lifinity_surface` | `#27392D` | `#FFFFFF` | cartões (branco puro, destacam-se) |
| `lifinity_surface2` | `#2F4435` | `#EDF4EF` | chips/sub-cartões (menta-cinza claro) |
| `lifinity_inset` | `#16241A` | `#EFF5F1` | inputs, barras, células de calendário |
| `lifinity_primary` | `#74CF97` | `#1E9E57` | acento verde da marca |
| `lifinity_primary_light` | `#84DBA5` | `#2BB069` | realces / FAB |
| `lifinity_primary_dark` | `#52A877` | `#126C39` | gradientes / estado pressionado |
| `lifinity_text_on_primary` | `#0E2C1B` | `#FFFFFF` | texto **branco** sobre verde |
| `lifinity_text` | `#EEF6F0` | `#16261C` | texto principal (quase-preto esverdeado) |
| `lifinity_text_secondary` | `#92AA9B` | `#51685B` | texto secundário |
| `lifinity_text_faint` | `#6F8A78` | `#84988B` | hints / datas auxiliares |
| `lifinity_coral` / `_danger` | `#EF9B7E` | `#DB5A3C` | perigo / tarefa perdida / alertas |
| `lifinity_gold` | `#E2BD4D` | `#C8920F` | 1.º lugar / dourado (mais legível sobre branco) |
| `lifinity_border` | `#2F4435` | `#D8E6DD` | bordas subtis de inputs/chips |

### A grande inversão: texto sobre verde passa a BRANCO
No tema escuro os botões verdes levavam texto **escuro** (`#0E2C1B`). No tema claro levam
texto **branco** (`lifinity_text_on_primary = #FFFFFF`). Isto obrigou a verificar **todos**
os usos de `lifinity_text_on_primary`: estão sobre verde/coral (botões, FAB, bolhas
enviadas, badges) → branco é o correto. As exceções (texto que ficava sobre superfícies
**claras**) foram corrigidas — ver §6.

### Contraste (WCAG AA)
- **Texto principal `#16261C` sobre fundo `#F4F8F5`** → ≈ **15:1** (excelente).
- **Texto secundário `#51685B` sobre branco** → ≈ **6:1** (AA folgado).
- **Texto branco sobre o botão verde**: o gradiente vai de `lifinity_primary` (`#1E9E57`)
  a `lifinity_primary_dark` (`#126C39`). O extremo escuro dá ≈ **6:1**; o claro ≈ **3,4:1**.
  Como o texto fica centrado sobre a zona mais escura e é **bold 16sp**, a leitura é nítida.
  Honestamente: um verde *muito* vivo (ex.: os `#2FB573` que se ponderaram) só daria ≈3:1
  para texto branco — escolheu-se um emerald um pouco mais profundo para favorecer a AA sem
  perder vivacidade. O `_dark` garante o estado pressionado bem contrastado.

---

## 2. Drawables clay para o tema claro (`res/drawable/`)

O claymorphism aqui é **discreto e sofisticado**: cartões brancos, cantos bem arredondados
e uma sombra **suave** vinda da **elevação real da View** (no tema claro as sombras de
elevação são visíveis — ao contrário do tema escuro, onde se simulavam com glows). Por isso
os antigos *glows* `#xx96CDA5` foram **substituídos** por preenchimentos sólidos + bordas hairline.

| Drawable | O que mudou |
|---|---|
| `bg_app_clay` | gradiente claro muito subtil (`#F4F8F5`→`#E7EFE9`) |
| `bg_card_clay` | branco, raio 30dp, **borda hairline** `#EBF1ED`; sombra via elevação |
| `bg_card_soft_clay` | chip menta-cinza claro (`surface2`) + borda `lifinity_border` |
| `bg_input_clay` | branco-acinzentado (`inset`) + **borda subtil** (era só fundo escuro) |
| `btn_primary_clay` | gradiente **verde→verde-escuro** com realce branco; texto branco |
| `btn_secondary_clay` | **branco com borda** + texto escuro (era gradiente escuro) |
| `btn_ghost_clay` | contorno verde ténue sobre transparente, texto verde |
| `btn_danger_clay` | gradiente coral→coral-escuro, texto branco |
| `bg_nav_clay` | barra **branca** com cantos no topo + hairline; sombra via elevação |
| `bg_fab_clay` | gradiente verde (tokens — atualizou-se sozinho) |
| `bg_avatar_clay` | **círculo cinza-claro discreto** com borda (era verde gritante) |
| `bg_pill_mint` | chip verde claro (`#DCEFE3`) + borda, texto verde |
| `bg_pill_alta/media/baixa` | pastéis suaves (coral/dourado/sálvia), texto escuro por cima |
| `bg_bell_alert` | coral muito claro + borda |
| `bg_bubble_received` | bolha branca + borda (texto escuro) |
| `bg_dialog_clay` | **novo** — fundo branco arredondado para diálogos/menus |
| `splash_background` | fundo **claro** com o símbolo (o snake escuro lê-se bem) |

> **Sobre a logo:** o ficheiro `lifinity_logo.png` é, na verdade, um **símbolo** —
> uma ilustração escura de um *ouroboros/infinito* (não é um wordmark com texto). Em fundo
> escuro era preciso tingi-lo de verde para se ver; **em fundo branco lê-se naturalmente**.
> Por isso no tema claro voltou a aparecer sem tint, emparelhado com o nome "Lifinity" em texto.

---

## 3. Espaçamento ampliado (`res/values/dimens.xml`)

A queixa central era "amontoado". A escala de espaço subiu de forma generosa mas equilibrada
(propaga-se a tudo o que usa tokens):

| Token | Antes | Depois |
|---|---|---|
| `space_xs/sm/md/lg/xl` | 6/10/14/20/28 | **8/12/16/24/32** |
| `space_screen` | 20dp | **22dp** |
| `space_card_hero` | 24dp | **28dp** |
| `space_card` | 18dp | **22dp** |
| `space_gap` (folga entre cartões) | 14dp | **18dp** |

O `item_task.xml` passou a usar `space_card`/`space_gap` (mais ar entre tarefas) e a sua
elevação baixou de 10→6dp; os cartões grandes da página de Tarefas também desceram para 6dp
— sombras **suaves e elegantes** em vez de relevo forte.

---

## 4. Tema claro (`res/values/themes.xml` + `values-night/themes.xml`)

- O parent passou de `Theme.Material3.DayNight.NoActionBar` para
  **`Theme.Material3.Light.NoActionBar`**.
- `android:windowLightStatusBar=true` (ícones de status escuros), status/navigation bar claras.
- Todos os papéis de cor do Material3 (`colorPrimary`, `colorSurface`, `colorOnSurface`,
  `colorError`, controlos, ripples) mapeados para a paleta clara — mata o roxo/rosa por defeito.
- O `colorControlHighlight`/`textColorHighlight` passaram a **verde translúcido** (ripples/seleção).
- **Modo escuro do sistema:** `values-night/themes.xml` **espelha o tema claro** (mesmo parent
  Light, mesmos valores). Assim, mesmo com o telemóvel em modo escuro, a app mantém-se clara —
  evita que o Android force cores escuras e parta o aspeto.

---

## 5. Login e Registo redesenhados

- O **hero** deixou de mostrar a imagem da logo (que o utilizador achava feia ali). Passou a
  um **wordmark "Lifinity"** estilizado (44sp, bold, verde) + lema *"Organiza. Concentra-te.
  Evolui."* — novo style `LifinityWordmark` em `styles.xml`.
- Formulário num **cartão branco clay** com bastante padding e espaço entre campos.
- Hierarquia de botões: ação principal (Entrar / Criar conta) é o **primário verde**; a
  secundária (Criar conta / Já tenho conta) é o **ghost discreto**, mais baixo.

---

## 6. Propagação + correções transversais (PASSO B)

- **Avatares (placeholder):** o círculo passou a cinza-claro discreto, por isso a **inicial**
  deixou de ser branca (invisível) e passou a **verde** (`lifinity_primary`) em
  `item_friend`, `item_friend_request` e `activity_profile`. Os pódios do ranking usam emojis
  de medalha (coloridos) — sem alteração.
- **Pills de prioridade no calendário** (`TasksActivity.makeTaskPill`): o texto era
  `text_on_primary` (agora branco) sobre pastéis claros → mudou para `lifinity_text` (escuro).
- **Bolha de chat enviada** (`item_chat_message_sent`): a hora era `#0E2C1B` (escuro) sobre
  verde → passou a branco translúcido `#CCFFFFFF`.
- **Pill de prioridade do item de tarefa**: hex solto `#0E2C1B` → token `@color/lifinity_text`.
- Verificou-se que **não há** fundos escuros hardcoded nos layouts nem texto branco sobre
  superfícies claras (todos os `text_on_primary` restantes estão sobre verde/coral).

### Cabeçalhos com wordmark + símbolo
Nos 5 ecrãs principais (Tarefas, Comunidade, Inspiração, Perfil, Ranking) e na Landing, o
cabeçalho mostra agora o **símbolo pequeno** (snake/infinito, 30dp) **+ "Lifinity"** em texto
verde ao lado — lockup consistente entre ecrãs.

### Ordenação das tarefas igual à web
`TasksActivity.applyFilters()` passou a ordenar a lista exatamente como
`frontend/src/pages/Tasks.jsx`:
1. por **ESTADO** — ativas/pendentes (1) → **perdidas** (2) → concluídas (3);
2. desempate dentro do mesmo estado: **`idtask` decrescente** (mais recentes primeiro).

Novo método `getTaskStatusOrder(task)` (pendente=1, perdida=2, concluída=3) e
`filteredTasks.sort(...)` com `Long.compare(idB, idA)` no desempate.

### Diálogos/menus com a identidade (tema claro)
Os `AlertDialog`/menus apareciam com o cinzento por defeito do Android. Criou-se o
**`ThemeOverlay.Lifinity.Dialog`** (fundo branco arredondado `bg_dialog_clay`, texto escuro,
acento/botões verdes) e ligou-se no tema base via `alertDialogTheme` **e**
`android:alertDialogTheme`. Como todos os diálogos usam `androidx.appcompat.app.AlertDialog`,
**nenhum Java precisou de ser tocado** — o atributo do tema cobre-os a todos
(`TasksActivity`, `GroupsActivity`, `FriendsActivity`, `SettingsActivity`).

### FAB robusto (já não cortado)
A correção anterior (`layout_marginTop="-20dp"`) dependia do clip dos contentores-pai e ficava
frágil. Reescreveu-se o `nav_bottom.xml` de forma **robusta, sem margens negativas**:
- `FrameLayout` de **96dp**, `clipChildren/clipToPadding="false"`.
- Barra branca de **70dp** alinhada ao **fundo** → o seu topo fica a 26dp do topo do frame.
- FAB de **64dp** alinhado ao **topo** (`top|center_horizontal`, `marginTop=0`).

Resultado: o FAB **emerge ~26dp acima da barra**, centrado, **sempre dentro dos limites do
FrameLayout** — por isso **nunca é cortado**, independentemente do clip dos pais. A `elevation`
alta (16dp) faz a sombra aparecer sobre a barra branca.

---

## O que ficou para depois (Prompt 2)
Integração de imagens/avatares reais (Glide) e os gráficos das estatísticas. Nesta tarefa só
se garantiu que o **placeholder** de avatar fica discreto e bonito no tema claro.

---

Validado com `gradlew :app:assembleDebug` → **BUILD SUCCESSFUL**. Sem alterações a lógica de
negócio (só visual + ordenação da lista de tarefas, que replica a web).
