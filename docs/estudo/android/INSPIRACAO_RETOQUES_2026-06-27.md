# Inspiração — 3 retoques visuais (2026-06-27)

Três correções **cirúrgicas** na página de Inspiração (`InspirationActivity.java` + `activity_inspiration.xml`), sem refazer a página nem mexer na lógica de carregamento/partilha. Tema claro mantido.

> Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).

---

## 1. Banner do versículo mais baixo (faixa contida)

O banner com a imagem (`bible_banner`) atrás do versículo do dia estava demasiado **alto**, ocupando ecrã a mais. Em vez de uma altura fixa (que cortaria versículos longos), reduziram-se os elementos que mais ocupavam altura, mantendo `wrap_content` (o conteúdo nunca é cortado):

| Atributo | Antes | Depois |
|---|---|---|
| `inspirationVerseHero` `minHeight` | `200dp` | **`150dp`** |
| Padding do conteúdo | `20dp` | **`16dp`** |
| Aspas decorativas (`textSize`) | `56sp` | **`34sp`** |
| Aspas decorativas (`layout_marginTop`) | `12dp` | **`4dp`** |
| Texto do versículo (`textSize`) | `22sp` | **`18sp`** |
| Referência (`layout_marginTop`) | `16dp` | **`10dp`** |

Mantêm-se: cantos arredondados (`clipToOutline` + `bg_verse_hero`), a imagem `centerCrop`, o overlay de legibilidade (`bg_verse_overlay`), o texto branco com sombra e os botões por baixo, na zona clay.

---

## 2. Ícone de copiar reconhecível (`ic_copy.xml`)

O botão de copiar usava o emoji de prancheta (`📋`), que não representava bem "copiar". Foi substituído pelo símbolo **universal de copiar — dois retângulos sobrepostos**.

- Novo `res/drawable/ic_copy.xml`: vector drawable desenhado à mão (path do Material `content_copy`), `android:tint="@color/lifinity_text"` e `fillColor` branco — **exatamente o padrão do `ic_share.xml`** (cor escura, lê-se bem sobre o botão claro `btn_secondary_clay`).
- No `activity_inspiration.xml`, o `copyVerseButton` deixou de ser um `<Button>` com texto e passou a um **`<ImageView>`** com `src="@drawable/ic_copy"`, com o **mesmo estilo do botão de partilhar** ao lado (`btn_secondary_clay`, `padding=14dp`, `scaleType=fitCenter`, `clickable`/`focusable`, `contentDescription`).
- No Java, o campo `copyVerseButton` mudou de `Button` para `ImageView`. O `findViewById` e o `setOnClickListener(... copyCurrentVerseToClipboard())` funcionam igual (são métodos de `View`). A função de copiar **não mudou**.

---

## 3. Favoritos com "Mostrar mais / Mostrar menos"

A secção FAVORITOS mostrava **todos** os favoritos de uma vez, ficando grande e confusa. Agora:

- mostra por defeito só os **4 mais recentes**;
- se houver mais de 4, aparece por baixo um botão **"Mostrar mais (N)"** (ghost, discreto) que expande para **todos**;
- expandido, o botão passa a **"Mostrar menos"** e volta a colapsar para 4.

**"Mais recentes":** o backend (`inspirationController.getFavorites`) já devolve a lista por **`ORDER BY fv.created_at DESC`** — ou seja, **os primeiros já são os mais recentes**. Por isso basta cortar os 4 primeiros, sem reordenar.

**Interação com o filtro de tema (já existente):** o corte aplica-se à lista **já filtrada** pelo tema selecionado. Em `renderFavorites()` calcula-se primeiro o `displayed` (favoritos do tema), e só depois se limita a 4 / se mostra o botão — logo "mostrar mais" mostra todos **desse tema**. Ao trocar de tema no Spinner, a expansão **recomeça colapsada** (`favoritesExpanded = false`), para cada tema começar nos 4 mais recentes.

Implementação (`InspirationActivity.java`):
- Novo `favoritesExpanded` + constante `FAVORITES_COLLAPSED_COUNT = 4`.
- `renderFavorites()`: limita o loop a `favoritesExpanded ? total : min(4, total)` e, se `total > 4`, adiciona o botão de alternância no fim do `inspirationFavoritesContainer` (criado por código, sem XML novo).
- `createToggleFavoritesButton(total)`: `Button` ghost (`btn_ghost_clay`, cor `lifinity_primary`, altura `height_button_secondary`); o clique inverte `favoritesExpanded` e chama `renderFavorites()`.

---

## Ficheiros tocados

- `res/layout/activity_inspiration.xml` — banner mais baixo + botão de copiar (ImageView).
- `res/drawable/ic_copy.xml` — **novo** ícone de copiar.
- `InspirationActivity.java` — campo `copyVerseButton` (Button→ImageView), estado/lógica do "mostrar mais/menos" e reset ao trocar de tema.

## Lições
- Preferir reduzir os elementos pesados (aspas a 56sp, padding) e manter `wrap_content` a impor altura fixa — evita cortar versículos longos.
- Reaproveitar o padrão visual já existente (o `ic_share` como ImageView) deixa os dois botões coerentes sem inventar estilo novo.
- Quando o backend já ordena (`created_at DESC`), "mais recentes" é só cortar os primeiros — não é preciso reordenar no cliente.
