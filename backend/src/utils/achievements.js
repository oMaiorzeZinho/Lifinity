const db = require('../config/db');
const { createNotifications } = require('../controllers/notificationController');

const ACHIEVEMENTS = [
    {
        code: 'level_2',
        name: 'Primeiro Salto',
        description: 'Atinge o nivel 2.',
        category: 'level',
        requirements: 2,
        sort_order: 10,
        isEligible: (stats) => stats.level >= 2
    },
    {
        code: 'level_5',
        name: 'Ritmo Consistente',
        description: 'Atinge o nivel 5.',
        category: 'level',
        requirements: 5,
        sort_order: 20,
        isEligible: (stats) => stats.level >= 5
    },
    {
        code: 'xp_500',
        name: '500 XP',
        description: 'Acumula 500 XP.',
        category: 'xp',
        requirements: 500,
        sort_order: 30,
        isEligible: (stats) => stats.xp >= 500
    },
    {
        code: 'tasks_1',
        name: 'Primeira Tarefa',
        description: 'Conclui a primeira tarefa.',
        category: 'tasks',
        requirements: 1,
        sort_order: 40,
        isEligible: (stats) => stats.completedTasks >= 1
    },
    {
        code: 'tasks_10',
        name: 'Dez Feitas',
        description: 'Conclui 10 tarefas.',
        category: 'tasks',
        requirements: 10,
        sort_order: 50,
        isEligible: (stats) => stats.completedTasks >= 10
    },
    {
        code: 'tasks_50',
        name: 'Maratonista',
        description: 'Conclui 50 tarefas.',
        category: 'tasks',
        requirements: 50,
        sort_order: 60,
        isEligible: (stats) => stats.completedTasks >= 50
    },
    {
        code: 'high_priority_5',
        name: 'Prioridade Maxima',
        description: 'Conclui 5 tarefas de prioridade alta.',
        category: 'tasks',
        requirements: 5,
        sort_order: 70,
        isEligible: (stats) => stats.highPriorityTasks >= 5
    },
    {
        code: 'before_deadline_5',
        name: 'Antes do Prazo',
        description: 'Conclui 5 tarefas antes do prazo.',
        category: 'tasks',
        requirements: 5,
        sort_order: 80,
        isEligible: (stats) => stats.beforeDeadlineTasks >= 5
    },
    {
        code: 'friends_1',
        name: 'Primeira Ligacao',
        description: 'Tem 1 amigo aceite.',
        category: 'friends',
        requirements: 1,
        sort_order: 90,
        isEligible: (stats) => stats.friends >= 1
    },
    {
        code: 'friends_5',
        name: 'Circulo Proximo',
        description: 'Tem 5 amigos aceites.',
        category: 'friends',
        requirements: 5,
        sort_order: 100,
        isEligible: (stats) => stats.friends >= 5
    },
    {
        code: 'groups_1',
        name: 'Em Equipa',
        description: 'Pertence a 1 grupo.',
        category: 'groups',
        requirements: 1,
        sort_order: 110,
        isEligible: (stats) => stats.groups >= 1
    },
    {
        code: 'groups_3',
        name: 'Rede Ativa',
        description: 'Pertence a 3 grupos.',
        category: 'groups',
        requirements: 3,
        sort_order: 120,
        isEligible: (stats) => stats.groups >= 3
    },
    {
        code: 'messages_1',
        name: 'Primeira Mensagem',
        description: 'Envia a primeira mensagem.',
        category: 'chat',
        requirements: 1,
        sort_order: 130,
        isEligible: (stats) => stats.messages >= 1
    },
    {
        code: 'messages_25',
        name: 'Conversa Fluida',
        description: 'Envia 25 mensagens.',
        category: 'chat',
        requirements: 25,
        sort_order: 140,
        isEligible: (stats) => stats.messages >= 25
    },
    {
        code: 'verses_favorite_1',
        name: 'Versiculo Guardado',
        description: 'Adiciona 1 versiculo aos favoritos.',
        category: 'verses',
        requirements: 1,
        sort_order: 150,
        isEligible: (stats) => stats.favoriteVerses >= 1
    },
    {
        code: 'verses_favorite_5',
        name: 'Colecao Inspiradora',
        description: 'Adiciona 5 versiculos aos favoritos.',
        category: 'verses',
        requirements: 5,
        sort_order: 160,
        isEligible: (stats) => stats.favoriteVerses >= 5
    },
    {
        code: 'verses_shared_1',
        name: 'Inspiracao Partilhada',
        description: 'Partilha 1 versiculo no chat.',
        category: 'verses',
        requirements: 1,
        sort_order: 170,
        isEligible: (stats) => stats.sharedVerses >= 1
    },
    {
        code: 'assistant_1',
        name: 'Primeira Ajuda',
        description: 'Usa o assistente pela primeira vez.',
        category: 'assistant',
        requirements: 1,
        sort_order: 180,
        isEligible: (stats) => stats.assistantMessages >= 1
    },
    {
        code: 'assistant_10',
        name: 'Assistente Habitual',
        description: 'Usa o assistente 10 vezes.',
        category: 'assistant',
        requirements: 10,
        sort_order: 190,
        isEligible: (stats) => stats.assistantMessages >= 10
    }
];

