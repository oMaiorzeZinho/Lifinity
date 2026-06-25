const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importamos o JWT
const db = require('../config/db');
const { sendEmail } = require('../services/emailService');

// Lógica do Registo
exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO USER (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // Email de boas-vindas: sem await bloqueante — se falhar, o registo
        // continua a funcionar exatamente igual (só fica um log de erro)
        sendEmail({
            to: email,
            subject: 'Bem-vindo ao Lifinity! 🌱',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #2f6f4f;">Olá, ${username}! 👋</h2>
                    <p>Bem-vindo ao <strong>Lifinity</strong> — a tua nova casa para organizar o dia a dia.</p>
                    <p>Começa por criar as tuas primeiras tarefas, conclui-as para ganhar XP e sobe de nível enquanto crias hábitos consistentes.</p>
                    <p>Convida amigos, junta-te a grupos e acompanha o teu progresso no ranking.</p>
                    <p style="margin-top: 24px;">Bons hábitos,<br /><strong>Equipa Lifinity</strong></p>
                </div>
            `
        }).catch((err) => {
            console.error('Erro ao enviar email de boas-vindas:', err.message);
        });

        res.status(201).json({ message: 'Utilizador registado com sucesso!', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao registar utilizador. O email ou username podem já existir.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try{
        // 1. Procurar o utilizador pelo email
        const [users] = await db.execute('SELECT * FROM USER WHERE email = ?', [email]);

        if(users.length === 0){
            return res.status(401).json({ message: 'Email ou password incorretos.' });
        }

        const user = users[0];

        // 2. Comparar a password escrita com a encriptada (Hash)
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(401).json({ message: 'Email ou password incorretos. '});
        }

        //3. Criar o Token JWT (A "Pulseira VIP")
        //Guardamos o iduser dentro do token para sabermos quem é o utilizador nas próximas rotas
        const token = jwt.sign(
            { iduser: user.iduser },
            process.env.JWT_SECRET,
            { expiresIn: '1d'} //O token expira em 1 dia por segurança
        );

        //4. Enviar a resposta com o token e os dados básicos do utilizador
        res.json({
            message: 'Login efetuado com sucesso!',
            token,
            user: {
                iduser: user.iduser,
                username: user.username,
                email: user.email,
                xp: user.xp,
                level: user.level,
                avatar: user.avatar,
                cover_image: user.cover_image
            }
        });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Erro ao processar o login.' });
    }
};

// ============================================================================
// RECUPERAÇÃO DE PALAVRA-PASSE (código de 6 dígitos enviado por email)
// Fluxo: forgot-password -> verify-reset-code -> reset-password.
// O código expira em 10 minutos e é de uso único (apagado após o reset).
// ============================================================================

// Procura um utilizador pelo email (devolve apenas campos não sensíveis).
const findUserByEmail = async (email) => {
    const [users] = await db.execute(
        'SELECT iduser, username, email FROM USER WHERE email = ?',
        [email]
    );
    return users[0] || null;
};

// 1) Pedir o código: gera um código de 6 dígitos, guarda-o (10 min) e envia por email.
exports.forgotPassword = async (req, res) => {
    const email = String(req.body.email || '').trim();

    try {
        if (!email) {
            return res.status(400).json({ message: 'Indica o teu email.' });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            // Email não registado: aviso claro (o frontend mostra-o e fica no passo 1).
            return res.status(404).json({ message: 'Não existe nenhuma conta com esse email.' });
        }

        // Código numérico de 6 dígitos (100000–999999)
        const code = String(Math.floor(100000 + Math.random() * 900000));

        // Só pode existir um código ativo por utilizador: limpa os antigos e insere o novo.
        // expires_at é calculado pelo MySQL (NOW() + 10 min) para evitar diferenças de relógio.
        await db.execute('DELETE FROM PASSWORD_RESET WHERE iduser = ?', [user.iduser]);
        await db.execute(
            'INSERT INTO PASSWORD_RESET (iduser, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
            [user.iduser, code]
        );

        // Envia o email com o código. Aguarda o envio para só responder sucesso se o email seguir.
        await sendEmail({
            to: user.email,
            subject: 'Lifinity — Código de recuperação de palavra-passe',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #2f6f4f;">Recuperação de palavra-passe</h2>
                    <p>Olá, ${user.username}! Recebemos um pedido para repor a tua palavra-passe no <strong>Lifinity</strong>.</p>
                    <p>Usa o seguinte código para continuares:</p>
                    <div style="margin: 24px 0; padding: 18px 0; text-align: center; background: #f0f5f1; border-radius: 12px;">
                        <span style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #1e2a23;">${code}</span>
                    </div>
                    <p>O código <strong>expira em 10 minutos</strong> e só pode ser usado uma vez.</p>
                    <p style="color: #718176; font-size: 13px;">Se não foste tu a pedir, ignora este email — a tua palavra-passe continua igual.</p>
                </div>
            `
        });

        res.json({ message: 'Enviámos um código para o teu email.' });
    } catch (error) {
        console.error('Erro no forgot-password:', error);
        res.status(500).json({ message: 'Erro ao enviar o código. Tenta novamente mais tarde.' });
    }
};

// Verifica (sem apagar) se existe um código válido e não expirado para o email.
// Devolve o iduser quando válido, ou null caso contrário.
const findValidReset = async (email, code) => {
    const user = await findUserByEmail(email);
    if (!user) return null;

    const [rows] = await db.execute(
        'SELECT idreset FROM PASSWORD_RESET WHERE iduser = ? AND code = ? AND expires_at > NOW()',
        [user.iduser, code]
    );

    return rows.length > 0 ? user : null;
};

// 2) Verificar o código (passo do pop-up). NÃO apaga o código — o passo 3 ainda precisa dele.
exports.verifyResetCode = async (req, res) => {
    const email = String(req.body.email || '').trim();
    const code = String(req.body.code || '').trim();

    try {
        const user = await findValidReset(email, code);
        if (!user) {
            return res.status(400).json({ message: 'Código inválido ou expirado.' });
        }

        res.json({ message: 'Código válido.' });
    } catch (error) {
        console.error('Erro no verify-reset-code:', error);
        res.status(500).json({ message: 'Erro ao validar o código.' });
    }
};

// 3) Definir a nova palavra-passe: revalida o código, faz hash e atualiza; apaga o código (uso único).
exports.resetPassword = async (req, res) => {
    const email = String(req.body.email || '').trim();
    const code = String(req.body.code || '').trim();
    const newPassword = String(req.body.newPassword || '');

    try {
        // Critério igual ao das configurações da conta: mínimo 6 caracteres.
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
        }

        const user = await findValidReset(email, code);
        if (!user) {
            return res.status(400).json({ message: 'Código inválido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.execute('UPDATE USER SET password = ? WHERE iduser = ?', [hashedPassword, user.iduser]);

        // O código é de uso único: apaga todos os deste utilizador.
        await db.execute('DELETE FROM PASSWORD_RESET WHERE iduser = ?', [user.iduser]);

        res.json({ message: 'Palavra-passe alterada com sucesso.' });
    } catch (error) {
        console.error('Erro no reset-password:', error);
        res.status(500).json({ message: 'Erro ao alterar a palavra-passe.' });
    }
};
