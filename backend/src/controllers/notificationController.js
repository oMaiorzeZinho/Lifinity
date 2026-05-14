const db = require('../config/db');

const normalizeRecipients = (recipients, excludeUserId) => {
    const exclude = Number(excludeUserId);

    return [
        ...new Set(
            recipients
                .map((recipient) => Number(recipient))
                .filter((recipient) => {
                    return Number.isInteger(recipient)
                        && recipient > 0
                        && recipient !== exclude;
                })
        )
    ];
};

const createNotifications = async ({
    recipients,
    type,
    message,
    excludeUserId,
    executor = db
}) => {
    const notificationRecipients = normalizeRecipients(recipients, excludeUserId);

    if (notificationRecipients.length === 0) {
        return 0;
    }

    const placeholders = notificationRecipients.map(() => '(?, ?, ?)').join(', ');
    const values = notificationRecipients.flatMap((iduser) => [
        iduser,
        type,
        message
    ]);

    await executor.query(
        `INSERT INTO NOTIFICATION (iduser, type, message)
         VALUES ${placeholders}`,
        values
    );

    return notificationRecipients.length;
};

exports.createNotifications = createNotifications;

exports.getNotifications = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [notifications] = await db.query(
            `SELECT idnotification,
                    iduser,
                    type,
                    message,
                    is_read,
                    created_at
             FROM NOTIFICATION
             WHERE iduser = ?
             ORDER BY created_at DESC, idnotification DESC
             LIMIT 20`,
            [iduser]
        );

        res.json(notifications);
    } catch (err) {
        console.error('Erro ao listar notificacoes:', err);
        res.status(500).json({ message: 'Erro ao listar notificacoes.' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [rows] = await db.query(
            `SELECT COUNT(*) AS unreadCount
             FROM NOTIFICATION
             WHERE iduser = ?
             AND is_read = FALSE`,
            [iduser]
        );

        res.json({ unreadCount: Number(rows[0]?.unreadCount || 0) });
    } catch (err) {
        console.error('Erro ao contar notificacoes:', err);
        res.status(500).json({ message: 'Erro ao contar notificacoes.' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const idnotification = Number(req.params.idnotification);

        if (!idnotification) {
            return res.status(400).json({ message: 'Notificacao invalida.' });
        }

        const [result] = await db.query(
            `UPDATE NOTIFICATION
             SET is_read = TRUE
             WHERE idnotification = ?
             AND iduser = ?`,
            [idnotification, iduser]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notificacao nao encontrada.' });
        }

        res.json({ message: 'Notificacao marcada como lida.' });
    } catch (err) {
        console.error('Erro ao marcar notificacao como lida:', err);
        res.status(500).json({ message: 'Erro ao marcar notificacao como lida.' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [result] = await db.query(
            `UPDATE NOTIFICATION
             SET is_read = TRUE
             WHERE iduser = ?
             AND is_read = FALSE`,
            [iduser]
        );

        res.json({
            message: 'Notificacoes marcadas como lidas.',
            updated: result.affectedRows
        });
    } catch (err) {
        console.error('Erro ao marcar todas as notificacoes como lidas:', err);
        res.status(500).json({ message: 'Erro ao marcar notificacoes como lidas.' });
    }
};
