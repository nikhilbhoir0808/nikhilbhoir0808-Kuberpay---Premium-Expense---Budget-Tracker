import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Zap,
  Award,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  LineChart,
} from 'lucide-react';
import { AnalyticsData, Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import { CategoryIcon, getPaymentIcon } from '../lib/icons';
import { SpendingTrends } from './SpendingTrends';

interface AnalyticsTabProps {
  analytics: AnalyticsData | null;
  transactions: Transaction[];
  selectedMonth: string;
  currency?: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  analytics,
  transactions,
  selectedMonth,
  currency = 'INR',
}) => {
  const [activeView, setActiveView] = useState<'trends' | 'daily' | 'all'>('trends');
  const [hoveredBar, setHoveredBar] = useState<{ date: string; amount: number } | null>(null);

  const totalIncome = analytics?.total_income ?? 0;
  const totalExpense = analytics?.total_expense ?? 0;
  const netSavings = analytics?.net_savings ?? 0;
  const savingsRate = analytics?.savings_rate ?? 0;
  const categoryBreakdown = analytics?.category_breakdown ?? [];
  const paymentBreakdown = analytics?.payment_breakdown ?? [];
  const dailyTrend = analytics?.daily_trend ?? [];

  // Calculate daily average spend
  const today = new Date();
  const currentDay = today.getDate();
  const avgDailySpend = currentDay > 0 ? Math.round(totalExpense / currentDay) : 0;

  // Max daily expense for chart scaling
  const maxDailyExpense = Math.max(...dailyTrend.map((d) => d.expense), 1000);

  // Highest spending category
  const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  return (
    <div className="space-y-6">
      {/* Monthly Financial Health Scorecard */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Financial Analytics & Insights</h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {selectedMonth}
              </span>
            </div>
            <p className="text-xs text-zinc-400 pt-0.5">
              Detailed cashflow breakdown, merchant distribution, and daily burn rates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Filter Pill */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs flex items-center gap-1">
              <button
                onClick={() => setActiveView('trends')}
                className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'trends'
                    ? 'bg-rose-500/20 text-rose-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Spending Trends</span>
              </button>
              <button
                onClick={() => setActiveView('daily')}
                className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === 'daily'
                    ? 'bg-zinc-700 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Daily & Breakdown</span>
              </button>
              <button
                onClick={() => setActiveView('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeView === 'all'
                    ? 'bg-zinc-700 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500">Savings Rate:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  savingsRate >= 30
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {savingsRate}%
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 font-medium block">Total Inflow</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono block mt-1">
              {formatCurrency(totalIncome, currency)}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 font-medium block">Total Outflow</span>
            <span className="text-base sm:text-lg font-bold text-rose-400 font-mono block mt-1">
              {formatCurrency(totalExpense, currency)}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 font-medium block">Avg Daily Burn</span>
            <span className="text-base sm:text-lg font-bold text-zinc-200 font-mono block mt-1">
              {formatCurrency(avgDailySpend, currency)}{' '}
              <span className="text-xs text-zinc-500 font-normal">/ day</span>
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5">
            <span className="text-[11px] text-zinc-500 font-medium block">Top Spend Area</span>
            <span className="text-base sm:text-lg font-bold text-amber-400 truncate block mt-1">
              {highestCategory ? highestCategory.name : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Spending Trends Component using Recharts */}
      {(activeView === 'trends' || activeView === 'all') && (
        <SpendingTrends selectedMonth={selectedMonth} currency={currency} />
      )}

      {/* Daily Spending Timeline Chart */}
      {(activeView === 'daily' || activeView === 'all') && (
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Spending Trajectory</h3>
              <p className="text-xs text-zinc-400">Day-by-day expense distribution</p>
            </div>
            {hoveredBar && (
              <div className="text-xs font-mono bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-lg">
                <span className="text-zinc-400">{formatDate(hoveredBar.date)}: </span>
                <span className="text-rose-400 font-bold">{formatCurrency(hoveredBar.amount, currency)}</span>
              </div>
            )}
          </div>

          {dailyTrend.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No daily expense data available for this month.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-zinc-800 overflow-x-auto">
                {dailyTrend.map((d) => {
                  const heightPct = Math.min(100, Math.max(8, (d.expense / maxDailyExpense) * 100));
                  const dayNum = d.date.split('-')[2];

                  return (
                    <div
                      key={d.date}
                      onMouseEnter={() => setHoveredBar({ date: d.date, amount: d.expense })}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="flex-1 min-w-[14px] flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className="w-full flex items-end justify-center h-36">
                        <div
                          className="w-full rounded-t-md bg-rose-500/80 group-hover:bg-rose-400 transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-white transition-colors">
                        {dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>Day 1</span>
                <span>Month Trajectory</span>
                <span>End of Month</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout: Category Breakdown & Payment Methods */}
      {(activeView === 'daily' || activeView === 'all') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category Spending Breakdown */}
          <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Expense by Category</h3>
                <p className="text-xs text-zinc-400">Share of monthly outflows</p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {categoryBreakdown.length} Categories
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                No category expenses recorded yet.
              </div>
            ) : (
              <div className="space-y-3.5">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        <span className="text-white font-medium">{cat.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-white font-semibold">{formatCurrency(cat.amount, currency)}</span>
                        <span className="text-zinc-500 text-[11px] ml-1.5">({cat.percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods Distribution */}
          <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Payment Method Channels</h3>
                <p className="text-xs text-zinc-400">Where outflows originate (UPI, Cards, Cash)</p>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Total {paymentBreakdown.reduce((acc, p) => acc + p.count, 0)} Txs
              </span>
            </div>

            {paymentBreakdown.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                No transactions recorded for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {paymentBreakdown.map((item) => {
                  const PaymentIcon = getPaymentIcon(item.payment_method);
                  const pct = totalExpense > 0 ? Math.round((item.total_amount / totalExpense) * 100) : 0;

                  return (
                    <div
                      key={item.payment_method}
                      className="p-3 bg-zinc-900/60 border border-zinc-800/70 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">
                          <PaymentIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{item.payment_method}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{item.count} transactions</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-white">
                          {formatCurrency(item.total_amount, currency)}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {pct}% of outflows
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
