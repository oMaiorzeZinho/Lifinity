const db = require('../config/db');

const normalizePrivatePair = (iduser, idfriend) => {
    const firstUser = Number(iduser);
    const secondUser = Number(idfriend);

    return firstUser < secondUser
        ? [firstUser, secondUser]
        : [secondUser, firstUser];
};

const friendshipExists = async (iduser, idfriend) => {
    const [friends] = await db.query(
        `SELECT idfriendship
         FROM FRIENDSHIP
         WHERE status = 'aceite'
         AND (
            (iduser_requester = ? AND iduser_receiver = ?)
            OR
            (iduser_requester = ? AND iduser_receiver = ?)
         )
         LIMIT 1`,
        [iduser, idfriend, idfriend, iduser]
    );

    return friends.length > 0;
};

const findPrivateConversation = async (iduser, idfriend) => {
    const [firstUser, secondUser] = normalizePrivatePair(iduser, idfriend);

    const [conversations] = await db.query(
        `SELECT c.idconversation
         FROM CONVERSATION c
         INNER JOIN CONVERSATION_MEMBER cm1
            ON cm1.idconversation = c.idconversation
            AND cm1.iduser = ?
         INNER JOIN CONVERSATION_MEMBER cm2
            ON cm2.idconversation = c.idconversation
            AND cm2.iduser = ?
         WHERE c.type = 'private'
         AND (
            SELECT COUNT(*)
            FROM CONVERSATION_MEMBER cm_count
            WHERE cm_count.idconversation = c.idconversation
         ) = 2
         LIMIT 1`,
        [firstUser, secondUser]
    );

    return conversations[0] || null;
};

const getConversationMemberIds = async (idconversation) => {
    const [members] = await db.query(
        `SELECT iduser
         FROM CONVERSATION_MEMBER
         WHERE idconversation = ?
         ORDER BY iduser ASC`,
        [idconversation]
    );

    return members.map((member) => Number(member.iduser));
};

const userBelongsToConversation = async (idconversation, iduser) => {
    const [members] = await db.query(
        `SELECT idconversation
         FROM CONVERSATION_MEMBER
         WHERE idconversation = ?
         AND iduser = ?
         LIMIT 1`,
        [idconversation, iduser]
    );

    return members.length > 0;
};

// Listar conversas do utilizador autenticado
exports.getConversations = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [conversations] = await db.query(
            `SELECT
                c.idconversation,
                c.type,
                c.idgroup,
                c.created_at,
                c.updated_at,
                other_user.iduser AS other_user_id,
                other_user.username AS other_username,
                other_user.level AS other_level,
                other_user.xp AS other_xp,
                last_message.content AS last_message,
                last_message.created_at AS last_message_at,
                last_sender.username AS last_sender_username
             FROM CONVERSATION c
             INNER JOIN CONVERSATION_MEMBER current_member
                ON current_member.idconversation = c.idconversation
                AND current_member.iduser = ?
             LEFT JOIN CONVERSATION_MEMBER other_member
                ON other_member.idconversation = c.idconversation
                AND other_member.iduser != ?
             LEFT JOIN USER other_user
                ON other_user.iduser = other_member.iduser
             LEFT JOIN MESSAGE last_message
                ON last_message.idmessage = (
                    SELECT m.idmessage
                    FROM MESSAGE m
                    WHERE m.idconversation = c.idconversation
                    ORDER BY m.created_at DESC, m.idmessage DESC
                    LIMIT 1
                )
             LEFT JOIN USER last_sender
                ON last_sender.iduser = last_message.idsender
             WHERE c.type = 'private'
             ORDER BY COALESCE(last_message.created_at, c.updated_at, c.created_at) DESC`,
            [iduser, iduser]
        );

        res.json(conversations);
    } catch (err) {
        console.error('Erro ao listar conversas:', err);
        res.status(500).json({ message: 'Erro ao listar conversas.' });
    }
};

