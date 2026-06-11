// Controller do formulário público "Contacte-nos"
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

exports.sendContactMessage = async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim();
        const phone = String(req.body.phone || '').trim();
        const message = String(req.body.message || '').trim();

        // Validações com mensagens claras
        if (name.length < 2 || name.length > 100) {
            return res.status(400).json({ message: 'O nome deve ter entre 2 e 100 caracteres.' });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ message: 'Indica um email válido.' });
        }

        // O telefone é opcional, mas se vier tem de ter um tamanho razoável
        if (phone && (phone.length < 9 || phone.length > 20)) {
            return res.status(400).json({ message: 'O telefone deve ter entre 9 e 20 caracteres.' });
        }

        if (message.length < 10 || message.length > 2000) {
            return res.status(400).json({ message: 'A mensagem deve ter entre 10 e 2000 caracteres.' });
        }

        // Proteção anti-spam por IP
        const ip = req.ip || req.socket?.remoteAddress || 'desconhecido';
        const lastSubmission = lastSubmissionByIp.get(ip);

        if (lastSubmission && Date.now() - lastSubmission < SUBMISSION_COOLDOWN_MS) {
            return res.status(429).json({ message: 'Aguarda um momento antes de enviar outra mensagem.' });
        }

        // Template simples com os dados do formulário
        // (white-space: pre-wrap preserva as quebras de linha da mensagem)
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2f6f4f;">Nova mensagem de contacto — Lifinity</h2>
                <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                ${phone ? `<p><strong>Telefone:</strong> ${escapeHtml(phone)}</p>` : ''}
                <hr style="border: none; border-top: 1px solid #ddd;" />
                <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
        `;

        await sendEmail({
            to: process.env.CONTACT_EMAIL,
            subject: `[Lifinity] Nova mensagem de contacto de ${name}`,
            replyTo: email,
            html
        });

        // Só conta para o cooldown depois de o envio ter sucesso
        lastSubmissionByIp.set(ip, Date.now());

        res.json({ message: 'Mensagem enviada com sucesso! Entraremos em contacto em breve.' });
    } catch (err) {
        console.error('Erro ao enviar mensagem de contacto:', err);
        res.status(500).json({ message: 'Erro ao enviar a mensagem. Tenta novamente mais tarde.' });
    }
};
