# Inspiração e Comunidade — banner e cabeçalhos sobrepostos (2026-06-27)

Três correções **cirúrgicas** de layout (só XML), tema claro mantido:
1. banner do versículo da Inspiração finalmente **pequeno** (a causa real era outra);
2. cabeçalho da **Inspiração** a sobrepor-se ao conteúdo;
3. cabeçalho da **Comunidade** com o mesmo problema.

> Validado com `gradlew :app:assembleDebug` (BUILD SUCCESSFUL).

---

## 1. Banner do versículo gigante — causa real: a imagem a inflar a faixa

**Ficheiro:** `res/layout/activity_inspiration.xml`, `FrameLayout @id/inspirationVerseHero`.

Na ronda anterior tinha-se reduzido `minHeight`, padding e tamanhos de texto, mas a faixa **continuava enorme**. A causa real é estrutural:

- o `FrameLayout` estava em `layout_height="wrap_content"` (+ `minHeight`);
- lá dentro, a `ImageView` de fundo (`bible_banner`) está em `layout_height="match_parent"`.

Numa parent `wrap_content`, uma `ImageView` `match_parent` **com uma foto grande infla a medição**: o sistema mede o conteúdo intrínseco da imagem e estica o `FrameLayout` muito para além da altura do texto. Resultado: a imagem aparecia como um **grande bloco por baixo** do versículo. Mexer só no `minHeight` não resolvia — era a imagem a impor a altura.

**Solução (fiável): altura FIXA.**

```xml
<FrameLayout
    android:id="@+id/inspirationVerseHero"
    android:layout_width="match_parent"
    android:layout_height="200dp"   <!-- era wrap_content + minHeight -->
    android:layout_margin="16dp"
    android:background="@drawable/bg_verse_hero"
    android:clipToOutline="true">
```

Com altura fixa, a `ImageView` `match_parent` já **não pode inflar nada** — preenche exatamente os 200dp em `centerCrop` e o texto fica por cima, numa faixa compacta. Mantêm-se os cantos arredondados (`clipToOutline` + `bg_verse_hero`), o overlay de legibilidade (`bg_verse_overlay`) e o texto branco. Os botões (Guardar/partilhar/copiar/Aleatório/Diário) continuam por baixo, na zona clay (não foram tocados).

Compromisso aceite: versículos muito longos podem cortar ligeiramente — o objetivo é a faixa pequena. (Uma altura que adaptasse ao texto sem a imagem inflar exigiria medir o texto e não é fiável só em XML; a altura fixa é a abordagem robusta.)

---

## 2. e 3. Cabeçalhos da Inspiração e da Comunidade sobrepostos

**Ficheiros:** `res/layout/activity_inspiration.xml` e `res/layout/activity_community.xml`, o `LinearLayout` do HEADER (1.º filho, "HEADER (marca + sino)").

**Causa:** estes cabeçalhos **não tinham** `background` nem `elevation`. Sem elevação, o conteúdo do `NestedScrollView` desenha-se **por cima** do cabeçalho (ordem de desenho), por isso o título da página colidia com o logo/wordmark. O **Perfil** e as **Tarefas** já resolvem isto com um cabeçalho **opaco e elevado**.

**Correção** (idêntica nos dois ficheiros, igual ao Perfil/Tarefas — só dois atributos, sem mexer na estrutura):

```xml
<LinearLayout
    ...
    android:background="@color/lifinity_bg"
    android:elevation="6dp"
    ... >
```

Assim o cabeçalho fica opaco e por cima, e o conteúdo desliza limpo por baixo ao fazer scroll.

---

## Ficheiros tocados
- `res/layout/activity_inspiration.xml` — banner com altura fixa (200dp) + header opaco/elevado.
- `res/layout/activity_community.xml` — header opaco/elevado.

## Lições
- `match_parent` numa `ImageView` **dentro** de uma parent `wrap_content` deixa a imagem **impor a altura** — para um banner de altura controlada, fixa a altura da parent.
- Cabeçalhos fixos precisam de `background` opaco + `elevation` para o conteúdo scrollável desaparecer por baixo (senão desenha-se por cima e "colide").
- Reaproveitar o padrão já validado (Perfil/Tarefas) garante coerência sem inventar nada.
