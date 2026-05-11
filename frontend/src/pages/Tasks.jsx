import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Classes reutilizáveis para manter a interface consistente
const cardClass =
  'bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-2xl';

const inputClass =
  'bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-300/40 focus:bg-white/10 transition-all';

const selectClass =
  'bg-white/5 border border-white/10 text-slate-200 outline-none cursor-pointer hover:bg-white/10 transition-all';

const emptyTaskForm = {
  title: '',
  description: '',
  priority: 'media',
  due_date: '',
  assignees: [],
  groups: []
};

const validCsvPriorities = ['baixa', 'media', 'alta'];

const normalizeCsvValue = (value) => {
  if (value === undefined || value === null) return '';

  return String(value).replace(/^\uFEFF/, '').trim();
};

const getCsvLookupKey = (value) =>
  normalizeCsvValue(value).toLowerCase().replace(/\s+/g, '');

const parseCsv = (csvText) => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const text = String(csvText || '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    if (char !== '\r') {
      field += char;
    }
  }

  if (inQuotes) {
    throw new Error('CSV invalido: aspas nao fechadas.');
  }

  row.push(field);
  rows.push(row);

  const headerRow = rows[0] || [];

  if (headerRow.every((cell) => normalizeCsvValue(cell) === '')) {
    throw new Error('O ficheiro CSV precisa de header na primeira linha.');
  }

  const headers = headerRow.map((header) =>
    normalizeCsvValue(header).toLowerCase()
  );

  if (!headers.includes('title')) {
    throw new Error('O header do CSV deve incluir a coluna title.');
  }

  return rows
    .slice(1)
    .filter((csvRow) => csvRow.some((cell) => normalizeCsvValue(cell) !== ''))
    .map((values) =>
      headers.reduce((task, header, index) => {
        if (header) {
          task[header] = normalizeCsvValue(values[index]);
        }

        return task;
      }, {})
    );
};

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Nao foi possivel ler o ficheiro CSV.'));
    reader.readAsText(file);
  });

// --- MOTOR DE GAMIFICAÇÃO (FRONTEND) ---
// Esta função calcula o nível e o progresso visual com base no XP do utilizador.
const getLevelData = (xp) => {
  if (!xp) xp = 0;

  let level = 1;

  const calculateXPForLevel = (lvl) => Math.floor(100 * Math.pow(lvl - 1, 1.5));

  while (xp >= calculateXPForLevel(level + 1)) {
    level++;
  }

  const xpStartOfLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const progress =
    ((xp - xpStartOfLevel) / (xpForNextLevel - xpStartOfLevel)) * 100;

  return {
    level,
    progress: Math.min(Math.max(progress, 0), 100),
    xpRemaining: Math.max(xpForNextLevel - xp, 0)
  };
};

