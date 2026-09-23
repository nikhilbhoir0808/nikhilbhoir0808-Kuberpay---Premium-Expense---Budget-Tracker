import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  PiggyBank,
} from 'lucide-react';
import { AnalyticsData, Transaction, RecurringItem, Budget, SavingsGoal } from '../types';
import { formatCurrency, getRelativeDay, isDueSoon } from '../lib/formatters';
import { CategoryIcon, getPaymentIcon } from '../lib/icons';
import { BudgetTrajectoryCard } from './BudgetTrajectoryCard';

interface OverviewTabProps {
  selectedMonth?: string;
  currency?: string;
  analytics: AnalyticsData | null;
  transactions: Transaction[];
  recurring: RecurringItem[];
  budgets: Budget[];
  goals: SavingsGoal[];
  onOpenAddModal: (type?: 'expense' | 'income' | 'transfer') => void;
  onSelectTab: (tab: any) => void;
  onPayRecurring: (id: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  selectedMonth = new Date().toISOString().substring(0, 7),
  currency = 'INR',
  analytics,
  transactions,
  recurring,
  budgets,
  goals,
  onOpenAddModal,
  onSelectTab,
  onPayRecurring,
  onSelectTransaction,
}) => {
  const totalIncome = analytics?.total_income ?? 0;
  const totalExpense = analytics?.total_expense ?? 0;
  const netSavings = analytics?.net_savings ?? 0;
  const savingsRate = analytics?.savings_rate ?? 0;
  const allTimeBalance = analytics?.all_time_balance ?? 0;

  // Monthly Budget overview calculation
  const totalBudgetLimit = budgets.reduce((acc, b) => acc + (b.monthly_limit || 0), 0);
  const totalBudgetSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
  const budgetPercentage = totalBudgetLimit > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100)) : 0;
  const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  // Safe daily spend calculation
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const safeDailySpend = budgetRemaining > 0 ? Math.round(budgetRemaining / daysRemaining) : 0;

  // Upcoming bills due in next 7 days
  const upcomingBills = recurring
    .filter((r) => r.is_active)
    .filter((r) => {
      const due = isDueSoon(r.next_due_date);
      return due.daysRemaining >= 0 && due.daysRemaining <= 7;
    })
    .slice(0, 3);

  // Recent 6 transactions
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero Financial Balance Card - Dark Glass Luxury */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#121824] via-[#0E131C] to-[#0A0D14] p-6 border border-zinc-800/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Primary Liquid Balance</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="text-emerald-400 font-mono">Realtime Ledger</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono">
                {formatCurrency(allTimeBalance, 'INR')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2 pt-1">
              <span>Monthly net: <strong className={netSavings >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>{formatCurrency(netSavings, 'INR', { showSign: true })}</strong></span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Savings Rate: <strong className="text-emerald-400 font-mono">{savingsRate}%</strong></span>
            </p>
          </div>

          {/* Income & Expense Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto min-w-[280px]">
            <div className="bg-zinc-900/80 border border-zinc-800/70 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-zinc-400 block truncate">Total Inflow</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono truncate block">
                  {formatCurrency(totalIncome, 'INR')}
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800/70 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-zinc-400 block truncate">Total Outflow</span>
                <span className="text-sm sm:text-base font-bold text-white font-mono truncate block">
                  {formatCurrency(totalExpense, 'INR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-xl text-xs font-semibold text-white transition-all active:scale-98 shadow-sm group"
          >
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs group-hover:bg-rose-500 group-hover:text-black transition-colors">
              -
            </span>
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => onOpenAddModal('income')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-xl text-xs font-semibold text-white transition-all active:scale-98 shadow-sm group"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs group-hover:bg-emerald-500 group-hover:text-black transition-colors">
              +
            </span>
            <span>Credit Income</span>
          </button>

          <button
            onClick={() => onOpenAddModal('transfer')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-xl text-xs font-semibold text-white transition-all active:scale-98 shadow-sm group"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>UPI Transfer</span>
          </button>

          <button
            onClick={() => onSelectTab('splitter')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-600 rounded-xl text-xs font-semibold text-white transition-all active:scale-98 shadow-sm group"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Split Bill Tool</span>
          </button>
        </div>
      </div>

      {/* AI Budget Trajectory & Predictive Overrun Section (Powered by Gemini) */}
      <BudgetTrajectoryCard
        selectedMonth={selectedMonth}
        currency={currency}
        analytics={analytics}
        budgets={budgets}
        transactions={transactions}
        recurring={recurring}
        onNavigateToBudgets={() => onSelectTab('budgets')}
      />

      {/* Tri-Column Insights: Budget Health, Upcoming Subscriptions, Savings Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Budget Health Card */}
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Budget</span>
              <button
                onClick={() => onSelectTab('budgets')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
              >
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-white font-mono">
                {formatCurrency(totalBudgetSpent, 'INR')}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                of {formatCurrency(totalBudgetLimit, 'INR')}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-800/80 h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercentage > 90
                    ? 'bg-rose-500'
                    : budgetPercentage > 75
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, budgetPercentage)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{budgetPercentage}% consumed</span>
              <span>{formatCurrency(budgetRemaining, 'INR')} remaining</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Safe Daily Burn Rate:</span>
            <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(safeDailySpend, 'INR')} / day</span>
          </div>
        </div>

        {/* Upcoming Bills & Subscriptions */}
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upcoming Bills</span>
              <button
                onClick={() => onSelectTab('recurring')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
              >
                All Bills <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingBills.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                No recurring bills due in next 7 days
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingBills.map((bill) => {
                  const due = isDueSoon(bill.next_due_date);
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <CategoryIcon iconName={bill.category_icon || 'bills'} className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{bill.title}</div>
                          <div className="text-[10px] text-amber-400 font-medium">
                            {due.daysRemaining === 0 ? 'Due Today' : `Due in ${due.daysRemaining} days`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-semibold text-white">
                          {formatCurrency(bill.amount, 'INR')}
                        </span>
                        <button
                          onClick={() => onPayRecurring(bill.id)}
                          className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-md transition-colors"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Active subscriptions:</span>
            <span className="font-mono text-zinc-300 font-semibold">{recurring.filter((r) => r.is_active).length}</span>
          </div>
        </div>

        {/* Savings Goals Pocket Preview */}
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Savings Pockets</span>
              <button
                onClick={() => onSelectTab('savings')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                <PiggyBank className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                No savings goals created yet
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 2).map((goal) => {
                  const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white truncate">{goal.title}</span>
                        <span className="font-mono text-emerald-400 font-semibold">{pct}%</span>
                      </div>
                      <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: goal.color || '#10B981' }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{formatCurrency(goal.current_amount, 'INR')} saved</span>
                        <span>Target {formatCurrency(goal.target_amount, 'INR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Total targets:</span>
            <span className="font-mono text-zinc-300 font-semibold">
              {formatCurrency(goals.reduce((acc, g) => acc + g.current_amount, 0), 'INR', { compact: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity Stream */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Recent Activity</h2>
            <p className="text-xs text-zinc-400">Latest transactions logged to device</p>
          </div>
          <button
            onClick={() => onSelectTab('transactions')}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Full Ledger ({transactions.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No transactions found for this period. Click "+ Record Expense" to log one.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {recentTransactions.map((tx) => {
              const PaymentIcon = getPaymentIcon(tx.payment_method);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-3 flex items-center justify-between hover:bg-zinc-800/30 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1"
                      style={{
                        backgroundColor: `${tx.category_color || '#3B82F6'}15`,
                        borderColor: `${tx.category_color || '#3B82F6'}40`,
                      }}
                    >
                      <CategoryIcon
                        iconName={tx.category_icon || 'utensils'}
                        className="w-5 h-5"
                        color={tx.category_color || '#3B82F6'}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {tx.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                        <span>{tx.category_name || 'General'}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1">
                          <PaymentIcon className="w-3 h-3 text-zinc-400" />
                          {tx.payment_method}
                        </span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>{getRelativeDay(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-mono font-bold ${
                        isIncome
                          ? 'text-emerald-400'
                          : isTransfer
                          ? 'text-cyan-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(tx.amount, 'INR', { showSign: true })}
                    </div>
                    {tx.note && (
                      <div className="text-[10px] text-zinc-500 truncate max-w-[120px] sm:max-w-[180px]">
                        {tx.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
