# Android — `res/values/` (colors · dimens · themes) + refinamento visual

> Os ficheiros de `res/values/` são o **centro de design** da app Android: tudo o que é cor,
> tamanho, espaço e tema vive aqui, e os layouts apenas *referenciam* estes tokens
> (`@color/...`, `@dimen/...`). Mudar um valor aqui propaga-se a toda a app — foi exatamente
> isto que permitiu o **passe de refinamento visual de 2026-06-17** mexer numa mão-cheia de
> ficheiros e melhorar **todos** os ecrãs de uma vez.

---

## 1. `colors.xml` — a paleta da marca

A identidade é **clay verde-menta escuro**: fundos muito escuros (quase preto-esverdeado),
cartões "clay" um pouco mais claros, e um **acento menta** para ações/realces.

Famílias de cor:
- **Fundos** — `lifinity_bg` (#18271C), `lifinity_bg_deep` (#112015): o `bg_app_clay` faz o gradiente entre eles.
- **Superfícies (cartões)** — `lifinity_surface` / `lifinity_surface2`: os cartões clay.
- **Afundados (inputs/barras)** — `lifinity_inset` / `lifinity_inset2`: dão a sensação de "campo encavado".
- **Acento menta** — `lifinity_primary` (+ `_light`, `_dark`, `_pressed`): botões, avatares, pills, barras de progresso.
- **Texto** — `lifinity_text` / `_secondary` / `_faint`: hierarquia de leitura.
- **Texto sobre menta** — `lifinity_text_on_primary` (#0E2C1B): verde quase-preto que assenta por cima do menta.
- **Estados** — `lifinity_gold`, `lifinity_coral` (= `lifinity_danger`), `lifinity_sage`: prioridades e perigo.
- **Aliases de compatibilidade** — `lifinity_card`, `lifinity_input`, etc.: nomes antigos mantidos para não partir layouts.

### Decisão do refinamento — **suavizar o menta**
O acento estava demasiado **intenso/saturado** (`#7EE0A2`), o que tornava a app "gritante".
Reduziu-se a intensidade ~12 % **mantendo a mesma família de cor** (menta), para um tom mais
calmo e maduro:

| Token | Antes | Depois |
|---|---|---|
| `lifinity_primary` | `#7EE0A2` | `#74CF97` |
| `lifinity_primary_light` | `#8EEDB0` | `#84DBA5` |
| `lifinity_primary_dark` | `#57B87E` | `#52A877` |
| `lifinity_primary_pressed` | `#57B87E` | `#52A877` |

**Porquê estes valores:** baixar saturação/brilho sem mudar o *matiz* (continua verde-menta);
manter `light` mais claro que `primary` e `dark` mais escuro, para os gradientes "clay"
(brilho → sombra) continuarem a funcionar nos botões, avatares e bolhas de chat.

**Contraste (acessibilidade):** o texto escuro `lifinity_text_on_primary` (#0E2C1B) sobre o novo
menta mantém-se bem legível — rácio ≈ **8:1** sobre `#74CF97` e ≈ **5,2:1** sobre o extremo mais
escuro do gradiente (`#52A877`), ambos acima do mínimo **WCAG AA 4,5:1** para texto normal.
Como o menta ficou *ligeiramente* mais escuro, o texto escuro por cima até ganha contraste.

**Cuidado com hex "soltos":** a maioria dos drawables referencia `@color/lifinity_primary*`,
por isso atualizaram-se automaticamente. Tiveram de ser corrigidos à mão os sítios onde o menta
estava **escrito em hexadecimal com transparência** (não dá para referenciar um `@color` com alfa):
- `drawable/bg_pill_mint.xml` — `#267EE0A2`/`#4D7EE0A2` → `#2674CF97`/`#4D74CF97`.
- `values/themes.xml` e `values-night/themes.xml` — `android:textColorHighlight` `#557EE0A2` → `#5574CF97`.

Também se trocaram hex avulsos por tokens nomeados (coerência "uma só mão"):
`#FF6B6B` → `@color/lifinity_coral` (estatísticas), `#AAAAAA`/`#888888` →
`@color/lifinity_text_secondary`/`_faint` (item de conversa), `#0E2C1B` →
`@color/lifinity_text_on_primary` (perfil).

> Os glows "clay" subtis dos cartões/nav (`#xx96CDA5`) **não** são o acento — são um sálvia
> muito ténue de realce e ficaram como estavam de propósito.

---

## 2. `dimens.xml` — a escala de tamanhos e espaços

Era a peça que faltava para resolver o "uns elementos grandes demais, outros apertados".
Passou a ser uma **escala explícita e documentada**, que os layouts devem usar em vez de
valores soltos:

- **Espaçamento** — `space_xs/sm/md/lg/xl` (6/10/14/20/28dp) + `space_screen` (margem lateral
  de ecrã, 20dp), `space_card_hero` (24dp, cartões grandes de formulário), `space_card` (18dp,
  cartões padrão), `space_gap` (14dp, folga entre itens de lista).
- **Tipografia** — `text_screen_title` (26sp), `text_toolbar_title`/`text_card_title` (20sp),
  `text_subtitle` (14sp), `text_body` (15sp), `text_caption` (13sp), `text_label` (11sp).
- **Raios clay** — `radius_card` (30dp), `radius_card_soft` (22dp), `radius_control` (16dp), `radius_pill` (999dp).
- **Alturas** — `height_button` (52dp, ação principal), `height_button_secondary` (46dp, ação
  discreta), `height_input` (52dp), `height_button_icon` (48dp), `size_header_icon` (40dp,
  botões circulares de cabeçalho/voltar).
- **Avatares** — `size_avatar_large/medium/small`.

**Decisões aplicadas:** títulos de ecrã unificados em **26sp** (antes uns a 27sp, outros a 30sp);
botões de ícone dos cabeçalhos e botões "voltar" unificados em **40dp** (antes uma mistura de
36/38/40dp, e ≥40dp também melhora o alvo de toque); cartões de formulário (login, registo,
criar/editar tarefa) com padding calmo de **24dp**.

---

## 3. `themes.xml` (+ `values-night/`)

`Theme.Lifinity` herda do `Material3.DayNight.NoActionBar` e **força a paleta da marca** em todos
os papéis de cor do Material3 (`colorPrimary`, `colorSurface`, `colorError`, controlos, ripples…).
Isto existe porque, sem estes overrides, o Material3 caía nas cores por defeito (roxo/rosa) — a
origem histórica dos "botões rosa". O modo **night** espelha exatamente os mesmos valores (a app
já é toda escura). Há ainda o `Theme.Lifinity.Splash`, que só troca o `windowBackground` pela
logo centrada durante o arranque a frio.

No refinamento, a única mudança aqui foi acompanhar o novo menta no `textColorHighlight`.
