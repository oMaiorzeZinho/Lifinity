# Android — correções visuais (2026-06-18)

> Três correções **cirúrgicas** a bugs visuais (mais um extra relacionado), sem mexer em
> lógica de negócio nem em ids de views. Cada uma: o que estava errado e como foi resolvido.

---

## BUG 1 — Botão de opções da tarefa parecia um quadrado verde vazio
**Ficheiro:** `res/layout/item_task.xml` (`@id/taskOptionsButton`).

**Problema:** o ícone usava o caractere `⋮` (U+22EE, três pontos verticais) com a cor
`lifinity_text_secondary` (baixo contraste). O glifo nem sempre existe na fonte do sistema
(`sans-serif-rounded`), aparecendo como um quadrado/tofu, e a cor esbatida ainda piorava a leitura.

**Correção:** trocar o glifo por `•••` (três *bullets* U+2022, que rendam em **qualquer** fonte)
e usar `@color/lifinity_text` (texto claro, alto contraste). Mantidos o `id`, o fundo
`btn_secondary_clay`, o tamanho 48×48dp e a lógica (o menu continua a abrir no `TaskAdapter`).
Acrescentou-se `letterSpacing` e `textStyle="bold"` para os pontos ficarem nítidos.

---

## BUG 2 — FAB "+" cortado/atrás da barra de navegação
**Ficheiro:** `res/layout/nav_bottom.xml` (`@id/navFab`).

**Problema:** o FAB tinha `layout_gravity="top|center_horizontal"` com `layout_marginTop="0dp"`,
o que o colava ao topo do `FrameLayout` (80dp). Como a barra (72dp) está alinhada ao fundo, o FAB
ficava quase todo sobreposto à barra, parecendo cortado em vez de "emergir".

**Correção:** `layout_marginTop="-20dp"`. O topo da barra fica a ~8dp do topo do `FrameLayout`; a
margem negativa sobe o FAB para o seu **centro assentar sobre essa aresta** — metade acima, metade
sobreposta, como um FAB central clássico. Funciona porque o `FrameLayout` e os contentores-pai já
têm `clipChildren="false"`/`clipToPadding="false"` (senão a parte de cima seria cortada). Mantidos
o tamanho 60dp, a `elevation="20dp"` (acima da barra) e o `id`. O espaço central de 68dp reservado
na barra evita colisão com os ícones das tabs.

---

## BUG 3 — Página de Inspiração com botões empilhados (pesada)
**Ficheiro:** `res/layout/activity_inspiration.xml`.

**Problema:** abaixo de "♥ Guardar" havia **dois botões secundários de largura total empilhados**
("Versículo aleatório" e "Voltar ao diário"), ambos com peso visual igual ao principal — o bloco
de ações dominava o ecrã.

**Correção:** os dois passaram a partilhar **uma linha** (lado a lado, `layout_weight="1"`), mais
baixos (`height_button_secondary`) e mais leves (`btn_ghost_clay`, contorno menta), com rótulos
curtos ("Aleatório" / "Diário"). O "♥ Guardar" mantém-se como ação principal forte (primário). De
duas linhas inteiras passou a uma linha discreta — a secção respira. **Ids e onClick intactos**.

---

## EXTRA — Glifo do botão de copiar versículo
**Ficheiro:** `res/layout/activity_inspiration.xml` (`@id/copyVerseButton`).

Mesmo tipo de problema do BUG 1: o ícone usava `⧉` (U+29C9), pouco fiável. Trocado pelo emoji de
prancheta `📋` (renderizado pela fonte de emojis em qualquer dispositivo). Lógica e `id` intactos.

---

Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL). Sem alterações a Java de negócio nem a ids.
