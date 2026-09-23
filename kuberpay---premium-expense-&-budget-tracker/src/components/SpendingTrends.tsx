import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Maximize2,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { SpendingTrendsData, MonthlySpendingTrend } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/formatters';

interface SpendingTrendsProps {
  selectedMonth?: string;
  currency?: string;
}

type MetricMode = 'expenses_only' | 'expense_vs_budget' | 'cashflow';
type TimeRange = 3 | 6 | 12;

export const SpendingTrends: React.FC<SpendingTrendsProps> = ({
  selectedMonth,
  currency = 'INR',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(6);
  const [metricMode, setMetricMode] = useState<MetricMode>('expense_vs_budget');
  const [showAreaGlow, setShowAreaGlow] = useState<boolean>(true);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<SpendingTrendsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async (months: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getSpendingTrends(months);
      setData(res);
    } catch (err: any) {
      console.error('[Spending Trends Error]:', err);
      setError(err?.message || 'Failed to load spending trends');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(timeRange);
  }, [timeRange, selectedMonth]);

  const trends = data?.trends || [];

  // Summary Metrics calculations
  const latestMonth = trends[trends.length - 1];
  const prevMonth = trends.length >= 2 ? trends[trends.length - 2] : null;

  const currentSpend = latestMonth?.expense ?? 0;
  const currentMoMChange = latestMonth?.mom_change ?? 0;
  const currentMoMPct = latestMonth?.mom_percentage ?? 0;

  const avgMonthlySpend = data?.average_monthly_expense ?? 0;
  const peakMonth = data?.highest_month;
  const lowestMonth = data?.lowest_month;
  const overallTrend = data?.overall_trend ?? 'stable';

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const rowData: MonthlySpendingTrend | undefined = payload[0]?.payload;
    if (!rowData) return null;

    const isIncreased = rowData.mom_change > 0;
    const isOverBudget = rowData.budget_limit > 0 && rowData.expense > rowData.budget_limit;

    return (
      <div className="bg-[#0B0F17]/95 backdrop-blur-md border border-zinc-700/90 rounded-xl p-3.5 shadow-2xl min-w-[210px] space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
          <span className="font-bold text-white text-sm">{rowData.label}</span>
          <span className="text-[10px] font-mono text-zinc-400">{rowData.tx_count} txs</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Total Expense:
            </span>
            <span className="font-bold font-mono text-rose-400">
              {formatCurrency(rowData.expense, currency)}
            </span>
          </div>

          {metricMode === 'cashflow' && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Total Income:
              </span>
              <span className="font-bold font-mono text-emerald-400">
                {formatCurrency(rowData.income, currency)}
              </span>
            </div>
          )}

          {metricMode === 'expense_vs_budget' && rowData.budget_limit > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Monthly Budget:
              </span>
              <span className="font-mono text-zinc-300">
                {formatCurrency(rowData.budget_limit, currency)}
              </span>
            </div>
          )}

          {/* MoM Delta indicator */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[11px]">
            <span className="text-zinc-500">MoM Change:</span>
            <span
              className={`font-mono font-semibold flex items-center gap-0.5 ${
                isIncreased ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isIncreased ? '+' : ''}
              {formatCurrency(rowData.mom_change, currency)} ({isIncreased ? '+' : ''}
              {rowData.mom_percentage}%)
            </span>
          </div>

          {/* Budget status notice */}
          {rowData.budget_limit > 0 && (
            <div className="pt-0.5 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Budget Status:</span>
              <span
                className={`font-semibold ${
                  isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isOverBudget ? 'Exceeded limit' : 'Under budget'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Component Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Spending Trends
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                  Month-Over-Month Outflow
                </span>
              </div>
              <p className="text-xs text-zinc-400 pt-0.5">
                Multi-month trajectory tracking, spending velocity curves, and budget compliance
              </p>
            </div>
          </div>
        </div>

        {/* View & Time Range Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Metric Mode Filter */}
          <div className="inline-flex bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setMetricMode('expenses_only')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metricMode === 'expenses_only'
                  ? 'bg-rose-500/20 text-rose-400 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Expense Trend
            </button>
            <button
              onClick={() => setMetricMode('expense_vs_budget')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metricMode === 'expense_vs_budget'
                  ? 'bg-amber-500/20 text-amber-400 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Vs Budget
            </button>
            <button
              onClick={() => setMetricMode('cashflow')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metricMode === 'cashflow'
                  ? 'bg-emerald-500/20 text-emerald-400 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cashflow (In vs Out)
            </button>
          </div>

          {/* Time Range Pill Toggle (3M, 6M, 12M) */}
          <div className="inline-flex bg-zinc-900/90 border border-zinc-800 rounded-lg p-1 text-xs font-mono">
            {([3, 6, 12] as TimeRange[]).map((m) => (
              <button
                key={m}
                onClick={() => setTimeRange(m)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === m
                    ? 'bg-zinc-700 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => fetchTrends(timeRange)}
            disabled={isLoading}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh trends"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchTrends(timeRange)}
            className="px-2 py-0.5 bg-rose-500/20 rounded font-semibold text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top 4 Key Metric Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Current Month Spend */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Latest Month Spend</span>
            <span className="font-mono text-zinc-500 text-[10px]">{latestMonth?.label}</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-400">
            {formatCurrency(currentSpend, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`inline-flex items-center font-mono font-semibold ${
                currentMoMChange > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {currentMoMChange > 0 ? '+' : ''}
              {currentMoMPct}%
            </span>
            <span className="text-zinc-500">MoM change</span>
          </div>
        </div>

        {/* Metric 2: Average Monthly Outflow */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Average Monthly Burn</span>
            <span className="text-[10px] text-zinc-500 font-mono">Past {timeRange}M</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white">
            {formatCurrency(avgMonthlySpend, currency)}
          </div>
          <div className="text-[11px] text-zinc-400">
            Trend:{' '}
            <span
              className={`font-semibold capitalize ${
                overallTrend === 'increasing'
                  ? 'text-rose-400'
                  : overallTrend === 'decreasing'
                  ? 'text-emerald-400'
                  : 'text-zinc-300'
              }`}
            >
              {overallTrend}
            </span>
          </div>
        </div>

        {/* Metric 3: Peak Spending Month */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Peak Spending Month</span>
            <span className="text-[10px] text-amber-400/80 font-mono">Max</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white truncate">
            {peakMonth ? formatCurrency(peakMonth.amount, currency) : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            {peakMonth ? peakMonth.label : '—'}
          </div>
        </div>

        {/* Metric 4: Lowest Spending Month */}
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span>Lowest Outflow Month</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">Min</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white truncate">
            {lowestMonth ? formatCurrency(lowestMonth.amount, currency) : '—'}
          </div>
          <div className="text-[11px] text-zinc-400 truncate">
            {lowestMonth ? lowestMonth.label : '—'}
          </div>
        </div>
      </div>

      {/* Main Recharts Line Graph Container */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Monthly Outflow Curve</span>
            <span className="text-zinc-500 font-mono text-[11px]">
              ({trends.length} months plotted)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAreaGlow(!showAreaGlow)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>{showAreaGlow ? 'Glow On' : 'Clean Line'}</span>
            </button>
          </div>
        </div>

        {/* Recharts Render */}
        <div className="w-full h-72 sm:h-80 select-none">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trends}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
            >
              <defs>
                {/* Gradient for Expense Area glow */}
                <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>

                {/* Gradient for Income Area glow */}
                <linearGradient id="incomeGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272A"
                vertical={false}
              />

              <XAxis
                dataKey="short_label"
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272A' }}
              />

              <YAxis
                stroke="#71717A"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272A' }}
                tickFormatter={(val) => `₹${Math.round(val / 1000)}k`}
                domain={['auto', 'auto']}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Optional Monthly Budget reference ceiling */}
              {metricMode === 'expense_vs_budget' && trends.length > 0 && (
                <ReferenceLine
                  y={trends[0]?.budget_limit || 50000}
                  stroke="#EAB308"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Budget Cap: ₹${Math.round((trends[0]?.budget_limit || 50000) / 1000)}k`,
                    fill: '#EAB308',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Average reference line */}
              {avgMonthlySpend > 0 && metricMode === 'expenses_only' && (
                <ReferenceLine
                  y={avgMonthlySpend}
                  stroke="#71717A"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: `Avg: ₹${Math.round(avgMonthlySpend / 1000)}k`,
                    fill: '#A1A1AA',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />
              )}

              {/* Income Area & Line if Cashflow mode */}
              {metricMode === 'cashflow' && (
                <>
                  {showAreaGlow && (
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="none"
                      fill="url(#incomeGlow)"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Inflow"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#0E131C' }}
                    activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </>
              )}

              {/* Expense Glow Area */}
              {showAreaGlow && (
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="none"
                  fill="url(#expenseGlow)"
                />
              )}

              {/* Expense Main Line */}
              <Line
                type="monotone"
                dataKey="expense"
                name="Total Outflow"
                stroke="#F43F5E"
                strokeWidth={3}
                dot={{
                  fill: '#F43F5E',
                  r: 4.5,
                  strokeWidth: 2,
                  stroke: '#0E131C',
                }}
                activeDot={{
                  r: 7,
                  fill: '#F43F5E',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend Row */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded bg-rose-500 inline-block" />
            <span>Total Monthly Expenses</span>
          </div>

          {metricMode === 'expense_vs_budget' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" />
              <span>Budget Ceiling Reference</span>
            </div>
          )}

          {metricMode === 'cashflow' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded bg-emerald-500 inline-block" />
              <span>Monthly Inflow (Salary/Income)</span>
            </div>
          )}

          {metricMode === 'expenses_only' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-zinc-500 inline-block" />
              <span>Period Mean Outflow</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Month-over-Month Data Table (Collapsible) */}
      <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
        <button
          onClick={() => setShowDataTable(!showDataTable)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-rose-400" />
            <span>Month-over-Month Tabular Ledger ({trends.length} Months)</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <span>{showDataTable ? 'Hide Table' : 'View Numerical Table'}</span>
            {showDataTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showDataTable && (
          <div className="overflow-x-auto border-t border-zinc-800/80">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-900/80 text-zinc-400 font-semibold border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Billing Month</th>
                  <th className="py-2.5 px-4 text-right">Total Outflow</th>
                  <th className="py-2.5 px-4 text-right">MoM Delta</th>
                  <th className="py-2.5 px-4 text-right">MoM %</th>
                  <th className="py-2.5 px-4 text-right">Budget Limit</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {trends.map((row) => {
                  const isExceeded = row.budget_limit > 0 && row.expense > row.budget_limit;
                  const isIncrease = row.mom_change > 0;

                  return (
                    <tr key={row.month} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                        <span>{row.label}</span>
                        {row.month === latestMonth?.month && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-rose-400">
                        {formatCurrency(row.expense, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <span className={isIncrease ? 'text-rose-400' : 'text-emerald-400'}>
                          {isIncrease ? '+' : ''}
                          {formatCurrency(row.mom_change, currency)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold">
                        <span className={isIncrease ? 'text-rose-400' : 'text-emerald-400'}>
                          {isIncrease ? '+' : ''}
                          {row.mom_percentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-zinc-400">
                        {formatCurrency(row.budget_limit, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-sans">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                            isExceeded
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isExceeded ? 'Exceeded' : 'On Track'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