const toNumber = (value) => Number(value || 0);

const ensureAchievementSeeds = async (executor = db) => {
    const placeholders = ACHIEVEMENTS.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values = ACHIEVEMENTS.flatMap((achievement) => [
        achievement.code,
        achievement.name,
        achievement.description,
        achievement.category,
        achievement.requirements,
        achievement.sort_order,
        achievement.is_active !== false
    ]);

    await executor.query(
        `INSERT INTO BADGE
            (code, name, description, category, requirements, sort_order, is_active)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            category = VALUES(category),
            requirements = VALUES(requirements),
            sort_order = VALUES(sort_order),
            is_active = VALUES(is_active)`,
        values
    );
};

const getAchievementStats = async (iduser) => {
    const [
        userRows,
        taskRows,
        friendRows,
        groupRows,
        messageRows,
        favoriteRows,
        assistantRows
    ] = await Promise.all([
        db.query('SELECT xp, level FROM USER WHERE iduser = ? LIMIT 1', [iduser]),
        db.query(
            `SELECT
                COUNT(*) AS completedTasks,
                SUM(CASE WHEN t.priority = 'alta' THEN 1 ELSE 0 END) AS highPriorityTasks,
                SUM(CASE
                    WHEN t.due_date IS NOT NULL
                     AND t.completed_at IS NOT NULL
                     AND t.completed_at <= t.due_date
                    THEN 1 ELSE 0
                END) AS beforeDeadlineTasks
             FROM XP_HISTORY x
             INNER JOIN TASK t ON t.idtask = x.idtask
             WHERE x.iduser = ?
               AND x.reason = 'task_completed'`,
            [iduser]
        ),
        db.query(
            `SELECT COUNT(*) AS friends
             FROM FRIENDSHIP
             WHERE status = 'aceite'
               AND (iduser_requester = ? OR iduser_receiver = ?)`,
            [iduser, iduser]
        ),
        db.query(
            `SELECT COUNT(*) AS groups
             FROM GROUP_MEMBER
             WHERE iduser = ?`,
            [iduser]
        ),
        db.query(
            `SELECT
                COUNT(*) AS messages,
                SUM(CASE WHEN message_type = 'verse' THEN 1 ELSE 0 END) AS sharedVerses
             FROM MESSAGE
             WHERE idsender = ?`,
            [iduser]
        ),
        db.query(
            `SELECT COUNT(*) AS favoriteVerses
             FROM FAVORITE_VERSE
             WHERE iduser = ?`,
            [iduser]
        ),
        db.query(
            `SELECT COUNT(*) AS assistantMessages
             FROM ASSISTANT_MESSAGE
             WHERE iduser = ?
               AND sender = 'user'`,
            [iduser]
        )
    ]);

    const user = userRows[0][0] || {};
    const tasks = taskRows[0][0] || {};
    const friends = friendRows[0][0] || {};
    const groups = groupRows[0][0] || {};
    const messages = messageRows[0][0] || {};
    const favorites = favoriteRows[0][0] || {};
    const assistant = assistantRows[0][0] || {};

    return {
        xp: toNumber(user.xp),
        level: toNumber(user.level),
        completedTasks: toNumber(tasks.completedTasks),
        highPriorityTasks: toNumber(tasks.highPriorityTasks),
        beforeDeadlineTasks: toNumber(tasks.beforeDeadlineTasks),
        friends: toNumber(friends.friends),
        groups: toNumber(groups.groups),
        messages: toNumber(messages.messages),
        sharedVerses: toNumber(messages.sharedVerses),
        favoriteVerses: toNumber(favorites.favoriteVerses),
        assistantMessages: toNumber(assistant.assistantMessages)
    };
};

