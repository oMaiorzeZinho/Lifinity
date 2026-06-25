# `backend/src/controllers/userController.js` — perfil, ranking, conta e uploads

> ⚠️ **Atualização 2026-06-25:** em `updatePassword`, depois de confirmar a password atual, a **nova password não pode ser igual à atual** (`bcrypt.compare(newPassword, hashAtual)` → `400` se igual). Mesma validação foi adicionada à recuperação por código — ver [Recuperação de palavra-passe](../../../RECUPERACAO_PALAVRA_PASSE_2026-06-25.md).

## Papel no projeto
Gere o utilizador: **ranking**, pesquisa, alterar password/username/bio, **upload de avatar/cover**, apagar conta e **perfil público**. Montado em `/api/users`.

## Setup e helpers
```js
const PUBLIC_USER_FIELDS = "iduser, username, email, xp, level, avatar, cover_image, bio, created_at";
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const normalizeUsername = (u) => typeof u === "string" ? u.trim() : "";
const getPublicUserById = async (iduser, executor = db) => { SELECT ${PUBLIC_USER_FIELDS} ... return users[0] || null; };
```
- `PUBLIC_USER_FIELDS` — lista de colunas "seguras" a devolver (note-se que **nunca** inclui `password`). Centraliza o que é público.
- `getPublicUserById` — helper reutilizável para devolver o utilizador atualizado depois de mudanças.

## `getRanking`
```js
SELECT iduser, username, xp, level, avatar FROM USER ORDER BY xp DESC LIMIT 10
```
**Top 10** por XP. Simples e direto. Alimenta a página de Ranking.

## `searchUsers`
```js
SELECT iduser, username, level FROM USER WHERE username LIKE ? AND iduser != ? LIMIT 5
// param: [`%${query}%`, req.user.iduser]
```
Procura por nome (`LIKE %query%`), **excluindo o próprio**, máx. 5 resultados. O `%...%` faz correspondência parcial.

## `updatePassword`
- Valida que ambas as passwords vêm e que a nova tem ≥6 caracteres.
- Lê o hash atual, confirma a password atual com **`bcrypt.compare`** (401 se errada).
- Faz **hash da nova** (genSalt 10 + hash) e atualiza. Boa prática: exige a password atual antes de mudar.

## `updateUsername`
- Valida tamanho (3–30).
- Verifica **unicidade**: `SELECT ... WHERE username = ? AND iduser != ?` → se já existe, **409 Conflict**.
- Atualiza e devolve o utilizador público atualizado.

## `deleteAccount` — apagar conta (com dupla confirmação)
```js
const connection = await db.getConnection();
// exige username + password no corpo
if (user.username !== username) return 400      // confirma o username
if (!bcrypt.compare(password, user.password)) return 401  // confirma a password
await connection.beginTransaction();
await connection.query("DELETE FROM USER WHERE iduser = ?", [iduser]);
await connection.commit();
```
- Pede **username + password** como confirmação (evita apagar por engano). Verifica os dois.
- Apaga numa **transação**. Como a BD tem `ON DELETE CASCADE` em quase tudo, apagar o `USER` arrasta tarefas, amizades, mensagens, etc. (ver `estrutura_lifinity.sql`).
- `try/catch/finally` com `rollback` em erro e `release` sempre.

## Uploads de imagem

### `deleteOldUploadedFile(storedPath)`
```js
if (!storedPath || !String(storedPath).startsWith('/uploads/')) return;
const filePath = path.join(UPLOADS_ROOT, String(storedPath).replace('/uploads/', ''));
try { fs.unlinkSync(filePath); } catch (err) { /* já não existe — sem problema */ }
```
Apaga do **disco** a imagem antiga (evita acumular lixo a cada novo upload). Só atua em caminhos que começam por `/uploads/` (defesa contra apagar ficheiros arbitrários). Falhas são ignoradas (o ficheiro pode já não existir).

### `updateUserImage(column, folder, successMessage)` — fábrica partilhada
```js
const updateUserImage = (column, folder, successMessage) => async (req, res) => {
    if (!req.file) return res.status(400)...        // multer põe o ficheiro em req.file
    // lê a imagem antiga → deleteOldUploadedFile
    const newPath = `/uploads/${folder}/${req.file.filename}`;
    UPDATE USER SET ${column} = ? WHERE iduser = ?
    // devolve o utilizador público atualizado
};
exports.updateAvatar = updateUserImage('avatar', 'avatars', 'Imagem de perfil atualizada.');
exports.updateCover  = updateUserImage('cover_image', 'covers', 'Imagem de fundo atualizada.');
```
- **Função-fábrica:** avatar e cover usam exatamente a mesma lógica, só mudando coluna/pasta/mensagem. Evita duplicar código.
- Guarda na BD o **caminho relativo** (`/uploads/...`), servido por `express.static` (ver `index.js`).
- ⚠️ Nota: `${column}`/`${folder}` são interpolados na query, mas **não** vêm do utilizador (são literais `'avatar'`/`'cover_image'`), portanto **não** há risco de SQL injection aqui.

### `updateBio`
- `bio` pode ser **vazia** (limpa o estado → guarda `NULL`); valida máx. 300 caracteres.

## `getPublicProfile` — perfil público de outro utilizador
Junta várias informações numa resposta:
1. Dados públicos do utilizador-alvo (sem email aqui: `iduser, username, level, avatar, cover_image, bio, created_at`).
2. **Badges em destaque** (`USER_BADGE_HIGHLIGHT` ∩ `USER_BADGE` ∩ `BADGE`), por posição.
3. **Fallback:** se não há destaques, mostra os **3 badges mais recentes** (`ORDER BY earned_at DESC LIMIT 3`).
4. **Total** de badges desbloqueados.
5. **Grupos em comum** entre o visitante (`currentUserId`) e o alvo (`profileUserId`): faz *self-join* de `GROUP_MEMBER` (os meus grupos ∩ os dele) e conta membros de cada.
- Devolve tudo combinado com *spread* (`...users[0]`). É o que alimenta o `PublicProfileModal.jsx`.

## Ligações
- **Tabelas:** `USER`, `USER_BADGE`, `USER_BADGE_HIGHLIGHT`, `BADGE`, `GROUP_MEMBER`, `GROUP_ENTITY`.
- **Middlewares:** `authMiddleware`, `uploadMiddleware`.
- **Rotas:** `userRoutes.js`. **Frontend:** `Ranking.jsx`, `Profile.jsx`, `AccountSettingsModal.jsx`, `ImageUploadModal.jsx`, `PublicProfileModal.jsx`.
