# Handoff: Lifinity — UI Android (Claymorphism)

## Visão geral

Protótipo de **alta fidelidade** do redesign da app Android do **Lifinity** (app de produtividade gamificada: tarefas, XP/níveis, ranking, inspiração diária, perfil). O objetivo é dar à app Android nativa uma identidade visual **claymorphism** ("clay" — superfícies macias e "fofas" com relevo, sombras duplas e cantos muito arredondados), usando as **cores da página web de Atividades** (verde-floresta escuro + menta).

> **Contexto do projeto:** PAP do curso Técnico de Gestão e Programação de Sistemas Informáticos. App Android existente em **Java + layouts XML** (não Compose), pasta `android/LifinityAndroid/`. Backend Node.js/Express + MySQL, frontend web React. A web já está feita; falta terminar o Android.

## Sobre os ficheiros de design

Os ficheiros deste bundle são **referências de design feitas em HTML/CSS/JS (React via Babel)** — um protótipo que mostra o aspeto e o comportamento pretendidos. **Não são código de produção para copiar diretamente.**

A tarefa é **recriar este design no ambiente Android existente** (Java + XML, em `android/LifinityAndroid/`), usando os padrões já estabelecidos do projeto: `drawable/*.xml` (shapes), `values/colors.xml`, `values/dimens.xml`, `themes.xml`, Activities e Adapters. O projeto já tem drawables chamados `*_clay.xml` mas estão **planos** (cor sólida + borda) — este design mostra como torná-los verdadeiramente "clay".

> O claymorphism em Android consegue-se com **layers de `<shape>`** (gradientes + cantos grandes) e elevação/sombras. Sombras internas reais (inset) não existem nativamente em drawables XML — aproximam-se com `<layer-list>` (camada clara deslocada para cima/esquerda + camada escura para baixo/direita) ou com uma biblioteca de neumorphism. Ver secção **"Notas de implementação Android"**.

## Fidelidade

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento, raios e relevo estão definidos abaixo com valores exatos. Recriar fielmente. As animações de entrada do protótipo são polish opcional.

---

## Sistema de design (tokens)

### Cores — Tema escuro (verde) — PRINCIPAL
| Token | Hex | Uso |
|---|---|---|
| `bg` | `#18271C` | Fundo da app |
| `bg2` (overlay) | `#112015` | Vinheta/gradiente de fundo |
| `surface` | `#27392D` | Cartões (tom base do gradiente) |
| `surface2` | `#2F4435` | Cartões (tom claro do gradiente) |
| `inset` | `#16241A` | Campos, barras de progresso (afundados) |
| `inset2` | `#1B2B1F` | Badges neutros |
| `mint` (acento) | `#7EE0A2` | Destaques, progresso, ícones ativos |
| `mint-2` | `#8EEDB0` | Botão primário (topo do gradiente) |
| `mint-d` | `#57B87E` | Botão primário (base do gradiente) |
| `on-mint` | `#0E2C1B` | Texto sobre menta |
| `gold` | `#E2BD4D` | Prioridade Média |
| `coral` | `#EF9B7E` | Prioridade Alta / perigo / streak |
| `sage` | `#A6C7AF` | Prioridade Baixa |
| `text` | `#EEF6F0` | Texto principal |
| `muted` | `#92AA9B` | Texto secundário |
| `faint` | `#6F8A78` | Texto terciário / placeholders |

### Cores — Tema claro (creme) — variante alternativa (tweak opcional)
`bg #E7E1D5` · `surface #F1EBDF`→`#FBF6EC` · `inset #E0D9CA` · `text #39342B` · `muted #8D8676`. Realces (luz) `rgba(255,255,255,0.92)`, sombras `rgba(150,138,116,0.40)`. Acento mantém-se.

### Tipografia
- **Família:** **Nunito** (Google Fonts), arredondada e amigável (combina com clay).
- Pesos usados: 400, 600, 700, **800** (predominante em títulos/labels), **900** (números grandes, títulos de ecrã, marca).
- **Escala:**
  - Título de ecrã (H1): 27px / 900 / letter-spacing −0.02em
  - Número grande (XP, %): 30–36px / 900
  - Título de cartão/tarefa: 17px / 800 / line-height 1.3
  - Versículo: 25px / 800 / line-height 1.34
  - Corpo / descrição: 13.5px / 700 / line-height 1.35
  - **Label** (maiúsculas): 11px / 800 / letter-spacing 0.13em / cor `muted`
  - Mini-label: 9.5px / 800

