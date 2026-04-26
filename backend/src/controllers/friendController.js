const db = require('../config/db');

// Pesquisar utilizadores por username
exports.searchUsers = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const query = req.query.query || '';

        if (query.trim().length < 2) {
            return res.json([]);
        }

        const [users] = await db.query(
            `SELECT iduser, username, level, xp
             FROM USER
             WHERE username LIKE ?
             AND iduser != ?
             LIMIT 10`,
            [`%${query}%`, iduser]
        );

        res.json(users);
    } catch (err) {
        console.error('Erro ao pesquisar utilizadores:', err);
        res.status(500).json({ message: 'Erro ao pesquisar utilizadores.' });
    }
};

// Enviar pedido de amizade
exports.sendFriendRequest = async (req, res) => {
    try {
        const requester = req.user.iduser;
        const { iduser_receiver } = req.body;

        if (!iduser_receiver || Number(iduser_receiver) === Number(requester)) {
            return res.status(400).json({ message: 'Utilizador inválido.' });
        }

        const [existing] = await db.query(
            `SELECT * FROM FRIENDSHIP
             WHERE 
             (iduser_requester = ? AND iduser_receiver = ?)
             OR
             (iduser_requester = ? AND iduser_receiver = ?)`,
            [requester, iduser_receiver, iduser_receiver, requester]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Já existe uma relação ou pedido com este utilizador.' });
        }

        await db.query(
            `INSERT INTO FRIENDSHIP (iduser_requester, iduser_receiver, status)
             VALUES (?, ?, 'pendente')`,
            [requester, iduser_receiver]
        );

        res.status(201).json({ message: 'Pedido de amizade enviado.' });
    } catch (err) {
        console.error('Erro ao enviar pedido:', err);
        res.status(500).json({ message: 'Erro ao enviar pedido de amizade.' });
    }
};

// Listar pedidos recebidos
exports.getFriendRequests = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [requests] = await db.query(
            `SELECT 
                f.idfriendship,
                u.iduser,
                u.username,
                u.level,
                u.xp,
                f.created_at
             FROM FRIENDSHIP f
             INNER JOIN USER u ON f.iduser_requester = u.iduser
             WHERE f.iduser_receiver = ?
             AND f.status = 'pendente'
             ORDER BY f.created_at DESC`,
            [iduser]
        );

        res.json(requests);
    } catch (err) {
        console.error('Erro ao listar pedidos:', err);
        res.status(500).json({ message: 'Erro ao listar pedidos de amizade.' });
    }
};

// Aceitar pedido de amizade
exports.acceptFriendRequest = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idfriendship } = req.params;

        const [result] = await db.query(
            `UPDATE FRIENDSHIP
             SET status = 'aceite'
             WHERE idfriendship = ?
             AND iduser_receiver = ?`,
            [idfriendship, iduser]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }

        res.json({ message: 'Pedido de amizade aceite.' });
    } catch (err) {
        console.error('Erro ao aceitar pedido:', err);
        res.status(500).json({ message: 'Erro ao aceitar pedido de amizade.' });
    }
};

// Listar amigos
exports.getFriends = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [friends] = await db.query(
            `SELECT 
                u.iduser,
                u.username,
                u.level,
                u.xp
             FROM FRIENDSHIP f
             INNER JOIN USER u
                ON u.iduser = CASE
                    WHEN f.iduser_requester = ? THEN f.iduser_receiver
                    ELSE f.iduser_requester
                END
             WHERE (f.iduser_requester = ? OR f.iduser_receiver = ?)
             AND f.status = 'aceite'
             ORDER BY u.username ASC`,
            [iduser, iduser, iduser]
        );

        res.json(friends);
    } catch (err) {
        console.error('Erro ao listar amigos:', err);
        res.status(500).json({ message: 'Erro ao listar amigos.' });
    }
};