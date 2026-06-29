# `InspirationActivity.java` — versículos (dia/aleatório, favoritos, partilha)

## Papel
Mostra o **versículo do dia** (com banner), permite pedir um **aleatório**, **guardar/remover favoritos**,
**filtrar favoritos por tema**, **copiar** e **partilhar** um versículo para uma conversa.

## `onCreate`
Liga os campos do versículo (modo, tema, texto, referência), os botões (Guardar/Aleatório/Diário/Copiar/
**Partilhar**), o `Spinner` de tema e o contentor de favoritos; configura a barra e o sino; e chama
`loadInitialData()` (versículo do dia + favoritos).

## Versículo do dia / aleatório
- `loadDailyVerse` (`GET /inspiration/daily`) e `loadRandomVerse` (`GET /inspiration/random`) → guardam em
  `currentVerse` e chamam `bindCurrentVerse(modo)` que escreve modo, tema, texto e referência. O **banner**
  (imagem de fundo + overlay) é só no XML; o Java não mexe nas cores. Ver
  [Inspiração: banner/filtro/partilha](INSPIRACAO_BANNER_FILTRO_PARTILHA_2026-06-26.md).
  > **2026-06-29:** a altura fixa do banner subiu de **200dp → 250dp** (só no XML) para a **referência**
  > dos versículos mais longos (ex.: João 14:27) deixar de cortar. Ver
  > [RETOQUES_TAREFAS_E_INSPIRACAO_2026-06-29.md](RETOQUES_TAREFAS_E_INSPIRACAO_2026-06-29.md).

## Favoritos + filtro por tema
- `loadFavorites` (`GET /inspiration/favorites`) enche a lista `favorites`.
- **`bindFavorites` = `setupThemeSpinner()` + `renderFavorites()`:**
  - `setupThemeSpinner` constrói as opções do `Spinner`: `"Todos"` + **temas únicos** dos favoritos
    (ignora os sem tema); esconde o filtro se não houver temas. Usa a *flag* `suppressThemeSpinnerEvent`
    para não disparar render duplicado ao repovoar.
  - `renderFavorites` filtra `favorites` por `selectedFavoriteTheme` e desenha um cartão por versículo
    (criado **programaticamente** em `createFavoriteView`, com botões "Partilhar" e "Remover").
- `toggleFavorite` (`POST /inspiration/favorite/{idverse}`) alterna o favorito e recarrega a lista.

## Copiar e partilhar
- **Copiar:** `copyCurrentVerseToClipboard` põe o texto no clipboard (`ClipboardManager`).
- **Partilhar** (`shareVerse`): formata o conteúdo `«"texto" — Livro cap:verso»`, faz
  `GET chat/conversations` (com `Toast` de loading), abre um **`AlertDialog`** com os nomes das conversas
  **existentes** e, ao escolher, envia com `POST chat/conversations/{id}/messages`. **Só** conversas
  existentes — não cria conversas nem lista amigos/grupos. Se não houver conversas, avisa.

## Ligações
- **APIs/Backend:** [`InspirationApi`](api/InspirationApi.java.md), [`ChatApi`](api/ChatApi.java.md)
  (partilha). **Model:** `Verse`.
- **Detalhe das 3 melhorias:** [INSPIRACAO_BANNER_FILTRO_PARTILHA_2026-06-26.md](INSPIRACAO_BANNER_FILTRO_PARTILHA_2026-06-26.md).