### Espaçamento, raios e medidas
- Padding horizontal de ecrã: **20px**
- Padding interno de cartão: ~16–20px
- Gap entre cartões: **14px**
- **Raios:** cartão grande `30px` · cartão suave/médio `22px` · controlo/campo `16px` · pills `999px`
- Altura de botão/campo: **46–56px** (alvos de toque ≥ 44px)
- Avatares: círculos (perfil 80px; pódio 48–58px; linhas de lista 40px)

### Relevo "clay" (a assinatura visual)
Cada superfície combina **4 sombras**: drop externa escura + glow externo claro (canto superior-esquerdo) + **inset claro** (luz no topo) + **inset escuro** (sombra em baixo). Valores (tema escuro), com um multiplicador de intensidade `--clay` (0.5–1.5, default 1):

**Cartão (`.clay`)** — raio 30px, `background: linear-gradient(152deg, surface2, surface)`:
```
box-shadow:
  8px 10px 24px rgba(0,0,0,0.42),          /* drop externo */
  -6px -6px 18px rgba(150,205,165,0.16),    /* glow externo claro */
  inset 4px 4px 9px rgba(150,205,165,0.16), /* luz interna (topo-esq) */
  inset -6px -7px 13px rgba(0,0,0,0.42);    /* sombra interna (base-dir) */
```
**Afundado (`.clay-inset`)** — raio 16px, `background: inset`:
```
box-shadow:
  inset 5px 5px 11px rgba(0,0,0,0.52),
  inset -3px -3px 8px rgba(150,205,165,0.16);
```
**Botão primário (`.clay-btn`)** — raio 16px, `background: linear-gradient(152deg, mint-2, mint-d)`, texto `on-mint`/800:
```
box-shadow:
  5px 6px 15px rgba(0,0,0,0.42),
  inset 3px 3px 6px rgba(255,255,255,0.5),     /* brilho plástico */
  inset -4px -5px 10px rgba(30,110,65,0.55);   /* sombra de cor */
/* :active → translateY(2px) scale(0.98) + sombras invertidas (afunda) */
```
**Pill/badge (`.clay-pill`)** — raio 999px, 800/uppercase/letter-spacing 0.06em, sombra suave + inset subtil.

---

## Ecrãs / Vistas

A app abre direta no ecrã **Atividades** (home pós-login — o mais importante). Navegação por **bottom navigation clay** com 4 separadores + **FAB central "+"**.

### Cabeçalho (comum a todos os ecrãs)
- Topo: marca à esquerda (símbolo ∞ num quadrado clay menta + wordmark "Lifinity" 900) · à direita: pill de utilizador ("Teste" / "NÍVEL 8") + botão-ícone redondo de notificações (sino) com badge coral.
- Abaixo: **título do ecrã** (H1 27/900). No Atividades, saudação inline "Bom trabalho, Teste" (muted, nowrap com ellipsis).

### 1. Atividades (home)
**Objetivo:** ver progresso e gerir as tarefas do dia.
**Layout (coluna, scroll):**
1. **Cartão XP** (`.clay`): label "NÍVEL 8" · número grande "2043 XP" (36/900 + "XP" menta) · **barra de progresso** clay-inset (preenchimento menta com gradiente; valor = xpInLevel/(xpInLevel+xpForNext)) · linha "Faltam **219 XP** para o nível 9".
2. **Cartão Resumo de hoje** (`.clay`): label + "%" grande (30/900) + **anel de progresso** pequeno (56px, ícone chama menta no centro). Abaixo: 3 mini-cartões (`.clay-soft`) "Pendentes" / "Concluídas" (valor menta) / "Perdidas" (valor coral).
3. **Pesquisa** (`.clay-inset`, 50px): ícone lupa + input "Procurar atividade…".
4. **2 dropdowns de filtro** (`.clay-inset`) lado a lado: "Todos os estados" e "Prioridades" (abrem menu `.clay` flutuante com opções).
5. Label "AS MINHAS ATIVIDADES" + contador menta.
6. **Lista de cartões de tarefa** (ver componente abaixo). Estado vazio: cartão central com ícone check menta + "Tudo em dia!".

**Componente — Cartão de tarefa (`.clay`):**
- Linha topo: título (17/800) + **pill de prioridade** à direita (Alta=coral, Média=gold, Baixa=sage; ícone bandeira + label; texto escuro).
- Descrição (muted, opcional).
- Linha de **badges meta** (`inset2`, pill, ícone + texto, muted): "Criada por mim", "Prazo: …", "Edição bloqueada".
- Linha de ações: botão **Concluir** (`.clay-btn`, full-width flex, ícone check) + botão-ícone **lixo** (`.clay-ico`, coral).
- **Concluir** → tarefa anima a colapsar (scale+fade+max-height) e some; **eliminar** idem.

