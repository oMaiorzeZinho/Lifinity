# Android — FAB "+", barra de XP, foto de perfil e destaque de conquistas (2026-06-26)

> Quatro melhorias funcionais/visuais à app Android, mantendo o **tema claro** e **sem alterar
> a lógica de negócio nem os endpoints** (só os *chamamos*). Para cada uma: o que estava errado,
> a decisão técnica e como ficou. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).

---

## 1 — Garantir o "+" no FAB de criar tarefa
**Ficheiros:** `res/drawable/ic_add.xml` (novo) · `res/layout/nav_bottom.xml`.

**Problema:** o FAB central (`@id/navFab`) aparecia como um círculo verde a emergir da barra **mas
sem o símbolo "+"**. A causa: com o tema **Material**, o `MaterialComponentsViewInflater` troca
automaticamente um `<Button>` por um **`MaterialButton`**, que tem *insets* próprios (6dp em cima/baixo)
e gere o seu próprio fundo e texto. Resultado: o `android:text="+"` deixava de renderizar de forma
fiável dentro do botão.

**Decisão:** em vez de lutar contra o `MaterialButton`, troca-se o `<Button>` por um **`ImageView`**
(que o inflater **não** substitui) com o "+" como **vector drawable** centrado:

- `ic_add.xml` — um "+" branco (`@color/lifinity_text_on_primary`) desenhado à mão como `<vector>`
  (linha horizontal + vertical), **sem depender de bibliotecas externas** (build robusta);
- o `ImageView` mantém o fundo `@drawable/bg_fab_clay`, `elevation="16dp"`, `padding="16dp"` +
  `scaleType="fitCenter"` → o "+" fica encorpado (~32dp), branco e **perfeitamente centrado** sobre
  o verde, com bom contraste;
- `clickable`/`focusable="true"` para receber toques. O **onClick não muda**: o `BottomNavHelper`
  já tratava o FAB como `View` (`findViewById(R.id.navFab)` + `setOnClickListener`), por isso continua
  a abrir o `CreateTaskActivity`.

---

## 2 — Barra de XP do perfil mais realista e bonita
**Ficheiros:** `res/drawable/xp_progress_bar.xml` (novo) · `res/layout/activity_profile.xml` ·
`ProfileActivity.java`.

**Problema visual:** a barra usava o `progressBarStyleHorizontal` por defeito — fina e "estranha".
**Problema de dados:** podia parecer **cheia** mesmo quando não devia.

**Drawable personalizado (`xp_progress_bar.xml`)** — `layer-list` com duas camadas arredondadas:
- `@android:id/background` (track): pílula clara (`lifinity_inset`) com contorno subtil
  (`lifinity_border`) — vê-se bem o "vazio";
- `@android:id/progress`: pílula verde com leve **gradiente** (`primary_light` → `primary`),
  envolvida num `<clip>` para ser recortada conforme o valor 0..100.

Aplicado via `android:progressDrawable`. **Detalhe essencial:** o `ProgressBar` horizontal limita a
altura do desenho pelo `maxHeight`; por isso o layout define `android:maxHeight`/`minHeight = 16dp`
(além de `layout_height="16dp"`) — sem isto a barra continuaria fina. Removidos `progressTint`/
`progressBackgroundTint` para não sobreporem as cores do drawable.

**Correção do cálculo (`ProfileActivity`):** a fórmula de XP/nível já estava **correta e igual ao
backend** (`calculateXpForLevel(n) = floor(100·(n−1)^1.5)`). O bug de "barra cheia" vinha de confiar
no campo `level` **guardado** (que podia estar dessincronizado do XP). Solução: derivar **sempre** o
nível a partir do XP (mesma fórmula do backend) quando há XP disponível — assim o nível mostrado e a
fração da barra são coerentes:

```java
int displayLevel = xp != null ? calculateLevelFromXp(safeXp)
                              : (level == null ? 1 : Math.max(level, 1));
```

A label por cima mostra agora o XP em falta **e a percentagem**:
`"219 XP para nivel 9  (47%)"`.

---

## 3 — Mudar a foto de perfil pela galeria (upload)
**Ficheiros:** `res/drawable/ic_camera.xml`, `bg_avatar_edit_badge.xml` (novos) ·
`res/layout/activity_profile.xml` · `api/UserApi.java` · `ProfileActivity.java`.
**Endpoint (já existente):** `PUT /users/me/avatar` (com `verifyToken`), campo multipart `image`.

**UI:** um **selo de câmara** (`@id/profileAvatarEditBadge`) sobreposto ao canto inferior direito do
avatar — círculo verde (`bg_avatar_edit_badge`, com anel branco) + ícone de câmara branco
(`ic_camera`, vector desenhado à mão). Discreto e coerente com o tema.

