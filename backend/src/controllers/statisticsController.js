const db = require('../config/db');
const gamification = require('../../build/Release/gamification');

// Converte período do frontend para número de dias
const getPeriodDays = (period) => {
    if (period === '7d') return 7;
    if (period === '30d') return 30;
    if (period === '1y') return 365;
    return 30;
};

exports.getMyStatistics = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const period = req.query.period || '30d';
        const days = getPeriodDays(period);

        // Buscar tarefas dentro do período
        const [tasks] = await db.query(
            `SELECT idtask, title, status, priority, due_date, created_at, completed_at
             FROM TASK
             WHERE iduser = ?
             AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [iduser, days]
        );

        // Buscar histórico de XP dentro do período
        const [xpRows] = await db.query(
            `SELECT amount, created_at
             FROM XP_HISTORY
             WHERE iduser = ?
             AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [iduser, days]
        );

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.status === 'concluida').length;
        const pendingTasks = tasks.filter((task) => task.status !== 'concluida').length;

        const now = new Date();
        const lostTasks = tasks.filter((task) => {
            return (
                task.status !== 'concluida' &&
                task.due_date &&
                new Date(task.due_date) < now
            );
        }).length;

        const totalXP = xpRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

        // C calcula as estatísticas principais
        const summary = gamification.calculateStats(
            totalTasks,
            completedTasks,
            pendingTasks,
            lostTasks,
            totalXP
        );

        // Preparar dados diários para gráfico
        const chartData = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            const key = date.toISOString().split('T')[0];

            chartData.push({
                date: key,
                label: date.toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: '2-digit'
                }),
                tasksCreated: 0,
                tasksCompleted: 0,
                tasksLost: 0,
                xpGained: 0
            });
        }

        tasks.forEach((task) => {
            const createdKey = new Date(task.created_at).toISOString().split('T')[0];
            const createdDay = chartData.find((day) => day.date === createdKey);

            if (createdDay) {
                createdDay.tasksCreated += 1;
            }

            if (task.completed_at) {
                const completedKey = new Date(task.completed_at).toISOString().split('T')[0];
                const completedDay = chartData.find((day) => day.date === completedKey);

                if (completedDay) {
                    completedDay.tasksCompleted += 1;
                }
            }

            if (
                task.status !== 'concluida' &&
                task.due_date &&
                new Date(task.due_date) < now
            ) {
                const lostKey = new Date(task.due_date).toISOString().split('T')[0];
                const lostDay = chartData.find((day) => day.date === lostKey);

                if (lostDay) {
                    lostDay.tasksLost += 1;
                }
            }
        });

        xpRows.forEach((row) => {
            const xpKey = new Date(row.created_at).toISOString().split('T')[0];
            const xpDay = chartData.find((day) => day.date === xpKey);

            if (xpDay) {
                xpDay.xpGained += Number(row.amount || 0);
            }
        });

        res.json({
            period,
            comparisonMode: 'me',
            summary,
            chartData,
            comparison: {
                friendsAvailable: false,
                groupsAvailable: false,
                message: 'Comparações com amigos e grupos serão ativadas quando o módulo social estiver completo.'
            }
        });
    } catch (err) {
        console.error('Erro ao gerar estatísticas:', err);
        res.status(500).json({ message: 'Erro ao gerar estatísticas.' });
    }
};