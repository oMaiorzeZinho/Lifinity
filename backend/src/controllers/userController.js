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

// Obter perfil publico simples de um utilizador
exports.getPublicProfile = async (req, res) => {
    try {
        const currentUserId = Number(req.user.iduser);
        const profileUserId = Number(req.params.iduser);

        if (!Number.isInteger(profileUserId) || profileUserId <= 0) {
            return res.status(400).json({ message: "Utilizador invalido." });
        }

        const [users] = await db.query(
            `SELECT iduser, username, level, avatar, created_at
             FROM USER
             WHERE iduser = ?
             LIMIT 1`,
            [profileUserId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Utilizador nao encontrado." });
        }

        const [highlightedBadges] = await db.query(
            `SELECT
                b.idbadge,
                b.code,
                b.name,
                b.description,
                b.category,
                b.icon_url,
                ub.earned_at,
                ubh.position
             FROM USER_BADGE_HIGHLIGHT ubh
             INNER JOIN USER_BADGE ub
                ON ub.iduser = ubh.iduser
               AND ub.idbadge = ubh.idbadge
             INNER JOIN BADGE b
                ON b.idbadge = ubh.idbadge
             WHERE ubh.iduser = ?
             ORDER BY ubh.position ASC`,
            [profileUserId]
        );

        let badges = highlightedBadges;

        if (badges.length === 0) {
            const [recentBadges] = await db.query(
                `SELECT
                    b.idbadge,
                    b.code,
                    b.name,
                    b.description,
                    b.category,
                    b.icon_url,
                    ub.earned_at,
                    NULL AS position
                 FROM USER_BADGE ub
                 INNER JOIN BADGE b
                    ON b.idbadge = ub.idbadge
                 WHERE ub.iduser = ?
                 ORDER BY ub.earned_at DESC
                 LIMIT 3`,
                [profileUserId]
            );

            badges = recentBadges;
        }

        const [badgeCountRows] = await db.query(
            `SELECT COUNT(*) AS totalUnlockedBadges
             FROM USER_BADGE
             WHERE iduser = ?`,
            [profileUserId]
        );

        const [commonGroups] = await db.query(
            `SELECT
                g.idgroup,
                g.name,
                g.description,
                COUNT(gm_count.iduser) AS member_count
             FROM GROUP_MEMBER my_groups
             INNER JOIN GROUP_MEMBER their_groups
                ON their_groups.idgroup = my_groups.idgroup
               AND their_groups.iduser = ?
             INNER JOIN GROUP_ENTITY g
                ON g.idgroup = my_groups.idgroup
             LEFT JOIN GROUP_MEMBER gm_count
                ON gm_count.idgroup = g.idgroup
             WHERE my_groups.iduser = ?
             GROUP BY g.idgroup, g.name, g.description
             ORDER BY g.name ASC`,
            [profileUserId, currentUserId]
        );

        res.json({
            ...users[0],
            highlightedBadges: badges,
            totalUnlockedBadges: Number(badgeCountRows[0]?.totalUnlockedBadges || 0),
            commonGroups: commonGroups.map((group) => ({
                ...group,
                member_count: Number(group.member_count || 0)
            }))
        });
    } catch (err) {
        console.error("Erro ao carregar perfil publico:", err);
        res.status(500).json({ message: "Erro ao carregar perfil publico." });
    }
};
