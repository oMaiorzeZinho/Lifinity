const db = require('../config/db');
const { safeUnlockAchievementsForUser } = require('../utils/achievements');
const { createNotifications } = require('./notificationController');

// Gera um codigo simples para convite de grupo
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const buildPlaceholders = (rows, columnsPerRow) => (
    rows.map(() => `(${Array(columnsPerRow).fill('?').join(', ')})`).join(', ')
);

// Duracoes possiveis para suspender (mute) um membro: minutos + texto legivel
const MUTE_DURATIONS = {
    '30min': { minutes: 30, label: '30 minutos' },
    '1d': { minutes: 1440, label: '1 dia' },
    '3d': { minutes: 4320, label: '3 dias' }
};

// Devolve a data/hora ate a qual o membro esta suspenso nesse grupo,
// ou null se nao estiver suspenso (sem registo, NULL, ou ja expirou).
const getMutedUntil = async (iduser, idgroup) => {
    const [rows] = await db.query(
        `SELECT muted_until
         FROM GROUP_MEMBER
         WHERE iduser = ? AND idgroup = ?
         LIMIT 1`,
        [iduser, idgroup]
    );

    if (rows.length === 0 || !rows[0].muted_until) {
        return null;
    }

    const mutedUntil = new Date(rows[0].muted_until);
    return mutedUntil > new Date() ? mutedUntil : null;
};

// Indica se um utilizador esta atualmente suspenso (mute) num grupo.
// Devolve true apenas se muted_until existir e ainda estiver no futuro.
const isUserMutedInGroup = async (iduser, idgroup) => {
    const mutedUntil = await getMutedUntil(iduser, idgroup);
    return mutedUntil !== null;
};

exports.getMutedUntil = getMutedUntil;
exports.isUserMutedInGroup = isUserMutedInGroup;

const syncGroupConversationMembers = async (connection, conversation, group) => {
    const [members] = await connection.query(
        `SELECT iduser
         FROM GROUP_MEMBER
         WHERE idgroup = ?
         ORDER BY iduser ASC`,
        [group.idgroup]
    );

    const memberRows = members.map((member) => [
        conversation.idconversation,
        Number(member.iduser),
        Number(member.iduser) === Number(group.idowner) ? 'admin' : 'membro'
    ]);

    await connection.query(
        `DELETE FROM CONVERSATION_MEMBER
         WHERE idconversation = ?
           AND iduser NOT IN (
                SELECT iduser
                FROM GROUP_MEMBER
                WHERE idgroup = ?
           )`,
        [conversation.idconversation, group.idgroup]
    );

    if (memberRows.length === 0) return;

    await connection.query(
        `INSERT INTO CONVERSATION_MEMBER (idconversation, iduser, role)
         VALUES ${buildPlaceholders(memberRows, 3)}
         ON DUPLICATE KEY UPDATE role = VALUES(role)`,
        memberRows.flat()
    );
};

const getOrCreateGroupConversation = async (idgroup) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [groups] = await connection.query(
            `SELECT idgroup, idowner, name
             FROM GROUP_ENTITY
             WHERE idgroup = ?
             LIMIT 1`,
            [idgroup]
        );

        if (groups.length === 0) {
            await connection.rollback();
            connection.release();
            return null;
        }

        const group = groups[0];

        const [existingConversations] = await connection.query(
            `SELECT idconversation
             FROM CONVERSATION
             WHERE idgroup = ?
             LIMIT 1`,
            [idgroup]
        );

        let conversation = existingConversations[0] || null;

        if (!conversation) {
            const [result] = await connection.query(
                `INSERT INTO CONVERSATION (type, name, idgroup, idcreated_by)
                 VALUES ('group', ?, ?, ?)`,
                [group.name, group.idgroup, group.idowner]
            );

            conversation = { idconversation: result.insertId };
        } else {
            await connection.query(
                `UPDATE CONVERSATION
                 SET type = 'group',
                     name = ?,
                     idcreated_by = ?
                 WHERE idconversation = ?`,
                [group.name, group.idowner, conversation.idconversation]
            );
        }

        await syncGroupConversationMembers(connection, conversation, group);

        await connection.commit();
        connection.release();

        return conversation;
    } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
    }
};

