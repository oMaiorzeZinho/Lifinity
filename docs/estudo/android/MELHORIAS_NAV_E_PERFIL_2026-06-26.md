# Android — Melhorias na barra de navegação e no Perfil (2026-06-26)

> Cinco melhorias **visuais** (UI/layout) à barra inferior e à página de Perfil, mantendo o
> tema claro e **sem mexer em lógica de negócio, rede ou navegação**. Para cada uma: o que
> estava errado e como foi resolvido. Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).

---

## 1 — Ícones consistentes na barra (Material Icons como vector drawables)
**Ficheiros:** `res/drawable/ic_nav_tasks.xml`, `ic_nav_community.xml`, `ic_nav_inspiration.xml`,
`ic_nav_profile.xml` (novos) · `res/layout/nav_bottom.xml` · `BottomNavHelper.java`.

**Problema:** as 4 tabs usavam **caracteres/emojis misturados** de famílias diferentes — Tarefas `☰`
(`&#9776;`), Comunidade um **emoji a cores** `👥` (`&#128101;`, que destoava por completo), Inspiração
`✦` (`&#10022;`) e Perfil um círculo `○` (`&#9711;`). Pareciam de origens diferentes e o emoji
colorido "saltava à vista".

**Correção:** substituir todos os ícones-texto (`TextView`) por **ícones vetoriais** (`ImageView` +
`<vector>`), todos da mesma família **Material Icons** e do mesmo estilo (*filled*):

| Tab | Ícone Material | Caminho (path) |
|-----|----------------|----------------|
| Tarefas | `checklist` | linhas + dois visto |
| Comunidade | `group` | duas pessoas |
| Inspiração | `star` | estrela |
| Perfil | `person` | pessoa (fallback do avatar — ver §2) |

**Porque vetores desenhados à mão (e não uma biblioteca):** copiar os `pathData` oficiais do Material
para ficheiros `<vector>` locais **não depende de descarregar nada** durante a build — é a opção mais
robusta (zero risco de falhar por rede/repositório). Cada vector tem `fillColor` por defeito
`@color/lifinity_text_secondary`; o `BottomNavHelper` **recolore por estado** com
`ImageView.setColorFilter(...)` — verde (`lifinity_primary`) na tab ativa, cinza na inativa —
substituindo o antigo `setTextColor` dos ícones-texto. Os rótulos por baixo mantêm-se.

---

## 2 — Miniatura da foto de perfil na tab "Perfil"
**Ficheiros:** `res/layout/nav_bottom.xml` · `BottomNavHelper.java` (reaproveita `utils/AvatarLoader`
e `utils/ImageUrlHelper`, já existentes).

**Objetivo:** na tab Perfil, mostrar a **foto real** do utilizador (circular) em vez de um ícone
genérico; quando não há foto, mostrar o ícone `person` (nunca vazio).

**Como:** o ícone da tab Perfil passou a ser um `FrameLayout` 24dp com **dois** `ImageView`
sobrepostos:
1. `navTabProfileIcon` — o ícone `person` (fallback, recolorido por estado);
2. `navTabProfileAvatar` — a foto, **por cima**, inicialmente `GONE`.

No `BottomNavHelper.setup()` (que já corre em **todas** as activities principais) chama-se
`AvatarLoader.load(avatar, caminho, null, null)`: lê-se o avatar do utilizador guardado nas
`SharedPreferences` (`lifinity_prefs` → `user` → `User.getAvatar()`, o **mesmo sítio** que o
`ProfileActivity` usa), e o Glide carrega-o com `circleCrop` (fica redondo). Se não houver foto ou se
falhar, a `ImageView` fica `GONE` e aparece o `person` por baixo. Assim a miniatura aparece **em todos
os ecrãs**, sempre coerente.

---

## 3 — FAB "+" que NÃO aparecia: a causa REAL
**Ficheiros:** os 5 `<include>` do nav (`activity_tasks/profile/ranking/inspiration/community.xml`) ·
`res/values/dimens.xml` · `res/layout/nav_bottom.xml`.

**Sintoma:** o botão flutuante "+" de criar tarefa **não aparecia**, apesar de a função existir.
Tentativas anteriores (margem negativa; depois um `FrameLayout` de 96dp com o FAB ao topo) não
resolveram.

**Causa real (desta vez encontrada):** o `nav_bottom.xml` é um `FrameLayout` de 96dp (barra 70dp em
baixo + 26dp de folga em cima para o FAB *emergir*). Mas **todos os `<include>`** fixavam
`android:layout_height="wrap_content"`. No Android, a altura indicada no `<include>` **sobrepõe-se** à
do layout incluído → o `FrameLayout` passava a `wrap_content`, que **colapsa para ~70dp** (a altura do
filho mais alto, a barra). Resultado: o FAB (`gravity="top"`, 64dp) deixava de ter os 26dp de folga e
ficava **espremido dentro da barra**, em vez de emergir acima dela. O mecanismo "emergir 26dp" nunca
chegava a funcionar — o penso anterior estava correto no `nav_bottom`, mas era **anulado pelo
`<include>`**.

