// Serviço de email reutilizável (nodemailer)
// Se as credenciais SMTP não estiverem configuradas no .env, entra em
// "modo simulação": o email é apenas mostrado no console e devolve sucesso.
// Assim a aplicação funciona em qualquer máquina sem configuração extra.
const nodemailer = require('nodemailer');

// As credenciais consideram-se configuradas se user e pass existirem
const isConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

if (isConfigured) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        // Porta 465 usa TLS implícito; 587 usa STARTTLS
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    console.log('[email] SMTP nao configurado no .env — emails serao simulados no console.');
}

// Envia um email. Parametros: { to, subject, html, replyTo (opcional),
// attachments (opcional — array no formato do nodemailer: [{ filename, path }]) }
const sendEmail = async ({ to, subject, html, replyTo, attachments }) => {
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    // Modo simulação: mostra o email no console em vez de enviar
    if (!isConfigured) {
        console.log('────────────────────────────────────────');
        console.log('[email simulado]');
        console.log(`Para: ${to}`);
        if (replyTo) console.log(`Reply-To: ${replyTo}`);
        console.log(`Assunto: ${subject}`);
        console.log('Corpo:');
        console.log(html);
        if (hasAttachments) {
            console.log(`Anexos: ${attachments.length} ficheiro(s)`);
            attachments.forEach((file) => console.log(`  - ${file.filename} (${file.path})`));
        }
        console.log('────────────────────────────────────────');
        return { simulated: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"Lifinity" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
            ...(replyTo ? { replyTo } : {}),
            // Só inclui anexos quando existem — não altera o comportamento sem anexos.
            ...(hasAttachments ? { attachments } : {})
        });

        console.log(`[email] Enviado para ${to} (${info.messageId})`);
        return info;
    } catch (err) {
        console.error(`[email] Erro ao enviar para ${to}:`, err.message);
        throw err;
    }
};

module.exports = { sendEmail };