// Listar grupos do utilizador
exports.getMyGroups = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [groups] = await db.query(
            `SELECT 
                g.idgroup,
                g.name,
                g.description,
                g.invite_code,
                g.idowner,
                gm.role,
                g.created_at,
                COUNT(gm2.iduser) AS member_count
             FROM GROUP_ENTITY g
             INNER JOIN GROUP_MEMBER gm ON g.idgroup = gm.idgroup
             LEFT JOIN GROUP_MEMBER gm2 ON g.idgroup = gm2.idgroup
             WHERE gm.iduser = ?
             GROUP BY g.idgroup, gm.role
             ORDER BY g.created_at DESC`,
            [iduser]
        );

        res.json(groups);
    } catch (err) {
        console.error('Erro ao listar grupos:', err);
        res.status(500).json({ message: 'Erro ao listar grupos.' });
    }
};

// Criar ou obter conversa associada a um grupo Lifinity
exports.getOrCreateConversationForGroup = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idgroup } = req.params;

        const [membership] = await db.query(
            `SELECT idgroup
             FROM GROUP_MEMBER
             WHERE iduser = ?
               AND idgroup = ?
             LIMIT 1`,
            [iduser, idgroup]
        );

        if (membership.length === 0) {
            return res.status(403).json({ message: 'Nao tens acesso a este grupo.' });
        }

        const conversation = await getOrCreateGroupConversation(idgroup);

        if (!conversation) {
            return res.status(404).json({ message: 'Grupo nao encontrado.' });
        }

        res.json({
            idconversation: conversation.idconversation,
            message: 'Conversa do grupo pronta.'
        });
    } catch (err) {
        console.error('Erro ao criar ou obter conversa do grupo:', err);
        res.status(500).json({ message: 'Erro ao abrir conversa do grupo.' });
    }
};

// Criar grupo
exports.createGroup = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { name, description } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'O nome do grupo e obrigatorio.' });
        }

        let inviteCode = generateInviteCode();

        let exists = true;
        while (exists) {
            const [rows] = await db.query(
                'SELECT idgroup FROM GROUP_ENTITY WHERE invite_code = ?',
                [inviteCode]
            );

            if (rows.length === 0) {
                exists = false;
            } else {
                inviteCode = generateInviteCode();
            }
        }

        const [result] = await db.query(
            `INSERT INTO GROUP_ENTITY (idowner, name, description, invite_code)
             VALUES (?, ?, ?, ?)`,
            [iduser, name, description || null, inviteCode]
        );

        const idgroup = result.insertId;

        await db.query(
            `INSERT INTO GROUP_MEMBER (iduser, idgroup, role)
             VALUES (?, ?, 'admin')`,
            [iduser, idgroup]
        );

        await safeUnlockAchievementsForUser(iduser);

        res.status(201).json({
            message: 'Grupo criado com sucesso.',
            idgroup,
            invite_code: inviteCode
        });
    } catch (err) {
        console.error('Erro ao criar grupo:', err);
        res.status(500).json({ message: 'Erro ao criar grupo.' });
    }
};

