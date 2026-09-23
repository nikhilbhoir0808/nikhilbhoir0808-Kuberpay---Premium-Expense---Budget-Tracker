import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Flame,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sliders,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import {
  BudgetTrajectoryPrediction,
  Budget,
  Transaction,
  RecurringItem,
  AnalyticsData,
} from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/formatters';

interface BudgetTrajectoryCardProps {
  selectedMonth: string;
  analytics: AnalyticsData | null;
  budgets: Budget[];
  transactions: Transaction[];
  recurring: RecurringItem[];
  currency?: string;
  onNavigateToBudgets?: () => void;
}

export const BudgetTrajectoryCard: React.FC<BudgetTrajectoryCardProps> = ({
  selectedMonth,
  analytics,
  budgets,
  transactions,
  recurring,
  currency = 'INR',
  onNavigateToBudgets,
}) => {
  const [prediction, setPrediction] = useState<BudgetTrajectoryPrediction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  // Time & Month calculations
  const { daysInMonth, currentDay, daysRemaining } = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const now = new Date();
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() === monthIndex;

    const todayDay = isCurrentMonth ? now.getDate() : Math.min(totalDays, 23);
    const rem = Math.max(1, totalDays - todayDay + 1);

    return {
      daysInMonth: totalDays,
      currentDay: todayDay,
      daysRemaining: rem,
    };
  }, [selectedMonth]);

  // Aggregate current month metrics
  const totalBudgetLimit = useMemo(() => {
    const sum = budgets.reduce((acc, b) => acc + (Number(b.monthly_limit) || 0), 0);
    if (sum > 0) return sum;
    // Fallback if no category budget set: based on income or default 50k
    return analytics?.total_income && analytics.total_income > 0
      ? Math.round(analytics.total_income * 0.8)
      : 50000;
  }, [budgets, analytics]);

  const totalSpentSoFar = useMemo(() => {
    return analytics?.total_expense ?? 0;
  }, [analytics]);

  // Upcoming bills due in remainder of this month
  const upcomingBills = useMemo(() => {
    return recurring
      .filter((r) => r.is_active && r.type === 'expense')
      .filter((r) => {
        if (!r.next_due_date) return false;
        return r.next_due_date.startsWith(selectedMonth);
      });
  }, [recurring, selectedMonth]);

  // Fetch prediction from Gemini API endpoint
  const fetchPrediction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const activeCategories = budgets.map((b) => ({
        category_id: b.category_id,
        name: b.name || b.category_id,
        monthly_limit: b.monthly_limit,
        spent: b.spent,
      }));

      const recentTxSample = transactions.slice(0, 15).map((t) => ({
        title: t.title,
        amount: t.amount,
        category_name: t.category_name || t.category_id,
        date: t.date,
        payment_method: t.payment_method,
      }));

      const billsPayload = upcomingBills.map((b) => ({
        title: b.title,
        amount: b.amount,
        next_due_date: b.next_due_date,
      }));

      const res = await api.predictBudgetTrajectory({
        month: selectedMonth,
        daysInMonth,
        currentDay,
        daysRemaining,
        totalBudgetLimit,
        totalSpentSoFar,
        categories: activeCategories,
        recentTransactions: recentTxSample,
        upcomingBills: billsPayload,
        currency,
      });

      setPrediction(res);
    } catch (err: any) {
      console.error('[Trajectory Prediction Error]:', err);
      setError(err?.message || 'Failed to analyze spending trajectory');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger analysis automatically on mount or when month/transactions/budgets change
  useEffect(() => {
    fetchPrediction();
  }, [selectedMonth, totalSpentSoFar, totalBudgetLimit]);

  // Interactive "What-If" Simulation Slider State
  const [simulatedDailyBurn, setSimulatedDailyBurn] = useState<number>(0);

  useEffect(() => {
    if (prediction) {
      setSimulatedDailyBurn(prediction.recommended_daily_limit || prediction.current_daily_burn);
    }
  }, [prediction]);

  const simulatedProjectedTotal = useMemo(() => {
    if (!prediction) return 0;
    const upcomingSum = upcomingBills.reduce((acc, b) => acc + (b.amount || 0), 0);
    return Math.round(totalSpentSoFar + simulatedDailyBurn * daysRemaining + upcomingSum);
  }, [prediction, totalSpentSoFar, simulatedDailyBurn, daysRemaining, upcomingBills]);

  const simulatedVariance = simulatedProjectedTotal - totalBudgetLimit;

  // Render progress bar calculation
  const currentPct = Math.min(100, Math.round((totalSpentSoFar / (totalBudgetLimit || 1)) * 100));
  const projectedPct = prediction
    ? Math.round((prediction.projected_total_spend / (totalBudgetLimit || 1)) * 100)
    : currentPct;

  const isOverrun = prediction?.will_exceed_budget ?? false;
  const status = prediction?.status ?? 'on_track';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0E131E] border border-zinc-800/90 shadow-xl p-5 sm:p-6 space-y-5">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-20 transition-all ${
          isOverrun ? 'bg-rose-500' : status === 'caution' ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />

      {/* Header & Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              isOverrun
                ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40'
                : status === 'caution'
                ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
            }`}
          >
            {isOverrun ? (
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            ) : status === 'caution' ? (
              <Flame className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                AI Budget Trajectory & Predictive Forecast
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
              <span>Dynamic spend velocity & monthly overrun modeling</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="font-mono text-zinc-400">Day {currentDay} of {daysInMonth}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {prediction?.analyzed_at && (
            <span className="text-[10px] text-zinc-500 hidden md:inline font-mono">
              Live Projection
            </span>
          )}
          <button
            onClick={fetchPrediction}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            title="Refresh AI trajectory analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoading ? 'Analyzing...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchPrediction}
            className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded font-semibold text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prediction Status Headline Hero Banner */}
      {prediction && (
        <div
          className={`relative z-10 p-4 rounded-xl border transition-all ${
            isOverrun
              ? 'bg-gradient-to-r from-rose-950/40 to-[#160B12] border-rose-500/40 text-white'
              : status === 'caution'
              ? 'bg-gradient-to-r from-amber-950/40 to-[#16120B] border-amber-500/40 text-white'
              : 'bg-gradient-to-r from-emerald-950/40 to-[#0B1612] border-emerald-500/40 text-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isOverrun
                      ? 'bg-rose-500 text-black'
                      : status === 'caution'
                      ? 'bg-amber-400 text-black'
                      : 'bg-emerald-400 text-black'
                  }`}
                >
                  {isOverrun
                    ? '⚠️ Budget Overrun Predicted'
                    : status === 'caution'
                    ? '⚡ Caution: High Burn Velocity'
                    : '✅ On Track Under Budget'}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {Math.round(prediction.confidence_score * 100)}% Confidence
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {prediction.headline}
              </h3>
            </div>

            <div className="sm:text-right shrink-0">
              <div className="text-[11px] text-zinc-400">Projected Month-End Variance</div>
              <div
                className={`text-lg sm:text-xl font-mono font-extrabold ${
                  prediction.predicted_variance > 0
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {prediction.predicted_variance > 0 ? '+' : ''}
                {formatCurrency(prediction.predicted_variance, currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trajectory Progress Gauge & Visual Target */}
      <div className="relative z-10 bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Current MTD Spend:</span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(totalSpentSoFar, currency)}
            </span>
            <span className="text-zinc-500">({currentPct}%)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Budget Limit:</span>
            <span className="font-mono font-semibold text-zinc-200">
              {formatCurrency(totalBudgetLimit, currency)}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar with Forecast Overflow Zone */}
        <div className="relative w-full bg-zinc-800/90 h-3.5 rounded-full overflow-hidden">
          {/* Current Spent Fill */}
          <div
            className={`h-full transition-all duration-500 ${
              isOverrun ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, currentPct)}%` }}
          />

          {/* Forecasted Overflow or Projected End */}
          {prediction && (
            <div
              className={`absolute top-0 bottom-0 transition-all duration-500 opacity-60 ${
                isOverrun ? 'bg-rose-500 animate-pulse' : 'bg-emerald-300'
              }`}
              style={{
                left: `${Math.min(100, currentPct)}%`,
                width: `${Math.max(0, Math.min(100, projectedPct) - Math.min(100, currentPct))}%`,
              }}
            />
          )}

          {/* Budget Limit Notch at 100% */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/70 shadow-sm" title="Budget Ceiling" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-400 gap-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>MTD Spent: {formatCurrency(totalSpentSoFar, currency)}</span>
            <span className="text-zinc-600">·</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>
              Projected Total:{' '}
              <strong className={isOverrun ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
                {formatCurrency(prediction?.projected_total_spend ?? totalSpentSoFar, currency)}
              </strong>
            </span>
          </div>

          <div className="text-zinc-400 font-mono">
            {daysRemaining} days remaining in cycle
          </div>
        </div>
      </div>

      {/* 4-Metric Quantitative Grid */}
      {prediction && (
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1: Projected Total */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
              <span>Projected Outflow</span>
              <TrendingUp className={`w-3.5 h-3.5 ${isOverrun ? 'text-rose-400' : 'text-emerald-400'}`} />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-white">
              {formatCurrency(prediction.projected_total_spend, currency)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              of {formatCurrency(totalBudgetLimit, currency)} budget
            </div>
          </div>

          {/* Metric 2: Predicted Overrun / Surplus */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
              <span>Predicted Variance</span>
              {prediction.predicted_variance > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div
              className={`text-base sm:text-lg font-bold font-mono ${
                prediction.predicted_variance > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {prediction.predicted_variance > 0 ? '+' : ''}
              {formatCurrency(prediction.predicted_variance, currency)}
            </div>
            <div className="text-[10px] text-zinc-500">
              {prediction.predicted_variance > 0 ? 'Projected Overrun' : 'Projected Surplus'}
            </div>
          </div>

          {/* Metric 3: Current Daily Burn Rate */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
              <span>Current Burn Rate</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-400">
              {formatCurrency(prediction.current_daily_burn, currency)}
              <span className="text-xs font-normal text-zinc-500">/day</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Avg across {currentDay} days
            </div>
          </div>

          {/* Metric 4: Safe Daily Limit Recommendation */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
            <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
              <span>Safe Daily Cap</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
              {formatCurrency(prediction.recommended_daily_limit, currency)}
              <span className="text-xs font-normal text-zinc-500">/day</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              To stay within budget
            </div>
          </div>
        </div>
      )}

      {/* Spending Velocity Narrative */}
      {prediction?.spending_velocity_analysis && (
        <div className="relative z-10 p-3.5 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white font-semibold block mb-0.5">Velocity Diagnostic:</strong>
            {prediction.spending_velocity_analysis}
          </div>
        </div>
      )}

      {/* AI Behavioral Insights & Actionable Recommendations Dual-Column */}
      {prediction && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Observed Spending Patterns */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Observed Spending Patterns</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {prediction.pattern_insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actionable Course-Correction Recommendations */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tactical Course Corrections</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {prediction.actionable_recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Category Risk Breakdown (Collapsible) */}
      {prediction?.category_risks && prediction.category_risks.length > 0 && (
        <div className="relative z-10 border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/40">
          <button
            onClick={() => setShowCategoryDetails(!showCategoryDetails)}
            className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Category Leakage & Overrun Risks ({prediction.category_risks.length})</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-500">
              <span>{showCategoryDetails ? 'Hide' : 'View Risk Table'}</span>
              {showCategoryDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showCategoryDetails && (
            <div className="p-3.5 border-t border-zinc-800/80 divide-y divide-zinc-800/50">
              {prediction.category_risks.map((cat, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate flex items-center gap-2">
                      <span>{cat.category_name}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                          cat.risk_level === 'high'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : cat.risk_level === 'medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {cat.risk_level} risk
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono pt-0.5">
                      Spent: {formatCurrency(cat.spent, currency)} / Limit:{' '}
                      {formatCurrency(cat.monthly_limit, currency)}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="text-zinc-400 text-[11px]">
                      Projected: <strong className="text-white">{formatCurrency(cat.projected_spend, currency)}</strong>
                    </div>
                    {cat.will_exceed ? (
                      <div className="text-[10px] text-rose-400 font-semibold">
                        + {formatCurrency(cat.overrun_amount, currency)} overrun
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-400">
                        Safe
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive What-If Spending Burn Simulator */}
      <div className="relative z-10 border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Interactive "What-If" Trajectory Simulator</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <span>{showSimulator ? 'Close Simulator' : 'Simulate Daily Burn'}</span>
            {showSimulator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showSimulator && (
          <div className="p-4 border-t border-zinc-800/80 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Simulate Daily Discretionary Cap:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatCurrency(simulatedDailyBurn, currency)} / day
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={Math.max(5000, (prediction?.current_daily_burn || 2000) * 2)}
                step="50"
                value={simulatedDailyBurn}
                onChange={(e) => setSimulatedDailyBurn(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>₹0 (Total freeze)</span>
                <span>Recommended: {formatCurrency(prediction?.recommended_daily_limit ?? 0, currency)}</span>
                <span>Current: {formatCurrency(prediction?.current_daily_burn ?? 0, currency)}</span>
              </div>
            </div>

            {/* Realtime Simulator Outcome Card */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-zinc-400 block">Simulated Month-End Result:</span>
                <span className="text-sm font-bold font-mono text-white">
                  {formatCurrency(simulatedProjectedTotal, currency)}
                </span>
                <span className="text-xs text-zinc-500 ml-2 font-mono">
                  (Budget: {formatCurrency(totalBudgetLimit, currency)})
                </span>
              </div>

              <div className="sm:text-right">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg inline-block ${
                    simulatedVariance > 0
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {simulatedVariance > 0
                    ? `Overrun: +${formatCurrency(simulatedVariance, currency)}`
                    : `Saved: ${formatCurrency(Math.abs(simulatedVariance), currency)} surplus`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
