const db = require('../config/db');
const { createNotifications } = require('./notificationController');
const { safeUnlockAchievementsForUser } = require('../utils/achievements');

const normalizePrivatePair = (iduser, idfriend) => {
    const firstUser = Number(iduser);
    const secondUser = Number(idfriend);

    return firstUser < secondUser
        ? [firstUser, secondUser]
        : [secondUser, firstUser];
};

const normalizeMemberIds = (memberIds, currentUserId = null) => {
    if (!Array.isArray(memberIds)) return [];

    const currentId = currentUserId === null ? null : Number(currentUserId);

    return [...new Set(
        memberIds
            .map((iduser) => Number(iduser))
            .filter((iduser) => Number.isInteger(iduser) && iduser > 0 && iduser !== currentId)
    )];
};

const buildPlaceholders = (rows, columnsPerRow) => (
    rows.map(() => `(${Array(columnsPerRow).fill('?').join(', ')})`).join(', ')
);

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

const getAcceptedFriendIds = async (iduser, memberIds) => {
    if (memberIds.length === 0) return [];

    const placeholders = memberIds.map(() => '?').join(', ');
    const [friends] = await db.query(
        `SELECT DISTINCT
            CASE
                WHEN iduser_requester = ? THEN iduser_receiver
                ELSE iduser_requester
            END AS idfriend
         FROM FRIENDSHIP
         WHERE status = 'aceite'
           AND (iduser_requester = ? OR iduser_receiver = ?)
           AND (
                CASE
                    WHEN iduser_requester = ? THEN iduser_receiver
                    ELSE iduser_requester
                END
           ) IN (${placeholders})`,
        [iduser, iduser, iduser, iduser, ...memberIds]
    );

    return friends.map((friend) => Number(friend.idfriend));
};

const validateAcceptedFriends = async (iduser, memberIds) => {
    const friendIds = await getAcceptedFriendIds(iduser, memberIds);
    const friendIdSet = new Set(friendIds);

    return memberIds.every((memberId) => friendIdSet.has(Number(memberId)));
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

const getConversationMembership = async (idconversation, iduser) => {
    const [memberships] = await db.query(
        `SELECT
            c.idconversation,
            c.type,
            c.name,
            c.idgroup,
            c.idcreated_by,
            cm.role
         FROM CONVERSATION c
         INNER JOIN CONVERSATION_MEMBER cm
            ON cm.idconversation = c.idconversation
            AND cm.iduser = ?
         WHERE c.idconversation = ?
         LIMIT 1`,
        [iduser, idconversation]
    );

    return memberships[0] || null;
};

const userBelongsToConversation = async (idconversation, iduser) => {
    const membership = await getConversationMembership(idconversation, iduser);

    return Boolean(membership);
};

// Listar conversas do utilizador autenticado
exports.getConversations = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [conversations] = await db.query(
            `SELECT
                c.idconversation,
                c.type,
                c.name,
                c.idgroup,
                c.idcreated_by,
                c.created_at,
                c.updated_at,
                current_member.role AS current_user_role,
                other_user.iduser AS other_user_id,
                other_user.username AS other_username,
                other_user.level AS other_level,
                other_user.xp AS other_xp,
                (
                    SELECT COUNT(*)
                    FROM CONVERSATION_MEMBER cm_count
                    WHERE cm_count.idconversation = c.idconversation
                ) AS member_count,
                last_message.content AS last_message,
                last_message.created_at AS last_message_at,
                last_sender.username AS last_sender_username
             FROM CONVERSATION c
             INNER JOIN CONVERSATION_MEMBER current_member
                ON current_member.idconversation = c.idconversation
                AND current_member.iduser = ?
             LEFT JOIN CONVERSATION_MEMBER other_member
                ON c.type = 'private'
                AND other_member.idconversation = c.idconversation
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
             ORDER BY COALESCE(last_message.created_at, c.updated_at, c.created_at) DESC,
                      c.idconversation DESC`,
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
            return res.status(400).json({ message: 'Amigo invalido.' });
        }

        const isFriend = await friendshipExists(iduser, idfriend);

        if (!isFriend) {
            connection.release();
            return res.status(403).json({ message: 'So podes iniciar conversa com amigos aceites.' });
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

// Criar conversa de grupo diretamente no chat
exports.createGroupConversation = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const iduser = Number(req.user.iduser);
        const name = String(req.body.name || '').trim();
        const memberIds = normalizeMemberIds(req.body.memberIds, iduser);

        if (name.length < 2 || name.length > 100) {
            connection.release();
            return res.status(400).json({ message: 'O nome do grupo deve ter entre 2 e 100 caracteres.' });
        }

        if (memberIds.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Escolhe pelo menos um amigo para criar o grupo.' });
        }

        const allFriends = await validateAcceptedFriends(iduser, memberIds);

        if (!allFriends) {
            connection.release();
            return res.status(403).json({ message: 'So podes adicionar amigos aceites ao grupo.' });
        }

        await connection.beginTransaction();

        const [conversationResult] = await connection.query(
            `INSERT INTO CONVERSATION (type, name, idcreated_by)
             VALUES ('group', ?, ?)`,
            [name, iduser]
        );

        const idconversation = conversationResult.insertId;
        const memberRows = [
            [idconversation, iduser, 'admin'],
            ...memberIds.map((memberId) => [idconversation, memberId, 'membro'])
        ];

        await connection.query(
            `INSERT INTO CONVERSATION_MEMBER (idconversation, iduser, role)
             VALUES ${buildPlaceholders(memberRows, 3)}`,
            memberRows.flat()
        );

        await connection.commit();
        connection.release();

        await createNotifications({
            recipients: memberIds,
            type: 'sistema',
            message: `Foste adicionado ao grupo de conversa "${name}".`,
            excludeUserId: iduser
        });

        res.status(201).json({
            idconversation,
            message: 'Grupo de conversa criado.'
        });
    } catch (err) {
        await connection.rollback();
        connection.release();

        console.error('Erro ao criar grupo de conversa:', err);
        res.status(500).json({ message: 'Erro ao criar grupo de conversa.' });
    }
};

