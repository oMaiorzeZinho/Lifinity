# `backend/src/middlewares/uploadMiddleware.js` — upload de imagens (avatares e covers)

> ⚠️ **Atualização 2026-06-24:** novo `uploadContactAttachments` (anexos do contacto, SEM `req.user`, lista branca com PDF/texto, 5MB, máx. 3) e `handleUploadErrors` mais genérico. Ver [Melhorias no formulário de contacto](../../../MELHORIAS_FORMULARIO_CONTACTO_2026-06-24.md).

## Papel no projeto
Configura o **multer** para receber uploads de imagens (avatar e imagem de capa do perfil), guardá-las no disco com nomes únicos, validar formato/tamanho e transformar erros em respostas JSON claras. Introduzido na FASE B (commit `7f3548f7`).

## Bloco a bloco

```js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
```
- `multer` trata multipart/form-data (uploads). `path` ajuda a construir caminhos; `fs` mexe no sistema de ficheiros.
- Só se aceitam **JPEG, PNG e WebP**. O limite é **2 MB** (`2 * 1024 * 1024` bytes).

### Fábrica de uploaders — `createUploader(folder, prefix)`
```js
const createUploader = (folder, prefix) => {
    const destination = path.join(__dirname, '..', '..', 'uploads', folder);
    fs.mkdirSync(destination, { recursive: true });
```
- É uma **função-fábrica**: recebe a subpasta (`avatars`/`covers`) e um prefixo de nome, e devolve um middleware multer já configurado. Evita repetir o código duas vezes.
- `destination` aponta para `backend/uploads/<folder>` (sobe dois níveis a partir de `src/middlewares`).
- **`fs.mkdirSync(destination, { recursive: true })`** — cria a pasta caso não exista (ex.: projeto acabado de clonar). `recursive` cria também pastas-pai em falta.

```js
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, destination),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `${prefix}_${req.user.iduser}_${Date.now()}${ext}`);
        }
    });
```
- `diskStorage` guarda os ficheiros **no disco** (não em memória).
- `destination` — sempre a pasta calculada acima.
- `filename` — gera um **nome único**: `prefixo_<idUtilizador>_<timestamp>.<ext>`, ex.: `avatar_3_1718020000000.png`.
  - `req.user.iduser` vem do **`authMiddleware`** (por isso o upload tem de correr depois da autenticação).
  - `Date.now()` (milissegundos) evita colisões e força o browser a recarregar a imagem nova (URL diferente → sem cache antiga).
  - `path.extname(...).toLowerCase()` mantém a extensão original em minúsculas.

```js
    return multer({
        storage,
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return cb(new Error('Formato inválido. Usa JPG, PNG ou WebP.'));
            }
            cb(null, true);
        },
        limits: { fileSize: MAX_FILE_SIZE }
    });
};
```
- `fileFilter` — rejeita ficheiros cujo `mimetype` não esteja na lista (passa um `Error` ao callback). Senão, `cb(null, true)` aceita.
- `limits.fileSize` — multer corta automaticamente ficheiros acima de 2 MB (gera o erro `LIMIT_FILE_SIZE`).

```js
exports.uploadAvatar = createUploader('avatars', 'avatar');
exports.uploadCover  = createUploader('covers', 'cover');
```
Cria e exporta dois uploaders prontos: um para avatares, outro para capas.

### Tratamento de erros — `handleUploadErrors`
```js
exports.handleUploadErrors = (uploadHandler) => (req, res, next) => {
    uploadHandler(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'A imagem não pode exceder 2MB.' });
        }
        return res.status(400).json({ message: err.message || 'Erro ao carregar a imagem.' });
    });
};
```
- É um **wrapper** (função que recebe outra função). Envolve, por exemplo, `uploadAvatar.single('image')`.
- Corre o upload; se houver erro, em vez do erro "feio" por defeito do multer, devolve **JSON 400** com mensagem amigável (mensagem específica para o caso de exceder 2 MB).
- Uso típico na rota: `handleUploadErrors(uploadAvatar.single('image'))`.

**Porquê este wrapper:** por defeito, um erro do multer dispara o handler de erros global do Express e dá uma resposta pouco clara. Este wrapper garante mensagens consistentes e legíveis no frontend.

## Ligações
- **Exporta:** `uploadAvatar`, `uploadCover`, `handleUploadErrors`.
- **Usado por:** `backend/src/routes/userRoutes.js` (rotas de upload de avatar/cover), em conjunto com `userController`.
- **Depende de:** `authMiddleware` ter corrido antes (precisa de `req.user.iduser`).
- **Servidor de ficheiros:** o `index.js` serve a pasta `uploads/` como estática para as imagens ficarem acessíveis por URL.