// Pedido à API para carregar tarefas visíveis
const requestTasks = async (token) => {
  const res = await axios.get(`${API_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

// Pedido à API para carregar o resumo diário das tarefas
const requestTaskSummary = async (token) => {
  const res = await axios.get(`${API_URL}/tasks/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

const requestFriends = async (token) => {
  const res = await axios.get(`${API_URL}/friends`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

const requestGroups = async (token) => {
  const res = await axios.get(`${API_URL}/groups`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

const canEditTask = (task) => {
  if (task.status === 'concluida') return false;
  if (isTaskOverdue(task)) return false;
  if (!task.created_at) return false;

  const createdAt = new Date(task.created_at);
  const now = new Date();

  const diffInMs = now.getTime() - createdAt.getTime();
  const oneHourInMs = 60 * 60 * 1000;

  return diffInMs <= oneHourInMs;
};

const isTaskOverdue = (task) => {
  if (!task.due_date) return false;
  if (task.status === 'concluida') return false;

  const dueDate = new Date(task.due_date);
  const now = new Date();

  return dueDate.getTime() < now.getTime();
};

const getTaskStatusOrder = (task) => {
  if (task.status === 'concluida') return 3;
  if (isTaskOverdue(task)) return 2;
  return 1;
};

const formatDueDate = (date) => {
  if (!date) return null;

  return new Date(date).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateForInput = (date) => {
  if (!date) return '';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '';

  const offset = parsedDate.getTimezoneOffset();
  const localDate = new Date(parsedDate.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

const Tasks = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [tasks, setTasks] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [taskSummary, setTaskSummary] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    lostTasks: 0,
    completionRate: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [showFriendsPicker, setShowFriendsPicker] = useState(false);
  const [showGroupsPicker, setShowGroupsPicker] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);  

  // Estados dos filtros
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTask, setSearchTask] = useState('');
  const csvFileInputRef = useRef(null);

  const navigate = useNavigate();

  // Carrega apenas as tarefas visíveis, ou seja, não arquivadas.
  const fetchTasks = useCallback(async (token) => {
    try {
      setTasks(await requestTasks(token));
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    }
  }, []);

  // Carrega o resumo diário separado por pendentes, concluídas e perdidas.
  const fetchTaskSummary = useCallback(async (token) => {
    try {
      setTaskSummary(await requestTaskSummary(token));
    } catch (err) {
      console.error('Erro ao carregar resumo das tarefas:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!user || !token) {
      navigate('/login');
      return;
    }

    let ignore = false;

    void Promise.allSettled([
      requestTasks(token),
      requestTaskSummary(token),
      requestFriends(token),
      requestGroups(token)
    ]).then(
      ([tasksResult, summaryResult, friendsResult, groupsResult]) => {
        if (ignore) return;

        if (tasksResult.status === 'fulfilled') {
          setTasks(tasksResult.value);
        } else {
          console.error('Erro ao carregar tarefas:', tasksResult.reason);
        }

        if (summaryResult.status === 'fulfilled') {
          setTaskSummary(summaryResult.value);
        } else {
          console.error('Erro ao carregar resumo das tarefas:', summaryResult.reason);
        }

        if (friendsResult.status === 'fulfilled') {
          setFriends(friendsResult.value);
        } else {
          console.error('Erro ao carregar amigos:', friendsResult.reason);
        }

        if (groupsResult.status === 'fulfilled') {
          setGroups(groupsResult.value);
        } else {
          console.error('Erro ao carregar grupos:', groupsResult.reason);
        }
      }
    );

    return () => {
      ignore = true;
    };
  }, [navigate, user]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setShowFriendsPicker(false);
    setShowGroupsPicker(false);
    setIsModalOpen(true);
};

  const openEditModal = (task) => {
    if (!canEditTask(task)) {
      alert('Esta tarefa ja nao pode ser editada.');
      return;
    }

    setEditingTask(task);

    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'media',
      due_date: formatDateForInput(task.due_date),
      assignees: [],
      groups: []
    });

    setIsModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTaskForm(emptyTaskForm);
    setShowFriendsPicker(false);
    setShowGroupsPicker(false);
  };

  const toggleDestination = (field, value) => {
    setTaskForm((currentForm) => {
      const currentValues = currentForm[field] || [];
      const isSelected = currentValues.includes(value);

      return {
        ...currentForm,
        [field]: isSelected
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value]
      };
    });
  };

const openCompleteConfirmation = (task) => {
    setTaskToComplete(task);
  };

  const closeCompleteConfirmation = () => {
    setTaskToComplete(null);
  };

  const confirmCompleteTask = async () => {
    if (!taskToComplete) return;

    try {
      const token = localStorage.getItem('token');

      const res = await axios.put(
        `${API_URL}/tasks/complete/${taskToComplete.idtask}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const localUser = JSON.parse(localStorage.getItem('user') || '{}');

      const updatedUser = {
        ...localUser,
        xp: res.data.newXP,
        level: res.data.newLevel
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      window.dispatchEvent(new Event('lifinity-user-updated'));

      setTaskToComplete(null);

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err);
      alert(err.response?.data?.message || 'Erro ao concluir tarefa.');
    }
  };

  const handleDeleteTask = async (task) => {
    const isCompleted = task.status === 'concluida';
    const isLost = isTaskOverdue(task);
    const shouldHide = isCompleted || isLost;

    const confirmMessage = shouldHide
      ? `Tens a certeza que queres ocultar esta tarefa ${
          isLost ? 'perdida' : 'concluída'
        } da lista?`
      : 'Tens a certeza que queres eliminar esta tarefa?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/tasks/${task.idtask}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error(
        shouldHide ? 'Erro ao ocultar tarefa:' : 'Erro ao eliminar tarefa:',
        err
      );

      alert(shouldHide ? 'Erro ao ocultar tarefa.' : 'Erro ao eliminar tarefa.');
    }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm('Tens a certeza que queres ocultar as tarefas concluídas da lista?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/tasks/completed/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error('Erro ao ocultar tarefas concluídas:', err);
      alert('Erro ao ocultar tarefas concluídas.');
    }
  };

  const findFriendIdByUsername = (username) => {
    const usernameKey = getCsvLookupKey(username);

    if (!usernameKey) return null;

    const friend = friends.find((currentFriend) => {
      return getCsvLookupKey(currentFriend.username) === usernameKey;
    });

    return friend?.iduser || null;
  };

  const findGroupIdByName = (groupName) => {
    const groupKey = getCsvLookupKey(groupName);

    if (!groupKey) return null;

    const group = groups.find((currentGroup) => {
      return getCsvLookupKey(currentGroup.name) === groupKey;
    });

    return group?.idgroup || null;
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    let importedCount = 0;
    let ignoredCount = 0;
    const errors = [];

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Sessao expirada. Inicia sessao novamente.');
        return;
      }

      const csvText = await readFileAsText(file);
      const csvTasks = parseCsv(csvText);

      for (const [index, csvTask] of csvTasks.entries()) {
        const lineNumber = index + 2;
        const title = normalizeCsvValue(csvTask.title);

        if (!title) {
          ignoredCount++;
          errors.push(`Linha ${lineNumber}: title em falta.`);
          continue;
        }

        const rawPriority = normalizeCsvValue(csvTask.priority).toLowerCase();
        const priority = validCsvPriorities.includes(rawPriority)
          ? rawPriority
          : 'media';
        const assigneeNames = normalizeCsvValue(csvTask.assignees)
          .split(';')
          .map(normalizeCsvValue)
          .filter(Boolean);
        const groupNames = normalizeCsvValue(csvTask.groups)
          .split(';')
          .map(normalizeCsvValue)
          .filter(Boolean);
        const assignees = [];
        const groupIds = [];
        const missingDestinations = [];

        assigneeNames.forEach((username) => {
          const friendId = findFriendIdByUsername(username);

          if (friendId) {
            assignees.push(friendId);
          } else {
            missingDestinations.push(`username "${username}"`);
          }
        });

        groupNames.forEach((groupName) => {
          const groupId = findGroupIdByName(groupName);

          if (groupId) {
            groupIds.push(groupId);
          } else {
            missingDestinations.push(`grupo "${groupName}"`);
          }
        });

        if (missingDestinations.length > 0) {
          ignoredCount++;
          errors.push(
            `Linha ${lineNumber}: ${missingDestinations.join(', ')} nao encontrado.`
          );
          continue;
        }

        const payload = {
          title,
          description: normalizeCsvValue(csvTask.description),
          priority,
          due_date: normalizeCsvValue(csvTask.due_date) || null,
          assignees: [...new Set(assignees)],
          groups: [...new Set(groupIds)]
        };

        try {
          await axios.post(`${API_URL}/tasks`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });

          importedCount++;
        } catch (err) {
          ignoredCount++;
          errors.push(
            `Linha ${lineNumber}: ${
              err.response?.data?.message ||
              err.response?.data?.error ||
              'erro ao criar tarefa.'
            }`
          );
        }
      }

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));

      const shortErrors = errors.slice(0, 5);
      const extraErrors = errors.length - shortErrors.length;
      const alertLines = [
        `${importedCount} tarefas importadas`,
        `${ignoredCount} linhas ignoradas`
      ];

      if (shortErrors.length > 0) {
        alertLines.push('', 'Erros:', ...shortErrors);

        if (extraErrors > 0) {
          alertLines.push(`... e mais ${extraErrors} erro(s).`);
        }
      }

      alert(alertLines.join('\n'));
    } catch (err) {
      console.error('Erro ao importar CSV:', err);
      alert(
        [
          `${importedCount} tarefas importadas`,
          `${ignoredCount} linhas ignoradas`,
          '',
          'Erros:',
          err.message || 'Erro ao importar CSV.'
        ].join('\n')
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvTemplate = [
      'title,description,priority,due_date,assignees,groups',
      'Estudar Matemática,Rever capítulo 4,alta,2026-05-10T18:00,,',
      'Tarefa para amigo,Enviar tarefa para um amigo,media,2026-05-11T18:00,cliente,',
      'Tarefa para grupo,Enviar tarefa para um grupo,baixa,2026-05-12T18:00,,Grupo Sigma',
      'Descrição com vírgula,"Preparar notas, slides e perguntas",media,,,',
      'Amigo e grupo,Exemplo com vários destinos,alta,2026-05-13T20:00,cliente,Grupo Sigma'
    ].join('\n');

    const blob = new Blob([csvTemplate], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'modelo_tarefas_lifinity.csv';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      if (editingTask && !canEditTask(editingTask)) {
        alert('Esta tarefa ja nao pode ser editada.');
        closeTaskModal();
        await fetchTasks(token);
        await fetchTaskSummary(token);
        return;
      }

      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null
      };

      if (!editingTask) {
        payload.assignees = taskForm.assignees || [];
        payload.groups = taskForm.groups || [];
      }

      if (editingTask) {
        await axios.put(`${API_URL}/tasks/${editingTask.idtask}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/tasks`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      closeTaskModal();

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error('Erro ao guardar tarefa:', err);
      alert(err.response?.data?.message || 'Erro ao guardar tarefa.');
    }
  };

  if (!user) {
    return (
      <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-center">
        A carregar...
      </div>
    );
  }

  const levelData = getLevelData(user.xp);

  // Filtragem das tarefas visíveis.
  const filteredTasks = tasks
    .filter((task) => {
      const taskOverdue = isTaskOverdue(task);

      const matchesStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'completed'
            ? task.status === 'concluida'
            : filterStatus === 'lost'
              ? taskOverdue
              : task.status !== 'concluida' && !taskOverdue;

      const matchesPriority =
        filterPriority === 'all' ? true : task.priority === filterPriority;

      const matchesSearch = (task.title || '')
        .toLowerCase()
        .includes(searchTask.toLowerCase());

      return matchesStatus && matchesPriority && matchesSearch;
    })
    .sort((a, b) => {
      const statusOrderDiff = getTaskStatusOrder(a) - getTaskStatusOrder(b);

      if (statusOrderDiff !== 0) return statusOrderDiff;

      return Number(b.idtask || 0) - Number(a.idtask || 0);
    });

    const isTaskOwner = (task) => {
      return Number(task.iduser) === Number(user.iduser);
    };
  const completedVisibleTasks = tasks.filter((task) => task.status === 'concluida');

  return (
    <div className="space-y-8">
      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD NÍVEL */}
        <div className={`${cardClass} p-6 rounded-2xl`}>
          <p className="text-slate-300 text-xs font-black uppercase tracking-widest mb-1 italic">
            Nível {levelData.level}
          </p>

          <p className="text-3xl font-black text-blue-500 tracking-tighter">
            {user.xp} XP
          </p>

          <div className="w-full bg-white/10 h-3 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/30"
              style={{ width: `${levelData.progress}%` }}
            ></div>
          </div>

          <p className="text-xs text-slate-400 mt-2 font-bold uppercase italic tracking-widest">
            Faltam {Math.round(levelData.xpRemaining)} XP para o Nível{' '}
            {levelData.level + 1}
          </p>
        </div>

        {/* CARD PRODUTIVIDADE DE HOJE */}
        <div className={`${cardClass} p-6 rounded-2xl`}>
          <p className="text-slate-300 text-xs font-black uppercase tracking-widest mb-1 italic">
            Resumo de Hoje
          </p>

          <p className="text-3xl font-black text-emerald-400 tracking-tighter">
            {taskSummary.completionRate}%
          </p>

          <div className="w-full bg-white/10 h-3 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-1000 shadow-lg shadow-emerald-400/25"
              style={{ width: `${taskSummary.completionRate}%` }}
            ></div>
          </div>

          <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">
            {taskSummary.pendingTasks} pendentes {' \u2022 '}
            {taskSummary.completedTasks} concluídas {' \u2022 '}
            {taskSummary.lostTasks || 0} perdidas
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* BARRA DE FILTROS E PESQUISA */}
        <div
          className={`${cardClass} p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between`}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <input
                aria-label="Procurar tarefa"
                type="text"
                placeholder="Procurar tarefa..."
                className={`pl-10 pr-4 py-3 rounded-xl text-xs font-bold w-64 ${inputClass}`}
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
              />

              <svg
                className="absolute left-3 top-3 text-slate-500"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              aria-label="Filtrar por estado"
              className={`rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${selectClass}`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option className="bg-slate-950 text-white" value="all">
                Todos os Estados
              </option>
              <option className="bg-slate-950 text-white" value="pending">
                Pendentes
              </option>
              <option className="bg-slate-950 text-white" value="completed">
                Concluídas
              </option>
              <option className="bg-slate-950 text-white" value="lost">
                Perdidas
              </option>
            </select>

            <select
              aria-label="Filtrar por prioridade"
              className={`rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${selectClass}`}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option className="bg-slate-950 text-white" value="all">
                Todas as Prioridades
              </option>
              <option className="bg-slate-950 text-white" value="alta">
                Prioridade Alta
              </option>
              <option className="bg-slate-950 text-white" value="media">
                Prioridade Média
              </option>
              <option className="bg-slate-950 text-white" value="baixa">
                Prioridade Baixa
              </option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {completedVisibleTasks.length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-xs font-black text-red-300 uppercase tracking-widest hover:text-red-200 transition-colors mr-2"
              >
                Ocultar Concluídas
              </button>
            )}

            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportCsv}
            />

            <button
              type="button"
              onClick={() => csvFileInputRef.current?.click()}
              className="bg-white/5 border border-white/10 text-slate-300 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-sm"
            >
              Importar CSV
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className="bg-white/5 border border-white/10 text-slate-300 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              Modelo CSV
            </button>

            <button
              onClick={openCreateModal}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-950/40"
            >
              Nova Tarefa
            </button>
          </div>
        </div>

        {/* LISTAGEM FILTRADA */}
        <div className={`${cardClass} rounded-2xl overflow-hidden`}>
          <div className="p-4 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-20 text-center text-slate-500 font-bold italic uppercase text-xs tracking-widest">
                Nenhuma tarefa encontrada com estes filtros.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const taskOverdue = isTaskOverdue(task);
                const taskIsOwner = isTaskOwner(task);
                const taskCanBeEdited = taskIsOwner && canEditTask(task);
                const dueDateLabel = formatDueDate(task.due_date);

                return (
                  <div
                    key={task.idtask}
                    className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 p-6 rounded-2xl transition-all border ${
                      task.status === 'concluida'
                        ? 'bg-white/5 opacity-55 border-white/5'
                        : taskOverdue
                          ? 'bg-red-500/10 border-red-400/25 hover:bg-red-500/15'
                          : 'bg-white/5 border-white/10 hover:border-emerald-300/25 hover:bg-white/10 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <span
                        className={`font-black text-lg tracking-tight leading-tight ${
                          task.status === 'concluida'
                            ? 'text-slate-500 line-through italic'
                            : taskOverdue
                              ? 'text-red-200'
                              : 'text-white'
                        }`}
                      >
                        {task.title}
                      </span>

                      <span
                        className={`text-sm font-medium ${
                          task.status === 'concluida'
                            ? 'text-slate-500 line-through italic'
                            : 'text-slate-300'
                        }`}
                      >
                        {task.description || 'Sem descrição detalhada.'}
                      </span>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.task_origin && (
                          <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-white/5 text-slate-300 border-white/10">
                            {task.task_origin === 'created_by_me'
                              ? 'Criada por mim'
                              : task.task_origin === 'assigned_to_me'
                                ? `Recebida de ${task.creator_username || 'utilizador'}`
                                : task.task_origin === 'group_task'
                                  ? `Grupo: ${task.group_names || 'grupo'}`
                                  : 'Tarefa'}
                          </span>
                        )}
                        {dueDateLabel && (
                          <span
                            className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border ${
                              taskOverdue
                                ? 'bg-red-500/10 text-red-300 border-red-400/20'
                                : 'bg-white/5 text-slate-300 border-white/10'
                            }`}
                          >
                            Prazo: {dueDateLabel}
                          </span>
                        )}

                        {taskCanBeEdited && (
                          <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-emerald-500/10 text-emerald-300 border-emerald-400/20">
                            Editável
                          </span>
                        )}

                        {!taskCanBeEdited && task.status !== 'concluida' && (
                          <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-white/5 text-slate-500 border-white/10">
                            Edição bloqueada
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                      <span
                        className={`text-xs font-black uppercase px-4 py-2 rounded-xl tracking-widest border ${
                          task.status === 'concluida'
                            ? 'bg-white/10 text-slate-300 border-white/10'
                            : taskOverdue
                              ? 'bg-red-500/10 text-red-300 border-red-400/20'
                              : task.priority === 'alta'
                                ? 'bg-red-500/10 text-red-300 border-red-400/20'
                                : task.priority === 'media'
                                  ? 'bg-orange-500/10 text-orange-300 border-orange-400/20'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-400/20'
                        }`}
                      >
                        {task.status === 'concluida'
                          ? 'Finalizado'
                          : taskOverdue
                            ? 'Perdida'
                            : task.priority}
                      </span>

                      {taskCanBeEdited && (
                        <button
                          onClick={() => openEditModal(task)}
                          className="bg-white/5 border border-white/10 text-slate-300 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-sm"
                        >
                          Editar
                        </button>
                      )}


                      {task.status !== 'concluida' && !taskOverdue && (
                        taskToComplete?.idtask === task.idtask ? (
                          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                              Concluir?
                            </span>

                            <button
                              type="button"
                              onClick={closeCompleteConfirmation}
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                            >
                              Cancelar
                            </button>

                            <button
                              type="button"
                              onClick={confirmCompleteTask}
                              className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-950/30"
                            >
                              Confirmar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openCompleteConfirmation(task)}
                            className="bg-blue-600/10 border border-blue-400/40 text-blue-300 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                          >
                            Concluir
                          </button>
                        )
                      )}

                      {taskIsOwner && (
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="text-slate-500 hover:text-red-300 transition-all p-2"
                            title={
                              task.status === 'concluida' || taskOverdue
                                ? 'Ocultar tarefa'
                                : 'Eliminar tarefa'
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL CRIAR / EDITAR TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div
            className="bg-slate-950 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-10 space-y-8 border border-white/10"
            style={{ backgroundColor: '#111916' }}
          >
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black tracking-tighter text-white">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest italic">
                {editingTask
                  ? 'Só podes editar tarefas recentes ainda não concluídas.'
                  : 'Define o teu próximo desafio.'}
              </p>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="task-title"
                  className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2"
                >
                  Título da Tarefa
                </label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Ex: Estudar Matemática"
                  className={`w-full p-6 rounded-2xl font-bold text-slate-100 text-lg ${inputClass}`}
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="task-description"
                  className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2"
                >
                  Descrição (Opcional)
                </label>
                <textarea
                  id="task-description"
                  placeholder="Algum detalhe extra para te ajudar?"
                  className={`w-full p-6 rounded-2xl font-bold text-slate-100 h-32 resize-none ${inputClass}`}
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="task-due-date"
                  className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2"
                >
                  Data limite
                </label>
                <input
                  id="task-due-date"
                  type="datetime-local"
                  className={`w-full p-6 rounded-2xl font-bold text-slate-100 text-lg ${inputClass}`}
                  value={taskForm.due_date}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, due_date: e.target.value })
                  }
                />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2">
                  Se deixares em branco, a tarefa fica sem prazo definido.
                </p>
              </div>

              {!editingTask && (
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                    Destino
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setTaskForm({ ...taskForm, assignees: [], groups: [] })
                    }
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                      taskForm.assignees.length === 0 && taskForm.groups.length === 0
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    Só para mim
                  </button>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowFriendsPicker((current) => !current)}
                      className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-between"
                    >
                      <span>
                        Amigos
                        {taskForm.assignees.length > 0 && ` (${taskForm.assignees.length})`}
                      </span>
                      <span>{showFriendsPicker ? '▲' : '▼'}</span>
                    </button>

                    {showFriendsPicker && (
                      <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                        {friends.length === 0 ? (
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center py-4">
                            Ainda não tens amigos disponíveis.
                          </p>
                        ) : (
                          friends.map((friend) => (
                            <button
                              key={friend.iduser}
                              type="button"
                              onClick={() => toggleDestination('assignees', friend.iduser)}
                              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-widest border transition-all ${
                                taskForm.assignees.includes(friend.iduser)
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                                  : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {friend.username}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowGroupsPicker((current) => !current)}
                      className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-between"
                    >
                      <span>
                        Grupos
                        {taskForm.groups.length > 0 && ` (${taskForm.groups.length})`}
                      </span>
                      <span>{showGroupsPicker ? '▲' : '▼'}</span>
                    </button>

                    {showGroupsPicker && (
                      <div className="max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                        {groups.length === 0 ? (
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center py-4">
                            Ainda não pertences a nenhum grupo.
                          </p>
                        ) : (
                          groups.map((group) => (
                            <button
                              key={group.idgroup}
                              type="button"
                              onClick={() => toggleDestination('groups', group.idgroup)}
                              className={`w-full px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-widest border transition-all ${
                                taskForm.groups.includes(group.idgroup)
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                                  : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {group.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">
                  Prioridade do Desafio
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {['baixa', 'media', 'alta'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, priority })}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                        taskForm.priority === priority
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-950/40'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="flex-1 px-6 py-5 bg-white/10 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/15 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 px-6 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-950/40"
                >
                  {editingTask ? 'Guardar' : 'Criar Agora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
