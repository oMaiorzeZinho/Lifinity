# `backend/src/controllers/achievementController.js` — conquistas (endpoints)

## Papel no projeto
Expõe as conquistas ao frontend: **listar** (com estado desbloqueado/destacado), **definir destaques** (≤3) e **forçar verificação**. A lógica pesada está em `utils/achievements.js`; aqui é a "casca" HTTP.

## `getAchievements`
```js
await ensureAchievementSeeds();   // garante que a tabela BADGE está atualizada
SELECT b.*, ub.earned_at,
       CASE WHEN ub.idbadge IS NULL THEN FALSE ELSE TRUE END AS unlocked,
       CASE WHEN ubh.idbadge IS NULL THEN FALSE ELSE TRUE END AS highlighted,
       ubh.position
FROM BADGE b
LEFT JOIN USER_BADGE ub  ON ub.idbadge=b.idbadge AND ub.iduser=?
LEFT JOIN USER_BADGE_HIGHLIGHT ubh ON ubh.idbadge=b.idbadge AND ubh.iduser=?
WHERE b.is_active=TRUE ORDER BY b.sort_order ASC, b.idbadge ASC
```
- Devolve **todas** as conquistas ativas, marcando para o utilizador atual: `unlocked` (já ganhou?), `highlighted` (está em destaque?) e `position`.
- Os **`LEFT JOIN`** são a chave: trazem todos os badges, mesmo os **não** desbloqueados (ficam com `ub.idbadge` a NULL → `unlocked=false`). Assim a UI mostra também os que faltam.
- O `.map(...)` converte os 0/1 do MySQL em `Boolean` reais e a posição em número/`null`.

## `updateHighlights` — escolher os ≤3 destaques
Cadeia de **validações** antes de gravar:
1. `highlights` tem de ser array; máximo **3**.
2. Cada item: `idbadge` inteiro >0 e `position` ∈ {1,2,3}.
3. **Sem posições repetidas** (`Set` de posições do mesmo tamanho que a lista).
4. **Sem badges repetidos** (idem para idbadge).
5. **Só badges já desbloqueados** pelo utilizador (consulta `USER_BADGE`; se algum não estiver, **403**).

Depois, numa **transação**:
```js
DELETE FROM USER_BADGE_HIGHLIGHT WHERE iduser=?     // limpa os destaques atuais
INSERT INTO USER_BADGE_HIGHLIGHT (iduser, idbadge, position) VALUES ... // grava os novos
```
- Estratégia **"apagar tudo e reinserir"** — mais simples e fiável do que tentar atualizar item a item.
- ⚠️ Nota de estilo: faz `connection.release()` **manualmente** em cada `return` de erro (em vez de um `finally`). Funciona, mas é verboso e propenso a esquecimentos; um `try/finally` seria mais robusto.

## `checkAchievements`
```js
const unlocked = await unlockAchievementsForUser(iduser);
res.json({ unlockedCount: unlocked.length, unlocked });
```
Força a verificação/desbloqueio (chama o motor) e devolve o que foi desbloqueado agora. Útil para um botão "verificar conquistas" ou após ações.

## Ligações
- **Motor:** `utils/achievements.js` (`ensureAchievementSeeds`, `unlockAchievementsForUser`).
- **Tabelas:** `BADGE`, `USER_BADGE`, `USER_BADGE_HIGHLIGHT`.
- **Rotas:** `achievementRoutes.js`. **Frontend:** `Profile.jsx`. **Android:** `AchievementsActivity`.
