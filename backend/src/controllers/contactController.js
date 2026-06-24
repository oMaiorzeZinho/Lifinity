// Controller do formulário público "Contacte-nos"
const fs = require('fs');
const { sendEmail } = require('../services/emailService');

// Regex simples para validar o formato do email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Anti-spam simples: guarda em memória o timestamp do último envio por IP.
// Se o mesmo IP enviar de novo em menos de 60 segundos, devolve 429.
const lastSubmissionByIp = new Map();
const SUBMISSION_COOLDOWN_MS = 60 * 1000;

// Escapa caracteres especiais de HTML (o conteúdo vem de utilizadores anónimos)
const escapeHtml = (text) =>
    String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

// Apaga (best-effort) os anexos já guardados em disco quando a validação falha,
// para não deixar ficheiros órfãos em uploads/contact em envios inválidos/abuso.
const cleanupFiles = (files) => {
    if (!Array.isArray(files)) return;
    for (const file of files) {
        fs.unlink(file.path, () => {}); // ignora erros de propósito
    }
};

exports.sendContactMessage = async (req, res) => {
    // Os anexos (se houver) já foram guardados pelo multer antes do controller.
    const files = Array.isArray(req.files) ? req.files : [];

    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim();
        const phone = String(req.body.phone || '').trim();
        const message = String(req.body.message || '').trim();

        // Validações com mensagens claras
        if (name.length < 2 || name.length > 100) {
            cleanupFiles(files);
            return res.status(400).json({ message: 'O nome deve ter entre 2 e 100 caracteres.' });
        }

        // O email é OPCIONAL: os utilizadores autenticados não precisam de o escrever
        // (o frontend esconde o campo). Quando vem, tem de ser válido; quando não vem,
        // o envio prossegue na mesma, apenas sem reply-to.
        if (email && !EMAIL_REGEX.test(email)) {
            cleanupFiles(files);
            return res.status(400).json({ message: 'Indica um email válido.' });
        }

        // O telefone é opcional, mas se vier tem de ter um tamanho razoável
        if (phone && (phone.length < 9 || phone.length > 20)) {
            cleanupFiles(files);
            return res.status(400).json({ message: 'O telefone deve ter entre 9 e 20 caracteres.' });
        }

        if (message.length < 10 || message.length > 2000) {
            cleanupFiles(files);
            return res.status(400).json({ message: 'A mensagem deve ter entre 10 e 2000 caracteres.' });
        }

        // Proteção anti-spam por IP
        const ip = req.ip || req.socket?.remoteAddress || 'desconhecido';
        const lastSubmission = lastSubmissionByIp.get(ip);

        if (lastSubmission && Date.now() - lastSubmission < SUBMISSION_COOLDOWN_MS) {
            cleanupFiles(files);
            return res.status(429).json({ message: 'Aguarda um momento antes de enviar outra mensagem.' });
        }

        // Anexos do nodemailer: cada ficheiro vai com o nome original e o caminho em disco.
        const attachments = files.map((file) => ({
            filename: file.originalname,
            path: file.path
        }));

        // Bloco HTML com a lista de anexos (nomes escapados), só se houver anexos.
        const attachmentsHtml = files.length
            ? `
                <hr style="border: none; border-top: 1px solid #ddd;" />
                <p><strong>Anexos:</strong> ${files.length} ficheiro(s)</p>
                <ul style="margin: 0; padding-left: 20px;">
                    ${files.map((file) => `<li>${escapeHtml(file.originalname)}</li>`).join('')}
                </ul>
            `
            : '';

        // Template simples com os dados do formulário
        // (white-space: pre-wrap preserva as quebras de linha da mensagem)
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2f6f4f;">Nova mensagem de contacto — Lifinity</h2>
                <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${email ? escapeHtml(email) : '(não indicado)'}</p>
                ${phone ? `<p><strong>Telefone:</strong> ${escapeHtml(phone)}</p>` : ''}
                <hr style="border: none; border-top: 1px solid #ddd;" />
                <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
                ${attachmentsHtml}
            </div>
        `;

        await sendEmail({
            to: process.env.CONTACT_EMAIL,
            subject: `[Lifinity] Nova mensagem de contacto de ${name}`,
            // Só define reply-to quando há email (caso do utilizador sem login).
            ...(email ? { replyTo: email } : {}),
            html,
            attachments
        });

        // Só conta para o cooldown depois de o envio ter sucesso
        lastSubmissionByIp.set(ip, Date.now());

        res.json({ message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.' });
    } catch (err) {
        console.error('Erro ao enviar mensagem de contacto:', err);
        cleanupFiles(files);
        res.status(500).json({ message: 'Erro ao enviar a mensagem. Tenta novamente mais tarde.' });
    }
};
