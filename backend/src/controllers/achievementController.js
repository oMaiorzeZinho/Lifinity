const db = require('../config/db');
const {
    ensureAchievementSeeds,
    unlockAchievementsForUser
} = require('../utils/achievements');

exports.getAchievements = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        await ensureAchievementSeeds();

        const [achievements] = await db.query(
            `SELECT
                b.idbadge,
                b.code,
                b.name,
                b.description,
                b.category,
                b.icon_url,
                b.requirements,
                b.sort_order,
                b.is_active,
                ub.earned_at,
                CASE WHEN ub.idbadge IS NULL THEN FALSE ELSE TRUE END AS unlocked,
                CASE WHEN ubh.idbadge IS NULL THEN FALSE ELSE TRUE END AS highlighted,
                ubh.position
             FROM BADGE b
             LEFT JOIN USER_BADGE ub
                ON ub.idbadge = b.idbadge
               AND ub.iduser = ?
             LEFT JOIN USER_BADGE_HIGHLIGHT ubh
                ON ubh.idbadge = b.idbadge
               AND ubh.iduser = ?
             WHERE b.is_active = TRUE
             ORDER BY b.sort_order ASC, b.idbadge ASC`,
            [iduser, iduser]
        );

        res.json(achievements.map((achievement) => ({
            ...achievement,
            unlocked: Boolean(achievement.unlocked),
            highlighted: Boolean(achievement.highlighted),
            position: achievement.position === null ? null : Number(achievement.position)
        })));
    } catch (err) {
        console.error('Erro ao listar conquistas:', err);
        res.status(500).json({ message: 'Erro ao listar conquistas.' });
    }
};

exports.updateHighlights = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const iduser = req.user.iduser;
        const highlights = Array.isArray(req.body.highlights)
            ? req.body.highlights
            : null;

        if (!highlights) {
            connection.release();
            return res.status(400).json({ message: 'Lista de destaques invalida.' });
        }

        if (highlights.length > 3) {
            connection.release();
            return res.status(400).json({ message: 'So podes destacar ate 3 conquistas.' });
        }

        const normalizedHighlights = highlights.map((highlight) => ({
            idbadge: Number(highlight.idbadge),
            position: Number(highlight.position)
        }));

        const hasInvalidValues = normalizedHighlights.some((highlight) => {
            return !Number.isInteger(highlight.idbadge)
                || highlight.idbadge <= 0
                || !Number.isInteger(highlight.position)
                || ![1, 2, 3].includes(highlight.position);
        });

        if (hasInvalidValues) {
            connection.release();
            return res.status(400).json({ message: 'Destaques invalidos.' });
        }

        const positions = new Set(normalizedHighlights.map((highlight) => highlight.position));
        const badges = new Set(normalizedHighlights.map((highlight) => highlight.idbadge));

        if (positions.size !== normalizedHighlights.length) {
            connection.release();
            return res.status(400).json({ message: 'Nao podes repetir posicoes.' });
        }

        if (badges.size !== normalizedHighlights.length) {
            connection.release();
            return res.status(400).json({ message: 'Nao podes repetir a mesma conquista.' });
        }

        if (normalizedHighlights.length > 0) {
            const [unlockedRows] = await connection.query(
                `SELECT idbadge
                 FROM USER_BADGE
                 WHERE iduser = ?
                   AND idbadge IN (?)`,
                [iduser, [...badges]]
            );

            if (unlockedRows.length !== normalizedHighlights.length) {
                connection.release();
                return res.status(403).json({
                    message: 'So podes destacar conquistas ja desbloqueadas.'
                });
            }
        }

        await connection.beginTransaction();

        await connection.query(
            `DELETE FROM USER_BADGE_HIGHLIGHT
             WHERE iduser = ?`,
            [iduser]
        );

        if (normalizedHighlights.length > 0) {
            const placeholders = normalizedHighlights.map(() => '(?, ?, ?)').join(', ');
            const values = normalizedHighlights.flatMap((highlight) => [
                iduser,
                highlight.idbadge,
                highlight.position
            ]);

            await connection.query(
                `INSERT INTO USER_BADGE_HIGHLIGHT (iduser, idbadge, position)
                 VALUES ${placeholders}`,
                values
            );
        }

        await connection.commit();
        connection.release();

        res.json({ message: 'Destaques atualizados.' });
    } catch (err) {
        await connection.rollback();
        connection.release();

        console.error('Erro ao atualizar destaques:', err);
        res.status(500).json({ message: 'Erro ao atualizar destaques.' });
    }
};

exports.checkAchievements = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const unlocked = await unlockAchievementsForUser(iduser);

        res.json({
            unlockedCount: unlocked.length,
            unlocked
        });
    } catch (err) {
        console.error('Erro ao verificar conquistas:', err);
        res.status(500).json({ message: 'Erro ao verificar conquistas.' });
    }
};