// Entrar num grupo por codigo
exports.joinGroupByCode = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: 'Codigo de convite obrigatorio.' });
        }

        const [groups] = await db.query(
            'SELECT idgroup, name FROM GROUP_ENTITY WHERE invite_code = ?',
            [inviteCode.trim().toUpperCase()]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Codigo de grupo invalido.' });
        }

        const group = groups[0];

        const [alreadyMember] = await db.query(
            'SELECT * FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, group.idgroup]
        );

        if (alreadyMember.length > 0) {
            return res.status(400).json({ message: 'Ja pertences a este grupo.' });
        }

        await db.query(
            `INSERT INTO GROUP_MEMBER (iduser, idgroup, role)
             VALUES (?, ?, 'membro')`,
            [iduser, group.idgroup]
        );

        const [conversations] = await db.query(
            `SELECT idconversation
             FROM CONVERSATION
             WHERE idgroup = ?
             LIMIT 1`,
            [group.idgroup]
        );

        if (conversations.length > 0) {
            await db.query(
                `INSERT INTO CONVERSATION_MEMBER (idconversation, iduser, role)
                 VALUES (?, ?, 'membro')
                 ON DUPLICATE KEY UPDATE role = VALUES(role)`,
                [conversations[0].idconversation, iduser]
            );
        }

        await safeUnlockAchievementsForUser(iduser);

        res.json({
            message: `Entraste no grupo ${group.name}.`
        });
    } catch (err) {
        console.error('Erro ao entrar no grupo:', err);
        res.status(500).json({ message: 'Erro ao entrar no grupo.' });
    }
};

// Listar membros de um grupo
exports.getGroupMembers = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idgroup } = req.params;

        const [membership] = await db.query(
            'SELECT * FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, idgroup]
        );

        if (membership.length === 0) {
            return res.status(403).json({ message: 'Nao tens acesso a este grupo.' });
        }

        const [members] = await db.query(
            `SELECT
                u.iduser,
                u.username,
                u.level,
                u.xp,
                gm.role,
                gm.muted_until
             FROM GROUP_MEMBER gm
             INNER JOIN USER u ON gm.iduser = u.iduser
             WHERE gm.idgroup = ?
             ORDER BY gm.role ASC, u.username ASC`,
            [idgroup]
        );

        res.json(members);
    } catch (err) {
        console.error('Erro ao listar membros:', err);
        res.status(500).json({ message: 'Erro ao listar membros.' });
    }
};

// Sair de um grupo
exports.leaveGroup = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idgroup } = req.params;

        const [groups] = await db.query(
            'SELECT idgroup, idowner FROM GROUP_ENTITY WHERE idgroup = ?',
            [idgroup]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Grupo nao encontrado.' });
        }

        const group = groups[0];

        if (Number(group.idowner) === Number(iduser)) {
            return res.status(400).json({
                message: 'O dono do grupo nao pode sair. Apaga o grupo ou transfere a propriedade futuramente.'
            });
        }

        const [result] = await db.query(
            'DELETE FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, idgroup]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Nao pertences a este grupo.' });
        }

        await db.query(
            `DELETE cm
             FROM CONVERSATION_MEMBER cm
             INNER JOIN CONVERSATION c
                ON c.idconversation = cm.idconversation
             WHERE c.idgroup = ?
               AND cm.iduser = ?`,
            [idgroup, iduser]
        );

        res.json({ message: 'Saiste do grupo.' });
    } catch (err) {
        console.error('Erro ao sair do grupo:', err);
        res.status(500).json({ message: 'Erro ao sair do grupo.' });
    }
};

