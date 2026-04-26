const db = require('../config/db');
// IMPORTANTE: Este require aponta para o binário que acabaste de compilar em C
const gamification = require('../../build/Release/gamification'); 

// 1. Listar todas as tarefas do utilizador logado
exports.getTasks = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [results] = await db.query(
            "SELECT * FROM TASK WHERE iduser = ? AND archived_at IS NULL ORDER BY idtask DESC",
            [iduser]
        );

        res.json(results);
    } catch (err) {
        console.error("Erro ao procurar tarefas:", err);
        res.status(500).json({ error: "Erro ao carregar a lista de tarefas." });
    }
};

// 2. Criar uma nova tarefa
exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, idcategory } = req.body;
        const iduser = req.user.iduser;

        console.log("--- A Inserir Nova Tarefa na BD ---");
        
        const [result] = await db.query(
            "INSERT INTO TASK (iduser, title, description, priority, idcategory) VALUES (?, ?, ?, ?, ?)",
            [iduser, title, description, priority, idcategory || null]
        );

        console.log("Sucesso! ID da tarefa criada:", result.insertId);
        
        res.status(201).json({ 
            message: "Tarefa criada com sucesso!", 
            idtask: result.insertId 
        });
    } catch (err) {
        console.error("ERRO FATAL NO MYSQL AO CRIAR TAREFA:", err.message);
        res.status(500).json({ error: "Erro na base de dados ao criar tarefa." });
    }
};

// 3. Concluir tarefa e ganhar XP (Aqui é onde o C entra em ação!)
exports.completeTask = async (req, res) => {
    try {
        const { idtask } = req.params;
        const iduser = req.user.iduser;

        // 1. Obter dados da tarefa (prioridade e data de criação)
        const [tasks] = await db.query("SELECT * FROM TASK WHERE idtask = ? AND iduser = ?", [idtask, iduser]);
        
        if (tasks.length === 0) return res.status(404).json({ message: "Tarefa não encontrada." });

        const task = tasks[0];
        if (task.status === 'concluida') {
            return res.status(400).json({ message: "Esta tarefa já foi concluída." });
        }

        // 2. Lógica de Bónus de Velocidade (Mesmo dia?)
        const today = new Date().toISOString().split('T')[0];
        const createdAt = new Date(task.created_at).toISOString().split('T')[0];
        const isSameDay = (today === createdAt);

        // 3. CHAMADA AO MÓDULO C: Passamos a prioridade e o bónus (true/false)
        const currentStreak = 3; // Placeholder: No futuro vira da BD
        const XP_REWARD = gamification.calcularRecompensa(task.priority, isSameDay, currentStreak);

        // 4. Marcar como concluída
        await db.query("UPDATE TASK SET status = 'concluida', completed_at = NOW() WHERE idtask = ? AND iduser = ?", [idtask, iduser]);

        // 5. Atualizar utilizador (XP e Nível)
            const [userStats] = await db.query("SELECT xp FROM USER WHERE iduser = ?", [iduser]);
            const currentXP = userStats[0].xp + XP_REWARD;
            const levelData = gamification.getLevelData(currentXP);

            await db.query(
                "UPDATE USER SET xp = ?, level = ? WHERE iduser = ?",
                [currentXP, levelData.level, iduser]
            );

            // 6. Registar histórico de XP para estatísticas
            await db.query(
                "INSERT INTO XP_HISTORY (iduser, idtask, amount, reason) VALUES (?, ?, ?, ?)",
                [iduser, idtask, XP_REWARD, "task_completed"]
            );

            res.json({ 
                message: `Tarefa concluída! Ganhaste ${XP_REWARD} XP${isSameDay ? ' (Bónus de Velocidade incluído!)' : ''}.`,
                newXP: currentXP,
                newLevel: levelData.level
            });
    } catch (err) {
        console.error("Erro no módulo de XP:", err);
        res.status(500).json({ error: "Erro ao processar recompensa." });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { idtask } = req.params;
        const iduser = req.user.iduser;

        const [tasks] = await db.query(
            "SELECT status FROM TASK WHERE idtask = ? AND iduser = ?",
            [idtask, iduser]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        const task = tasks[0];

        if (task.status === 'concluida') {
            await db.query(
                "UPDATE TASK SET archived_at = NOW() WHERE idtask = ? AND iduser = ?",
                [idtask, iduser]
            );

            return res.json({
                message: "Tarefa concluída ocultada com sucesso."
            });
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
        // Apaga apenas as tarefas concluídas deste utilizador
        await db.query(
            "UPDATE TASK SET archived_at = NOW() WHERE iduser = ? AND status = 'concluida' AND archived_at IS NULL",
            [iduser]
        );

res.json({ message: "Tarefas concluídas ocultadas com sucesso." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// 7. Resumo das tarefas do utilizador
// Esta função conta também tarefas arquivadas, porque serve para estatísticas/resumo.
// 7. Resumo diário das tarefas do utilizador
// Esta função é usada no card "Produtividade de Hoje" da página de tarefas.
// Conta tarefas de hoje, incluindo concluídas que já foram ocultadas.
exports.getTaskSummary = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [rows] = await db.query(
            `SELECT 
                SUM(CASE 
                    WHEN status != 'concluida'
                    AND archived_at IS NULL
                    AND DATE(created_at) = CURDATE()
                    THEN 1 ELSE 0 
                END) AS pendingToday,

                SUM(CASE 
                    WHEN status = 'concluida'
                    AND completed_at IS NOT NULL
                    AND DATE(completed_at) = CURDATE()
                    THEN 1 ELSE 0 
                END) AS completedToday
             FROM TASK
             WHERE iduser = ?`,
            [iduser]
        );

        const summary = rows[0];

        const pendingTasks = Number(summary.pendingToday || 0);
        const completedTasks = Number(summary.completedToday || 0);
        const totalTasks = pendingTasks + completedTasks;

        const completionRate =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate
        });
    } catch (err) {
        console.error("Erro ao carregar resumo diário das tarefas:", err);
        res.status(500).json({ error: "Erro ao carregar resumo diário das tarefas." });
    }
};


