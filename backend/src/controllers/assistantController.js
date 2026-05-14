const db = require('../config/db');

const GEMINI_FALLBACK_MESSAGE =
    'Ainda nao tenho a API Gemini configurada, mas posso ajudar com tarefas, produtividade e organizacao.';

const SYSTEM_PROMPT =
    'Es o Assistente Lifinity, um assistente de produtividade, tarefas, motivacao e organizacao. Responde em portugues europeu, de forma curta, util e natural.';

const normalizeText = (value) => {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

const assistantMessageSelect = `
    SELECT idmessage, iduser, sender, content, action_type, created_at
    FROM ASSISTANT_MESSAGE
`;

const taskVisibilitySql = `
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

const getVisibilityParams = (iduser) => [iduser, iduser, iduser];

const formatDate = (date) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const insertAssistantMessage = async (executor, { iduser, sender, content, actionType = null }) => {
    const [result] = await executor.query(
        `INSERT INTO ASSISTANT_MESSAGE (iduser, sender, content, action_type)
         VALUES (?, ?, ?, ?)`,
        [iduser, sender, content, actionType]
    );

    const [messages] = await executor.query(
        `${assistantMessageSelect}
         WHERE idmessage = ?`,
        [result.insertId]
    );

    return messages[0];
};

const detectIntent = (content) => {
    const text = normalizeText(content);

    if (/^(cria tarefa|criar tarefa|adiciona tarefa|nova tarefa|lembra-me de)\b/.test(text)) {
        return 'create_task';
    }

    if (
        text.includes('tarefas pendentes') ||
        text.includes('o que tenho para fazer') ||
        text.includes('lista tarefas')
    ) {
        return 'list_pending_tasks';
    }

    if (
        text.includes('produtividade') ||
        text.includes('resumo') ||
        text.includes('como estou') ||
        text.includes('estatisticas')
    ) {
        return 'productivity_summary';
    }

    if (
        text.includes('organiza') ||
        text.includes('prioriza') ||
        text.includes('por onde comeco') ||
        text.includes('sugestao')
    ) {
        return 'organization_suggestion';
    }

    return 'gemini';
};

const extractTaskTitle = (content) => {
    return String(content || '')
        .replace(/^\s*(cria tarefa|criar tarefa|adiciona tarefa|nova tarefa|lembra-me de)\s*/i, '')
        .replace(/^[:\-\s]+/, '')
        .trim();
};

const createTaskFromMessage = async (iduser, content) => {
    const title = extractTaskTitle(content);

    if (!title) {
        return {
            actionType: 'create_task',
            content: 'Diz-me o titulo da tarefa. Exemplo: "cria tarefa estudar matematica".'
        };
    }

    const [result] = await db.query(
        `INSERT INTO TASK (iduser, title, description, priority, idcategory, due_date)
         VALUES (?, ?, NULL, 'media', NULL, NULL)`,
        [iduser, title]
    );

    return {
        actionType: 'create_task',
        content: `Tarefa criada: "${title}". Ficou com prioridade media e sem prazo definido.`,
        data: { idtask: result.insertId }
    };
};

const getPendingTasks = async (iduser, limit = 8) => {
    const [tasks] = await db.query(
        `SELECT t.idtask, t.title, t.priority, t.due_date, t.created_at
         FROM TASK t
         WHERE t.archived_at IS NULL
           AND t.status != 'concluida'
           AND (t.due_date IS NULL OR t.due_date >= NOW())
           AND ${taskVisibilitySql}
         ORDER BY FIELD(t.priority, 'alta', 'media', 'baixa'),
                  t.due_date IS NULL,
                  t.due_date ASC,
                  t.created_at ASC
         LIMIT ?`,
        [...getVisibilityParams(iduser), limit]
    );

    return tasks;
};

const listPendingTasks = async (iduser) => {
    const tasks = await getPendingTasks(iduser);

    if (tasks.length === 0) {
        return {
            actionType: 'list_pending_tasks',
            content: 'Nao tens tarefas pendentes neste momento.'
        };
    }

    const lines = tasks.map((task, index) => {
        const dueDate = formatDate(task.due_date);
        const dueText = dueDate ? ` - prazo: ${dueDate}` : '';

        return `${index + 1}. ${task.title} (${task.priority})${dueText}`;
    });

    return {
        actionType: 'list_pending_tasks',
        content: `Tens ${tasks.length} tarefa${tasks.length === 1 ? '' : 's'} pendente${tasks.length === 1 ? '' : 's'}:\n${lines.join('\n')}`
    };
};

const getProductivitySummary = async (iduser) => {
    const [taskRows] = await db.query(
        `SELECT
            COUNT(*) AS totalTasks,
            SUM(CASE WHEN t.status = 'concluida' THEN 1 ELSE 0 END) AS completedTasks,
            SUM(CASE
                WHEN t.status != 'concluida'
                 AND t.archived_at IS NULL
                 AND (t.due_date IS NULL OR t.due_date >= NOW())
                THEN 1 ELSE 0
            END) AS pendingTasks,
            SUM(CASE
                WHEN t.status != 'concluida'
                 AND t.due_date IS NOT NULL
                 AND t.due_date < NOW()
                THEN 1 ELSE 0
            END) AS lostTasks
         FROM TASK t
         WHERE ${taskVisibilitySql}`,
        getVisibilityParams(iduser)
    );

    const [xpRows] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS xpGained
         FROM XP_HISTORY
         WHERE iduser = ?`,
        [iduser]
    );

    const summary = taskRows[0] || {};
    const totalTasks = Number(summary.totalTasks || 0);
    const completedTasks = Number(summary.completedTasks || 0);
    const pendingTasks = Number(summary.pendingTasks || 0);
    const lostTasks = Number(summary.lostTasks || 0);
    const xpGained = Number(xpRows[0]?.xpGained || 0);
    const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        actionType: 'productivity_summary',
        content:
            `Resumo rapido:\n` +
            `- Tarefas totais: ${totalTasks}\n` +
            `- Concluidas: ${completedTasks}\n` +
            `- Pendentes: ${pendingTasks}\n` +
            `- Perdidas: ${lostTasks}\n` +
            `- Taxa de conclusao: ${completionRate}%\n` +
            `- XP ganho: ${xpGained}`
    };
};

