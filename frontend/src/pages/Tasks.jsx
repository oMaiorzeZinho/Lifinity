import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Classes reutilizáveis para manter a interface consistente
const cardClass =
  'lifinity-card';

const inputClass =
  'lifinity-input';

const selectClass =
  'lifinity-select cursor-pointer';

const optionClass =
  '';

const labelClass =
  'lifinity-muted-label ml-2';

const buttonPrimaryClass =
  'lifinity-button-primary px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest';

const buttonSecondaryClass =
  'lifinity-button-secondary px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest';

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

  // Tarefas atribuídas a outros: editáveis até serem concluídas, sem limite de tempo.
  const hasAssignees = Boolean(Number(task.has_assignees));
  if (hasAssignees) return true;

  // Tarefas pessoais: só editáveis até 1 hora depois da criação.
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

// Formata a data de criação para "dd/mm" em pt-PT; devolve null se inválida
const formatCreationDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
};

// --- VISTA DE CALENDÁRIO ---

// Nomes dos meses e dos dias da semana em português, para o cabeçalho do calendário
const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_LABELS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Cor do ponto indicador de cada tarefa, consoante a sua prioridade
const priorityDotClass = {
  alta: 'bg-(--lifinity-danger)',
  media: 'bg-(--lifinity-warning)',
  baixa: 'bg-(--lifinity-success)'
};

