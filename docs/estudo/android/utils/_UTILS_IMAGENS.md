# Android — Utils de imagens: `ImageUrlHelper` + `AvatarLoader` (2 ficheiros)

> Duas classes utilitárias (`final`, construtor privado — não se instanciam, só têm métodos `static`) que
> tratam de **mostrar avatares** de forma consistente em toda a app. São a versão Android do
> `frontend/src/utils/imageUrl.js`.

## `ImageUrlHelper` — montar o URL completo da imagem
```java
public static String build(String path) {
    if (TextUtils.isEmpty(path)) return null;
    if (path.startsWith("http")) return path;
    String root = BuildConfig.API_BASE_URL.replaceFirst("/api/?$", "");
    if (root.endsWith("/")) root = root.substring(0, root.length() - 1);
    return root + path;
}
```
**Problema que resolve:** o backend guarda o avatar como um **caminho relativo** (ex.:
`/uploads/avatars/x.jpg`), mas o `API_BASE_URL` aponta para `.../api/`. As imagens **não** estão sob `/api`
— estão na raiz do servidor. Então:
- `null`/vazio → devolve `null` (não há foto; usa-se o *placeholder*).
- já começa por `http` → devolve tal como está (URL absoluto).
- caso contrário → tira o sufixo **`/api`** do `API_BASE_URL` (com o regex `/api/?$`) e cola o caminho.
  Ex.: `http://192.168.1.200:3000/api/` + `/uploads/avatars/x.jpg` → `http://192.168.1.200:3000/uploads/avatars/x.jpg`.
- O `if (root.endsWith("/"))` evita a **barra dupla** (`//`) na junção.

Isto replica **exatamente** o regex `/\/api\/?$/` do helper da web — por isso o comportamento é igual nas
duas plataformas.

## `AvatarLoader` — decidir entre foto real e placeholder (Glide)
```java
public static void load(ImageView image, String avatarPath, TextView initialView, String username) {
    if (initialView != null) initialView.setText(initialOf(username)); // inicial no placeholder
    if (image == null) return;
    String url = ImageUrlHelper.build(avatarPath);
    if (TextUtils.isEmpty(url)) { image.setVisibility(View.GONE); return; }  // sem foto -> placeholder
    image.setVisibility(View.VISIBLE);
    Glide.with(image.getContext()).load(url).circleCrop()
         .listener(/* onLoadFailed -> esconde a ImageView */)
         .into(image);
}
```
**Padrão de avatar usado em toda a app:** um *placeholder* (círculo claro com a **inicial** do nome, já no
layout) e, **por cima**, uma `ImageView` circular. Este método decide o que se vê:
- escreve sempre a **inicial** no placeholder (fallback garantido);
- se **não há** caminho de avatar → esconde a `ImageView` (`GONE`) e deixa ver o placeholder por baixo;
- se **há** → usa o **Glide** para carregar a foto, com **`circleCrop()`** (recorta-a redonda) e mostra a
  `ImageView` por cima;
- **`onLoadFailed`** (foto não carregou, ex.: rede/404) → volta a esconder a `ImageView`, reaparecendo o
  placeholder. Robustez: nunca fica um quadrado vazio.
- **`initialOf(username)`** — primeira letra em maiúscula, ou `"?"` se vazio.

**Porque Glide:** carregar imagens de rede à mão (thread, *bitmap*, cache, reciclagem em listas) é
complicado e propenso a fugas de memória. O Glide trata disso tudo com uma linha
(`Glide.with(...).load(...).into(...)`).

## Ligações
- **Onde os caminhos nascem:** o backend (`/uploads/avatars/...`), via `User.getAvatar()`/
  `RankingUser.getAvatar()`.
- **Quem usa:** `ProfileActivity`, `RankingActivity`/`RankingAdapter`, `BottomNavHelper` (miniatura),
  `FriendsActivity`/`GroupsActivity` (fallbacks).
- **Equivalente web:** `frontend/src/utils/imageUrl.js`.
- **Dependência:** Glide (ver [`config/_CONFIG_GRADLE_MANIFEST.md`](../config/_CONFIG_GRADLE_MANIFEST.md)).
