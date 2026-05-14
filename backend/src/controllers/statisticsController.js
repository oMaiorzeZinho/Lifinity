const db = require('../config/db');
const gamification = require('../../build/Release/gamification');

const metricKeys = ['tasksCreated', 'tasksCompleted', 'tasksLost', 'xpGained'];

const getPeriodDays = (period) => {
    if (period === '7d') return 7;
    if (period === '30d') return 30;
    if (period === '1y') return 365;
    return 30;
};

const roundOne = (value) => Math.round(Number(value || 0) * 10) / 10;

const createEmptyChartData = (days) => {
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

    return chartData;
};

const getMetrics = (day) => {
    return {
        tasksCreated: Number(day?.tasksCreated || 0),
        tasksCompleted: Number(day?.tasksCompleted || 0),
        tasksLost: Number(day?.tasksLost || 0),
        xpGained: Number(day?.xpGained || 0)
    };
};

const isLostTask = (task) => Number(task.is_lost) === 1;

const getUserStatisticsData = async (iduser, days) => {
    const [tasks] = await db.query(
        `SELECT idtask,
                title,
                status,
                priority,
                due_date,
                created_at,
                completed_at,
                (due_date IS NOT NULL AND due_date < NOW() AND status != 'concluida') AS is_lost
         FROM TASK
         WHERE iduser = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [iduser, days]
    );

    const [xpRows] = await db.query(
        `SELECT amount, created_at
         FROM XP_HISTORY
         WHERE iduser = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [iduser, days]
    );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'concluida').length;
    const lostTasks = tasks.filter(isLostTask).length;
    const pendingTasks = tasks.filter((task) => {
        return task.status !== 'concluida' && !isLostTask(task);
    }).length;
    const totalXP = xpRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const summary = gamification.calculateStats(
        totalTasks,
        completedTasks,
        pendingTasks,
        lostTasks,
        totalXP
    );

    const chartData = createEmptyChartData(days);
    const chartDataByDate = new Map(chartData.map((day) => [day.date, day]));

    tasks.forEach((task) => {
        const createdKey = new Date(task.created_at).toISOString().split('T')[0];
        const createdDay = chartDataByDate.get(createdKey);

        if (createdDay) {
            createdDay.tasksCreated += 1;
        }

        if (task.completed_at) {
            const completedKey = new Date(task.completed_at).toISOString().split('T')[0];
            const completedDay = chartDataByDate.get(completedKey);

            if (completedDay) {
                completedDay.tasksCompleted += 1;
            }
        }

        if (isLostTask(task)) {
            const lostKey = new Date(task.due_date).toISOString().split('T')[0];
            const lostDay = chartDataByDate.get(lostKey);

            if (lostDay) {
                lostDay.tasksLost += 1;
            }
        }
    });

    xpRows.forEach((row) => {
        const xpKey = new Date(row.created_at).toISOString().split('T')[0];
        const xpDay = chartDataByDate.get(xpKey);

        if (xpDay) {
            xpDay.xpGained += Number(row.amount || 0);
        }
    });

    return { summary, chartData };
};

const averageSummaries = (statisticsList) => {
    if (statisticsList.length === 0) {
        return gamification.calculateStats(0, 0, 0, 0, 0);
    }

    const totals = statisticsList.reduce(
        (acc, stats) => {
            Object.keys(acc).forEach((key) => {
                acc[key] += Number(stats.summary[key] || 0);
            });

            return acc;
        },
        {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            lostTasks: 0,
            totalXP: 0,
            completionRate: 0,
            productivityScore: 0
        }
    );

    Object.keys(totals).forEach((key) => {
        totals[key] = roundOne(totals[key] / statisticsList.length);
    });

    return totals;
};

const averageChartData = (statisticsList, days) => {
    const chartData = createEmptyChartData(days);

    if (statisticsList.length === 0) {
        return chartData;
    }

    chartData.forEach((day, index) => {
        metricKeys.forEach((metric) => {
            const total = statisticsList.reduce((sum, stats) => {
                return sum + Number(stats.chartData[index]?.[metric] || 0);
            }, 0);

            day[metric] = roundOne(total / statisticsList.length);
        });
    });

    return chartData;
};