**Correção (robusta e DRY):** criar `@dimen/nav_total_height = 96dp` como **fonte única de verdade** e
usá-la **tanto** no `FrameLayout` do `nav_bottom` **como** em cada um dos 5 `<include>`
(`android:layout_height="@dimen/nav_total_height"`). Com a altura correta, a barra fica em baixo e o
FAB de 64dp emerge ~26dp acima dela, **totalmente visível, centrado e clicável**, com a sombra
(`elevation="16dp"` > 12dp da barra). Os `clipChildren`/`clipToPadding="false"` já garantiam que nada
é cortado. O `onClick` do FAB (abrir `CreateTaskActivity`) manteve-se intacto no `BottomNavHelper`.
Como o `<include>` está nas 5 telas, a correção foi aplicada às 5 (consistência).

---

## 4 — Cabeçalho das Tarefas a sobrepor-se ao fazer scroll
**Ficheiro:** `res/layout/activity_tasks.xml` (cabeçalho fixo + título "Atividades").

**Problema:** ao fazer scroll, o título grande "Atividades" e a saudação pareciam **chocar/sobrepor-se**
ao lockup "Lifinity" do cabeçalho. Causa: o cabeçalho fixo era **transparente** (sem fundo), por isso
o conteúdo a deslizar para cima ficava visível "por trás" da marca — os dois textos pareciam colidir.

**Correção:** dar ao cabeçalho um **fundo opaco** (`@color/lifinity_bg`, igual ao topo do fundo da app)
e uma **elevação** (`6dp`). Agora o conteúdo desaparece **limpo** por baixo do cabeçalho ao deslizar (a
elevação dá ainda uma sombra subtil que separa a marca do conteúdo, estilo *app bar*). Adicionou-se
também respiro acima do título ("Atividades" com `layout_marginTop="12dp"`) e mais folga no cabeçalho
(`paddingBottom` 12→14dp). O mesmo tratamento de cabeçalho foi aplicado ao Perfil, por coerência.

---

## 5 — "Mais no Lifinity" reorganizado (Conquistas com "Ver todas")
**Ficheiros:** `res/layout/activity_profile.xml` · `ProfileActivity.java`.

**Problema:** a secção "MAIS NO LIFINITY" tinha 3 itens — **Notificações**, **Conquistas**,
**Definições** — mas Notificações e Definições **já estavam no cabeçalho** do perfil (o sino e a
engrenagem). Era redundante.

**Correção:**
- **Removida** a secção inteira (título + os 3 itens-cartão) do corpo do perfil.
- **Mantidos** no cabeçalho: o sino (Notificações, ligado pelo `HeaderHelper.setupBell`) e a
  engrenagem (Definições, `headerSettingsIcon` — continua a só existir no Perfil).
- Para as **Conquistas** continuarem acessíveis, o título da secção "CONQUISTAS" passou a uma **linha**
  com um botão **"Ver todas ›"** alinhado à direita (`profileViewAllAchievementsButton`, pílula menta),
  que abre o **mesmo** `AchievementsActivity` que o item removido abria.
- **Java:** retirados os 3 `setOnClickListener` dos itens removidos (senão `findViewById` devolvia
  `null` → *crash*) e ligado o novo botão a `openAchievementsActivity()`. Nada fica órfão.

---

## Ficheiros tocados (resumo)
**Novos:** `res/drawable/ic_nav_{tasks,community,inspiration,profile}.xml`,
`docs/estudo/android/MELHORIAS_NAV_E_PERFIL_2026-06-26.md`.
**Editados:** `res/layout/nav_bottom.xml`, `activity_tasks.xml`, `activity_profile.xml`,
`activity_ranking.xml`, `activity_inspiration.xml`, `activity_community.xml`, `res/values/dimens.xml`,
`BottomNavHelper.java`, `ProfileActivity.java`.

## Validação e notas
- `gradlew :app:assembleDebug` → **BUILD SUCCESSFUL** (43s). (Aviso de API deprecada em `TasksActivity`
  é **pré-existente**, não vem destas alterações.)
- Recomenda-se confirmação visual no dispositivo (a build valida a compilação, não o aspeto).
- O FAB "+" passou a aparecer também nas outras telas que já o incluíam (Comunidade, Inspiração,
  Perfil, Ranking) — era o comportamento pretendido do layout, antes escondido pelo bug. Limitar o FAB
  só às Tarefas seria uma alteração de **lógica/navegação** (fora do âmbito desta sessão).
- **Fora do âmbito (intocado):** upload de fotos, destacar conquistas, endpoints e lógica de negócio.