const suggestOrganization = async (iduser) => {
    const tasks = await getPendingTasks(iduser, 5);

    if (tasks.length === 0) {
        return {
            actionType: 'organization_suggestion',
            content: 'Neste momento nao vejo tarefas pendentes. Boa altura para planear a proxima prioridade pequena.'
        };
    }

    const lines = tasks.map((task, index) => {
        const dueDate = formatDate(task.due_date);
        const dueText = dueDate ? `, prazo ${dueDate}` : ', sem prazo';

        return `${index + 1}. ${task.title} (${task.priority}${dueText})`;
    });

    return {
        actionType: 'organization_suggestion',
        content:
            `Eu comecaria por esta ordem:\n${lines.join('\n')}\n\n` +
            'Faz primeiro a tarefa de maior prioridade ou com prazo mais proximo, e transforma a primeira em apenas um passo de 15 minutos.'
    };
};

const getRecentAssistantMessages = async (iduser) => {
    const [messages] = await db.query(
        `${assistantMessageSelect}
         WHERE iduser = ?
         ORDER BY created_at DESC, idmessage DESC
         LIMIT 8`,
        [iduser]
    );

    return messages.reverse();
};

const callGemini = async (iduser, content) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return GEMINI_FALLBACK_MESSAGE;
    }

    if (typeof fetch !== 'function') {
        return 'A API Gemini precisa de uma versao recente do Node com fetch disponivel. Entretanto, posso ajudar com tarefas, produtividade e organizacao.';
    }

    const recentMessages = (await getRecentAssistantMessages(iduser)).filter((message, index, messages) => {
        const isCurrentMessage =
            index === messages.length - 1 &&
            message.sender === 'user' &&
            message.content === content;

        return !isCurrentMessage;
    });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const conversationContext = recentMessages.map((message) => ({
        role: message.sender === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
    })).filter((message, index, messages) => {
        if (index === 0) return message.role === 'user';

        return message.role !== messages[index - 1].role;
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [
                ...conversationContext,
                {
                    role: 'user',
                    parts: [{ text: content }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 240
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API Gemini:', response.status, errorText);
        return 'Nao consegui falar com a Gemini agora. Posso continuar a ajudar com tarefas, produtividade e organizacao.';
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join('\n')
        .trim();

    return text || 'Nao consegui gerar uma resposta agora, mas posso ajudar-te a organizar as tarefas.';
};

const runInternalAction = async (intent, iduser, content) => {
    if (intent === 'create_task') {
        return createTaskFromMessage(iduser, content);
    }

    if (intent === 'list_pending_tasks') {
        return listPendingTasks(iduser);
    }

    if (intent === 'productivity_summary') {
        return getProductivitySummary(iduser);
    }

    if (intent === 'organization_suggestion') {
        return suggestOrganization(iduser);
    }

    return null;
};

exports.getAssistantMessages = async (req, res) => {
    try {
        const iduser = req.user.iduser;

        const [messages] = await db.query(
            `${assistantMessageSelect}
             WHERE iduser = ?
             ORDER BY created_at ASC, idmessage ASC`,
            [iduser]
        );

        res.json(messages);
    } catch (err) {
        console.error('Erro ao listar mensagens do assistente:', err);
        res.status(500).json({ message: 'Erro ao listar mensagens do assistente.' });
    }
};

exports.sendAssistantMessage = async (req, res) => {
    let connection;

    try {
        connection = await db.getConnection();
        const iduser = Number(req.user.iduser);
        const content = String(req.body.content || '').trim();

        if (!content) {
            connection.release();
            return res.status(400).json({ message: 'A mensagem nao pode estar vazia.' });
        }

        await connection.beginTransaction();

        const userMessage = await insertAssistantMessage(connection, {
            iduser,
            sender: 'user',
            content
        });

        await connection.commit();
        connection.release();
        connection = null;

        const intent = detectIntent(content);
        const actionResult =
            intent === 'gemini'
                ? {
                    actionType: 'gemini',
                    content: await callGemini(iduser, content)
                }
                : await runInternalAction(intent, iduser, content);

        const assistantMessage = await insertAssistantMessage(db, {
            iduser,
            sender: 'assistant',
            content: actionResult.content,
            actionType: actionResult.actionType
        });

        res.status(201).json({
            reply: assistantMessage,
            messages: [userMessage, assistantMessage],
            action_type: actionResult.actionType,
            data: actionResult.data || null
        });
    } catch (err) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }

        console.error('Erro ao enviar mensagem ao assistente:', err);
        res.status(500).json({ message: 'Nao foi possivel responder agora. Tenta novamente daqui a pouco.' });
    }
};