const buildComparisonChartData = (meChartData, comparisonChartData) => {
    return meChartData.map((day, index) => {
        return {
            date: day.date,
            label: day.label,
            me: getMetrics(day),
            comparison: getMetrics(comparisonChartData[index])
        };
    });
};

exports.getMyStatistics = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const period = req.query.period || '30d';
        const days = getPeriodDays(period);
        const statistics = await getUserStatisticsData(iduser, days);

        res.json({
            period,
            comparisonMode: 'me',
            summary: statistics.summary,
            chartData: statistics.chartData,
            comparison: {
                friendsAvailable: true,
                groupsAvailable: true,
                message: 'Comparacoes com amigos e grupos disponiveis.'
            }
        });
    } catch (err) {
        console.error('Erro ao gerar estatisticas:', err);
        res.status(500).json({ message: 'Erro ao gerar estatisticas.' });
    }
};

exports.compareWithFriend = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const idfriend = Number(req.params.idfriend);
        const period = req.query.period || '30d';
        const days = getPeriodDays(period);

        if (!idfriend || idfriend === Number(iduser)) {
            return res.status(400).json({ message: 'Amigo invalido.' });
        }

        const [friendship] = await db.query(
            `SELECT idfriendship
             FROM FRIENDSHIP
             WHERE status = 'aceite'
             AND (
                (iduser_requester = ? AND iduser_receiver = ?)
                OR
                (iduser_requester = ? AND iduser_receiver = ?)
             )`,
            [iduser, idfriend, idfriend, iduser]
        );

        if (friendship.length === 0) {
            return res.status(403).json({ message: 'So podes comparar com amigos aceites.' });
        }

        const [friends] = await db.query(
            `SELECT iduser, username
             FROM USER
             WHERE iduser = ?`,
            [idfriend]
        );

        const meStatistics = await getUserStatisticsData(iduser, days);
        const friendStatistics = await getUserStatisticsData(idfriend, days);

        res.json({
            period,
            comparisonMode: 'friend',
            target: {
                id: idfriend,
                name: friends[0]?.username || 'Amigo',
                type: 'friend'
            },
            summary: meStatistics.summary,
            comparisonSummary: friendStatistics.summary,
            chartData: buildComparisonChartData(
                meStatistics.chartData,
                friendStatistics.chartData
            )
        });
    } catch (err) {
        console.error('Erro ao comparar estatisticas com amigo:', err);
        res.status(500).json({ message: 'Erro ao comparar estatisticas com amigo.' });
    }
};

exports.compareWithGroup = async (req, res) => {
    try {
        const iduser = req.user.iduser;
        const idgroup = Number(req.params.idgroup);
        const period = req.query.period || '30d';
        const days = getPeriodDays(period);

        if (!idgroup) {
            return res.status(400).json({ message: 'Grupo invalido.' });
        }

        const [membership] = await db.query(
            `SELECT gm.idgroup, g.name
             FROM GROUP_MEMBER gm
             INNER JOIN GROUP_ENTITY g ON g.idgroup = gm.idgroup
             WHERE gm.iduser = ?
             AND gm.idgroup = ?`,
            [iduser, idgroup]
        );

        if (membership.length === 0) {
            return res.status(403).json({ message: 'So podes comparar com grupos onde es membro.' });
        }

        const [members] = await db.query(
            `SELECT iduser
             FROM GROUP_MEMBER
             WHERE idgroup = ?`,
            [idgroup]
        );

        const meStatistics = await getUserStatisticsData(iduser, days);
        const memberStatistics = await Promise.all(
            members.map((member) => getUserStatisticsData(member.iduser, days))
        );

        const groupChartData = averageChartData(memberStatistics, days);
        const groupSummary = averageSummaries(memberStatistics);

        res.json({
            period,
            comparisonMode: 'group',
            target: {
                id: idgroup,
                name: membership[0].name,
                type: 'group',
                memberCount: members.length
            },
            summary: meStatistics.summary,
            comparisonSummary: groupSummary,
            chartData: buildComparisonChartData(meStatistics.chartData, groupChartData)
        });
    } catch (err) {
        console.error('Erro ao comparar estatisticas com grupo:', err);
        res.status(500).json({ message: 'Erro ao comparar estatisticas com grupo.' });
    }
};
