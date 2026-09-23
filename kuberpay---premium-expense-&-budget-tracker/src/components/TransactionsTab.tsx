import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  CreditCard,
  Tag,
  Download,
  FileSpreadsheet,
  Camera,
} from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatCurrency, formatDate, getRelativeDay } from '../lib/formatters';
import { CategoryIcon, getPaymentIcon } from '../lib/icons';

interface TransactionsTabProps {
  transactions: Transaction[];
  categories: Category[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onExportCsv: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  categories,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onExportCsv,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) return false;

      // Payment method filter
      if (selectedPayment !== 'all' && tx.payment_method !== selectedPayment) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesNote = (tx.note || '').toLowerCase().includes(query);
        const matchesCategory = (tx.category_name || '').toLowerCase().includes(query);
        const matchesPayment = tx.payment_method.toLowerCase().includes(query);
        const matchesTags = tx.tags && tx.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesNote && !matchesCategory && !matchesPayment && !matchesTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
  }, [transactions, searchTerm, selectedType, selectedCategory, selectedPayment, sortBy]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    for (const tx of filteredTransactions) {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    }
    return Object.entries(groups).sort(([dateA], [dateB]) => {
      if (sortBy === 'date_asc') return dateA.localeCompare(dateB);
      return dateB.localeCompare(dateA);
    });
  }, [filteredTransactions, sortBy]);

  // Calculate totals for filtered list
  const filteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header Controls & Summary Bar */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Expense & Income Ledger</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 pt-0.5">
              <span>{filteredTransactions.length} records found</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Total Outflow: <strong className="text-rose-400 font-mono">{formatCurrency(filteredExpense, 'INR')}</strong></span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Inflow: <strong className="text-emerald-400 font-mono">{formatCurrency(filteredIncome, 'INR')}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-zinc-200 transition-colors"
              title="Download CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 pt-4 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, notes, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
            <option value="transfer">Transfers</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="py-1.5 px-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Payment Modes</option>
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>
      </div>

      {/* Grouped Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No transactions found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or record a new transaction using the + Add Entry button.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map(([date, txs]) => {
            const dayTotal = txs.reduce((acc, t) => {
              if (t.type === 'expense') return acc - t.amount;
              if (t.type === 'income') return acc + t.amount;
              return acc;
            }, 0);

            return (
              <div key={date} className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl overflow-hidden">
                {/* Date Group Header */}
                <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{getRelativeDay(date)}</span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-[11px] text-zinc-400">{formatDate(date)}</span>
                  </div>
                  <div className="text-xs font-mono font-medium">
                    <span className="text-zinc-500 text-[10px] mr-1">Day Net:</span>
                    <span className={dayTotal >= 0 ? 'text-emerald-400' : 'text-zinc-300'}>
                      {formatCurrency(dayTotal, 'INR', { showSign: true })}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-zinc-800/50">
                  {txs.map((tx) => {
                    const PaymentIcon = getPaymentIcon(tx.payment_method);
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxForDetail(tx)}
                        className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors cursor-pointer group"
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
                            <div className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                              {tx.title}
                            </div>
                            <div className="flex items-center flex-wrap gap-2 text-[11px] text-zinc-400 pt-0.5">
                              <span>{tx.category_name || 'Category'}</span>
                              <span aria-hidden="true" className="text-zinc-600">·</span>
                              <span className="flex items-center gap-1">
                                <PaymentIcon className="w-3 h-3 text-zinc-400" />
                                {tx.payment_method}
                              </span>
                              {tx.tags && tx.tags.length > 0 && (
                                <>
                                  <span aria-hidden="true" className="text-zinc-600">·</span>
                                  <span className="text-zinc-500 font-mono">{tx.tags.join(' ')}</span>
                                </>
                              )}
                              {tx.receipt_url && (
                                <>
                                  <span aria-hidden="true" className="text-zinc-600">·</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingReceipt(tx.receipt_url || null);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono transition-colors"
                                    title="View attached receipt photo"
                                  >
                                    <Camera className="w-2.5 h-2.5" />
                                    Receipt
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <div className="text-right">
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
                            {tx.account && (
                              <div className="text-[10px] text-zinc-500 font-medium">
                                {tx.account}
                              </div>
                            )}
                          </div>

                          {/* Quick action controls on row */}
                          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTransaction(tx);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(tx.id);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Detail Drawer / Modal */}
      {selectedTxForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0E131C] border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transaction Details</span>
              <button
                onClick={() => setSelectedTxForDetail(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <div
                className={`text-2xl sm:text-3xl font-mono font-extrabold ${
                  selectedTxForDetail.type === 'income'
                    ? 'text-emerald-400'
                    : selectedTxForDetail.type === 'transfer'
                    ? 'text-cyan-400'
                    : 'text-rose-400'
                }`}
              >
                {formatCurrency(selectedTxForDetail.amount, 'INR', { showSign: true })}
              </div>
              <h3 className="text-base font-bold text-white">{selectedTxForDetail.title}</h3>
              <p className="text-xs text-zinc-400 capitalize">{selectedTxForDetail.type} · {selectedTxForDetail.category_name}</p>
            </div>

            <div className="bg-zinc-900/80 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Date</span>
                <span className="text-white font-medium">{formatDate(selectedTxForDetail.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Mode</span>
                <span className="text-white font-medium">{selectedTxForDetail.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Account</span>
                <span className="text-white font-medium">{selectedTxForDetail.account}</span>
              </div>
              {selectedTxForDetail.note && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500 block mb-1">Notes:</span>
                  <p className="text-zinc-300 italic">{selectedTxForDetail.note}</p>
                </div>
              )}
              {selectedTxForDetail.tags && selectedTxForDetail.tags.length > 0 && (
                <div className="pt-2 border-t border-zinc-800 flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-500">Tags:</span>
                  {selectedTxForDetail.tags.map((t, idx) => (
                    <span key={idx} className="text-emerald-400 font-mono text-[11px]">{t}</span>
                  ))}
                </div>
              )}
              {selectedTxForDetail.receipt_url && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-zinc-500 block mb-1.5 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attached Physical Receipt:</span>
                  </span>
                  <div
                    onClick={() => setViewingReceipt(selectedTxForDetail.receipt_url || null)}
                    className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black cursor-pointer group max-h-40"
                  >
                    <img
                      src={selectedTxForDetail.receipt_url}
                      alt="Receipt"
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white">
                      Click to expand photo
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const tx = selectedTxForDetail;
                  setSelectedTxForDetail(null);
                  onEditTransaction(tx);
                }}
                className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Entry</span>
              </button>

              <button
                onClick={() => {
                  const id = selectedTxForDetail.id;
                  setSelectedTxForDetail(null);
                  onDeleteTransaction(id);
                }}
                className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Receipt Lightbox Viewer */}
      {viewingReceipt && (
        <div
          onClick={() => setViewingReceipt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-[#0E131C] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Physical Receipt Photo</h3>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black rounded-2xl p-2">
              <img
                src={viewingReceipt}
                alt="Full receipt photo"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setViewingReceipt(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