// Expulsar (kick) um membro de um grupo
exports.kickGroupMember = async (req, res) => {
    try {
        const iduser = req.user.iduser;       // quem expulsa (utilizador autenticado)
        const idgroup = req.params.idgroup;   // grupo de onde vai expulsar
        const idtarget = req.params.iduser;   // membro a ser expulso
        const { reason } = req.body;          // motivo da expulsao

        // A razao e obrigatoria e nao pode ser vazia
        const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
        if (!trimmedReason) {
            return res.status(400).json({ message: 'Tens de indicar uma razão para expulsar o membro.' });
        }

        // O grupo tem de existir
        const [groups] = await db.query(
            'SELECT idgroup, idowner, name FROM GROUP_ENTITY WHERE idgroup = ?',
            [idgroup]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Grupo nao encontrado.' });
        }

        const group = groups[0];

        // Quem expulsa tem de ser admin do grupo ou o dono
        const [membership] = await db.query(
            'SELECT role FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, idgroup]
        );

        const isOwner = Number(group.idowner) === Number(iduser);
        const isAdmin = membership.length > 0 && membership[0].role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Apenas administradores podem expulsar membros.' });
        }

        // Nao se pode expulsar a si proprio
        if (Number(idtarget) === Number(iduser)) {
            return res.status(400).json({ message: 'Não te podes expulsar a ti próprio. Usa a opção de sair do grupo.' });
        }

        // Nao se pode expulsar o dono do grupo
        if (Number(idtarget) === Number(group.idowner)) {
            return res.status(400).json({ message: 'Não podes expulsar o dono do grupo.' });
        }

        // O alvo tem de pertencer ao grupo
        const [targetMembership] = await db.query(
            'SELECT iduser FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [idtarget, idgroup]
        );

        if (targetMembership.length === 0) {
            return res.status(404).json({ message: 'Esse utilizador não pertence ao grupo.' });
        }

        // Remove o membro do grupo e da conversa associada numa transacao
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Remove de GROUP_MEMBER
            await connection.query(
                'DELETE FROM GROUP_MEMBER WHERE idgroup = ? AND iduser = ?',
                [idgroup, idtarget]
            );

            // Remove da conversa do grupo (CONVERSATION_MEMBER), tal como no leaveGroup
            await connection.query(
                `DELETE cm
                 FROM CONVERSATION_MEMBER cm
                 INNER JOIN CONVERSATION c
                    ON c.idconversation = cm.idconversation
                 WHERE c.idgroup = ?
                   AND cm.iduser = ?`,
                [idgroup, idtarget]
            );

            await connection.commit();
            connection.release();
        } catch (err) {
            await connection.rollback();
            connection.release();
            throw err;
        }

        // Notifica o membro expulso, indicando o motivo
        await createNotifications({
            recipients: [Number(idtarget)],
            type: 'sistema',
            message: `Foste removido do grupo "${group.name}". Motivo: ${trimmedReason}`,
            entity_type: 'group',
            entity_id: Number(idgroup),
            link: null
        });

        res.json({ message: 'Membro removido do grupo.' });
    } catch (err) {
        console.error('Erro ao expulsar membro do grupo:', err);
        res.status(500).json({ message: 'Erro ao expulsar membro do grupo.' });
    }
};

// Suspender (mute) temporariamente um membro de um grupo
exports.muteGroupMember = async (req, res) => {
    try {
        const iduser = req.user.iduser;       // quem suspende (utilizador autenticado)
        const idgroup = req.params.idgroup;   // grupo
        const idtarget = req.params.iduser;   // membro a suspender
        const { reason, duration } = req.body;

        // A razao e obrigatoria e nao pode ser vazia
        const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
        if (!trimmedReason) {
            return res.status(400).json({ message: 'Tens de indicar uma razão para suspender o membro.' });
        }

        // A duracao tem de ser uma das opcoes validas
        const durationConfig = MUTE_DURATIONS[duration];
        if (!durationConfig) {
            return res.status(400).json({ message: 'Duração inválida.' });
        }

        // O grupo tem de existir
        const [groups] = await db.query(
            'SELECT idgroup, idowner, name FROM GROUP_ENTITY WHERE idgroup = ?',
            [idgroup]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Grupo nao encontrado.' });
        }

        const group = groups[0];

        // Quem suspende tem de ser admin do grupo ou o dono
        const [membership] = await db.query(
            'SELECT role FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, idgroup]
        );

        const isOwner = Number(group.idowner) === Number(iduser);
        const isAdmin = membership.length > 0 && membership[0].role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Apenas administradores podem suspender membros.' });
        }

        // Nao se pode suspender a si proprio
        if (Number(idtarget) === Number(iduser)) {
            return res.status(400).json({ message: 'Não te podes suspender a ti próprio.' });
        }

        // Nao se pode suspender o dono do grupo
        if (Number(idtarget) === Number(group.idowner)) {
            return res.status(400).json({ message: 'Não podes suspender o dono do grupo.' });
        }

        // O alvo tem de pertencer ao grupo
        const [targetMembership] = await db.query(
            'SELECT iduser FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [idtarget, idgroup]
        );

        if (targetMembership.length === 0) {
            return res.status(404).json({ message: 'Esse utilizador não pertence ao grupo.' });
        }

        // Define muted_until = agora + duracao escolhida
        await db.query(
            `UPDATE GROUP_MEMBER
             SET muted_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
             WHERE idgroup = ? AND iduser = ?`,
            [durationConfig.minutes, idgroup, idtarget]
        );

        // Le de volta o valor aplicado pela BD para devolver ao cliente
        const [updatedRows] = await db.query(
            'SELECT muted_until FROM GROUP_MEMBER WHERE idgroup = ? AND iduser = ?',
            [idgroup, idtarget]
        );
        const mutedUntil = updatedRows.length > 0 ? updatedRows[0].muted_until : null;

        // Notifica o membro suspenso, indicando duracao e motivo
        await createNotifications({
            recipients: [Number(idtarget)],
            type: 'sistema',
            message: `Foste suspenso do grupo "${group.name}" durante ${durationConfig.label}. Motivo: ${trimmedReason}`,
            entity_type: 'group',
            entity_id: Number(idgroup),
            link: null
        });

        res.json({ message: 'Membro suspenso.', muted_until: mutedUntil });
    } catch (err) {
        console.error('Erro ao suspender membro do grupo:', err);
        res.status(500).json({ message: 'Erro ao suspender membro do grupo.' });
    }
};

