import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  TrendingDown,
  Info,
  Flame,
  Bell,
  BellRing,
  Sparkles,
} from 'lucide-react';
import { Budget, Category } from '../types';
import { formatCurrency } from '../lib/formatters';
import { CategoryIcon } from '../lib/icons';

interface BudgetsTabProps {
  budgets: Budget[];
  categories: Category[];
  selectedMonth: string;
  onSaveBudget: (budget: { category_id: string; monthly_limit: number }) => Promise<void>;
  desktopNotificationAllowed?: boolean;
  onEnableDesktopNotifications?: () => Promise<void>;
  onTriggerTestAlert?: () => void;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({
  budgets,
  categories,
  selectedMonth,
  onSaveBudget,
  desktopNotificationAllowed = false,
  onEnableDesktopNotifications,
  onTriggerTestAlert,
}) => {
  const [editingBudget, setEditingBudget] = useState<{ category_id: string; name: string; limit: number } | null>(null);
  const [inputLimit, setInputLimit] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Overall totals
  const totalBudgeted = budgets.reduce((acc, b) => acc + (b.monthly_limit || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overallPercentage = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;

  // Safe daily burn rate
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const safeDailySpend = totalRemaining > 0 ? Math.round(totalRemaining / daysRemaining) : 0;

  const handleOpenEdit = (categoryId: string, name: string, currentLimit: number) => {
    setEditingBudget({ category_id: categoryId, name, limit: currentLimit });
    setInputLimit(currentLimit > 0 ? String(currentLimit) : '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget) return;
    const limit = parseFloat(inputLimit) || 0;
    setIsSubmitting(true);
    try {
      await onSaveBudget({
        category_id: editingBudget.category_id,
        monthly_limit: limit,
      });
      setEditingBudget(null);
    } catch (err) {
      console.error('Failed to save budget limit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find over-budget categories
  const overBudgetCategories = budgets.filter((b) => b.monthly_limit > 0 && b.spent > b.monthly_limit);

  return (
    <div className="space-y-6">
      {/* Monthly Budget Summary Banner */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Monthly Expense Budgets</h2>
              <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Active Cap: {formatCurrency(totalBudgeted, 'INR')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 pt-0.5">
              Set spending limits per category to keep cashflow disciplined.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2">
              <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Safe Daily Spend</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {formatCurrency(safeDailySpend, 'INR')} / day
              </span>
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Total Spent: <strong className="text-white font-mono">{formatCurrency(totalSpent, 'INR')}</strong></span>
            <span className="text-zinc-400">Remaining Buffer: <strong className="text-emerald-400 font-mono">{formatCurrency(totalRemaining, 'INR')}</strong></span>
          </div>

          <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage >= 95
                  ? 'bg-rose-500'
                  : overallPercentage >= 75
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>0%</span>
            <span>{overallPercentage}% utilized ({daysRemaining} days left)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Warning if any category is over budget */}
        {overBudgetCategories.length > 0 && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Budget Alert:</strong> You have exceeded the limit in {overBudgetCategories.map(o => o.name).join(', ')}.
            </span>
          </div>
        )}
      </div>

      {/* Real-time Over-Budget Alert Engine Bar */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${desktopNotificationAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Automated Over-Budget Guard</span>
              <span className={`text-[10px] font-semibold font-mono px-1.5 py-0.2 rounded border ${desktopNotificationAllowed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {desktopNotificationAllowed ? 'Desktop Alerts Active' : 'In-App Alerts Active'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Evaluates every new transaction in real-time. Triggers warning at 80% and desktop alert if budget is exceeded.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {!desktopNotificationAllowed && onEnableDesktopNotifications && (
            <button
              onClick={onEnableDesktopNotifications}
              className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors border border-zinc-700/80 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enable Desktop Alerts</span>
            </button>
          )}

          {onTriggerTestAlert && (
            <button
              onClick={onTriggerTestAlert}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors border border-rose-500/30 flex items-center gap-1.5 active:scale-95"
              title="Test over-budget evaluation and trigger desktop notification"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Alert Trigger</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const limit = b.monthly_limit || 0;
          const spent = b.spent || 0;
          const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const isOver = limit > 0 && spent > limit;
          const isWarning = limit > 0 && spent >= limit * 0.8 && !isOver;

          return (
            <div
              key={b.category_id}
              className={`bg-[#0E131C] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-colors ${
                isOver
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : isWarning
                  ? 'border-amber-500/30'
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${b.color || '#3B82F6'}18` }}
                    >
                      <CategoryIcon iconName={b.icon || 'utensils'} className="w-4 h-4" color={b.color} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{b.name}</h3>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {limit > 0 ? `Limit: ${formatCurrency(limit, 'INR')}` : 'No limit set'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(b.category_id, b.name || '', limit)}
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Edit category budget limit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Set</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-mono text-zinc-300 font-medium">
                      Spent: <strong className="text-white">{formatCurrency(spent, 'INR')}</strong>
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {limit > 0 ? `${pct}%` : '—'}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${limit > 0 ? pct : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-400">
                <span>
                  {limit > 0
                    ? isOver
                      ? `Over budget by ${formatCurrency(spent - limit, 'INR')}`
                      : `${formatCurrency(limit - spent, 'INR')} left`
                    : 'Tap "Set" to enforce monthly cap'}
                </span>
                {isOver && (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Exceeded
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131C] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Set Monthly Budget for {editingBudget.name}</h3>
            <p className="text-xs text-zinc-400">Enter your target maximum spending limit in INR (₹) for this month.</p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  placeholder="e.g. 5000"
                  value={inputLimit}
                  onChange={(e) => setInputLimit(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