// Devolve a chave 'YYYY-MM-DD' (em hora local) de uma data
const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Componente da vista de calendário mensal: grelha do mês + painel lateral com as
// tarefas do dia selecionado. Recebe as funções de ação da página principal
// (concluir/editar/apagar) por props, para não duplicar lógica de negócio.
const TaskCalendar = ({
  tasks,
  currentUser,
  onComplete,
  onConfirmComplete,
  onCancelComplete,
  taskToComplete,
  onEdit,
  onDelete,
  canEdit,
  isOverdue
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Cartão de tarefa do painel lateral: cores sólidas de alto contraste e botões
  // de ação (concluir/editar/apagar) com as mesmas validações da lista principal.
  const renderPanelTaskCard = (task) => {
    const taskOverdue = isOverdue(task);
    const isDone = task.status === 'concluida';
    const dueDateLabel = formatDueDate(task.due_date);
    const creationDateLabel = formatCreationDate(task.created_at);

    // Permissões — replicam exatamente a lógica do renderTaskCard da lista
    const taskIsOwner = Number(task.iduser) === Number(currentUser.iduser);
    const taskHasAssignees = Boolean(Number(task.has_assignees));
    const taskIsAssignee = (task.assignee_ids || '')
      .split(',')
      .filter(Boolean)
      .includes(String(currentUser.iduser));

    const taskCanBeCompleted =
      !isDone && !taskOverdue && (!taskHasAssignees || taskIsAssignee);
    const taskCanBeEdited = taskIsOwner && canEdit(task);
    const taskCanBeHidden = isDone || taskOverdue;
    const taskCanBeDeleted = taskIsOwner || taskCanBeHidden;

    // Classe base dos badges (forma de pílula); as cores vêm de style inline
    // hardcoded para garantir contraste e não serem sobrescritas pelo Tailwind.
    const badgeBaseClass =
      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider';

    // Badge genérico (origem, prazo, criação, finalizado): fundo escuro, texto claro
    const neutralBadgeStyle = {
      background: 'rgba(255,255,255,0.07)',
      color: '#c8dece',
      border: '1px solid rgba(255,255,255,0.15)'
    };

    // Estilo do badge por prioridade: fundo semitransparente + texto e borda da cor
    const priorityBadgeStyle = {
      alta: {
        background: 'rgba(239,68,68,0.15)',
        color: '#fca5a5',
        border: '1px solid rgba(239,68,68,0.35)'
      },
      media: {
        background: 'rgba(234,179,8,0.15)',
        color: '#fde047',
        border: '1px solid rgba(234,179,8,0.35)'
      },
      baixa: {
        background: 'rgba(134,239,172,0.15)',
        color: '#86efac',
        border: '1px solid rgba(134,239,172,0.35)'
      }
    };

    // Badge de tarefa perdida (mesmas cores que prioridade alta)
    const lostBadgeStyle = {
      background: 'rgba(239,68,68,0.15)',
      color: '#fca5a5',
      border: '1px solid rgba(239,68,68,0.35)'
    };

    // Estilo base dos botões de ação (sem cor — definida inline por botão)
    const actionButtonClass =
      'text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg';

    // Fundo do card ligeiramente mais claro que o painel (#1a2620), para criar
    // separação visual clara. Tarefas perdidas ganham borda esquerda vermelha.
    const cardStyle = {
      background: '#1e3028',
      border: '1px solid rgba(174,194,180,0.2)',
      ...(taskOverdue && !isDone
        ? { borderLeft: '2px solid rgba(239,68,68,0.5)' }
        : {})
    };

    return (
      <div
        key={task.idtask}
        className={`rounded-2xl p-4 ${isDone ? 'opacity-60' : ''}`}
        style={cardStyle}
      >
        {/* Título da tarefa */}
        <p
          className={`text-sm font-bold ${isDone ? 'line-through' : ''}`}
          style={{ color: '#e8f5e9' }}
        >
          {task.title}
        </p>

        {/* Descrição (máximo 2 linhas) */}
        {task.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#a5c9ac' }}>
            {task.description}
          </p>
        )}

        {/* Badges de origem, prazo, criação e estado/prioridade */}
        <div className="flex flex-wrap gap-2 mt-3">
          {task.task_origin && (
            <span className={badgeBaseClass} style={neutralBadgeStyle}>
              {task.task_origin === 'created_by_me'
                ? 'Criada por mim'
                : task.task_origin === 'assigned_to_me'
                  ? `Recebida de ${task.creator_username || 'utilizador'}`
                  : task.task_origin === 'group_task'
                    ? `Grupo: ${task.group_names || 'grupo'}`
                    : 'Atividade'}
            </span>
          )}

          {dueDateLabel && (
            <span className={badgeBaseClass} style={neutralBadgeStyle}>
              Prazo: {dueDateLabel}
            </span>
          )}

          {creationDateLabel && (
            <span className={badgeBaseClass} style={neutralBadgeStyle}>
              Criada a {creationDateLabel}
            </span>
          )}

          {isDone ? (
            <span className={badgeBaseClass} style={neutralBadgeStyle}>
              Finalizado
            </span>
          ) : taskOverdue ? (
            <span className={badgeBaseClass} style={lostBadgeStyle}>
              Perdida
            </span>
          ) : (
            <span
              className={badgeBaseClass}
              style={priorityBadgeStyle[task.priority] || priorityBadgeStyle.media}
            >
              {task.priority}
            </span>
          )}
        </div>

        {/* Ações: concluir (com confirmação inline), editar e apagar */}
        {(taskCanBeCompleted || taskCanBeEdited || taskCanBeDeleted) && (
          <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
            {taskCanBeCompleted &&
              (taskToComplete?.idtask === task.idtask ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancelComplete}
                    className={actionButtonClass}
                    style={{
                      color: '#a5c9ac',
                      border: '1px solid rgba(165,201,172,0.3)',
                      background: 'rgba(165,201,172,0.06)'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={onConfirmComplete}
                    className={actionButtonClass}
                    style={{
                      color: '#86efac',
                      border: '1px solid rgba(134,239,172,0.4)',
                      background: 'rgba(134,239,172,0.08)'
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onComplete(task)}
                  className={actionButtonClass}
                  style={{
                    color: '#86efac',
                    border: '1px solid rgba(134,239,172,0.4)',
                    background: 'rgba(134,239,172,0.08)'
                  }}
                >
                  Concluir
                </button>
              ))}

            {taskCanBeEdited && (
              <button
                type="button"
                onClick={() => {
                  onEdit(task);
                  setSelectedDay(null);
                }}
                className={actionButtonClass}
                style={{
                  color: '#a5c9ac',
                  border: '1px solid rgba(165,201,172,0.3)',
                  background: 'rgba(165,201,172,0.06)'
                }}
              >
                Editar
              </button>
            )}

            {taskCanBeDeleted && (
              <button
                type="button"
                onClick={async () => {
                  await onDelete(task);
                  setSelectedDay(null);
                }}
                aria-label="Apagar atividade"
                className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ color: '#fca5a5' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
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
        )}
      </div>
    );
  };

  // Agrupa as tarefas por dia ('YYYY-MM-DD'), usando o campo due_date.
  // Tarefas sem due_date não entram no calendário (continuam visíveis na lista).
  const tasksByDay = new Map();

  tasks.forEach((task) => {
    if (!task.due_date) return;

    const dueDate = new Date(task.due_date);
    if (Number.isNaN(dueDate.getTime())) return;

    const key = getDateKey(dueDate);

    if (!tasksByDay.has(key)) {
      tasksByDay.set(key, []);
    }

    tasksByDay.get(key).push(task);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const today = new Date();
  const todayKey = getDateKey(today);

  // Células da grelha: primeiro as células de preenchimento (antes do dia 1),
  // depois um número por cada dia do mês.
  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  const goToPreviousMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const selectedDayKey = selectedDay ? getDateKey(selectedDay) : null;
  const selectedDayTasks = selectedDayKey ? tasksByDay.get(selectedDayKey) || [] : [];

  return (
    <div className={`${cardClass} rounded-2xl overflow-hidden`}>
      {/* CABEÇALHO: mês/ano atual e navegação entre meses */}
      <div className="flex items-center justify-between p-6 border-b border-(--lifinity-border)">
        <button
          type="button"
          onClick={goToPreviousMonth}
          aria-label="Mês anterior"
          className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
        >
          ‹
        </button>

        <h3 className="text-lg font-black uppercase tracking-widest text-(--lifinity-text)">
          {MONTH_NAMES_PT[month]} {year}
        </h3>

        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Mês seguinte"
          className="lifinity-button-secondary w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
        >
          ›
        </button>
      </div>

      {/* CABEÇALHO DOS DIAS DA SEMANA */}
      <div className="grid grid-cols-7 px-4 pt-4">
        {WEEKDAY_LABELS_PT.map((weekday) => (
          <div
            key={weekday}
            className="text-center text-[10px] font-black uppercase tracking-widest pb-2 text-(--lifinity-text-muted)"
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* GRELHA DE DIAS DO MÊS */}
      <div className="grid grid-cols-7 gap-2 p-4">
        {cells.map((day, index) => {
          // Células vazias de preenchimento antes do dia 1
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square rounded-xl bg-(--lifinity-surface-soft) opacity-30"
              />
            );
          }

          const cellDate = new Date(year, month, day);
          const key = getDateKey(cellDate);
          const dayTasks = tasksByDay.get(key) || [];
          const isToday = key === todayKey;

          // Tarefas perdidas: não concluídas e com prazo já ultrapassado
          const hasLostTask = dayTasks.some(
            (task) => task.status !== 'concluida' && isTaskOverdue(task)
          );

          // No máximo 3 pontos visíveis, com "..." para o restante
          const visibleDots = dayTasks.slice(0, 3);
          const extraCount = dayTasks.length - visibleDots.length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => dayTasks.length > 0 && setSelectedDay(cellDate)}
              disabled={dayTasks.length === 0}
              className={`aspect-square rounded-xl p-2 flex flex-col items-start gap-1 border transition-all ${
                isToday
                  ? 'border-(--lifinity-primary) bg-(--lifinity-primary-muted)'
                  : hasLostTask
                    ? 'border-(--lifinity-danger) bg-(--lifinity-surface-soft) opacity-80'
                    : 'border-(--lifinity-border) bg-(--lifinity-surface-soft)'
              } ${dayTasks.length > 0 ? 'hover:bg-(--lifinity-surface-hover) cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`text-xs font-black ${
                  isToday ? 'text-(--lifinity-primary-strong)' : 'text-(--lifinity-text)'
                }`}
              >
                {day}
              </span>

              <div className="flex flex-wrap items-center gap-1 mt-auto">
                {visibleDots.map((task) => (
                  <span
                    key={task.idtask}
                    className={`w-2 h-2 rounded-full ${priorityDotClass[task.priority] || priorityDotClass.media}`}
                  />
                ))}

                {extraCount > 0 && (
                  <span className="text-[9px] font-black text-(--lifinity-text-muted)">
                    ...
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* OVERLAY + PAINEL LATERAL: renderizados num portal para o <body>, para que o
          "position: fixed" cubra o ecrã todo e não fique preso dentro do cartão
          (que tem backdrop-filter e cria um novo "containing block"). */}
      {createPortal(
        <>
          {/* OVERLAY: escurece o fundo e fecha o painel lateral ao clicar fora */}
          <div
            className={`fixed inset-0 bg-(--lifinity-overlay) backdrop-blur-sm z-40 transition-opacity ${
              selectedDay ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setSelectedDay(null)}
          />

          {/* PAINEL LATERAL: tarefas do dia selecionado, desliza a partir da direita.
              Fundo sólido (sem blur) para garantir contraste com o texto. */}
          <div
            className={`fixed top-0 right-0 h-full w-full sm:w-[380px] z-50 rounded-none sm:rounded-l-3xl overflow-y-auto p-6 space-y-4 transition-transform duration-300 ease-out ${
              selectedDay ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ background: '#1a2620', borderLeft: '1px solid rgba(174,194,180,0.3)' }}
          >
            <div
              className="flex items-start justify-between gap-4 pb-4 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <h3
                className="text-base font-bold tracking-tight"
                style={{ color: '#e8f5e9' }}
              >
                {selectedDay
                  ? selectedDay.toLocaleDateString('pt-PT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : ''}
              </h3>

              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Fechar painel"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0"
                style={{ color: '#a5c9ac' }}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedDayTasks.map(renderPanelTaskCard)}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
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
  // Novos filtros: por grupo especifico e por amigo (assignee)
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterFriend, setFilterFriend] = useState('all');
  const [searchTask, setSearchTask] = useState('');
  // Controla a visibilidade do painel de filtros recolhivel
  const [showFilters, setShowFilters] = useState(false);
  // Alterna entre a vista em lista e a vista em calendário mensal
  const [viewMode, setViewMode] = useState('list');
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
      alert('Esta atividade ja nao pode ser editada.');
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
      alert(err.response?.data?.message || 'Erro ao concluir atividade.');
    }
  };

  const handleDeleteTask = async (task) => {
    const isCompleted = task.status === 'concluida';
    const isLost = isTaskOverdue(task);
    const shouldHide = isCompleted || isLost;

    const confirmMessage = shouldHide
      ? `Tens a certeza que queres ocultar esta atividade ${
          isLost ? 'perdida' : 'concluída'
        } da lista?`
      : 'Tens a certeza que queres eliminar esta atividade?';

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

      alert(shouldHide ? 'Erro ao ocultar atividade.' : 'Erro ao eliminar atividade.');
    }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm('Tens a certeza que queres ocultar as atividades concluídas da lista?')) {
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
      alert('Erro ao ocultar atividades concluídas.');
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
              'erro ao criar atividade.'
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
        `${importedCount} atividades importadas`,
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
          `${importedCount} atividades importadas`,
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
      'Atividade para amigo,Enviar atividade para um amigo,media,2026-05-11T18:00,cliente,',
      'Atividade para grupo,Enviar atividade para um grupo,baixa,2026-05-12T18:00,,Grupo Sigma',
      'Descrição com vírgula,"Preparar notas, slides e perguntas",media,,,',
      'Amigo e grupo,Exemplo com vários destinos,alta,2026-05-13T20:00,cliente,Grupo Sigma'
    ].join('\n');

    const blob = new Blob([csvTemplate], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'modelo_atividades_lifinity.csv';
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
        alert('Esta atividade ja nao pode ser editada.');
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
      alert(err.response?.data?.message || 'Erro ao guardar atividade.');
    }
  };

  if (!user) {
    return (
      <div className="p-10 font-bold uppercase tracking-widest text-center text-(--lifinity-text-muted)">
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

      // Filtro por grupo: group_ids vem como string "3,7,12" (ou null)
      const groupIdList = (task.group_ids || '').split(',').filter(Boolean);
      const matchesGroup =
        filterGroup === 'all' ? true : groupIdList.includes(String(filterGroup));

      // Filtro por amigo: a tarefa "envolve o amigo" se ele é destinatário (assignee)
      // OU se é o criador da tarefa (task.iduser). Assim apanhamos as duas direções:
      // tarefas que ele me enviou e tarefas que eu lhe enviei.
      const assigneeIdList = (task.assignee_ids || '').split(',').filter(Boolean);
      const friendIsAssignee = assigneeIdList.includes(String(filterFriend));
      const friendIsCreator = String(task.iduser) === String(filterFriend);
      const matchesFriend =
        filterFriend === 'all' ? true : friendIsAssignee || friendIsCreator;

      return matchesStatus && matchesPriority && matchesSearch && matchesGroup && matchesFriend;
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

  // Classifica cada tarefa numa de três categorias lógicas, com base na origem
  // (task_origin) e em ter ou não destinatários (has_assignees / has_groups).
  // Os campos booleanos podem vir como 1/0, "1"/"0" ou true/false — normalizamos.
  const getTaskCategory = (task) => {
    const hasAssignees = Boolean(Number(task.has_assignees));
    const hasGroups = Boolean(Number(task.has_groups));
    const hasRecipients = hasAssignees || hasGroups;

    if (task.task_origin === 'created_by_me') {
      // Criada por mim: pessoal (sem destinatários) ou atribuída a outros
      return hasRecipients ? 'created_for_others' : 'to_complete_mine';
    }

    // Recebida de outro utilizador ('assigned_to_me') ou de um grupo ('group_task')
    return 'to_complete_received';
  };

  // Cartão de tarefa reutilizável nos dois blocos para evitar duplicação de JSX
  const renderTaskCard = (task) => {
    const taskOverdue = isTaskOverdue(task);
    const taskIsOwner = isTaskOwner(task);
    const taskCanBeHidden = task.status === 'concluida' || taskOverdue;
    const taskCanBeEdited = taskIsOwner && canEditTask(task);
    const dueDateLabel = formatDueDate(task.due_date);
    const creationDateLabel = formatCreationDate(task.created_at);

    // Permissão para concluir: se a tarefa tem destinatários, só um destinatário
    // (assignee) a pode concluir; tarefas pessoais e de grupo mantêm o comportamento atual.
    const taskHasAssignees = Boolean(Number(task.has_assignees));
    const taskIsAssignee = (task.assignee_ids || '')
      .split(',')
      .filter(Boolean)
      .includes(String(user.iduser));
    const taskCanBeCompleted =
      task.status !== 'concluida' &&
      !taskOverdue &&
      (!taskHasAssignees || taskIsAssignee);

    return (
      <div
        key={task.idtask}
        className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 p-6 rounded-2xl transition-all border ${
          task.status === 'concluida'
            ? 'bg-(--lifinity-surface-soft) opacity-60 border-(--lifinity-border)'
            : taskOverdue
              ? 'lifinity-danger-surface hover:bg-(--lifinity-danger-surface)'
              : 'bg-(--lifinity-surface-soft) border-(--lifinity-border) hover:bg-(--lifinity-surface-hover) shadow-sm'
        }`}
      >
        <div className="flex flex-col gap-2">
          <span
            className={`font-black text-lg tracking-tight leading-tight ${
              task.status === 'concluida'
                ? 'text-(--lifinity-text-muted) line-through italic'
                : taskOverdue
                  ? 'text-(--lifinity-danger)'
                  : 'text-(--lifinity-text)'
            }`}
          >
            {task.title}
          </span>

          <span
            className={`text-sm font-medium ${
              task.status === 'concluida'
                ? 'text-(--lifinity-text-muted) line-through italic'
                : 'text-(--lifinity-text-muted)'
            }`}
          >
            {task.description || 'Sem descrição detalhada.'}
          </span>

          <div className="flex flex-wrap gap-2 mt-2">
            {task.task_origin && (
              <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border)">
                {task.task_origin === 'created_by_me'
                  ? 'Criada por mim'
                  : task.task_origin === 'assigned_to_me'
                    ? `Recebida de ${task.creator_username || 'utilizador'}`
                    : task.task_origin === 'group_task'
                      ? `Grupo: ${task.group_names || 'grupo'}`
                      : 'Atividade'}
              </span>
            )}

            {/* Para tarefas que EU criei e atribuí, mostra para quem foram enviadas:
                um badge "Para: X, Y" com os amigos e/ou "Grupo: X" com os grupos. */}
            {task.task_origin === 'created_by_me' &&
              (Number(task.has_assignees) === 1 || Number(task.has_groups) === 1) && (
                <>
                  {task.assignee_names && (
                    <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border)">
                      Para: {task.assignee_names}
                    </span>
                  )}

                  {task.group_names && (
                    <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border)">
                      Grupo: {task.group_names}
                    </span>
                  )}
                </>
              )}

            {dueDateLabel && (
              <span
                className={`text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border ${
                  taskOverdue
                    ? 'lifinity-danger-surface'
                    : 'bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border)'
                }`}
              >
                Prazo: {dueDateLabel}
              </span>
            )}

            {/* Data de criação da tarefa em formato dd/mm */}
            {creationDateLabel && (
              <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border)">
                Criada a {creationDateLabel}
              </span>
            )}

            {taskCanBeEdited && (
              <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-(--lifinity-success-surface) text-(--lifinity-success) border-(--lifinity-border)">
                Editável
              </span>
            )}

            {!taskCanBeEdited && task.status !== 'concluida' && (
              <span className="text-[10px] font-black uppercase px-3 py-2 rounded-xl tracking-widest border bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border) opacity-70">
                Edição bloqueada
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <span
            className={`text-xs font-black uppercase px-4 py-2 rounded-xl tracking-widest border ${
              task.status === 'concluida'
                ? 'bg-(--lifinity-surface-soft) text-(--lifinity-text-muted) border-(--lifinity-border)'
                : taskOverdue
                  ? 'lifinity-danger-surface'
                  : task.priority === 'alta'
                    ? 'lifinity-danger-surface'
                    : task.priority === 'media'
                      ? 'bg-(--lifinity-warning-surface) text-(--lifinity-warning) border-(--lifinity-border)'
                      : 'bg-(--lifinity-primary-muted) text-(--lifinity-primary-strong) border-(--lifinity-border)'
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
              className="lifinity-button-secondary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
            >
              Editar
            </button>
          )}

          {taskCanBeCompleted && (
            taskToComplete?.idtask === task.idtask ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-(--lifinity-border) bg-(--lifinity-success-surface) px-3 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-(--lifinity-success)">
                  Concluir?
                </span>

                <button
                  type="button"
                  onClick={closeCompleteConfirmation}
                  className="lifinity-button-secondary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmCompleteTask}
                  className="lifinity-button-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Confirmar
                </button>
              </div>
            ) : (
              <button
                onClick={() => openCompleteConfirmation(task)}
                className="lifinity-button-secondary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Concluir
              </button>
            )
          )}

          {(taskIsOwner || taskCanBeHidden) && (
            <button
              onClick={() => handleDeleteTask(task)}
              className="transition-all p-2 text-(--lifinity-text-muted) hover:text-(--lifinity-danger)"
              title={
                task.status === 'concluida' || taskOverdue
                  ? 'Ocultar atividade'
                  : 'Eliminar atividade'
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
  };

  // Renderiza uma lista de tarefas com a divisão da Fase 1:
  // não-concluídas primeiro, divisória "CONCLUÍDAS", depois as concluídas.
  const renderTaskList = (taskList) => {
    const notDone = taskList.filter((task) => task.status !== 'concluida');
    const done = taskList.filter((task) => task.status === 'concluida');

    return (
      <>
        {/* Bloco A: tarefas não concluídas (pendentes e atrasadas) */}
        {notDone.map(renderTaskCard)}

        {/* Divisória entre pendentes e concluídas — só aparece se existirem ambos os blocos */}
        {notDone.length > 0 && done.length > 0 && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-(--lifinity-border)"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-(--lifinity-text-muted)">
              Concluídas
            </span>
            <div className="flex-1 h-px bg-(--lifinity-border)"></div>
          </div>
        )}

        {/* Bloco B: tarefas concluídas */}
        {done.map(renderTaskCard)}
      </>
    );
  };

  // Renderiza uma secção (cabeçalho clay + lista) apenas se tiver tarefas.
  const renderSection = (title, taskList) => {
    if (taskList.length === 0) return null;

    return (
      <div key={title} className="space-y-3">
        {/* Cabeçalho da secção com o título e a contagem de tarefas */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <span className="text-xs font-black uppercase tracking-widest text-(--lifinity-primary)">
            {title}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-(--lifinity-text-muted)">
            ({taskList.length})
          </span>
        </div>

        {renderTaskList(taskList)}
      </div>
    );
  };

  // Conta quantos filtros (alem da pesquisa) estao ativos, para o badge do botao "Filtros"
  const activeFilterCount = [filterStatus, filterPriority, filterGroup, filterFriend]
    .filter((value) => value !== 'all').length;

  return (
    <div className="space-y-8">
      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD NÍVEL */}
        <div className={`${cardClass} p-6 rounded-2xl`}>
          <p className="lifinity-muted-label mb-1">
            Nível {levelData.level}
          </p>

          <p className="text-3xl font-black tracking-tighter text-(--lifinity-primary)">
            {user.xp} XP
          </p>

          <div className="w-full bg-(--lifinity-surface-soft) h-3 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-(--lifinity-primary) h-full transition-all duration-1000 ease-out"
              style={{ width: `${levelData.progress}%` }}
            ></div>
          </div>

          <p className="text-xs mt-2 font-bold uppercase tracking-widest text-(--lifinity-text-muted)">
            Faltam {Math.round(levelData.xpRemaining)} XP para o Nível{' '}
            {levelData.level + 1}
          </p>
        </div>

        {/* CARD PRODUTIVIDADE DE HOJE */}
        <div className={`${cardClass} p-6 rounded-2xl`}>
          <p className="lifinity-muted-label mb-1">
            Resumo de Hoje
          </p>

          <p className="text-3xl font-black tracking-tighter text-(--lifinity-primary)">
            {taskSummary.completionRate}%
          </p>

          <div className="w-full bg-(--lifinity-surface-soft) h-3 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-(--lifinity-primary) h-full transition-all duration-1000"
              style={{ width: `${taskSummary.completionRate}%` }}
            ></div>
          </div>

          <p className="text-xs mt-2 font-bold uppercase tracking-widest text-(--lifinity-text-muted)">
            {taskSummary.pendingTasks} pendentes {' \u2022 '}
            {taskSummary.completedTasks} concluídas {' \u2022 '}
            {taskSummary.lostTasks || 0} perdidas
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* BARRA SUPERIOR: pesquisa + botao Filtros + acoes (sempre visivel) */}
        <div
          className={`${cardClass} p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between`}
        >
          <div className="flex flex-wrap gap-3 items-center flex-1 min-w-0">
            {/* TOGGLE LISTA / CALENDÁRIO */}
            <div className="flex items-center gap-1 p-1 rounded-xl border border-(--lifinity-border) bg-(--lifinity-surface-soft)">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  viewMode === 'list'
                    ? 'bg-(--lifinity-primary) text-(--lifinity-on-primary)'
                    : 'text-(--lifinity-text-muted) hover:text-(--lifinity-text)'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-pressed={viewMode === 'calendar'}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-(--lifinity-primary) text-(--lifinity-on-primary)'
                    : 'text-(--lifinity-text-muted) hover:text-(--lifinity-text)'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Calendário</span>
              </button>
            </div>

            {/* PESQUISA (sempre visivel, ocupa o espaco flexivel) */}
            <div className="relative flex-1 min-w-48">
              <input
                aria-label="Procurar atividade"
                type="text"
                placeholder="Procurar atividade..."
                className={`pl-10 pr-4 py-3 rounded-xl text-xs font-bold w-full ${inputClass}`}
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
              />

              <svg
                className="absolute left-3 top-3 text-(--lifinity-text-muted)"
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

            {/* BOTAO FILTROS: abre/fecha o painel; badge com nº de filtros ativos */}
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`${buttonSecondaryClass} flex items-center gap-2`}
              aria-expanded={showFilters}
              aria-label="Mostrar ou esconder filtros"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5h18M6 12h12M10 19h4"
                />
              </svg>

              <span>Filtros</span>

              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-black bg-(--lifinity-primary) text-(--lifinity-on-primary)">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {completedVisibleTasks.length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-xs font-black uppercase tracking-widest transition-colors mr-2 text-(--lifinity-danger) hover:opacity-80"
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
              className={buttonSecondaryClass}
            >
              Importar CSV
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvTemplate}
              className={buttonSecondaryClass}
            >
              Modelo CSV
            </button>

            <button
              onClick={openCreateModal}
              className={buttonPrimaryClass}
            >
              Nova Atividade
            </button>
          </div>
        </div>

        {/* PAINEL DE FILTROS (recolhivel): 4 selects numa grelha responsiva */}
        {showFilters && (
          <div className="lifinity-card-soft p-5 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <select
                aria-label="Filtrar por estado"
                className={`w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${selectClass}`}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option className={optionClass} value="all">
                  Todos os Estados
                </option>
                <option className={optionClass} value="pending">
                  Pendentes
                </option>
                <option className={optionClass} value="completed">
                  Concluídas
                </option>
                <option className={optionClass} value="lost">
                  Perdidas
                </option>
              </select>

              <select
                aria-label="Filtrar por prioridade"
                className={`w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${selectClass}`}
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option className={optionClass} value="all">
                  Todas as Prioridades
                </option>
                <option className={optionClass} value="alta">
                  Prioridade Alta
                </option>
                <option className={optionClass} value="media">
                  Prioridade Média
                </option>
                <option className={optionClass} value="baixa">
                  Prioridade Baixa
                </option>
              </select>

              {/* Filtro por grupo: usa a lista de grupos ja carregada */}
              <select
                aria-label="Filtrar por grupo"
                className={`w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${selectClass}`}
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
              >
                <option className={optionClass} value="all">
                  Todos os Grupos
                </option>
                {groups.map((group) => (
                  <option className={optionClass} key={group.idgroup} value={group.idgroup}>
                    {group.name}
                  </option>
                ))}
              </select>

              {/* Filtro por amigo: usa a lista de amigos ja carregada */}
              <select
                aria-label="Filtrar por amigo"
                className={`w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest ${selectClass}`}
                value={filterFriend}
                onChange={(e) => setFilterFriend(e.target.value)}
              >
                <option className={optionClass} value="all">
                  Todos os Amigos
                </option>
                {friends.map((friend) => (
                  <option className={optionClass} key={friend.iduser} value={friend.iduser}>
                    {friend.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Limpar filtros: repoe os 4 selects a 'all' (nao mexe na pesquisa) */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterPriority('all');
                    setFilterGroup('all');
                    setFilterFriend('all');
                  }}
                  className="text-xs font-black uppercase tracking-widest transition-colors text-(--lifinity-danger) hover:opacity-80"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* VISTA EM CALENDÁRIO: grelha mensal com painel lateral por dia */}
        {viewMode === 'calendar' && (
          <TaskCalendar
            tasks={filteredTasks}
            currentUser={user}
            onComplete={openCompleteConfirmation}
            onConfirmComplete={confirmCompleteTask}
            onCancelComplete={closeCompleteConfirmation}
            taskToComplete={taskToComplete}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
            canEdit={canEditTask}
            isOverdue={isTaskOverdue}
          />
        )}

        {/* LISTAGEM FILTRADA (vista em lista) */}
        {viewMode === 'list' && (
        <div className={`${cardClass} rounded-2xl overflow-hidden`}>
          <div className="p-4 space-y-3">
            {(() => {
              // Nome do amigo selecionado (para os títulos do modo B)
              const selectedFriend = friends.find(
                (friend) => String(friend.iduser) === String(filterFriend)
              );
              const selectedFriendName = selectedFriend?.username || 'este amigo';

              // Constrói as secções a apresentar conforme o modo de visualização.
              // As secções operam SEMPRE sobre filteredTasks (já filtrado).
              const sections =
                filterFriend === 'all'
                  ? [
                      // MODO A — sem filtro de amigo: três secções por origem
                      {
                        title: 'As minhas tarefas',
                        tasks: filteredTasks.filter(
                          (task) => getTaskCategory(task) === 'to_complete_mine'
                        )
                      },
                      {
                        title: 'Recebidas de outros',
                        tasks: filteredTasks.filter(
                          (task) => getTaskCategory(task) === 'to_complete_received'
                        )
                      },
                      {
                        title: 'Atribuídas por mim',
                        tasks: filteredTasks.filter(
                          (task) => getTaskCategory(task) === 'created_for_others'
                        )
                      }
                    ]
                  : [
                      // MODO B — com filtro de amigo: duas secções (recebidas dele / enviadas a ele)
                      {
                        title: `Recebidas de ${selectedFriendName}`,
                        // Tarefas criadas por esse amigo (ele é o criador)
                        tasks: filteredTasks.filter(
                          (task) => String(task.iduser) === String(filterFriend)
                        )
                      },
                      {
                        title: `Enviadas a ${selectedFriendName}`,
                        // Tarefas que eu criei e atribuí a esse amigo
                        tasks: filteredTasks.filter((task) => {
                          if (task.task_origin !== 'created_by_me') return false;
                          const assigneeIdList = (task.assignee_ids || '')
                            .split(',')
                            .filter(Boolean);
                          return assigneeIdList.includes(String(filterFriend));
                        })
                      }
                    ];

              // Se nenhuma secção tiver tarefas, mostra a mensagem de "sem tarefas".
              const hasAnyTask = sections.some((section) => section.tasks.length > 0);

              if (!hasAnyTask) {
                return (
                  <div className="p-20 text-center font-bold italic uppercase text-xs tracking-widest text-(--lifinity-text-muted)">
                    Nenhuma atividade encontrada com estes filtros.
                  </div>
                );
              }

              // Renderiza as secções (renderSection ignora as vazias devolvendo null).
              return (
                <div className="space-y-6">
                  {sections.map((section) =>
                    renderSection(section.title, section.tasks)
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        )}
      </div>

      {/* MODAL CRIAR / EDITAR TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-(--lifinity-overlay) backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div
            className="lifinity-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-10 space-y-8"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black tracking-tighter text-(--lifinity-text)">
                {editingTask ? 'Editar Atividade' : 'Nova Atividade'}
              </h2>
              <p className="text-xs font-black uppercase tracking-widest text-(--lifinity-text-muted)">
                {editingTask
                  ? 'Só podes editar atividades recentes ainda não concluídas.'
                  : 'Define a tua próxima atividade.'}
              </p>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="task-title"
                  className={labelClass}
                >
                  Título da Atividade
                </label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Ex: Estudar Matemática"
                  className={`w-full p-6 rounded-2xl font-bold text-lg ${inputClass}`}
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
                  className={labelClass}
                >
                  Descrição (Opcional)
                </label>
                <textarea
                  id="task-description"
                  placeholder="Algum detalhe extra para te ajudar?"
                  className={`w-full p-6 rounded-2xl font-bold h-32 resize-none ${inputClass}`}
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="task-due-date"
                  className={labelClass}
                >
                  Data limite
                </label>
                <input
                  id="task-due-date"
                  type="datetime-local"
                  className={`w-full p-6 rounded-2xl font-bold text-lg ${inputClass}`}
                  value={taskForm.due_date}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, due_date: e.target.value })
                  }
                />
                <p className="text-[10px] font-bold uppercase tracking-widest ml-2 text-(--lifinity-text-muted)">
                  Se deixares em branco, a atividade fica sem prazo definido.
                </p>
              </div>

              {!editingTask && (
                <div className="space-y-4">
                  <p className={labelClass}>
                    Destino
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setTaskForm({ ...taskForm, assignees: [], groups: [] })
                    }
                    className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                      taskForm.assignees.length === 0 && taskForm.groups.length === 0
                        ? 'lifinity-selected text-(--lifinity-text) shadow-lg'
                        : 'lifinity-button-secondary'
                    }`}
                  >
                    Só para mim
                  </button>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowFriendsPicker((current) => !current)}
                      className="lifinity-button-secondary w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-between"
                    >
                      <span>
                        Amigos
                        {taskForm.assignees.length > 0 && ` (${taskForm.assignees.length})`}
                      </span>
                      <span>{showFriendsPicker ? '▲' : '▼'}</span>
                    </button>

                    {showFriendsPicker && (
                      <div className="lifinity-card-soft max-h-48 overflow-y-auto rounded-2xl p-3 space-y-2">
                        {friends.length === 0 ? (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-center py-4 text-(--lifinity-text-muted)">
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
                                  ? 'lifinity-selected text-(--lifinity-text) shadow-lg'
                                  : 'lifinity-button-secondary'
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
                      className="lifinity-button-secondary w-full px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-between"
                    >
                      <span>
                        Grupos
                        {taskForm.groups.length > 0 && ` (${taskForm.groups.length})`}
                      </span>
                      <span>{showGroupsPicker ? '▲' : '▼'}</span>
                    </button>

                    {showGroupsPicker && (
                      <div className="lifinity-card-soft max-h-48 overflow-y-auto rounded-2xl p-3 space-y-2">
                        {groups.length === 0 ? (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-center py-4 text-(--lifinity-text-muted)">
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
                                  ? 'lifinity-selected text-(--lifinity-text) shadow-lg'
                                  : 'lifinity-button-secondary'
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
                <p className={labelClass}>
                  Prioridade
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {['baixa', 'media', 'alta'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, priority })}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                        taskForm.priority === priority
                          ? 'lifinity-selected text-(--lifinity-text) shadow-lg'
                          : 'lifinity-button-secondary'
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
                  className="lifinity-button-secondary flex-1 px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="lifinity-button-primary flex-1 px-6 py-5 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  {editingTask ? 'Guardar' : 'Criar atividade'}
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
