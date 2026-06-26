# Android — Página de Inspiração: banner, filtro de temas e partilha (2026-06-26)

> Três melhorias à página de **Inspiração** (`InspirationActivity` + `activity_inspiration.xml`),
> mantendo o **tema claro** e **sem alterar a lógica de negócio nem os endpoints** (só os *chamamos*).
> Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).

---

## 1 — Imagem de fundo atrás do versículo do dia
**Ficheiros:** `res/drawable/bible_banner.jpg` (copiada da web), `bg_verse_hero.xml`,
`bg_verse_overlay.xml` (novos) · `res/layout/activity_inspiration.xml`.

**Origem da imagem:** é a **mesma** do browser — `frontend/public/images/bible-banner.jpg` — copiada
para `res/drawable/bible_banner.jpg` (nome em minúsculas/underscore, válido como *resource*). É só para
teste; o utilizador trocará depois. **O fundo geral da página mantém-se claro** — a imagem é exclusiva
do cartão do versículo.

**Como ficou (como no browser):** o cartão do versículo passou a ter um **banner** no topo:
- um `FrameLayout` (`inspirationVerseHero`) com três camadas: a **imagem** (`ImageView`,
  `scaleType="centerCrop"`), um **overlay escuro** (`View` com `bg_verse_overlay`) e o **conteúdo**
  (modo, pílula de tema, aspas, texto, referência) por cima;
- **cantos arredondados fiáveis:** `android:clipToOutline="true"` no `FrameLayout` + um fundo
  `bg_verse_hero` que é uma `<shape>` com cantos **uniformes** (22dp). Cantos uniformes garantem que o
  *outline* é um retângulo arredondado e o recorte funciona em API 24+ (cantos não-uniformes dariam
  recorte não fiável). O `bg_verse_hero` também serve de cor escura de *fallback* enquanto a imagem
  carrega.

**Legibilidade:** o `bg_verse_overlay` é um **gradiente preto** vertical (≈35 %→65 % de opacidade, mais
escuro em baixo onde fica a referência). Os textos sobre o banner passaram a **branco**
(`#FFFFFF`), com a referência num branco quase-puro e as aspas decorativas num branco translúcido
(`#B3FFFFFF`); o texto do versículo ganhou ainda uma **sombra** subtil (`android:shadow*`) para se ler
sobre zonas claras da imagem. A pílula de tema mantém o fundo menta claro (tem o seu próprio fundo,
legível). Estas cores estão **só no XML** — o Java nunca sobrepõe cores, por isso não há regressões.

**Botões mantidos e funcionais:** "♥ Guardar" (primário), partilhar/copiar (ícones) e "Aleatório"/
"Diário" (ghost) ficam **por baixo do banner**, na zona clay branca do cartão — sempre legíveis. Ids e
`onClick` inalterados.

---

## 2 — Filtro por tema nos favoritos
**Ficheiros:** `res/layout/activity_inspiration.xml` · `InspirationActivity.java`
(reutiliza `res/layout/item_spinner.xml`).

**Campo de tema:** confirmado no modelo `Verse` — o getter é **`getTheme()`** (campo `theme`), igual ao
`theme` da web.

**UI:** um **`Spinner`** (`inspirationFavoritesThemeSpinner`) dentro de um contentor
(`inspirationThemeFilterContainer`) na secção FAVORITOS, com o mesmo estilo do seletor de período das
Estatísticas (envolto em `bg_card_soft_clay`, `item_spinner` para a vista e o *dropdown*). Tema claro
coerente.

**Temas dinâmicos (como na web):** as opções são `"Todos"` + os **temas únicos** presentes nos
favoritos carregados (derivados em runtime, não uma lista fixa). Favoritos **sem tema** são ignorados
na lista de temas. Se os favoritos não tiverem nenhum tema, o filtro **fica escondido** (só teria
"Todos"). Lógica espelha a do browser:
`themes = ["Todos", ...Set(favoritos.map(theme).filter(Boolean))]`.

**Filtragem:** `renderFavorites()` separa o "carregar" do "mostrar" — a lista completa fica em
`favorites`; o que se desenha é filtrado por `selectedFavoriteTheme` ("Todos" mostra tudo). Ao escolher
um tema, filtra-se a lista. Mensagens distintas: "Ainda não tens versículos favoritos." (sem favoritos)
vs "Nenhum favorito neste tema." (filtro sem resultados).

**Robustez:** repovoar o `Spinner` dispara `onItemSelected`; usa-se uma *flag*
`suppressThemeSpinnerEvent` para não duplicar o render durante a reconstrução, e o tema selecionado é
restaurado (ou volta a "Todos" se já não existir).

---

## 3 — Partilhar um versículo para uma conversa EXISTENTE
**Ficheiros:** `res/drawable/ic_share.xml` (novo) · `res/layout/activity_inspiration.xml` ·
`InspirationActivity.java`. **Endpoints (já existentes, só chamados):**
`GET chat/conversations` e `POST chat/conversations/{id}/messages`.

**Âmbito (decisão):** a partilha é **apenas para conversas que já existem**. **Não** cria conversas
novas nem lista amigos/grupos — só lista `getConversations()` e envia para a escolhida.

**Ação de partilhar:** um ícone de partilha (vector `ic_share`, desenhado à mão, sem bibliotecas) ao
lado das ações do **versículo do dia**, e um botão **"Partilhar"** (ghost) em cada **favorito** (numa
linha com o "Remover").

**Fluxo (com loading):**
1. ao tocar, mostra-se um `Toast` "A carregar conversas..." e chama-se `getConversations`;
2. filtram-se as conversas válidas (com `idconversation`); se **não houver nenhuma**, mostra-se
   "Ainda não tens conversas para partilhar." (em vez de uma lista vazia);
3. abre-se um **`AlertDialog`** (tema claro existente, via `alertDialogTheme` →
   `ThemeOverlay.Lifinity.Dialog`) com os **nomes** (`getName()`) das conversas;
4. ao escolher, envia-se a mensagem com `sendMessage(token, idconversation, body)` e mostra-se
   "Versículo enviado." (erros de rede/HTTP têm `Toast` claro).

**Conteúdo formatado (igual ao browser):** `«"texto" — Livro cap:verso»`, com aspas curvas e travessão
(`formatVerseForShare`). O `SendChatMessageRequest` do Android só tem **`content`** (não tem
`message_type`), por isso envia-se apenas o texto formatado — o essencial (a mensagem chegar) cumpre-se.
Não se abre a `ChatActivity` (era opcional); o feedback por `Toast` é suficiente. As `Call` novas
(`conversationsCall`, `shareMessageCall`) são canceladas no `onDestroy`.

---

## Notas
- Sem bibliotecas externas novas: os ícones (`ic_share`) e os fundos são vector/shape locais.
- A nota "deprecated API" no build é pré-existente (sobrecargas Java do OkHttp do avatar) — inofensiva.
