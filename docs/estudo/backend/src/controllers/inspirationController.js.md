# `backend/src/controllers/inspirationController.js` — inspiração diária (versículos)

## Papel no projeto
Trata o módulo de inspiração: **versículo do dia**, favoritos (listar e alternar) e versículo aleatório. Montado em `/api/inspiration`.

## Helper `getDayOfYear(date)`
```js
const start = new Date(date.getFullYear(), 0, 0);
const diff = date - start;
return Math.floor(diff / (1000*60*60*24));
```
Calcula o **dia do ano** (1–366): diferença, em dias, entre a data e o início do ano. É a base do "versículo do dia" determinístico.

## `getDailyVerse` — versículo do dia (determinístico)
```js
const total = COUNT(*) FROM bible_verse;
const dayOfYear = getDayOfYear(today);
const offset = dayOfYear % total;
SELECT * FROM bible_verse ORDER BY idverse ASC LIMIT 1 OFFSET ?   // [offset]
// + verifica se é favorito do utilizador → isFavorite
```
- Escolhe o versículo pelo **resto** `dayOfYear % total`. Resultado:
  - **Toda a gente vê o mesmo versículo no mesmo dia** (não é aleatório).
  - **Muda automaticamente a cada dia** e dá a volta ao catálogo ao longo do ano.
- Junta `isFavorite` (true se o utilizador já o tem nos favoritos) para a UI mostrar o coração preenchido.
- **Porquê determinístico:** um "versículo do **dia**" deve ser estável durante o dia e igual para todos — daí a fórmula em vez de `RAND()`.
- Nota: usa nomes de tabela em minúsculas (`bible_verse`) — funciona porque o MySQL no Windows é *case-insensitive* nos nomes.

## `getFavoriteVerses`
```js
SELECT fv.idfavorite, bv.* (campos) FROM favorite_verse fv
INNER JOIN bible_verse bv ON fv.idverse = bv.idverse
WHERE fv.iduser = ? ORDER BY fv.created_at DESC
```
Lista os versículos favoritos do utilizador, mais recentes primeiro (junta favoritos ↔ versículos).

## `toggleFavoriteVerse` — alternar favorito
```js
if (já existe favorito) { DELETE ... ; return { isFavorite: false } }
INSERT INTO favorite_verse (iduser, idverse) VALUES (?, ?)
await safeUnlockAchievementsForUser(req.user.iduser);   // pode desbloquear "Versiculo Guardado"
return { isFavorite: true }
```
- **Toggle:** se já está favoritado, remove; senão, adiciona.
- Ao **adicionar**, tenta desbloquear conquistas (badges `verses_favorite_*`). Não o faz ao remover (faz sentido — remover não é uma conquista).

## `getRandomVerse`
```js
SELECT * FROM bible_verse ORDER BY RAND() LIMIT 1
// + isFavorite
```
Versículo **aleatório** (`ORDER BY RAND()`). Ao contrário do "do dia", este muda a cada pedido. (`RAND()` é simples mas pouco eficiente em tabelas enormes — irrelevante para o tamanho deste catálogo.)

## Ligações
- **Tabelas:** `BIBLE_VERSE`, `FAVORITE_VERSE`.
- **Conquistas:** `safeUnlockAchievementsForUser` (badges de versículos).
- **Rotas:** `inspirationRoutes.js`. **Frontend:** `Inspiration.jsx`, `DailyVerseWidget.jsx`. **Android:** `InspirationActivity`.
