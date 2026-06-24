# Android — drawables "clay" (`res/drawable/bg_*.xml`, `btn_*.xml`)

> ⚠️ **ATUALIZAÇÃO 2026-06-24 — TEMA CLARO.** No redesenho para tema claro, os cartões/inputs/
> botões deixaram de usar gradientes escuros + glows e passaram a **superfícies brancas com
> bordas hairline + sombra de elevação suave**. A técnica de `<layer-list>`/`<shape>` descrita
> abaixo continua a ser a base, mas os valores e a estratégia de sombra mudaram — ver
> [`../../REDESIGN_TEMA_CLARO_2026-06-24.md`](../../REDESIGN_TEMA_CLARO_2026-06-24.md).

> Os ~25 drawables clay repetem todos a **mesma técnica**, por isso explicam-se em conjunto.
> A estética "clay/claymorphism" cria-se com `<layer-list>` + `<shape>`: uma forma com
> **gradiente** (do mais claro em cima-esquerda para o mais escuro em baixo-direita) e, por baixo,
> uma segunda forma ligeiramente deslocada que simula o **brilho/sombra** plástica.

## A técnica, em resumo
- **Cartões** (`bg_card_clay` 30dp, `bg_card_soft_clay` 22dp): gradiente `surface2 → surface`
  + um glow sálvia ténue (`#xx96CDA5`) deslocado. A elevação real vem do `android:elevation`
  do layout; o drawable só dá a "massa" e o cantinho de luz.
- **Inputs** (`bg_input_clay`, `bg_nav_item_active`): forma sólida `lifinity_inset`, **sem** glow
  — o fundo escuro é que cria a sensação de "afundado" por contraste com os cartões elevados.
- **Botões**: `selector` com estado `state_pressed`. Cada estado é um gradiente clay com o
  raio `radius_control` (16dp):
  - `btn_primary_clay` — gradiente menta (`primary_light → primary_dark`): a **ação principal**.
  - `btn_secondary_clay` — gradiente `surface2 → surface`: ação equivalente/alternativa.
  - `btn_danger_clay` — gradiente coral: ações destrutivas (apagar, terminar sessão).
  - `btn_ghost_clay` — **novo (refinamento 2026-06-17)**, ver abaixo.
- **Pills** (`bg_pill_mint`, `bg_pill_alta/media/baixa`, `bg_pill_coral`): cápsulas (raio 999dp)
  para níveis/prioridades. O `bg_pill_mint` usa menta com transparência + contorno fino.
- **Avatar/FAB/bolhas** (`bg_avatar_clay`, `bg_fab_clay`, `bg_bubble_sent`): gradiente menta
  (a forma oval do avatar, o `+` da nav, a bolha de mensagem do utilizador).

Como quase todos referenciam `@color/lifinity_primary*`, **suavizar o menta no `colors.xml`
propagou-se a todos** sem editar cada ficheiro (ver [`../values/_VALUES.md`](../values/_VALUES.md)).

## `btn_ghost_clay.xml` — hierarquia de botões (decisão do refinamento)
**Problema:** quando um ecrã tinha uma ação **principal** e uma **secundária** lado a lado
(ex.: Login "Entrar" + "Criar conta"), ambas eram botões clay preenchidos com o mesmo peso, o
que baralhava qual era a ação principal.

**Solução:** criou-se um botão "ghost" (fantasma) para a **ação secundária discreta**:
- `selector` sem preenchimento sólido (`#00000000`) e **sem elevação** — recua perante o primário;
- apenas um **contorno menta ténue** (`#4D74CF97`) com o raio de controlo (16dp);
- no estado pressionado ganha um leve preenchimento menta (`#2274CF97`) como feedback de toque;
- aplica-se com altura mais baixa (`height_button_secondary` = 46dp vs 52dp do primário),
  texto menta a `text_body` (15sp) e sem o peso visual do botão cheio.

**Onde se aplicou:**
- **Login** — "Entrar" é primário (clay menta, 52dp, elevação); "Criar conta" passou a ghost.
- **Registo** — inverso: "Criar conta" é o primário; "Já tenho conta" passou a ghost.

O princípio (uma ação principal forte + secundárias discretas) é o mesmo a seguir noutros ecrãs
sempre que existam botões principal e secundário juntos.
