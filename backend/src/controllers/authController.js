const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importamos o JWT
const db = require('../config/db');

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
                level: user.level
            }
        });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Erro ao processar o login.' });
    }
};
