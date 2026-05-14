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

const cardClass =
  'bg-[#111916]/88 border border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)]';

const selectClass =
  'w-full bg-white/[0.06] border border-white/10 text-slate-200 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-white/[0.09] focus:border-emerald-300/40 transition-all';

const metricOptions = {
  xpGained: {
    label: 'XP ganho',
    description: 'Mostra a evolução do XP ganho no período escolhido.',
    colorClass: 'text-blue-400',
    stroke: '#60a5fa',
    fill: '#3b82f6'
  },
  tasksCompleted: {
    label: 'Tarefas concluídas',
    description: 'Mostra quantas tarefas foram concluídas ao longo do tempo.',
    colorClass: 'text-emerald-300',
    stroke: '#34d399',
    fill: '#10b981'
  },
  tasksCreated: {
    label: 'Tarefas criadas',
    description: 'Mostra quantas tarefas foram criadas no período escolhido.',
    colorClass: 'text-slate-200',
    stroke: '#cbd5e1',
    fill: '#94a3b8'
  },
  tasksLost: {
    label: 'Tarefas perdidas',
    description: 'Mostra tarefas cujo prazo terminou sem conclusão.',
    colorClass: 'text-red-300',
    stroke: '#f87171',
    fill: '#ef4444'
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

const formatMetricValue = (value) => {
  const numericValue = Number(value || 0);

  if (Number.isInteger(numericValue)) {
    return numericValue;
  }

  return numericValue.toFixed(1);
};

const CustomTooltip = ({ active, payload, label, selectedMetric }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111916]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((item) => (
          <p
            key={item.dataKey}
            className="text-sm font-black text-white flex items-center gap-2"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color || item.fill }}
            ></span>
            {item.name || selectedMetric.label}: {formatMetricValue(item.value)}
          </p>
        ))}
      </div>
    </div>
  );
};