**Seleção sem permissões perigosas:** usa-se o **photo picker** moderno via
`registerForActivityResult(new ActivityResultContracts.GetContent())` e `launch("image/*")`.
O `GetContent` **não exige** permissões de armazenamento — é a abordagem recomendada. O launcher é
registado no `onCreate` (antes do estado *STARTED*).

**Upload (Retrofit + OkHttp):** método novo no `UserApi`:

```java
@Multipart
@PUT("users/me/avatar")
Call<JsonObject> updateAvatar(@Header("Authorization") String token,
                              @Part MultipartBody.Part image);
```

No `ProfileActivity.uploadAvatar(Uri)`:
1. lê os bytes do `Uri` via `ContentResolver` (`openInputStream` → `ByteArrayOutputStream`, sem libs);
2. **valida no cliente**: tamanho ≤ **2MB** (igual ao backend) e tipo ∈ {jpeg, png, webp};
3. cria a `MultipartBody.Part` (campo `"image"`, nome com extensão coerente com o MIME);
4. envia com `Authorization: Bearer <token>`.

**Após sucesso:** a resposta traz `{ message, user: { avatar } }`; extrai-se o novo caminho e:
- atualiza-se a foto no **cartão de perfil** (`AvatarLoader`),
- a **miniatura na barra** (`navTabProfileAvatar`),
- e o campo `avatar` no **cache** das `SharedPreferences` (preservando os restantes campos do user).
Feedback por `Toast` ("A enviar foto..." → "Foto atualizada."); erros de leitura/rede/tamanho/formato
mostram mensagem clara.

---

## 4 — Destacar conquistas (escolher as 3 em destaque)
**Ficheiros:** `res/layout/item_achievement.xml` · `adapters/AchievementAdapter.java` ·
`api/AchievementApi.java` · `AchievementsActivity.java`.
**Endpoint (já existente):** `PUT /achievements/highlights` com `{ highlights: [ {idbadge, position}… ] }`
(máx. 3, `position ∈ {1,2,3}`, só conquistas desbloqueadas). O `GET /achievements` devolve por
conquista `idbadge`, `unlocked`, `highlighted` e `position`.

**Distinção visual (requisito):** dois elementos com **estilos diferentes** no cartão da conquista:
- **selo de já-destacada** — `★ Destacada`, verde **sólido** (`btn_primary_clay`), só aparece nas que
  estão em destaque;
- **botão de ação** `@id/achievementHighlightButton` — **ghost/contorno** (`btn_ghost_clay`), só nas
  **desbloqueadas**, com texto que alterna: **"Destacar"** (ainda não destacada) ↔
  **"Remover destaque"** (já destacada — *toggle*). Conquistas **bloqueadas** não têm botão.

**Lógica (`AchievementsActivity`)** — ao tocar no botão de uma conquista desbloqueada:
- **já destacada** → remove-a dos destaques (lista atual menos esta);
- **não destacada e < 3 destaques** → adiciona na próxima posição livre;
- **não destacada e já há 3** → abre um **`AlertDialog`** (tema claro existente, via `alertDialogTheme`)
  a listar os 3 destaques atuais; o utilizador escolhe **qual substituir** e a nova entra no lugar.

Em todos os casos, as **posições são reatribuídas 1..n** pela ordem da lista e envia-se o `PUT`
(corpo construído com `JsonObject`/`JsonArray`). **Validações:** nunca mais de 3, posições 1..3, só
desbloqueadas (reforçado no cliente; o backend revalida). Após sucesso (`Toast` "Destaques
atualizados.") **recarrega-se** a lista para refletir os selos; ao voltar ao **Perfil**, o `onResume`
relê os destaques, por isso as 3 conquistas em destaque mostram as novas escolhas.

O `AchievementAdapter` ganhou um `OnHighlightClickListener` (callback) que a Activity implementa —
o adapter trata só da apresentação; a regra de negócio (limite/substituição) fica na Activity.

---

## Notas de robustez
- `GetContent` evita permissões de armazenamento (sem `READ_MEDIA_*`/`READ_EXTERNAL_STORAGE`).
- `RequestBody.create(MediaType, byte[])` e `MediaType.parse(...)` estão *deprecated* no Kotlin do
  OkHttp 4, mas mantêm as sobrecargas para Java — daí a nota "deprecated API" no build (inofensiva).
- Todas as `Call` novas (`avatarUploadCall`, `updateHighlightsCall`) são canceladas no `onDestroy`.
