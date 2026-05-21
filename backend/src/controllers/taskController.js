const db = require('../config/db');
const { createNotifications } = require('./notificationController');
const { safeUnlockAchievementsForUser } = require('../utils/achievements');
// IMPORTANTE: Este require aponta para o binário que acabaste de compilar em C
const gamification = require('../../build/Release/gamification'); 

const taskVisibilityCondition = `
    (
        t.iduser = ?
        OR EXISTS (
            SELECT 1
            FROM TASK_ASSIGNEE ta
            WHERE ta.idtask = t.idtask
              AND ta.iduser = ?
        )
        OR EXISTS (
            SELECT 1
            FROM GROUP_TASK gt
            INNER JOIN GROUP_MEMBER gm
                ON gm.idgroup = gt.idgroup
            WHERE gt.idtask = t.idtask
              AND gm.iduser = ?
        )
    )
`;

const taskHiddenForUserCondition = `
    NOT EXISTS (
        SELECT 1
        FROM TASK_USER_ARCHIVE tua
        WHERE tua.idtask = t.idtask
          AND tua.iduser = ?
    )
`;

// 1. Listar todas as tarefas do utilizador logado
exports.getTasks = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [results] = await db.query(
            `SELECT
                t.*,
                creator.username AS creator_username,

                CASE
                    WHEN t.iduser = ? THEN 'created_by_me'
                    WHEN EXISTS (
                        SELECT 1
                        FROM TASK_ASSIGNEE ta
                        WHERE ta.idtask = t.idtask
                          AND ta.iduser = ?
                    ) THEN 'assigned_to_me'
                    WHEN EXISTS (
                        SELECT 1
                        FROM GROUP_TASK gt
                        INNER JOIN GROUP_MEMBER gm
                            ON gm.idgroup = gt.idgroup
                        WHERE gt.idtask = t.idtask
                          AND gm.iduser = ?
                    ) THEN 'group_task'
                    ELSE 'unknown'
                END AS task_origin,

                (
                    SELECT GROUP_CONCAT(DISTINCT ge.name SEPARATOR ', ')
                    FROM GROUP_TASK gt
                    INNER JOIN GROUP_ENTITY ge
                        ON ge.idgroup = gt.idgroup
                    INNER JOIN GROUP_MEMBER gm
                        ON gm.idgroup = gt.idgroup
                    WHERE gt.idtask = t.idtask
                      AND gm.iduser = ?
                ) AS group_names

             FROM TASK t
             INNER JOIN USER creator
                ON creator.iduser = t.iduser

             WHERE t.archived_at IS NULL
               AND ${taskHiddenForUserCondition}
               AND ${taskVisibilityCondition}

             ORDER BY t.idtask DESC`,
            [iduser, iduser, iduser, iduser, iduser, iduser, iduser, iduser]
        );

        res.json(results);
    } catch (err) {
        console.error("Erro ao procurar tarefas:", err);
        res.status(500).json({ error: "Erro ao carregar a lista de tarefas." });
    }
};

