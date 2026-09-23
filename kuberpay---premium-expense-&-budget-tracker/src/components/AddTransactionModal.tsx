import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Calendar,
  CreditCard,
  Tag,
  FileText,
  Smartphone,
  Banknote,
  Building2,
  Check,
  AlertTriangle,
  Flame,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { Transaction, Category, TransactionType, PaymentMethod, Budget } from '../types';
import { CategoryIcon } from '../lib/icons';
import { api, ParsedReceiptData } from '../lib/api';
import { evaluateBudgetImpact } from '../lib/budgetEvaluator';
import { formatCurrency } from '../lib/formatters';
import { ReceiptCameraScanner } from './ReceiptCameraScanner';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  budgets?: Budget[];
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onSave: (tx: Partial<Transaction>) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  budgets = [],
  initialType = 'expense',
  editingTransaction,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [account, setAccount] = useState<string>('Primary Account');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSmartPaste, setShowSmartPaste] = useState<boolean>(false);
  const [smartPasteText, setSmartPasteText] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Physical Receipt Camera Scanner states
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptSummary, setReceiptSummary] = useState<string>('');

  // Live real-time budget evaluation as user types
  const budgetImpact = React.useMemo(() => {
    return evaluateBudgetImpact({
      transaction: {
        type,
        category_id: categoryId,
        amount: parseFloat(amount) || 0,
        title,
      },
      existingTransaction: editingTransaction,
      budgets,
      categories,
    });
  }, [type, categoryId, amount, title, editingTransaction, budgets, categories]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setTitle(editingTransaction.title);
      setCategoryId(editingTransaction.category_id);
      setPaymentMethod(editingTransaction.payment_method);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
      setTags(editingTransaction.tags || []);
      setAccount(editingTransaction.account || 'Primary Account');
      setReceiptImage(editingTransaction.receipt_url || '');
      setReceiptSummary('');
    } else {
      setType(initialType);
      setAmount('');
      setTitle('');
      setCategoryId(initialType === 'income' ? 'salary' : 'food');
      setPaymentMethod('UPI');
      setDate(new Date().toISOString().substring(0, 10));
      setNote('');
      setTags([]);
      setAccount('Primary Account');
      setReceiptImage('');
      setReceiptSummary('');
    }
  }, [editingTransaction, initialType, isOpen]);

  // Callback when Gemini successfully parses physical receipt from camera
  const handleReceiptParsed = (parsed: ParsedReceiptData, imageBase64: string) => {
    if (parsed.merchant) {
      setTitle(parsed.merchant);
    }
    if (parsed.amount !== undefined && parsed.amount > 0) {
      setAmount(String(parsed.amount));
    }
    if (parsed.date) {
      setDate(parsed.date);
    }
    if (parsed.category_id) {
      const target = parsed.category_id.toLowerCase();
      const matchedCat = categories.find(
        (c) =>
          c.id.toLowerCase() === target ||
          c.name.toLowerCase().includes(target) ||
          target.includes(c.id.toLowerCase())
      );
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }
    }
    if (parsed.payment_method) {
      const pm = parsed.payment_method;
      if (['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'].includes(pm)) {
        setPaymentMethod(pm as PaymentMethod);
      }
    }
    if (parsed.items_summary) {
      setNote((prev) => (prev ? `${prev} · ${parsed.items_summary}` : parsed.items_summary || ''));
      setReceiptSummary(parsed.items_summary);
    }
    setReceiptImage(imageBase64);
  };

  if (!isOpen) return null;

  const handleAddQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + val));
  };

  const handleAddTag = () => {
    let clean = tagInput.trim();
    if (!clean) return;
    if (!clean.startsWith('#')) clean = '#' + clean;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSmartScan = async () => {
    if (!smartPasteText.trim()) return;
    setIsScanning(true);
    try {
      const parsed = await api.smartScanText(smartPasteText);
      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.title) setTitle(parsed.title);
      if (parsed.type) setType(parsed.type as TransactionType);
      if (parsed.category_id) setCategoryId(parsed.category_id);
      if (parsed.payment_method) setPaymentMethod(parsed.payment_method as PaymentMethod);
      if (parsed.note) setNote(parsed.note);
      setShowSmartPaste(false);
      setSmartPasteText('');
    } catch (err) {
      console.error('Smart scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSave({
        id: editingTransaction?.id,
        type,
        amount: numAmount,
        title: title.trim() || (type === 'expense' ? 'Expense' : 'Income'),
        category_id: categoryId,
        payment_method: paymentMethod,
        date,
        note: note.trim(),
        tags,
        account,
        receipt_url: receiptImage || editingTransaction?.receipt_url,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (type === 'expense') return c.type === 'expense';
    if (type === 'income') return c.type === 'income';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0E131C] border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl space-y-4 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">
              {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
              ₹ INR
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!editingTransaction && (
              <>
                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="text-xs text-emerald-300 hover:text-white font-semibold flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 rounded-lg transition-all border border-emerald-500/30 active:scale-95 shadow-sm ring-1 ring-emerald-500/20"
                  title="Capture physical paper receipt using camera & Gemini OCR"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scan Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSmartPaste(!showSmartPaste)}
                  className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-1 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800"
                  title="Paste Indian Bank SMS or UPI text"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>SMS</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Physical Receipt Quick Camera Banner Callout */}
        {!editingTransaction && !receiptImage && (
          <div
            onClick={() => setIsCameraScannerOpen(true)}
            className="p-3 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900/80 border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:border-emerald-400/50 transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Capture Physical Receipt</span>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Snap a photo of any receipt to auto-fill merchant, date & amount
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform hidden sm:inline">
              Open Camera →
            </span>
          </div>
        )}

        {/* Receipt Attached Card */}
        {receiptImage && (
          <div className="p-3 bg-zinc-900/90 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-700 bg-black shrink-0">
                <img src={receiptImage} alt="Receipt thumbnail" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-400">Receipt Photo Attached</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Gemini Parsed</span>
                </div>
                <p className="text-[11px] text-zinc-300 truncate">
                  {receiptSummary || title || 'Physical paper receipt attached'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-2.5 py-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                title="Retake photo"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={() => {
                  setReceiptImage('');
                  setReceiptSummary('');
                }}
                className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Smart SMS / Natural Text Auto-Fill Box */}
        {showSmartPaste && (
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Auto-parse SMS or Note
              </span>
              <span className="text-[10px] text-zinc-500">Python NLP Parser</span>
            </div>
            <textarea
              rows={2}
              value={smartPasteText}
              onChange={(e) => setSmartPasteText(e.target.value)}
              placeholder="e.g. 'Paid 450 to Swiggy via GPay' or paste bank SMS..."
              className="w-full p-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSmartPaste(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSmartScan}
                disabled={isScanning || !smartPasteText.trim()}
                className="px-3 py-1 text-xs font-semibold bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                {isScanning ? 'Parsing...' : 'Extract Fields'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segmented Type Switcher */}
          <div className="grid grid-cols-3 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('food');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId('salary');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setCategoryId('investment');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Large Amount Field */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
              Amount (₹ INR)
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-extrabold text-zinc-400 font-mono">₹</span>
              <input
                type="number"
                step="any"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-48 text-3xl sm:text-4xl font-extrabold font-mono text-white text-center bg-transparent focus:outline-none placeholder-zinc-600"
              />
            </div>

            {/* Quick Amount Helper Chips */}
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              {[50, 100, 200, 500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddQuickAmount(val)}
                  className="px-2 py-0.5 text-[11px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-700/60 transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Description / Payee
            </label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. Swiggy Biryani, Petrol, Groceries' : 'e.g. Monthly Salary, Freelance retainer'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredCategories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-800 ring-2 ring-emerald-400 border-transparent text-white'
                        : 'bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${c.color}20` }}
                    >
                      <CategoryIcon iconName={c.icon} className="w-3.5 h-3.5" color={c.color} />
                    </div>
                    <span className="text-[11px] font-medium truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'] as PaymentMethod[]).map((m) => {
                const isSelected = paymentMethod === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="block truncate text-[11px]">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Account Label</label>
              <input
                type="text"
                placeholder="e.g. HDFC Salary A/c, Cash"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Tags</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Type tag (e.g. grocery, trip) and add"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Split with Aman, reimbursed later"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Live Budget Evaluation Alert */}
          {type === 'expense' && budgetImpact.hasBudget && parseFloat(amount) > 0 && (
            <div
              className={`p-3 rounded-xl border transition-all text-xs ${
                budgetImpact.level === 'critical'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : budgetImpact.level === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {budgetImpact.level === 'critical' ? (
                  <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                ) : budgetImpact.level === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span className="font-bold">
                  {budgetImpact.level === 'critical'
                    ? budgetImpact.pushesOverBudget
                      ? `Budget Alert: Exceeds ${budgetImpact.categoryName} Cap!`
                      : `Budget Alert: Further exceeds limit!`
                    : budgetImpact.level === 'warning'
                    ? `Budget Warning: ${budgetImpact.newPercentage}% utilized`
                    : `Budget Safe (${budgetImpact.newPercentage}% used)`}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                {budgetImpact.message}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/10">
                <span>Current Spent: {formatCurrency(budgetImpact.currentSpent, 'INR')}</span>
                <span>Limit: {formatCurrency(budgetImpact.monthlyLimit, 'INR')}</span>
                <span className="font-bold">New: {formatCurrency(budgetImpact.newSpent, 'INR')}</span>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingTransaction ? 'Save Changes' : 'Confirm Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Live Physical Receipt Camera Scanner & Gemini 3.8 Parser */}
      <ReceiptCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onReceiptParsed={handleReceiptParsed}
      />
    </div>
  );
};
