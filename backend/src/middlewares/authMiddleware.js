const jwt = require('jsonwebtoken');

// Este middleware verifica se o utilizador enviou um Token válido no cabeçalho (header)
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: "Token não fornecido. Acesso negado." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Guarda os dados do user (id, username) no pedido
        next(); // Continua para a próxima função
    } catch (err) {
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
};

module.exports = verifyToken;