// Listar mensagens de uma conversa
exports.getMessages = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idconversation } = req.params;

        const belongsToConversation = await userBelongsToConversation(idconversation, iduser);

        if (!belongsToConversation) {
            return res.status(403).json({ message: 'Nao tens acesso a esta conversa.' });
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
             LEFT JOIN USER u ON u.iduser = m.idsender
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

// Listar membros de uma conversa
exports.getConversationMembers = async (req, res) => {
    try {
        const iduser = Number(req.user.iduser);
        const { idconversation } = req.params;

        const membership = await getConversationMembership(idconversation, iduser);

        if (!membership) {
            return res.status(403).json({ message: 'Nao tens acesso a esta conversa.' });
        }

        const [members] = await db.query(
            `SELECT
                u.iduser,
                u.username,
                u.level,
                u.xp,
                cm.role
             FROM CONVERSATION_MEMBER cm
             INNER JOIN USER u ON u.iduser = cm.iduser
             WHERE cm.idconversation = ?
             ORDER BY FIELD(cm.role, 'admin', 'membro'), u.username ASC`,
            [idconversation]
        );

        res.json(members);
    } catch (err) {
        console.error('Erro ao listar membros da conversa:', err);
        res.status(500).json({ message: 'Erro ao listar membros da conversa.' });
    }
};

// Adicionar membros a uma conversa de grupo
exports.addConversationMembers = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const iduser = Number(req.user.iduser);
        const { idconversation } = req.params;
        const requestedMemberIds = normalizeMemberIds(req.body.memberIds, iduser);

        const membership = await getConversationMembership(idconversation, iduser);

        if (!membership) {
            connection.release();
            return res.status(403).json({ message: 'Nao tens acesso a esta conversa.' });
        }

        if (membership.type !== 'group') {
            connection.release();
            return res.status(400).json({ message: 'So podes adicionar membros a conversas de grupo.' });
        }

        if (membership.idgroup) {
            connection.release();
            return res.status(400).json({ message: 'Os membros deste chat são geridos pelo grupo Lifinity.' });
        }

        if (requestedMemberIds.length === 0) {
            connection.release();
            return res.status(400).json({ message: 'Escolhe pelo menos um amigo para adicionar.' });
        }

        const currentMemberIds = await getConversationMemberIds(idconversation);
        const currentMemberSet = new Set(currentMemberIds);
        const newMemberIds = requestedMemberIds.filter((memberId) => !currentMemberSet.has(memberId));

        if (newMemberIds.length === 0) {
            connection.release();
            return res.json({ addedCount: 0, message: 'Esses utilizadores ja pertencem ao grupo.' });
        }

        const allFriends = await validateAcceptedFriends(iduser, newMemberIds);

        if (!allFriends) {
            connection.release();
            return res.status(403).json({ message: 'So podes adicionar amigos aceites ao grupo.' });
        }

        await connection.beginTransaction();

        const memberRows = newMemberIds.map((memberId) => [idconversation, memberId, 'membro']);

        await connection.query(
            `INSERT INTO CONVERSATION_MEMBER (idconversation, iduser, role)
             VALUES ${buildPlaceholders(memberRows, 3)}`,
            memberRows.flat()
        );

        await connection.query(
            `UPDATE CONVERSATION
             SET updated_at = CURRENT_TIMESTAMP
             WHERE idconversation = ?`,
            [idconversation]
        );

        await connection.commit();
        connection.release();

        await createNotifications({
            recipients: newMemberIds,
            type: 'sistema',
            message: `Foste adicionado ao grupo de conversa "${membership.name || 'Grupo'}".`,
            excludeUserId: iduser
        });

        res.status(201).json({
            addedCount: newMemberIds.length,
            message: 'Membros adicionados ao grupo.'
        });
    } catch (err) {
        await connection.rollback();
        connection.release();

        console.error('Erro ao adicionar membros a conversa:', err);
        res.status(500).json({ message: 'Erro ao adicionar membros a conversa.' });
    }
};

