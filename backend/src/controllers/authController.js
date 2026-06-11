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
