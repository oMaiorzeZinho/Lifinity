import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL;

const metricOptions = {
  xpGained: {
    label: 'XP ganho',
    description: 'Mostra a evolução do XP ganho no período escolhido.',
    colorClass: 'text-blue-600'
  },
  tasksCompleted: {
    label: 'Tarefas concluídas',
    description: 'Mostra quantas tarefas foram concluídas ao longo do tempo.',
    colorClass: 'text-emerald-600'
  },
  tasksCreated: {
    label: 'Tarefas criadas',
    description: 'Mostra quantas tarefas foram criadas no período escolhido.',
    colorClass: 'text-slate-700'
  },
  tasksLost: {
    label: 'Tarefas perdidas',
    description: 'Mostra tarefas cujo prazo terminou sem conclusão.',
    colorClass: 'text-red-500'
  }
};

const periodOptions = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '1y': 'Último ano'
};

const defaultSummary = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  lostTasks: 0,
  totalXP: 0,
  completionRate: 0,
  productivityScore: 0
};

const Statistics = () => {
  const [period, setPeriod] = useState('30d');
  const [metric, setMetric] = useState('xpGained');
  const [comparisonMode, setComparisonMode] = useState('me');
  const [comparisonTarget, setComparisonTarget] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('area');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/statistics/me`, {
        params: { period },
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatistics(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Não foi possível carregar as estatísticas.');
    } finally {
      setLoading(false);
    }
  }, [period, navigate]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const chartData = useMemo(() => statistics?.chartData ?? [], [statistics]);
  const summary = useMemo(
    () => statistics?.summary ?? defaultSummary,
    [statistics]
  );

  const selectedMetric = metricOptions[metric];

  const totalMetricValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + Number(item[metric] || 0), 0);
  }, [chartData, metric]);

  const bestDay = useMemo(() => {
    if (chartData.length === 0) return null;

    return chartData.reduce((best, item) => {
      if (!best || Number(item[metric] || 0) > Number(best[metric] || 0)) {
        return item;
      }

      return best;
    }, null);
  }, [chartData, metric]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-90 items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-300">
          Ainda não existem dados suficientes para mostrar o gráfico.
        </div>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey={metric} radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey={metric}
            strokeWidth={3}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
          A carregar estatísticas...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div
        className="relative overflow-hidden rounded-4xl shadow-sm border border-slate-200 min-h-72 flex items-end"
        style={{
          backgroundImage: "url('/images/statistics-banner.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-slate-950/60"></div>

        <div className="relative z-10 p-8 md:p-10 text-white max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-blue-200">
            Produtividade e Evolução
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">
            Estatísticas do teu progresso
          </h2>
          <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
            Analisa tarefas concluídas, XP ganho, tarefas perdidas e evolução ao
            longo do tempo. Estes dados ajudam-te a perceber padrões e a melhorar
            a tua organização diária.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-500 p-5 rounded-2xl font-bold text-sm">
          {error}
        </div>
      )}

      {/* FILTROS E GRÁFICO */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* FILTROS */}
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200 h-fit">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Filtros
          </p>
          <h3 className="text-2xl font-black tracking-tight text-slate-800 mb-6">
            Personalizar gráfico
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Tema do gráfico
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
              >
                <option value="xpGained">XP ganho</option>
                <option value="tasksCompleted">Tarefas concluídas</option>
                <option value="tasksCreated">Tarefas criadas</option>
                <option value="tasksLost">Tarefas perdidas</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
              >
                {Object.entries(periodOptions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Tipo de gráfico
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
              >
                <option value="area">Área</option>
                <option value="bar">Barras</option>
              </select>
            </div>

            <div className="pt-5 border-t border-slate-100">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Comparação
              </label>

              <select
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer hover:bg-white transition-all"
              >
                <option value="me">Só as minhas estatísticas</option>
                <option value="friend">Comparar com amigo</option>
                <option value="group">Média de grupo</option>
              </select>

              {(comparisonMode === 'friend' || comparisonMode === 'group') && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder={
                      comparisonMode === 'friend'
                        ? 'Nome do amigo...'
                        : 'Nome do grupo...'
                    }
                    value={comparisonTarget}
                    onChange={(e) => setComparisonTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-xs font-bold text-slate-500 outline-none"
                    disabled
                  />

                  <p className="text-xs text-slate-400 font-bold mt-3 leading-relaxed">
                    Esta opção será ativada quando o módulo de amigos e grupos
                    estiver completo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">
              Tarefas perdidas no período
            </p>
            <p className="text-2xl font-black text-red-500">
              {summary.lostTasks}
            </p>
            <p className="text-xs text-red-400 font-bold mt-1">
              Tarefas cujo prazo terminou sem conclusão.
            </p>
          </div>
        </div>

        {/* GRÁFICO PRINCIPAL */}
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                Gráfico Principal
              </p>
              <h3 className={`text-3xl font-black tracking-tighter ${selectedMetric.colorClass}`}>
                {selectedMetric.label}
              </h3>
              <p className="text-slate-500 font-medium mt-2">
                {selectedMetric.description}
              </p>
            </div>

            <div className="min-w-47.5 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total no período
              </p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">
                {totalMetricValue}
              </p>
            </div>
          </div>

          {renderChart()}
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Melhor dia
          </p>
          <h3 className="text-2xl font-black tracking-tight text-slate-800">
            {bestDay ? bestDay.label : '--'}
          </h3>
          <p className="text-slate-500 font-medium mt-3">
            Foi o dia com maior valor para a métrica selecionada.
          </p>
        </div>

        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Tarefas pendentes
          </p>
          <h3 className="text-2xl font-black tracking-tight text-slate-800">
            {summary.pendingTasks}
          </h3>
          <p className="text-slate-500 font-medium mt-3">
            Tarefas ainda não concluídas dentro do período selecionado.
          </p>
        </div>

        <div className="bg-white p-6 rounded-4xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Comparações futuras
          </p>
          <h3 className="text-2xl font-black tracking-tight text-slate-800">
            Amigos e grupos
          </h3>
          <p className="text-slate-500 font-medium mt-3">
            A estrutura já está preparada para comparar estatísticas individuais
            com amigos ou médias de grupos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