// Remover membro de uma conversa de grupo
exports.removeConversationMember = async (req, res) => {
    try {
        const iduser = Number(req.user.iduser);
        const targetUserId = Number(req.params.iduser);
        const { idconversation } = req.params;

        if (!targetUserId) {
            return res.status(400).json({ message: 'Membro invalido.' });
        }

        const membership = await getConversationMembership(idconversation, iduser);

        if (!membership) {
            return res.status(403).json({ message: 'Nao tens acesso a esta conversa.' });
        }

        if (membership.type !== 'group') {
            return res.status(400).json({ message: 'So podes remover membros de conversas de grupo.' });
        }

        if (membership.idgroup) {
            return res.status(400).json({ message: 'Os membros deste chat são geridos pelo grupo Lifinity.' });
        }

        if (membership.role !== 'admin') {
            return res.status(403).json({ message: 'Apenas administradores podem remover membros.' });
        }

        const [targetMembers] = await db.query(
            `SELECT role
             FROM CONVERSATION_MEMBER
             WHERE idconversation = ?
               AND iduser = ?
             LIMIT 1`,
            [idconversation, targetUserId]
        );

        if (targetMembers.length === 0) {
            return res.status(404).json({ message: 'Esse utilizador nao pertence ao grupo.' });
        }

        const [counts] = await db.query(
            `SELECT
                COUNT(*) AS memberCount,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS adminCount
             FROM CONVERSATION_MEMBER
             WHERE idconversation = ?`,
            [idconversation]
        );

        const memberCount = Number(counts[0]?.memberCount || 0);
        const adminCount = Number(counts[0]?.adminCount || 0);
        const targetRole = targetMembers[0].role;

        if (memberCount <= 1) {
            return res.status(400).json({ message: 'Nao podes remover todos os membros do grupo.' });
        }

        if (targetUserId === iduser && targetRole === 'admin' && adminCount <= 1) {
            return res.status(400).json({ message: 'Nao podes remover-te se fores o unico administrador.' });
        }

        await db.query(
            `DELETE FROM CONVERSATION_MEMBER
             WHERE idconversation = ?
               AND iduser = ?`,
            [idconversation, targetUserId]
        );

        await db.query(
            `UPDATE CONVERSATION
             SET updated_at = CURRENT_TIMESTAMP
             WHERE idconversation = ?`,
            [idconversation]
        );

        res.json({ message: 'Membro removido do grupo.' });
    } catch (err) {
        console.error('Erro ao remover membro da conversa:', err);
        res.status(500).json({ message: 'Erro ao remover membro da conversa.' });
    }
};

// Enviar mensagem de texto
exports.sendMessage = async (req, res) => {
    try {
        const iduser = Number(req.user.iduser);
        const { idconversation } = req.params;
        const content = String(req.body.content || '').trim();
        const messageType = req.body.message_type || 'text';

        if (!content) {
            return res.status(400).json({ message: 'A mensagem nao pode estar vazia.' });
        }

        if (!['text', 'verse'].includes(messageType)) {
            return res.status(400).json({ message: 'Tipo de mensagem invalido.' });
        }

        const membership = await getConversationMembership(idconversation, iduser);

        if (!membership) {
            return res.status(403).json({ message: 'Nao tens acesso a esta conversa.' });
        }

        const memberIds = await getConversationMemberIds(idconversation);

        if (membership.type === 'private') {
            if (memberIds.length !== 2) {
                return res.status(400).json({ message: 'Conversa privada invalida.' });
            }

            const otherUserId = memberIds.find((memberId) => memberId !== iduser);
            const isFriend = await friendshipExists(iduser, otherUserId);

            if (!isFriend) {
                return res.status(403).json({ message: 'Ja nao existe amizade aceite entre os utilizadores.' });
            }
        }

        const [result] = await db.query(
            `INSERT INTO MESSAGE (idconversation, idsender, content, message_type)
             VALUES (?, ?, ?, ?)`,
            [idconversation, iduser, content, messageType]
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
             LEFT JOIN USER u ON u.iduser = m.idsender
             WHERE m.idmessage = ?`,
            [result.insertId]
        );

        const sentMessage = messages[0];
        const isGroup = membership.type === 'group';
        const notificationMessage = messageType === 'verse'
            ? `${sentMessage.sender_username || 'Alguem'} enviou um versiculo.`
            : isGroup
                ? `${sentMessage.sender_username || 'Alguem'} enviou uma mensagem no grupo "${membership.name || 'Grupo'}".`
                : `${sentMessage.sender_username || 'Alguem'} enviou-te uma mensagem.`;

        await createNotifications({
            recipients: memberIds,
            type: 'sistema',
            message: notificationMessage,
            excludeUserId: iduser
        });

        await safeUnlockAchievementsForUser(iduser);

        res.status(201).json(sentMessage);
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err);
        res.status(500).json({ message: 'Erro ao enviar mensagem.' });
    }
};