### 2. Ranking
**Objetivo:** ver classificação por XP.
- Label "RANKING GLOBAL · POR XP".
- **Pódio** (3 colunas, alinhadas em baixo): ordem visual 2º · 1º · 3º. Cada coluna: avatar circular (cor por lugar: gold/sage/coral; iniciais) + primeiro nome (13/800) + "XP" (menta) + **pedestal** (`.clay-soft`, alturas 100/78/64px) com o número do lugar (30/900, cor do lugar). 1º maior e ao centro.
- Label "CLASSIFICAÇÃO COMPLETA" + lista: cada linha (`.clay-soft`; o utilizador atual usa `.clay` + contorno menta 2px) com posição, avatar `.clay-inset` (iniciais menta), nome + "Nível N", XP à direita. Sufixo "· tu" no próprio utilizador.

### 3. Inspiração
**Objetivo:** versículo diário motivacional.
- **Cartão do versículo** (`.clay`, grande): aspas decorativas gigantes (menta, opacity 0.08) · pill de tema (ex. "Força") · texto do versículo (25/800) · referência "— Filipenses 4:13" (menta/900).
- Linha de ações: botão **Guardar** (`.clay-btn-soft`, coração; toggla para "Guardado" coral) + botão-ícone **copiar** (`.clay-ico`; muda para check menta 1.4s).
- Botão **Versículo aleatório** (`.clay-btn`, full-width, ícone shuffle) → troca o versículo.
- Cartão **Favoritos** (`.clay-soft`): ícone coração coral + "N versículos guardados" + chevron.

### 4. Perfil
**Objetivo:** resumo do utilizador.
- Cartão topo (`.clay`, centrado): **anel de progresso** (120px) à volta do avatar clay menta com inicial "T" · nome (22/900) · email (muted) · 2 pills (Nível N menta · XP gold) · barra de progresso + "Faltam … XP".
- **Grelha 3 colunas** de stats (`.clay-soft`): "12 Dias seguidos" (chama coral), "3 Grupos", "9 Amigos" — cada um ícone + número (22/900) + label.
- Label "CONQUISTAS RECENTES" + **fila de 4 medalhas** (`.clay-soft`, quadradas, ícones: troféu gold, chama coral, check menta, brilho azul).
- Botão **Terminar sessão** (`.clay-btn-soft`, coral, ícone logout).

### 5. Nova Atividade (bottom sheet)
Aberto pelo **FAB "+"**. Backdrop escuro `rgba(0,0,0,0.5)` + folha `.clay` com cantos só no topo (34px), grabber. Campos:
- Título (`.clay-inset` + input, autofocus)
- Descrição (`.clay-inset` + input)
- **Prioridade**: 3 botões segmentados (Alta/Média/Baixa); o selecionado pinta-se com a cor da prioridade e ganha relevo; os outros ficam `.clay-inset` muted.
- Prazo (`.clay-inset`, ícone relógio + input "dd/mm/aaaa")
- Ações: **Cancelar** (`.clay-btn-soft`) + **Criar** (`.clay-btn`, ícone +; desativado/opacity 0.5 sem título). Criar → prepende a tarefa à lista e volta a Atividades.

### Bottom navigation (comum)
Barra `.clay` (cantos no topo 26px), 4 separadores: **Atividades** (lista+check), **Ranking** (troféu), **Inspiração** (brilho), **Perfil** (utilizador). Separador ativo: ícone menta dentro de um slot `.clay-inset` + label menta. **FAB "+"** central (60px, `.clay-btn` redondo) sobreposto, a fazer ponte com a área de conteúdo.
> **Importante (bug corrigido):** a barra precisa de `z-index` superior à área de scroll, senão o conteúdo da lista tapa o topo do FAB nas páginas com scroll.

---

## Interações & comportamento
- **Concluir tarefa:** +XP por prioridade (**Alta 60 / Média 35 / Baixa 20**); atualiza XP total, barra de nível e contador "Concluídas"; mostra **toast** flutuante "+N XP" (sobe e desaparece ~1.5s); se o XP do nível chega a 0, sobe de nível. Cartão colapsa e some (~320ms).
- **Eliminar tarefa:** colapsa e some.
- **Pesquisa:** filtra por título/descrição. **Filtros:** por estado e por prioridade.
- **Nova atividade:** valida título não-vazio; cria e volta a Atividades com toast.
- **Inspiração:** guardar (toggle favorito), aleatório (troca versículo), copiar (feedback visual).
- **Navegação:** troca de ecrã faz reset do scroll ao topo.
- **Animações:** botões `:active` afundam (translateY + scale + sombras invertidas). Entradas (subida do sheet, etc.) são polish — **nunca prender a visibilidade do conteúdo ao fim de uma animação** (usar estado de repouso visível).