const createAchievementNotification = async (iduser, unlockedAchievements) => {
    if (unlockedAchievements.length === 0) return;

    const message = unlockedAchievements.length === 1
        ? `Conquista desbloqueada: ${unlockedAchievements[0].name}`
        : `Desbloqueaste ${unlockedAchievements.length} novas conquistas`;

    const firstAchievement = unlockedAchievements[0];

    await createNotifications({
        recipients: [iduser],
        type: 'sistema',
        message,
        entity_type: 'achievement',
        entity_id: firstAchievement?.idbadge || null,
        link: '/dashboard/profile'
    });
};

const unlockAchievementsForUser = async (iduser, options = {}) => {
    const notify = options.notify !== false;

    await ensureAchievementSeeds();

    const stats = await getAchievementStats(iduser);
    const eligibleCodes = ACHIEVEMENTS
        .filter((achievement) => achievement.isEligible(stats))
        .map((achievement) => achievement.code);

    if (eligibleCodes.length === 0) {
        return [];
    }

    const [badgeRows] = await db.query(
        `SELECT idbadge, code, name
         FROM BADGE
         WHERE is_active = TRUE
           AND code IN (?)`,
        [eligibleCodes]
    );

    if (badgeRows.length === 0) {
        return [];
    }

    const badgeIds = badgeRows.map((badge) => badge.idbadge);
    const [alreadyUnlockedRows] = await db.query(
        `SELECT idbadge
         FROM USER_BADGE
         WHERE iduser = ?
           AND idbadge IN (?)`,
        [iduser, badgeIds]
    );

    const alreadyUnlocked = new Set(alreadyUnlockedRows.map((row) => Number(row.idbadge)));
    const newBadges = badgeRows.filter((badge) => !alreadyUnlocked.has(Number(badge.idbadge)));

    if (newBadges.length === 0) {
        return [];
    }

    const placeholders = newBadges.map(() => '(?, ?)').join(', ');
    const values = newBadges.flatMap((badge) => [iduser, badge.idbadge]);

    await db.query(
        `INSERT IGNORE INTO USER_BADGE (iduser, idbadge)
         VALUES ${placeholders}`,
        values
    );

    if (notify) {
        await createAchievementNotification(iduser, newBadges);
    }

    return newBadges;
};

const safeUnlockAchievementsForUser = async (iduser, options = {}) => {
    try {
        return await unlockAchievementsForUser(iduser, options);
    } catch (err) {
        console.error('Erro ao desbloquear conquistas:', err);
        return [];
    }
};

module.exports = {
    ACHIEVEMENTS,
    ensureAchievementSeeds,
    unlockAchievementsForUser,
    safeUnlockAchievementsForUser
};
