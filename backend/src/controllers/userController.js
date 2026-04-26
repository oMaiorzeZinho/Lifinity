const db = require('../config/db');

// Obter o Ranking Global (Top 10 utilizadores por XP)
exports.getRanking = async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT iduser, username, xp, level FROM USER ORDER BY xp DESC LIMIT 10"
        );

        res.json(results);
    } catch (err) {
        console.error("Erro ao carregar ranking:", err);
        res.status(500).json({ error: "Erro ao carregar o ranking." });
    }
};

// Pesquisar utilizadores para adicionar como amigos
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;

        const [results] = await db.query(
            "SELECT iduser, username, level FROM USER WHERE username LIKE ? AND iduser != ? LIMIT 5",
            [`%${query}%`, req.user.iduser]
        );

        res.json(results);
    } catch (err) {
        console.error("Erro ao pesquisar utilizadores:", err);
        res.status(500).json({ error: "Erro ao pesquisar utilizadores." });
    }
};