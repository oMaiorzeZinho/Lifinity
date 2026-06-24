# `backend/src/services/emailService.js` — envio de emails (com modo simulação)

> ⚠️ **Atualização 2026-06-24:** `sendEmail` passou a aceitar `attachments` (opcional, formato nodemailer); no modo simulação imprime também os anexos. Ver [Melhorias no formulário de contacto](../../../MELHORIAS_FORMULARIO_CONTACTO_2026-06-24.md).

## Papel no projeto
Serviço reutilizável para **enviar emails** via `nodemailer` (boas-vindas no registo, formulário de contacto). O seu truque inteligente: se não houver credenciais SMTP no `.env`, entra em **"modo simulação"** — em vez de enviar, mostra o email na consola e devolve sucesso. Assim a app funciona em qualquer máquina sem configuração extra. Introduzido na FASE E (commit `95d17be7`).

## Bloco a bloco

```js
const nodemailer = require('nodemailer');
const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
let transporter = null;
```
- `isConfigured` é `true` só se **existirem** utilizador e password SMTP no `.env`. É a "chave" que decide entre enviar a sério ou simular.
- `transporter` é o objeto do nodemailer que efetivamente envia (fica `null` em modo simulação).

```js
if (isConfigured) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
} else {
    console.log('[email] SMTP nao configurado no .env — emails serao simulados no console.');
}
```
- Cria o `transporter` com os dados SMTP. Valores por defeito: **Gmail** (`smtp.gmail.com`) e **porta 587**.
- **`secure: ... === 465`** — `true` só se a porta for 465 (TLS implícito). A porta 587 usa **STARTTLS** (começa em claro e "promove" para TLS), por isso `secure` fica `false`. É a configuração correta consoante a porta.
- Se não estiver configurado, escreve um aviso e segue (modo simulação).

### Função `sendEmail({ to, subject, html, replyTo })`
```js
const sendEmail = async ({ to, subject, html, replyTo }) => {
    if (!isConfigured) {
        console.log('────────────────────────────────────────');
        console.log('[email simulado]');
        console.log(`Para: ${to}`);
        if (replyTo) console.log(`Reply-To: ${replyTo}`);
        console.log(`Assunto: ${subject}`);
        console.log('Corpo:'); console.log(html);
        console.log('────────────────────────────────────────');
        return { simulated: true };
    }
```
**Modo simulação:** se não há SMTP, "imprime" o email todo na consola (destinatário, reply-to, assunto, corpo HTML) e devolve `{ simulated: true }`. O chamador trata isto como sucesso — a app não se comporta de forma diferente.

```js
    try {
        const info = await transporter.sendMail({
            from: `"Lifinity" <${process.env.SMTP_USER}>`,
            to, subject, html,
            ...(replyTo ? { replyTo } : {})
        });
        console.log(`[email] Enviado para ${to} (${info.messageId})`);
        return info;
    } catch (err) {
        console.error(`[email] Erro ao enviar para ${to}:`, err.message);
        throw err;
    }
};
```
**Modo real:** envia com o nodemailer.
- `from` mostra o remetente como "Lifinity".
- **`...(replyTo ? { replyTo } : {})`** — *spread condicional*: só adiciona o campo `replyTo` ao objeto se ele existir. Truque elegante para campos opcionais (usado no contacto, para responder diretamente a quem preencheu o formulário).
- Em erro, regista e **relança** (`throw`) para o controlador decidir o que fazer.

```js
module.exports = { sendEmail };
```

## Porquê este design
- O **modo simulação** é a decisão mais inteligente aqui: para uma PAP demonstrada localmente, configurar SMTP real (e expor uma password de app) seria um incómodo e um risco. Assim mostra-se a funcionalidade (vê-se o email na consola) sem depender de credenciais.
- Centralizar o envio num único serviço evita repetir configuração de nodemailer em vários controladores.

## Ligações
- **Exporta:** `sendEmail`.
- **Usado por:** `contactController.js` (formulário Contacte-nos) e `authController.js` (email de boas-vindas no registo).
- **Depende de:** variáveis `SMTP_*` no `.env` (opcionais).