// Levantar a suspensao (unmute) de um membro de um grupo
exports.unmuteGroupMember = async (req, res) => {
    try {
        const iduser = req.user.iduser;       // quem levanta a suspensao (autenticado)
        const idgroup = req.params.idgroup;   // grupo
        const idtarget = req.params.iduser;   // membro a reativar

        // O grupo tem de existir
        const [groups] = await db.query(
            'SELECT idgroup, idowner FROM GROUP_ENTITY WHERE idgroup = ?',
            [idgroup]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Grupo nao encontrado.' });
        }

        const group = groups[0];

        // Quem levanta a suspensao tem de ser admin do grupo ou o dono
        const [membership] = await db.query(
            'SELECT role FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, idgroup]
        );

        const isOwner = Number(group.idowner) === Number(iduser);
        const isAdmin = membership.length > 0 && membership[0].role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Apenas administradores podem levantar suspensões.' });
        }

        // Remove a suspensao (muted_until volta a NULL)
        await db.query(
            `UPDATE GROUP_MEMBER
             SET muted_until = NULL
             WHERE idgroup = ? AND iduser = ?`,
            [idgroup, idtarget]
        );

        res.json({ message: 'Suspensão removida.' });
    } catch (err) {
        console.error('Erro ao levantar suspensao do membro:', err);
        res.status(500).json({ message: 'Erro ao levantar suspensao do membro.' });
    }
};

// Apagar grupo
exports.deleteGroup = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { idgroup } = req.params;

        const [permissions] = await db.query(
            `SELECT
                g.idgroup,
                g.idowner,
                gm.role
             FROM GROUP_ENTITY g
             LEFT JOIN GROUP_MEMBER gm
                ON gm.idgroup = g.idgroup
                AND gm.iduser = ?
             WHERE g.idgroup = ?`,
            [iduser, idgroup]
        );

        if (permissions.length === 0) {
            return res.status(404).json({ message: 'Grupo nao encontrado.' });
        }

        const group = permissions[0];
        const canDelete =
            Number(group.idowner) === Number(iduser) || group.role === 'admin';

        if (!canDelete) {
            return res.status(403).json({ message: 'Apenas o dono ou um administrador pode apagar este grupo.' });
        }

        await db.query('DELETE FROM GROUP_ENTITY WHERE idgroup = ?', [idgroup]);

        res.json({ message: 'Grupo apagado.' });
    } catch (err) {
        console.error('Erro ao apagar grupo:', err);
        res.status(500).json({ message: 'Erro ao apagar grupo.' });
    }
};