## Gestão de estado (no protótipo)
- `screen` (atividades|ranking|inspiracao|perfil), `sheet` (aberto?), `tasks[]` (id, title, desc, priority, due, locked, done), `xp`, `level`, `xpInLevel`, `xpForNext`, `toast`.
- Estado inicial: nível 8, 2043 XP, xpInLevel 124 / xpForNext 219; 5 tarefas exemplo.
- No Android: mapear para os modelos/Activities existentes (Task, TaskAdapter, TasksActivity, etc.) e à API (`TaskApi`, `AccountApi`, …). O XP/nível vem do backend (módulo C).

## Tweaks (configuráveis no protótipo)
- **Intensidade do relevo** (`--clay` 0.5–1.5) · **Tema** (Escuro verde ↔ Claro creme) · **Acento** (Menta/Azul/Coral/Violeta). No Android, equivalem a escolher valores em `dimens`/`colors` e variantes `values-night`.

## Assets
- **Marca:** logo **ouroboros** (cobra em forma de ∞) — `assets/lifinity-logo.png` (original em `frontend/public/images/lifinity-logo.png`). Desenho a preto sobre transparente; no protótipo aparece **a preto dentro de um selo clay menta** (alto contraste, independente do tema). Em alternativa, tintar para claro/menta sobre fundo escuro.
- **Ícones:** conjunto de glifos SVG de traço (em `icons.jsx`) — tarefas, troféu, brilho, utilizador, +, sino, lupa, check, lixo, relógio, bandeira, cadeado, chevrons, coração, shuffle, copiar, engrenagem, logout, chama, grupos, gráfico. No Android, substituir por vetores equivalentes (`res/drawable` vector assets / Material Symbols arredondados).
- **Tipo:** Nunito (Google Fonts) — adicionar como fonte em `res/font/`.
- Sem imagens fotográficas. Sem emoji.

## Ficheiros neste bundle
- `Lifinity Android.html` — entrada do protótipo (carrega tudo; tem o scaling do telemóvel)
- `clay.css` — **sistema de design**: tokens (CSS vars), classes clay, tipografia, keyframes
- `app.jsx` — app: navegação, estado, bottom nav + FAB, toast, tweaks, temas
- `components.jsx` — marca, cabeçalho, pill de prioridade, badges, progresso, anel, **cartão de tarefa**
- `screen-atividades.jsx` — ecrã Atividades (XP, resumo, pesquisa, filtros, lista)
- `screens-more.jsx` — Ranking, Inspiração, Perfil, **bottom sheet Nova Atividade**
- `icons.jsx` — ícones SVG
- `android-frame.jsx` — moldura do telemóvel (apenas para visualização do protótipo; **não** faz parte do design a portar)
- `tweaks-panel.jsx` — painel de tweaks (infra do protótipo; não portar)

## Notas de implementação Android (Java + XML)
1. **Tokens:** atualizar `res/values/colors.xml` com os hex acima; `dimens.xml` com raios (28–30dp, 16–22dp) e alturas (56dp). Já existem nomes `lifinity_*` — manter e ajustar.
2. **Superfícies clay:** os `bg_card_clay.xml` etc. atuais são planos. Para o relevo, usar `<layer-list>`: camada de sombra escura deslocada (+dx,+dy), camada base com `<gradient>` (152° surface2→surface) e cantos grandes, e (se possível) uma camada clara deslocada (−dx,−dy) para a "luz". Em cartões com `CardView`/`MaterialCardView`, combinar `cardElevation` + `cardCornerRadius` grande. Para inset/afundado e duplo-realce fiel, considerar uma lib de **neumorphism** (ex.: views custom) — opcional.
3. **Botões primários:** `MaterialButton` com `cornerRadius` 16dp, gradiente menta (via drawable), `stateListAnimator` para o "afundar" no press.
4. **Bottom nav + FAB:** `BottomNavigationView` (ou `BottomAppBar`) com 4 itens + `FloatingActionButton` central (`app:fabCradleMargin` se usar `BottomAppBar`). Garantir o FAB **acima** do conteúdo (elevation).
5. **Lista de tarefas:** `RecyclerView` + `TaskAdapter` (já existe) com o novo `item_task.xml` desenhado segundo o componente acima.
6. **Sheet Nova Atividade:** `BottomSheetDialogFragment` com o form e o segmented de prioridade.
7. **Fonte:** Nunito em `res/font/` + aplicar no tema.
8. **Tema claro/escuro:** usar `values/` (escuro verde como default) e opcionalmente `values-night/` ou uma preferência.
