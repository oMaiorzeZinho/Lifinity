const db = require('../config/db');
// IMPORTANTE: Este require aponta para o binário que acabaste de compilar em C
const gamification = require('../../build/Release/gamification'); 

// 1. Listar todas as tarefas do utilizador logado
exports.getTasks = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        // Ordenamos por idtask DESC para as mais recentes aparecerem primeiro
        const [results] = await db.query(
            "SELECT * FROM TASK WHERE iduser = ? ORDER BY idtask DESC", 
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

        // 2. Lógica de Bónus de Velocidade (Mesmo dia?)
        const today = new Date().toISOString().split('T')[0];
        const createdAt = new Date(task.created_at).toISOString().split('T')[0];
        const isSameDay = (today === createdAt);

        // 3. CHAMADA AO MÓDULO C: Passamos a prioridade e o bónus (true/false)
        const currentStreak = 3; // Placeholder: No futuro vira da BD
        const XP_REWARD = gamification.calcularRecompensa(task.priority, isSameDay, currentStreak);

        // 4. Marcar como concluída
        await db.query("UPDATE TASK SET status = 'concluida' WHERE idtask = ?", [idtask]);

        // 5. Atualizar utilizador (XP e Nível)
        const [userStats] = await db.query("SELECT xp FROM USER WHERE iduser = ?", [iduser]);
        const currentXP = userStats[0].xp + XP_REWARD;
        const levelData = gamification.getLevelData(currentXP);

        await db.query("UPDATE USER SET xp = ?, level = ? WHERE iduser = ?", [currentXP, levelData.level, iduser]);

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

        const [result] = await db.query("DELETE FROM TASK WHERE idtask = ? AND iduser = ?", [idtask, iduser]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        res.json({ message: "Tarefa eliminada com sucesso." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearCompletedTasks = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        // Apaga apenas as tarefas concluídas deste utilizador
        await db.query("DELETE FROM TASK WHERE iduser = ? AND status = 'concluida'", [iduser]);
        res.json({ message: "Histórico limpo com sucesso." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