const Statistics = () => {
  const [period, setPeriod] = useState('30d');
  const [metric, setMetric] = useState('xpGained');
  const [comparisonMode, setComparisonMode] = useState('me');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('area');
  const [error, setError] = useState('');
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  const navigate = useNavigate();

  const fetchComparisonOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      setOptionsError('');

      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [friendsResponse, groupsResponse] = await Promise.all([
        axios.get(`${API_URL}/friends`, { headers }),
        axios.get(`${API_URL}/groups`, { headers })
      ]);

      setFriends(Array.isArray(friendsResponse.data) ? friendsResponse.data : []);
      setGroups(Array.isArray(groupsResponse.data) ? groupsResponse.data : []);
    } catch (err) {
      console.error('Erro ao carregar amigos e grupos:', err);
      setOptionsError('Nao foi possivel carregar amigos e grupos.');
    } finally {
      setOptionsLoading(false);
    }
  }, [navigate]);

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

      let endpoint = `${API_URL}/statistics/me`;

      if (comparisonMode === 'friend' && selectedFriendId) {
        endpoint = `${API_URL}/statistics/compare/friend/${selectedFriendId}`;
      }

      if (comparisonMode === 'group' && selectedGroupId) {
        endpoint = `${API_URL}/statistics/compare/group/${selectedGroupId}`;
      }

      const response = await axios.get(endpoint, {
        params: { period },
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatistics(response.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError(err.response?.data?.message || 'Nao foi possivel carregar as estatisticas.');
    } finally {
      setLoading(false);
    }
  }, [period, comparisonMode, selectedFriendId, selectedGroupId, navigate]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchComparisonOptions();
  }, [fetchComparisonOptions]);

  useEffect(() => {
    if (comparisonMode === 'friend') {
      const hasSelectedFriend = friends.some((friend) => {
        return String(friend.iduser) === String(selectedFriendId);
      });

      if (friends.length > 0 && !hasSelectedFriend) {
        setSelectedFriendId(String(friends[0].iduser));
      }

      if (friends.length === 0 && selectedFriendId) {
        setSelectedFriendId('');
      }
    }

    if (comparisonMode === 'group') {
      const hasSelectedGroup = groups.some((group) => {
        return String(group.idgroup) === String(selectedGroupId);
      });

      if (groups.length > 0 && !hasSelectedGroup) {
        setSelectedGroupId(String(groups[0].idgroup));
      }

      if (groups.length === 0 && selectedGroupId) {
        setSelectedGroupId('');
      }
    }
  }, [comparisonMode, friends, groups, selectedFriendId, selectedGroupId]);

  const chartData = useMemo(() => statistics?.chartData ?? [], [statistics]);

  const summary = useMemo(
    () => statistics?.summary ?? defaultSummary,
    [statistics]
  );

  const selectedMetric = metricOptions[metric];
  const hasComparison =
    statistics?.comparisonMode === 'friend' || statistics?.comparisonMode === 'group';

  const comparisonLabel = useMemo(() => {
    if (!hasComparison) return '';
    if (statistics?.comparisonMode === 'group') return 'Media do grupo';
    return statistics?.target?.name || 'Amigo';
  }, [hasComparison, statistics]);

  const getChartMetricValue = useCallback(
    (item, source = 'me') => {
      if (hasComparison) {
        return Number(item?.[source]?.[metric] || 0);
      }

      return Number(item?.[metric] || 0);
    },
    [hasComparison, metric]
  );

  const totalMetricValue = useMemo(() => {
    return chartData.reduce(
      (totals, item) => {
        totals.me += getChartMetricValue(item, 'me');
        totals.comparison += hasComparison
          ? getChartMetricValue(item, 'comparison')
          : 0;

        return totals;
      },
      { me: 0, comparison: 0 }
    );
  }, [chartData, getChartMetricValue, hasComparison]);

  const bestDay = useMemo(() => {
    if (chartData.length === 0) return null;

    return chartData.reduce((best, item) => {
      if (!best || getChartMetricValue(item, 'me') > getChartMetricValue(best, 'me')) {
        return item;
      }

      return best;
    }, null);
  }, [chartData, getChartMetricValue]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-[360px] items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-500 text-center px-6">
          Ainda não existem dados suficientes para mostrar o gráfico.
        </div>
      );
    }

    const ownMetricKey = hasComparison ? `me.${metric}` : metric;
    const comparisonMetricKey = `comparison.${metric}`;
    const comparisonStroke = '#fbbf24';
    const comparisonFill = '#f59e0b';

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.10)"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={false}
              allowDecimals={hasComparison}
            />
            <Tooltip
              content={<CustomTooltip selectedMetric={selectedMetric} />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar
              dataKey={ownMetricKey}
              name="Eu"
              radius={[10, 10, 0, 0]}
              fill={selectedMetric.fill}
            />
            {hasComparison && (
              <Bar
                dataKey={comparisonMetricKey}
                name={comparisonLabel}
                radius={[10, 10, 0, 0]}
                fill={comparisonFill}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.10)"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
            tickLine={false}
            allowDecimals={hasComparison}
          />
          <Tooltip
            content={<CustomTooltip selectedMetric={selectedMetric} />}
            cursor={{ stroke: 'rgba(255,255,255,0.12)' }}
          />
          <Area
            type="monotone"
            dataKey={ownMetricKey}
            name="Eu"
            stroke={selectedMetric.stroke}
            fill={selectedMetric.fill}
            strokeWidth={3}
            fillOpacity={0.18}
          />
          {hasComparison && (
            <Area
              type="monotone"
              dataKey={comparisonMetricKey}
              name={comparisonLabel}
              stroke={comparisonStroke}
              fill={comparisonFill}
              strokeWidth={3}
              fillOpacity={0.12}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className={`${cardClass} p-10 rounded-3xl text-center`}>
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
        className="relative overflow-hidden rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-white/10 min-h-72 flex items-end"
        style={{
          backgroundImage: "url('/images/statistics-banner.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#101713]/95 via-[#101713]/70 to-[#101713]/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.18),_transparent_35%)]"></div>

        <div className="relative z-10 p-8 md:p-10 text-white max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-cyan-200">
            Produtividade e Evolução
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-4">
            Estatísticas do teu progresso
          </h2>
          <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed">
            Analisa tarefas concluídas, XP ganho, tarefas perdidas e evolução ao
            longo do tempo. Estes dados ajudam-te a perceber padrões e a melhorar
            a tua organização diária.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-500/10 border border-red-400/20 text-red-200 p-5 rounded-2xl font-bold text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ALERTA DE TAREFAS PERDIDAS */}
      <div className="bg-red-500/10 border border-red-400/20 rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur-xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-1">
            Tarefas perdidas no período
          </p>
          <p className="text-red-100/80 text-sm font-bold">
            Tarefas cujo prazo terminou sem conclusão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-4xl font-black text-red-300 tracking-tighter">
            {summary.lostTasks}
          </p>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-300">
            perdidas
          </span>
        </div>
      </div>

      {/* FILTROS E GRÁFICO */}
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        {/* FILTROS */}
        <div className={`${cardClass} p-6 rounded-[2rem] h-fit`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Filtros
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white mb-6">
            Personalizar gráfico
          </h3>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="statistics-metric"
                className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Tema do gráfico
              </label>
              <select
                id="statistics-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className={selectClass}
              >
                <option className="bg-[#111916] text-white" value="xpGained">
                  XP ganho
                </option>
                <option className="bg-[#111916] text-white" value="tasksCompleted">
                  Tarefas concluídas
                </option>
                <option className="bg-[#111916] text-white" value="tasksCreated">
                  Tarefas criadas
                </option>
                <option className="bg-[#111916] text-white" value="tasksLost">
                  Tarefas perdidas
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="statistics-period"
                className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Período
              </label>
              <select
                id="statistics-period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={selectClass}
              >
                {Object.entries(periodOptions).map(([value, label]) => (
                  <option
                    className="bg-[#111916] text-white"
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="statistics-chart-type"
                className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Tipo de gráfico
              </label>
              <select
                id="statistics-chart-type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className={selectClass}
              >
                <option className="bg-[#111916] text-white" value="area">
                  Área
                </option>
                <option className="bg-[#111916] text-white" value="bar">
                  Barras
                </option>
              </select>
            </div>

            <div className="pt-5 border-t border-white/10">
              <label
                htmlFor="statistics-comparison-mode"
                className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
              >
                Comparação
              </label>

              <select
                id="statistics-comparison-mode"
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value)}
                className={selectClass}
              >
                <option className="bg-[#111916] text-white" value="me">
                  Só as minhas estatísticas
                </option>
                <option className="bg-[#111916] text-white" value="friend">
                  Comparar com amigo
                </option>
                <option className="bg-[#111916] text-white" value="group">
                  Média de grupo
                </option>
              </select>

              {(comparisonMode === 'friend' || comparisonMode === 'group') && (
                <div className="mt-4">
                  <label
                    htmlFor="statistics-comparison-target"
                    className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
                  >
                    {comparisonMode === 'friend' ? 'Amigo' : 'Grupo'}
                  </label>

                  {comparisonMode === 'friend' && (
                    <>
                      <select
                        id="statistics-comparison-target"
                        value={selectedFriendId}
                        onChange={(e) => setSelectedFriendId(e.target.value)}
                        className={selectClass}
                        disabled={optionsLoading || friends.length === 0}
                      >
                        {friends.map((friend) => (
                          <option
                            className="bg-[#111916] text-white"
                            key={friend.iduser}
                            value={friend.iduser}
                          >
                            {friend.username}
                          </option>
                        ))}
                      </select>

                      {friends.length === 0 && !optionsLoading && (
                        <p className="text-xs text-slate-400 font-bold mt-3 leading-relaxed">
                          Ainda nao tens amigos aceites para comparar.
                        </p>
                      )}
                    </>
                  )}

                  {comparisonMode === 'group' && (
                    <>
                      <select
                        id="statistics-comparison-target"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className={selectClass}
                        disabled={optionsLoading || groups.length === 0}
                      >
                        {groups.map((group) => (
                          <option
                            className="bg-[#111916] text-white"
                            key={group.idgroup}
                            value={group.idgroup}
                          >
                            {group.name}
                          </option>
                        ))}
                      </select>

                      {groups.length === 0 && !optionsLoading && (
                        <p className="text-xs text-slate-400 font-bold mt-3 leading-relaxed">
                          Ainda nao pertences a nenhum grupo para comparar.
                        </p>
                      )}
                    </>
                  )}

                  {optionsLoading && (
                    <p className="text-xs text-slate-400 font-bold mt-3 leading-relaxed">
                      A carregar opcoes de comparacao...
                    </p>
                  )}

                  {optionsError && (
                    <p className="text-xs text-red-300 font-bold mt-3 leading-relaxed">
                      {optionsError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GRÁFICO PRINCIPAL */}
        <div className={`${cardClass} p-6 rounded-[2rem] overflow-hidden`}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
                Gráfico Principal
              </p>
              <h3
                className={`text-3xl font-black tracking-tighter ${selectedMetric.colorClass}`}
              >
                {selectedMetric.label}
              </h3>
              <p className="text-slate-300 font-medium mt-2">
                {selectedMetric.description}
              </p>
            </div>

            <div className="min-w-[190px] rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total no período
              </p>
              {hasComparison ? (
                <div className="mt-2 space-y-1">
                  <p className="text-2xl font-black text-white tracking-tighter">
                    Eu: {formatMetricValue(totalMetricValue.me)}
                  </p>
                  <p className="text-sm font-black text-amber-200 tracking-tight">
                    {comparisonLabel}: {formatMetricValue(totalMetricValue.comparison)}
                  </p>
                </div>
              ) : (
                <p className="text-3xl font-black text-white tracking-tighter mt-1">
                  {formatMetricValue(totalMetricValue.me)}
                </p>
              )}
            </div>
          </div>

          {renderChart()}
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} p-6 rounded-[2rem]`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Melhor dia
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white">
            {bestDay ? bestDay.label : '--'}
          </h3>
          <p className="text-slate-300 font-medium mt-3">
            Foi o dia com maior valor para a métrica selecionada.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-[2rem]`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Tarefas pendentes
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white">
            {summary.pendingTasks}
          </h3>
          <p className="text-slate-300 font-medium mt-3">
            Tarefas ainda não concluídas dentro do período selecionado.
          </p>
        </div>

        <div className={`${cardClass} p-6 rounded-[2rem]`}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 italic">
            Comparacoes
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white">
            Amigos e grupos
          </h3>
          <p className="text-slate-300 font-medium mt-3">
            Compara o teu progresso com amigos aceites ou com a media dos teus
            grupos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