// Criar ou obter conversa privada com amigo
exports.createPrivateConversation = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const iduser = Number(req.user.iduser);
        const idfriend = Number(req.body.idfriend);

        if (!idfriend || idfriend === iduser) {
            connection.release();
            return res.status(400).json({ message: 'Amigo invÃ¡lido.' });
        }

        const isFriend = await friendshipExists(iduser, idfriend);

        if (!isFriend) {
            connection.release();
            return res.status(403).json({ message: 'SÃ³ podes iniciar conversa com amigos aceites.' });
        }

        const existingConversation = await findPrivateConversation(iduser, idfriend);

        if (existingConversation) {
            connection.release();
            return res.json({
                idconversation: existingConversation.idconversation,
                message: 'Conversa privada existente.'
            });
        }

        await connection.beginTransaction();

        const [conversationResult] = await connection.query(
            `INSERT INTO CONVERSATION (type)
             VALUES ('private')`
        );

        const idconversation = conversationResult.insertId;
        const [firstUser, secondUser] = normalizePrivatePair(iduser, idfriend);

        await connection.query(
            `INSERT INTO CONVERSATION_MEMBER (idconversation, iduser)
             VALUES (?, ?), (?, ?)`,
            [idconversation, firstUser, idconversation, secondUser]
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            idconversation,
            message: 'Conversa privada criada.'
        });
    } catch (err) {
        await connection.rollback();
        connection.release();

        console.error('Erro ao criar conversa privada:', err);
        res.status(500).json({ message: 'Erro ao criar conversa privada.' });
    }
};

// Listar mensagens de uma conversa
exports.getMessages = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idconversation } = req.params;

        const belongsToConversation = await userBelongsToConversation(idconversation, iduser);

        if (!belongsToConversation) {
            return res.status(403).json({ message: 'NÃ£o tens acesso a esta conversa.' });
        }

        const [messages] = await db.query(
            `SELECT
                m.idmessage,
                m.idconversation,
                m.idsender,
                u.username AS sender_username,
                m.content,
                m.message_type,
                m.created_at,
                m.read_at
             FROM MESSAGE m
             INNER JOIN USER u ON u.iduser = m.idsender
             WHERE m.idconversation = ?
             ORDER BY m.created_at ASC, m.idmessage ASC`,
            [idconversation]
        );

        res.json(messages);
    } catch (err) {
        console.error('Erro ao listar mensagens:', err);
        res.status(500).json({ message: 'Erro ao listar mensagens.' });
    }
};

// Enviar mensagem de texto
exports.sendMessage = async (req, res) => {
    try {
        const iduser = Number(req.user.iduser);
        const { idconversation } = req.params;
        const content = String(req.body.content || '').trim();

        if (!content) {
            return res.status(400).json({ message: 'A mensagem nÃ£o pode estar vazia.' });
        }

        const belongsToConversation = await userBelongsToConversation(idconversation, iduser);

        if (!belongsToConversation) {
            return res.status(403).json({ message: 'NÃ£o tens acesso a esta conversa.' });
        }

        const memberIds = await getConversationMemberIds(idconversation);

        if (memberIds.length !== 2) {
            return res.status(400).json({ message: 'Apenas chat privado estÃ¡ disponÃ­vel neste momento.' });
        }

        const otherUserId = memberIds.find((memberId) => memberId !== iduser);
        const isFriend = await friendshipExists(iduser, otherUserId);

        if (!isFriend) {
            return res.status(403).json({ message: 'JÃ¡ nÃ£o existe amizade aceite entre os utilizadores.' });
        }

        const [result] = await db.query(
            `INSERT INTO MESSAGE (idconversation, idsender, content, message_type)
             VALUES (?, ?, ?, 'text')`,
            [idconversation, iduser, content]
        );

        await db.query(
            `UPDATE CONVERSATION
             SET updated_at = CURRENT_TIMESTAMP
             WHERE idconversation = ?`,
            [idconversation]
        );

        const [messages] = await db.query(
            `SELECT
                m.idmessage,
                m.idconversation,
                m.idsender,
                u.username AS sender_username,
                m.content,
                m.message_type,
                m.created_at,
                m.read_at
             FROM MESSAGE m
             INNER JOIN USER u ON u.iduser = m.idsender
             WHERE m.idmessage = ?`,
            [result.insertId]
        );

        res.status(201).json(messages[0]);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).json({ message: 'Erro ao enviar mensagem.' });
    }
};