// 2. Criar uma nova tarefa
// 2. Criar uma nova tarefa
exports.createTask = async (req, res) => {
    let connection;

    try {
        const { title, description, priority, idcategory, due_date } = req.body;
        const iduser = req.user.iduser;

        const normalizeIdList = (value) => {
            if (value === undefined || value === null) return [];
            if (!Array.isArray(value)) return null;

            const ids = value.map((id) => Number(id));

            if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
                return null;
            }

            return [...new Set(ids)];
        };

        const assigneeIds = normalizeIdList(req.body.assignees);
        const groupIds = normalizeIdList(req.body.groups);
        const taskNotificationRecipients = new Set(assigneeIds || []);

        if (!assigneeIds || !groupIds) {
            return res.status(400).json({
                message: "Destinos invalidos."
            });
        }

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                message: "O título da tarefa é obrigatório."
            });
        }

        const validPriorities = ["baixa", "media", "alta"];

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Prioridade inválida."
            });
        }

        const normalizedDueDate =
            due_date && String(due_date).trim() !== ""
                ? due_date
                : null;

        console.log("--- A Inserir Nova Tarefa na BD ---");

        if (assigneeIds.length > 0) {
            const placeholders = assigneeIds.map(() => '?').join(', ');
            const [friends] = await db.query(
                `SELECT DISTINCT
                    CASE
                        WHEN iduser_requester = ? THEN iduser_receiver
                        ELSE iduser_requester
                    END AS iduser
                 FROM FRIENDSHIP
                 WHERE status = 'aceite'
                 AND (
                    (iduser_requester = ? AND iduser_receiver IN (${placeholders}))
                    OR
                    (iduser_receiver = ? AND iduser_requester IN (${placeholders}))
                 )`,
                [iduser, iduser, ...assigneeIds, iduser, ...assigneeIds]
            );

            const validFriendIds = new Set(friends.map((friend) => Number(friend.iduser)));
            const invalidAssignees = assigneeIds.filter((assigneeId) => {
                return !validFriendIds.has(assigneeId);
            });

            if (invalidAssignees.length > 0) {
                return res.status(403).json({
                    message: "So podes atribuir tarefas a amigos aceites."
                });
            }
        }

        if (groupIds.length > 0) {
            const placeholders = groupIds.map(() => '?').join(', ');
            const [groups] = await db.query(
                `SELECT DISTINCT idgroup
                 FROM GROUP_MEMBER
                 WHERE iduser = ?
                 AND idgroup IN (${placeholders})`,
                [iduser, ...groupIds]
            );

            const validGroupIds = new Set(groups.map((group) => Number(group.idgroup)));
            const invalidGroups = groupIds.filter((groupId) => {
                return !validGroupIds.has(groupId);
            });

            if (invalidGroups.length > 0) {
                return res.status(403).json({
                    message: "So podes enviar tarefas para grupos aos quais pertences."
                });
            }

            const [groupMembers] = await db.query(
                `SELECT DISTINCT iduser
                 FROM GROUP_MEMBER
                 WHERE idgroup IN (${placeholders})`,
                groupIds
            );

            groupMembers.forEach((member) => {
                taskNotificationRecipients.add(Number(member.iduser));
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO TASK 
             (iduser, title, description, priority, idcategory, due_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                iduser,
                title.trim(),
                description || null,
                priority || "media",
                idcategory || null,
                normalizedDueDate
            ]
        );

        const idtask = result.insertId;

        if (assigneeIds.length > 0) {
            const placeholders = assigneeIds.map(() => '(?, ?, ?)').join(', ');
            const values = assigneeIds.flatMap((assigneeId) => [idtask, assigneeId, iduser]);

            await connection.query(
                `INSERT INTO TASK_ASSIGNEE (idtask, iduser, assigned_by)
                 VALUES ${placeholders}`,
                values
            );
        }

        if (groupIds.length > 0) {
            const placeholders = groupIds.map(() => '(?, ?)').join(', ');
            const values = groupIds.flatMap((groupId) => [idtask, groupId]);

            await connection.query(
                `INSERT INTO GROUP_TASK (idtask, idgroup)
                 VALUES ${placeholders}`,
                values
            );
        }

        await createNotifications({
            recipients: [...taskNotificationRecipients],
            type: 'tarefa',
            message: `Recebeste uma nova tarefa: ${title.trim()}.`,
            entity_type: 'task',
            entity_id: idtask,
            link: '/dashboard/tasks',
            excludeUserId: iduser,
            executor: connection
        });

        await connection.commit();

        console.log("Sucesso! ID da tarefa criada:", idtask);

        res.status(201).json({
            message: "Tarefa criada com sucesso!",
            idtask
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error("ERRO FATAL NO MYSQL AO CRIAR TAREFA:", err.message);
        res.status(500).json({
            error: "Erro na base de dados ao criar tarefa."
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// 3. Concluir tarefa e ganhar XP (Aqui é onde o C entra em ação!)
exports.completeTask = async (req, res) => {
    try {
        const { idtask } = req.params;
        const iduser = req.user.iduser;

        const [tasks] = await db.query(
            `SELECT t.*
             FROM TASK t
             WHERE t.idtask = ?
               AND (
                    t.iduser = ?
                    OR EXISTS (
                        SELECT 1
                        FROM TASK_ASSIGNEE ta
                        WHERE ta.idtask = t.idtask
                          AND ta.iduser = ?
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM GROUP_TASK gt
                        INNER JOIN GROUP_MEMBER gm
                            ON gm.idgroup = gt.idgroup
                        WHERE gt.idtask = t.idtask
                          AND gm.iduser = ?
                    )
               )`,
            [idtask, iduser, iduser, iduser]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "Tarefa não encontrada."
            });
        }

        const task = tasks[0];

        if (task.status === "concluida") {
            return res.status(400).json({
                message: "Esta tarefa já foi concluída."
            });
        }

        if (task.due_date && new Date(task.due_date) < new Date()) {
            return res.status(403).json({
                message: "Esta tarefa já passou do prazo e foi marcada como perdida."
            });
        }

        const today = new Date().toISOString().split('T')[0];
        const createdAt = new Date(task.created_at).toISOString().split('T')[0];
        const isSameDay = today === createdAt;

        const currentStreak = 3;
        const XP_REWARD = gamification.calcularRecompensa(
            task.priority,
            isSameDay,
            currentStreak
        );

        await db.query(
            "UPDATE TASK SET status = 'concluida', completed_at = NOW() WHERE idtask = ?",
            [idtask]
        );

        const [userStats] = await db.query(
            "SELECT xp FROM USER WHERE iduser = ?",
            [iduser]
        );

        const currentXP = userStats[0].xp + XP_REWARD;
        const levelData = gamification.getLevelData(currentXP);

        await db.query(
            "UPDATE USER SET xp = ?, level = ? WHERE iduser = ?",
            [currentXP, levelData.level, iduser]
        );

        await db.query(
            "INSERT INTO XP_HISTORY (iduser, idtask, amount, reason) VALUES (?, ?, ?, ?)",
            [iduser, idtask, XP_REWARD, "task_completed"]
        );

        await safeUnlockAchievementsForUser(iduser);

        res.json({
            message: `Tarefa concluída! Ganhaste ${XP_REWARD} XP${
                isSameDay ? " (Bónus de Velocidade incluído!)" : ""
            }.`,
            newXP: currentXP,
            newLevel: levelData.level
        });
    } catch (err) {
        console.error("Erro no módulo de XP:", err);
        res.status(500).json({
            error: "Erro ao processar recompensa."
        });
    }
};

// 4. Editar tarefa
// Regras:
// - só o criador da tarefa pode editar;
// - só pode editar até 1 hora depois da criação;
// - tarefas concluídas não podem ser editadas.
exports.updateTask = async (req, res) => {
    try {
        const { idtask } = req.params;
        const iduser = req.user.iduser;

        const {
            title,
            description,
            priority,
            due_date,
            idcategory
        } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                message: "O título da tarefa é obrigatório."
            });
        }

        const validPriorities = ["baixa", "media", "alta"];

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Prioridade inválida."
            });
        }

        // Procurar tarefa e confirmar se pertence ao utilizador autenticado
        const [tasks] = await db.query(
            `SELECT *,
                    (due_date IS NOT NULL AND due_date < NOW() AND status != 'concluida') AS is_lost
             FROM TASK
             WHERE idtask = ? AND iduser = ?`,
            [idtask, iduser]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "Tarefa não encontrada ou sem permissão para editar."
            });
        }

        const task = tasks[0];

        if (task.status === "concluida") {
            return res.status(403).json({
                message: "Não é possível editar uma tarefa já concluída."
            });
        }

        // Regra: tarefas perdidas nao podem ser editadas.
        if (Number(task.is_lost) === 1) {
            return res.status(403).json({
                message: "Nao e possivel editar uma tarefa perdida."
            });
        }

        // Regra: so pode editar ate 1 hora depois da criacao.
        const createdAt = new Date(task.created_at);
        const now = new Date();
        const diffInMs = now.getTime() - createdAt.getTime();
        const oneHourInMs = 60 * 60 * 1000;

        if (diffInMs > oneHourInMs) {
            return res.status(403).json({
                message: "Esta tarefa já não pode ser editada porque passou mais de 1 hora desde a criação."
            });
        }

        const normalizedDueDate = due_date && due_date.trim() !== ""
            ? due_date
            : null;

        await db.query(
            `UPDATE TASK
             SET title = ?,
                 description = ?,
                 priority = ?,
                 due_date = ?,
                 idcategory = ?
             WHERE idtask = ? AND iduser = ?`,
            [
                title.trim(),
                description || null,
                priority || "media",
                normalizedDueDate,
                idcategory || null,
                idtask,
                iduser
            ]
        );

        res.json({
            message: "Tarefa atualizada com sucesso."
        });
    } catch (err) {
        console.error("Erro ao editar tarefa:", err);
        res.status(500).json({
            error: "Erro ao editar tarefa."
        });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { idtask } = req.params;
        const iduser = req.user.iduser;

        const [tasks] = await db.query(
            `SELECT
                t.idtask,
                t.iduser,
                t.status,
                (t.due_date IS NOT NULL AND t.due_date < NOW() AND t.status != 'concluida') AS is_lost,
                EXISTS (
                    SELECT 1
                    FROM TASK_ASSIGNEE ta
                    WHERE ta.idtask = t.idtask
                ) AS has_assignees,
                EXISTS (
                    SELECT 1
                    FROM GROUP_TASK gt
                    WHERE gt.idtask = t.idtask
                ) AS has_groups
             FROM TASK t
             WHERE t.idtask = ?
               AND t.archived_at IS NULL
               AND ${taskHiddenForUserCondition}
               AND ${taskVisibilityCondition}`,
            [idtask, iduser, iduser, iduser, iduser]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        const task = tasks[0];
        const isOwner = Number(task.iduser) === Number(iduser);
        const isShared = Number(task.has_assignees) === 1 || Number(task.has_groups) === 1;

        if (task.status === 'concluida' || Number(task.is_lost) === 1) {
            if (isOwner && !isShared) {
                await db.query(
                    "UPDATE TASK SET archived_at = NOW() WHERE idtask = ? AND iduser = ?",
                    [idtask, iduser]
                );
            } else {
                await db.query(
                    `INSERT INTO TASK_USER_ARCHIVE (idtask, iduser)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE hidden_at = CURRENT_TIMESTAMP`,
                    [idtask, iduser]
                );
            }

            return res.json({
                message:
                    task.status === 'concluida'
                        ? "Tarefa concluída ocultada com sucesso."
                        : "Tarefa perdida ocultada com sucesso."
            });
        }

        if (!isOwner) {
            return res.status(403).json({ message: "Nao podes eliminar uma tarefa de outro utilizador." });
        }

        await db.query(
            "DELETE FROM TASK WHERE idtask = ? AND iduser = ?",
            [idtask, iduser]
        );

        res.json({ message: "Tarefa eliminada com sucesso." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearCompletedTasks = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        await db.query(
            `INSERT INTO TASK_USER_ARCHIVE (idtask, iduser)
             SELECT t.idtask, ?
             FROM TASK t
             WHERE t.status = 'concluida'
               AND t.archived_at IS NULL
               AND ${taskHiddenForUserCondition}
               AND ${taskVisibilityCondition}
               AND (
                    t.iduser <> ?
                    OR EXISTS (
                        SELECT 1
                        FROM TASK_ASSIGNEE ta
                        WHERE ta.idtask = t.idtask
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM GROUP_TASK gt
                        WHERE gt.idtask = t.idtask
                    )
               )
             ON DUPLICATE KEY UPDATE hidden_at = CURRENT_TIMESTAMP`,
            [iduser, iduser, iduser, iduser, iduser, iduser]
        );
        // Arquiva globalmente apenas tarefas pessoais; colaborativas ficam ocultas por utilizador.
        await db.query(
            `UPDATE TASK t
             SET t.archived_at = NOW()
             WHERE t.iduser = ?
               AND t.status = 'concluida'
               AND t.archived_at IS NULL
               AND NOT EXISTS (
                    SELECT 1
                    FROM TASK_ASSIGNEE ta
                    WHERE ta.idtask = t.idtask
               )
               AND NOT EXISTS (
                    SELECT 1
                    FROM GROUP_TASK gt
                    WHERE gt.idtask = t.idtask
               )`,
            [iduser]
        );

        res.json({ message: "Tarefas concluídas ocultadas com sucesso." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.hideCompletedVisibleTasks = async (req, res) => {
    let connection;

    try {
        const iduser = req.user.iduser;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [visibleRows] = await connection.query(
            `SELECT COUNT(*) AS total
             FROM TASK t
             WHERE t.archived_at IS NULL
               AND ${taskHiddenForUserCondition}
               AND ${taskVisibilityCondition}
               AND t.status = 'concluida'`,
            [iduser, iduser, iduser, iduser]
        );

        const totalVisible = Number(visibleRows[0]?.total || 0);

        if (totalVisible === 0) {
            await connection.commit();
            return res.json({
                message: "Nao ha tarefas concluidas para ocultar.",
                hiddenCount: 0
            });
        }

        await connection.query(
            `UPDATE TASK t
             SET t.archived_at = NOW()
             WHERE t.iduser = ?
               AND t.archived_at IS NULL
               AND ${taskHiddenForUserCondition}
               AND t.status = 'concluida'
               AND NOT EXISTS (
                    SELECT 1
                    FROM TASK_ASSIGNEE ta
                    WHERE ta.idtask = t.idtask
               )
               AND NOT EXISTS (
                    SELECT 1
                    FROM GROUP_TASK gt
                    WHERE gt.idtask = t.idtask
               )`,
            [iduser, iduser]
        );

        await connection.query(
            `INSERT INTO TASK_USER_ARCHIVE (idtask, iduser)
             SELECT t.idtask, ?
             FROM TASK t
             WHERE t.archived_at IS NULL
               AND ${taskHiddenForUserCondition}
               AND ${taskVisibilityCondition}
               AND t.status = 'concluida'
               AND NOT (
                    t.iduser = ?
                    AND NOT EXISTS (
                        SELECT 1
                        FROM TASK_ASSIGNEE ta
                        WHERE ta.idtask = t.idtask
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM GROUP_TASK gt
                        WHERE gt.idtask = t.idtask
                    )
               )
             ON DUPLICATE KEY UPDATE hidden_at = CURRENT_TIMESTAMP`,
            [iduser, iduser, iduser, iduser, iduser, iduser]
        );

        await connection.commit();

        res.json({
            message: `${totalVisible} tarefa(s) concluida(s) ocultada(s) com sucesso.`,
            hiddenCount: totalVisible
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Erro ao ocultar tarefas concluidas visiveis:", err);
        res.status(500).json({ error: "Erro ao ocultar tarefas concluidas visiveis." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// 7. Resumo diario das tarefas do utilizador.
// Tarefas ocultadas continuam a contar no dia em que foram concluidas/perdidas.
// 7. Resumo diario das tarefas do utilizador.
// Conta tarefas criadas pelo utilizador, atribuídas diretamente e tarefas de grupos.
exports.getTaskSummary = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [rows] = await db.query(
            `SELECT 
                SUM(CASE 
                    WHEN t.status != 'concluida'
                    AND t.archived_at IS NULL
                    AND (t.due_date IS NULL OR t.due_date >= NOW())
                    AND DATE(t.created_at) = CURDATE()
                    THEN 1 ELSE 0 
                END) AS pendingTasks,

                SUM(CASE 
                    WHEN t.status = 'concluida'
                    AND t.completed_at IS NOT NULL
                    AND DATE(t.completed_at) = CURDATE()
                    THEN 1 ELSE 0 
                END) AS completedTasks,

                SUM(CASE
                    WHEN t.status != 'concluida'
                    AND t.due_date IS NOT NULL
                    AND t.due_date < NOW()
                    AND DATE(t.due_date) = CURDATE()
                    THEN 1 ELSE 0
                END) AS lostTasks

             FROM TASK t
             WHERE (
                    t.iduser = ?
                    OR EXISTS (
                        SELECT 1
                        FROM TASK_ASSIGNEE ta
                        WHERE ta.idtask = t.idtask
                          AND ta.iduser = ?
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM GROUP_TASK gt
                        INNER JOIN GROUP_MEMBER gm
                            ON gm.idgroup = gt.idgroup
                        WHERE gt.idtask = t.idtask
                          AND gm.iduser = ?
                    )
             )`,
            [iduser, iduser, iduser]
        );

        const summary = rows[0];

        const pendingTasks = Number(summary.pendingTasks || 0);
        const completedTasks = Number(summary.completedTasks || 0);
        const lostTasks = Number(summary.lostTasks || 0);
        const totalTasks = pendingTasks + completedTasks + lostTasks;

        const completionRate =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            lostTasks,
            completionRate
        });
    } catch (err) {
        console.error("Erro ao carregar resumo diario das tarefas:", err);
        res.status(500).json({
            error: "Erro ao carregar resumo diario das tarefas."
        });
    }
};


