const db = require('../config/db');

// Obter o Ranking Global (Top 10 utilizadores por XP)
exports.getRanking = (req, res) => {
    const query = "SELECT username, xp, level FROM USER ORDER BY xp DESC LIMIT 10";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Pesquisar utilizadores para adicionar como amigos
exports.searchUsers = (req, res) => {
    const { query } = req.query;
    const sql = "SELECT iduser, username, level FROM USER WHERE username LIKE ? AND iduser != ? LIMIT 5";
    db.query(sql, [`%${query}%`, req.user.iduser], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};
