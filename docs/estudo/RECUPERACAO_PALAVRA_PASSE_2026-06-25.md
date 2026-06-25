# Recuperação de palavra-passe por código (web) — 2026-06-25

> Fluxo completo de "esqueci-me da palavra-passe" no site: o utilizador pede um
> **código de 6 dígitos** por email, valida-o num pop-up e define a nova palavra-passe.
> Código **expira em 10 minutos** e é de **uso único**. Hash com **bcryptjs**.

Ficheiros tocados:
- BD: `docs/base_dados/estrutura_lifinity.sql` (tabela `PASSWORD_RESET`) + novo
  `docs/base_dados/password_reset.sql` (para correr no phpMyAdmin).
- Backend: `controllers/authController.js`, `routes/authRoutes.js`.
- Frontend: `components/PasswordResetModal.jsx` (novo), `pages/Login.jsx`.

---

## 1. Base de dados — `PASSWORD_RESET`

```sql
CREATE TABLE PASSWORD_RESET (
    idreset INT AUTO_INCREMENT PRIMARY KEY,
    iduser INT NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (iduser) REFERENCES USER(iduser) ON DELETE CASCADE
);
```

- Guarda os códigos de recuperação com a sua **expiração**. Um registo por pedido — os
  antigos do mesmo utilizador são apagados antes de inserir um novo (só há um código ativo).
- `ON DELETE CASCADE`: se o utilizador for apagado, os seus códigos vão com ele.

> **Importante:** editar o `.sql` do esquema **não** cria a tabela na base de dados que o
> XAMPP está a correr. Por isso há o ficheiro `docs/base_dados/password_reset.sql` (com
> `CREATE TABLE IF NOT EXISTS`) para correr **uma vez** no phpMyAdmin (separador SQL de
> `lifinity_db`). Sem esse passo, os 3 endpoints dão erro 500 (a tabela não existe).

## 2. Backend — 3 endpoints (em `/api/auth`, estilo do `/login`)

Todos usam **prepared statements** (`db.execute` com `?`) e `try/catch` com mensagens claras.
As comparações de tempo são feitas pelo **MySQL** (`NOW()`, `DATE_ADD(NOW(), INTERVAL 10 MINUTE)`)
para não depender do relógio do Node.

1. **`POST /auth/forgot-password`** — `{ email }`
   - Procura o utilizador por email. Se **não** existir → `404 { message: "Não existe nenhuma conta com esse email." }`.
   - Se existir: gera `code` de 6 dígitos (`100000–999999`), **apaga** os códigos antigos
     desse `iduser`, **insere** o novo com `expires_at = NOW() + 10 min`, e **envia o email**
     (via `sendEmail`) com um HTML simples a mostrar o código e a indicar a expiração.
   - Responde `200 { message: "Enviámos um código para o teu email." }`.

2. **`POST /auth/verify-reset-code`** — `{ email, code }`
   - Procura um registo desse `iduser` com `code` igual e `expires_at > NOW()`.
   - Inválido/inexistente/expirado → `400 { message: "Código inválido ou expirado." }`.
   - Válido → `200 { message: "Código válido." }`. **Não apaga** o código (o passo 3 precisa dele).

3. **`POST /auth/reset-password`** — `{ email, code, newPassword }`
   - **Revalida** o código (igual ao passo 2). Inválido → `400`.
   - Valida a nova palavra-passe (**mínimo 6 caracteres**, igual às configurações da conta).
   - **(2026-06-25)** A nova palavra-passe **não pode ser igual à atual**: busca-se o `password`
     atual do `USER` (o `findValidReset` não o traz) e faz-se `bcrypt.compare(newPassword, hashAtual)`;
     se for `true` → `400 { message: "A nova palavra-passe não pode ser igual à atual." }`. A recusa
     acontece **antes** do hash/UPDATE e **NÃO apaga** o código — o utilizador pode tentar outra
     palavra-passe com o mesmo código (ainda válido).
   - Faz **hash com bcryptjs** (`genSalt(10)` + `hash`) e atualiza `USER.password`.
   - **Apaga** os códigos desse `iduser` (uso único).
   - Responde `200 { message: "Palavra-passe alterada com sucesso." }`.

> A **mudança de palavra-passe no perfil** (`userController.updatePassword`, após login) tem a
> mesma validação desde 2026-06-25: depois de confirmar a password atual, compara a nova com o hash
> atual (`bcrypt.compare`) e recusa com `400` se forem iguais.

Helper partilhado `findValidReset(email, code)` (devolve o utilizador quando o código é válido
e não expirou) evita duplicação entre o passo 2 e o 3. Nunca se devolve o hash nem dados sensíveis.

## 3. Frontend — link no login + modal de 3 passos

- **`Login.jsx`**: link discreto **"Recuperar palavra-passe"** ao lado de "Contacte-nos".
  Abre o `PasswordResetModal`. Quando o reset tem sucesso, o modal fecha e o login mostra uma
  **mensagem verde** ("Palavra-passe alterada! Inicia sessão.").
- **`PasswordResetModal.jsx`** (novo, segue o padrão dos modais de `components/`):
  - **Passo 1 (Email):** campo de email + "Enviar código" → `forgot-password`. Email inexistente
    mostra o aviso e fica no passo 1.
  - **Passo 2 (Código):** campo de 6 dígitos (só números) + "Verificar" → `verify-reset-code`.
    Erro fica no passo 2; tem "Reenviar código".
  - **Passo 3 (Nova palavra-passe):** dois campos (nova + confirmar) com validação no cliente
    (mínimo 6, têm de coincidir) → `reset-password`.
  - Indica o **passo (X de 3)**, estados de **loading** nos botões, mensagens de erro/sucesso
    claras, e permite **fechar** a qualquer momento.
  - **Estilo clay:** como a página de Login não é uma `.lifinity-page` (os tokens clay estão
    scoped a essa classe), o **overlay** do modal recebe a classe `lifinity-page` (e fundo
    translúcido via `--lifinity-overlay`) para os `lifinity-card`/`lifinity-input`/botões
    resolverem as variáveis e ficarem com o tema escuro da app.

## Segurança / notas
- Código de 6 dígitos, expiração de 10 min e uso único (apagado após o reset) limitam a janela
  de ataque. Prepared statements em tudo. As mensagens de erro do passo 2/3 são genéricas
  ("Código inválido ou expirado.") para não revelar qual parte falhou.
- O email **revela** que um dado email não tem conta (mensagem clara no passo 1) — foi um
  requisito explícito (UX). Se um dia se quiser evitar enumeração de emails, bastaria responder
  sempre 200 no `forgot-password`.

## Validação feita
- Backend: `node --check` a `authController.js`/`authRoutes.js` + carregamento de `authRoutes`
  (confirma que os 3 handlers existem) — **sem disparar emails**.
- Frontend: `npm run build` → **OK**.
- Não foram enviados emails de teste reais. (Nesta máquina o SMTP nem está configurado, pelo que
  os emails seriam simulados na consola; na máquina do utilizador, com SMTP no `.env`, são reais.)
