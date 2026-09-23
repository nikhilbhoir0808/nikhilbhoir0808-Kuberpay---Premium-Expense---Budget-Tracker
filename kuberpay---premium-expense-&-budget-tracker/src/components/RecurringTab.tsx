import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Repeat,
  DollarSign,
  ChevronRight,
  X,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { RecurringItem, Category, PaymentMethod } from '../types';
import { formatCurrency, formatDate, isDueSoon } from '../lib/formatters';
import { CategoryIcon, getPaymentIcon } from '../lib/icons';

interface RecurringTabProps {
  recurring: RecurringItem[];
  categories: Category[];
  onPayRecurring: (id: string) => Promise<void>;
  onCreateRecurring: (item: Partial<RecurringItem>) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
}

export const RecurringTab: React.FC<RecurringTabProps> = ({
  recurring,
  categories,
  onPayRecurring,
  onCreateRecurring,
  onDeleteRecurring,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('bills');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Total monthly recurring commitments
  const totalMonthlyCommitment = recurring
    .filter((r) => r.is_active)
    .reduce((acc, r) => {
      if (r.frequency === 'monthly') return acc + r.amount;
      if (r.frequency === 'yearly') return acc + r.amount / 12;
      if (r.frequency === 'weekly') return acc + r.amount * 4.33;
      if (r.frequency === 'daily') return acc + r.amount * 30;
      return acc + r.amount;
    }, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onCreateRecurring({
        title: title.trim() || 'Subscription',
        amount: numAmount,
        type: 'expense',
        category_id: categoryId,
        payment_method: paymentMethod,
        frequency,
        next_due_date: nextDueDate,
        note: note.trim(),
        is_active: 1,
      });
      setIsAddModalOpen(false);
      setTitle('');
      setAmount('');
      setNote('');
    } catch (err) {
      console.error('Failed to create recurring bill:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await onPayRecurring(id);
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Subscriptions & Recurring Bills</h2>
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {recurring.length} Tracked
            </span>
          </div>
          <p className="text-xs text-zinc-400 pt-0.5">
            Auto-calculated monthly commitments and due dates with 1-click ledger payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Monthly Commitment</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">
              {formatCurrency(totalMonthlyCommitment, 'INR')}/mo
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Bill</span>
          </button>
        </div>
      </div>

      {/* Bills Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurring.map((item) => {
          const due = isDueSoon(item.next_due_date);
          const isDue = due.isDue;
          const PaymentIcon = getPaymentIcon(item.payment_method);

          return (
            <div
              key={item.id}
              className={`bg-[#0E131C] border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-colors ${
                isDue ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1"
                      style={{
                        backgroundColor: `${item.category_color || '#F59E0B'}15`,
                        borderColor: `${item.category_color || '#F59E0B'}40`,
                      }}
                    >
                      <CategoryIcon
                        iconName={item.category_icon || 'bills'}
                        className="w-5 h-5"
                        color={item.category_color || '#F59E0B'}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                        <span className="capitalize">{item.frequency}</span>
                        <span aria-hidden="true" className="text-zinc-600">·</span>
                        <span className="flex items-center gap-1">
                          <PaymentIcon className="w-3 h-3 text-zinc-400" />
                          {item.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm sm:text-base font-mono font-bold text-white">
                      {formatCurrency(item.amount, 'INR')}
                    </div>
                    <div
                      className={`text-[11px] font-medium font-mono ${
                        due.daysRemaining < 0
                          ? 'text-rose-400'
                          : due.daysRemaining <= 3
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {due.daysRemaining === 0
                        ? 'Due Today'
                        : due.daysRemaining < 0
                        ? `Overdue (${Math.abs(due.daysRemaining)}d)`
                        : `Due in ${due.daysRemaining} days`}
                    </div>
                  </div>
                </div>

                {item.note && (
                  <p className="mt-3 text-xs text-zinc-400 bg-zinc-900/60 p-2 rounded-lg italic">
                    {item.note}
                  </p>
                )}
              </div>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="text-[11px] text-zinc-500 font-mono">
                  Next Due: {formatDate(item.next_due_date)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteRecurring(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete subscription"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handlePay(item.id)}
                    disabled={payingId === item.id}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{payingId === item.id ? 'Recording...' : 'Mark Paid'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131C] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">Add Recurring Subscription / Bill</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Bill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Apartment Rent, Gym, SIP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 649"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.filter((c) => c.type === 'expense').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Next Due Date</label>
                <input
                  type="date"
                  required
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Plan details or mandate ID"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
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
                  {isSubmitting ? 'Saving...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
