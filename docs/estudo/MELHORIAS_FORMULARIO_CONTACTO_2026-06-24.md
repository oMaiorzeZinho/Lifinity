# Melhorias no formulário de contacto público — 2026-06-24

> Três melhorias ao formulário **Contacte-nos** (público): email inteligente,
> campo de telefone (já existia, confirmado) e **anexos** de ficheiros enviados
> junto com o email para os funcionários. Mantidos o **anti-spam** (cooldown 60s
> por IP), o **escape de HTML** e o **modo simulação** do email.

Ficheiros tocados:
- Backend: `middlewares/uploadMiddleware.js`, `routes/contactRoutes.js`,
  `controllers/contactController.js`, `services/emailService.js`.
- Frontend: `src/pages/Contact.jsx`.
- `.gitignore` (+ `backend/uploads/contact/.gitkeep`).

---

## 1. Email inteligente (autenticado vs público)

A página `/contact` é **pública** (acessível sem login) mas também vive no dashboard
(`/dashboard/contact`). A ideia: quem tem sessão não devia ter de escrever o email outra vez.

- **Frontend** (`Contact.jsx`): lê o `token` e o `user` do `localStorage` (o mesmo padrão
  do resto da app). Se houver sessão:
  - **esconde** o campo de email;
  - mostra uma nota discreta — *"Vamos responder para o email da tua conta (…)"*;
  - no envio, manda na mesma o **email da conta** (`user.email`) para o backend ter o `reply-to`.
  - Se **não** houver sessão, o campo de email mantém-se visível e obrigatório (quem não
    tem conta precisa de indicar email).

- **Backend** (`contactController.js`): o email passou a ser **opcional** no corpo:
  - se vier, tem de ser válido (`EMAIL_REGEX`) — senão, `400`;
  - se vier, usa-se como `replyTo`;
  - se **não** vier, o envio prossegue na mesma, apenas **sem** `reply-to` (robustez).
  - No HTML do email, a linha do email mostra `(não indicado)` quando ausente.

## 2. Telefone

Já existia (opcional, 9–20 caracteres). Mantido tal como estava, tanto no frontend como na
validação do controller.

## 3. Anexos (multer dedicado + nodemailer + FormData)

### Uploader dedicado, SEM `req.user`
O `createUploader` existente põe o `req.user.iduser` no nome do ficheiro — **rebenta** numa
rota pública (sem login). Por isso criou-se um uploader próprio em `uploadMiddleware.js`:
- pasta `uploads/contact` (criada com `fs.mkdirSync({ recursive: true })`);
- nome **sem** `req.user`: `contact_${Date.now()}_${randomHex}${ext}` (sufixo de
  `crypto.randomBytes`);
- **lista branca** de mimetypes: `image/jpeg`, `image/png`, `image/webp`,
  `application/pdf`, `text/plain` (segurança — não se aceita tudo);
- limites: **5MB** por ficheiro e **3 ficheiros** no máximo;
- exporta `uploadContactAttachments` (e `MAX_CONTACT_FILES`).
- O `handleUploadErrors` (reaproveitado) ficou mais genérico: trata `LIMIT_FILE_SIZE`
  ("O ficheiro é demasiado grande."), `LIMIT_FILE_COUNT`/`LIMIT_UNEXPECTED_FILE`
  ("Demasiados ficheiros anexados.") e o resto via `err.message`.

### Rota
`contactRoutes.js` passou a correr o upload **antes** do controller, mantendo-se pública:
```js
router.post('/',
  handleUploadErrors(uploadContactAttachments.array('attachments', MAX_CONTACT_FILES)),
  contactController.sendContactMessage);
```
Os ficheiros chegam ao controller em `req.files` (array do multer). Os campos de texto
(`name`, `email`, `phone`, `message`) continuam em `req.body` (o multer faz o parse do
multipart).

### Controller → email
- Constrói os anexos do nodemailer: `req.files.map(f => ({ filename: f.originalname, path: f.path }))`.
- No HTML, acrescenta `Anexos: N ficheiro(s)` + a lista dos nomes originais (escapados).
- Passa os anexos ao `sendEmail`.
- **Limpeza:** se a validação falhar (nome/email/telefone/mensagem inválidos, cooldown, erro),
  apaga (best-effort, `fs.unlink`) os ficheiros já guardados — evita órfãos em `uploads/contact`
  por envios inválidos/abuso.

### emailService
`sendEmail` aceita agora `attachments` (opcional):
- **modo real:** só inclui `attachments` no `sendMail` quando existem (não altera o
  comportamento sem anexos);
- **modo simulação** (sem SMTP no `.env`): além do corpo, imprime na consola
  `Anexos: N ficheiro(s)` e os nomes/paths.

### Frontend (FormData)
- Seletor de ficheiros (`input type=file multiple accept="..."`) com botão "Anexar ficheiro",
  lista dos escolhidos (nome + tamanho) e botão **Remover** por ficheiro.
- **Validação no cliente** (espelha o backend): tipos aceites, **5MB** por ficheiro, **3** no
  máximo, sem duplicados — dá feedback imediato antes de enviar.
- O envio passou de JSON para **`multipart/form-data`** via `FormData` (porque há ficheiros):
  `name`, `email` (só quando aplicável), `phone` (se preenchido), `message` e os ficheiros em
  `attachments`. O `axios` define o `Content-Type` (boundary) automaticamente para `FormData`.
- Mantidos o tratamento de erros/sucesso e o estilo clay.

---

## Segurança / .gitignore
- Lista branca de mimetypes + limites de tamanho e de número de ficheiros (cliente e servidor).
- `uploads/contact` está no `.gitignore` (`backend/uploads/contact/*` com exceção
  `!.../.gitkeep`) — a estrutura vai para o git, os ficheiros enviados por utilizadores **não**.

## Validação feita
- Backend: `node --check` aos 4 ficheiros + carregamento da cadeia da rota + teste funcional do
  controller em modo simulação (3 casos: autenticado-sem-email+anexo, público-com-email, email
  inválido → 400). Todos com o comportamento esperado (reply-to/anexos corretos).
- Frontend: `npm run build` → **OK** (Contact compila).
- **Sem** SMTP configurado, os emails (com a indicação dos anexos) são **simulados na consola** —
  comportamento inalterado.
