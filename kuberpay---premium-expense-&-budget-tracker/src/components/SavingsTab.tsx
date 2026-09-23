import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Bike,
  Compass,
  Laptop,
  CheckCircle,
  X,
  PiggyBank,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface SavingsTabProps {
  goals: SavingsGoal[];
  onCreateGoal: (goal: Partial<SavingsGoal>) => Promise<void>;
  onDepositGoal: (id: string, amount: number) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const SavingsTab: React.FC<SavingsTabProps> = ({
  goals,
  onCreateGoal,
  onDepositGoal,
  onDeleteGoal,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [depositModalGoal, setDepositModalGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New goal form state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState('#10B981');

  // Overall totals
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) return;

    setIsSubmitting(true);
    try {
      await onCreateGoal({
        title: title.trim() || 'New Goal',
        target_amount: target,
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10),
        category,
        color,
        icon: 'target',
      });
      setIsAddModalOpen(false);
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositModalGoal) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsSubmitting(true);
    try {
      await onDepositGoal(depositModalGoal.id, amt);

      // Check if this deposit completes the goal
      if (depositModalGoal.current_amount + amt >= depositModalGoal.target_amount) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      setDepositModalGoal(null);
      setDepositAmount('');
    } catch (err) {
      console.error('Failed to deposit to goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Savings Goals & Pockets</h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {goals.length} Goals Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 pt-0.5">
            Ring-fence funds for emergency safety, trips, gadgets, and large milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Total Saved</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {formatCurrency(totalSaved, 'INR')} <span className="text-zinc-500 text-xs font-normal">/ {formatCurrency(totalTarget, 'INR', { compact: true })}</span>
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const target = g.target_amount || 1;
          const current = g.current_amount || 0;
          const pct = Math.min(100, Math.round((current / target) * 100));
          const isCompleted = current >= target;
          const remaining = Math.max(0, target - current);

          return (
            <div
              key={g.id}
              className={`bg-[#0E131C] border rounded-2xl p-5 flex flex-col justify-between transition-colors ${
                isCompleted ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1"
                      style={{
                        backgroundColor: `${g.color || '#10B981'}15`,
                        borderColor: `${g.color || '#10B981'}40`,
                      }}
                    >
                      <Target className="w-5 h-5" style={{ color: g.color || '#10B981' }} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{g.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                        <span>{g.category}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span>Target: {formatDate(g.deadline)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base sm:text-lg font-mono font-extrabold ${
                        isCompleted ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300">Saved: <strong>{formatCurrency(current, 'INR')}</strong></span>
                    <span className="text-zinc-500">Goal: {formatCurrency(target, 'INR')}</span>
                  </div>

                  <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: g.color || '#10B981',
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {isCompleted ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Goal Reached!
                    </span>
                  ) : (
                    `${formatCurrency(remaining, 'INR')} remaining`
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteGoal(g.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setDepositModalGoal(g);
                      setDepositAmount('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Deposit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Funds Modal */}
      {depositModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131C] border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Deposit Funds to {depositModalGoal.title}</h3>
            <p className="text-xs text-zinc-400">
              Allocating savings logs this automatically into your ledger as an investment reserve.
            </p>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="e.g. 5000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Amount Helper Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[500, 1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(String(val))}
                    className="px-2 py-1 text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-700/60"
                  >
                    +₹{val}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDepositModalGoal(null)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131C] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Create New Savings Target</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Goa Trip, New Phone, Emergency Fund"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Emergency">Emergency Safety</option>
                    <option value="Travel">Travel & Vacation</option>
                    <option value="Vehicle">Vehicle / Bike</option>
                    <option value="Gadgets">Gadgets & Tech</option>
                    <option value="Real Estate">Real Estate / Home</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  {['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
