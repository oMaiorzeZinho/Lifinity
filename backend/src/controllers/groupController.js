const db = require('../config/db');

// Gera um código simples para convite de grupo
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
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

// Criar grupo
exports.createGroup = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { name, description } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ message: 'O nome do grupo é obrigatório.' });
        }

        let inviteCode = generateInviteCode();

        // Tenta evitar colisões de código
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

// Entrar num grupo por código
exports.joinGroupByCode = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: 'Código de convite obrigatório.' });
        }

        const [groups] = await db.query(
            'SELECT idgroup, name FROM GROUP_ENTITY WHERE invite_code = ?',
            [inviteCode.trim().toUpperCase()]
        );

        if (groups.length === 0) {
            return res.status(404).json({ message: 'Código de grupo inválido.' });
        }

        const group = groups[0];

        const [alreadyMember] = await db.query(
            'SELECT * FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, group.idgroup]
        );

        if (alreadyMember.length > 0) {
            return res.status(400).json({ message: 'Já pertences a este grupo.' });
        }

        await db.query(
            `INSERT INTO GROUP_MEMBER (iduser, idgroup, role)
             VALUES (?, ?, 'membro')`,
            [iduser, group.idgroup]
        );

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
            return res.status(403).json({ message: 'Não tens acesso a este grupo.' });
        }

        const [members] = await db.query(
            `SELECT 
                u.iduser,
                u.username,
                u.level,
                u.xp,
                gm.role
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
            return res.status(404).json({ message: 'Grupo nÃ£o encontrado.' });
        }

        const group = groups[0];

        if (Number(group.idowner) === Number(iduser)) {
            return res.status(400).json({
                message: 'O dono do grupo nÃ£o pode sair. Apaga o grupo ou transfere a propriedade futuramente.'
            });
        }

        const [result] = await db.query(
            'DELETE FROM GROUP_MEMBER WHERE iduser = ? AND idgroup = ?',
            [iduser, idgroup]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'NÃ£o pertences a este grupo.' });
        }

        res.json({ message: 'SaÃ­ste do grupo.' });
    } catch (err) {
        console.error('Erro ao sair do grupo:', err);
        res.status(500).json({ message: 'Erro ao sair do grupo.' });
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
            return res.status(404).json({ message: 'Grupo nÃ£o encontrado.' });
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
