import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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
  const progress = ((xp - xpStartOfLevel) / (xpForNextLevel - xpStartOfLevel)) * 100;

  return {
    level,
    progress: Math.min(Math.max(progress, 0), 100),
    xpRemaining: Math.max(xpForNextLevel - xp, 0)
  };
};

const requestTasks = async (token) => {
  const res = await axios.get(`${API_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

const requestTaskSummary = async (token) => {
  const res = await axios.get(`${API_URL}/tasks/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
};

const Tasks = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [tasks, setTasks] = useState([]);
  const [taskSummary, setTaskSummary] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'media'
  });

  // Estados para filtros
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTask, setSearchTask] = useState('');

  const navigate = useNavigate();

  // Carrega apenas as tarefas visíveis, ou seja, não arquivadas.
  const fetchTasks = useCallback(async (token) => {
    try {
      setTasks(await requestTasks(token));
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err);
    }
  }, []);

  // Carrega o resumo histórico, incluindo tarefas concluídas que foram ocultadas.
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

    void Promise.allSettled([requestTasks(token), requestTaskSummary(token)]).then(
      ([tasksResult, summaryResult]) => {
        if (ignore) return;

        if (tasksResult.status === 'fulfilled') {
          setTasks(tasksResult.value);
        } else {
          console.error('Erro ao carregar tarefas:', tasksResult.reason);
        }

        if (summaryResult.status === 'fulfilled') {
          setTaskSummary(summaryResult.value);
        } else {
          console.error(
            'Erro ao carregar resumo das tarefas:',
            summaryResult.reason
          );
        }
      }
    );

    return () => {
      ignore = true;
    };
  }, [navigate, user]);

  const handleCompleteTask = async (idtask) => {
    try {
      const token = localStorage.getItem('token');

      const res = await axios.put(
        `${API_URL}/tasks/complete/${idtask}`,
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

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err);
      alert('Erro ao concluir tarefa.');
    }
  };

  const handleDeleteTask = async (idtask) => {
    if (!window.confirm('Tens a certeza que queres eliminar esta tarefa?')) return;

    try {
      const token = localStorage.getItem('token');

      await axios.delete(`${API_URL}/tasks/${idtask}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error('Erro ao eliminar tarefa:', err);
      alert('Erro ao eliminar tarefa.');
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

  const handleCreateTask = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      await axios.post(`${API_URL}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewTask({
        title: '',
        description: '',
        priority: 'media'
      });

      setIsModalOpen(false);

      await fetchTasks(token);
      await fetchTaskSummary(token);

      window.dispatchEvent(new Event('lifinity-tasks-updated'));
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      alert('Erro ao criar tarefa.');
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
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'completed'
          ? task.status === 'concluida'
          : task.status !== 'concluida';

    const matchesPriority =
      filterPriority === 'all' ? true : task.priority === filterPriority;

    const matchesSearch = (task.title || '')
      .toLowerCase()
      .includes(searchTask.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD NÍVEL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">
            Nível {levelData.level}
          </p>

          <p className="text-3xl font-black text-blue-600 tracking-tighter">
            {user.xp} XP
          </p>

          <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
              style={{ width: `${levelData.progress}%` }}
            ></div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase italic tracking-widest">
            Faltam {Math.round(levelData.xpRemaining)} XP para o Nível{' '}
            {levelData.level + 1}
          </p>
        </div>

        {/* CARD PRODUTIVIDADE DIÁRIA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">
            Produtividade Diária
          </p>

          <p className="text-3xl font-black text-emerald-600 tracking-tighter">
            {taskSummary.completionRate}%
          </p>

          <div className="w-full bg-slate-100 h-3 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-1000"
              style={{ width: `${taskSummary.completionRate}%` }}
            ></div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
            {taskSummary.pendingTasks} pendentes • {taskSummary.completedTasks} concluídas
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* BARRA DE FILTROS E PESQUISA */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Procurar tarefa..."
                className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white transition-all w-64 shadow-inner"
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
              />

              <svg
                className="absolute left-3 top-3 text-slate-400"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os Estados</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluídas</option>
            </select>

            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">Todas as Prioridades</option>
              <option value="alta">Prioridade Alta</option>
              <option value="media">Prioridade Média</option>
              <option value="baixa">Prioridade Baixa</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {tasks.filter((task) => task.status === 'concluida').length > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors mr-2"
              >
                Ocultar Concluídas
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              Nova Tarefa
            </button>
          </div>
        </div>

        {/* LISTAGEM FILTRADA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="p-20 text-center text-slate-300 font-bold italic uppercase text-xs tracking-widest">
                Nenhuma tarefa encontrada com estes filtros.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.idtask}
                  className={`flex items-center justify-between p-6 rounded-2xl transition-all border ${
                    task.status === 'concluida'
                      ? 'bg-slate-50/50 opacity-70 border-transparent'
                      : 'bg-white border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className={`font-black text-lg tracking-tight leading-tight ${
                        task.status === 'concluida'
                          ? 'text-slate-400 line-through italic'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>

                    <span
                      className={`text-sm font-medium ${
                        task.status === 'concluida'
                          ? 'text-slate-300 line-through italic'
                          : 'text-slate-500'
                      }`}
                    >
                      {task.description || 'Sem descrição detalhada.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <span
                      className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl tracking-widest shadow-sm ${
                        task.status === 'concluida'
                          ? 'bg-slate-100 text-slate-400'
                          : task.priority === 'alta'
                            ? 'bg-red-50 text-red-500'
                            : task.priority === 'media'
                              ? 'bg-orange-50 text-orange-500'
                              : 'bg-blue-50 text-blue-500'
                      }`}
                    >
                      {task.status === 'concluida' ? 'Finalizado' : task.priority}
                    </span>

                    {task.status !== 'concluida' && (
                      <button
                        onClick={() => handleCompleteTask(task.idtask)}
                        className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        Concluir
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.idtask)}
                      className="text-slate-200 hover:text-red-500 transition-all p-2"
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOVA TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-4xl font-black tracking-tighter text-slate-800">
                Nova Tarefa
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                Define o teu próximo desafio.
              </p>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Estudar Matemática"
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-700 text-lg"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  placeholder="Algum detalhe extra para te ajudar?"
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-700 h-32 resize-none"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Prioridade do Desafio
                </label>

                <div className="grid grid-cols-3 gap-3">
                  {['baixa', 'media', 'alta'].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() =>
                        setNewTask({ ...newTask, priority })
                      }
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        newTask.priority === priority
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
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
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 px-6 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                  Criar Agora
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
