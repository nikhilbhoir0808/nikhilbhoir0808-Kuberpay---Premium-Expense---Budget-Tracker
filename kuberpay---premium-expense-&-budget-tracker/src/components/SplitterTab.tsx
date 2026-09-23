import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Share2,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '../lib/formatters';

interface SplitterTabProps {
  onRecordExpense: (amount: number, title: string, note: string) => void;
}

interface Friend {
  id: string;
  name: string;
}

export const SplitterTab: React.FC<SplitterTabProps> = ({ onRecordExpense }) => {
  const [totalBill, setTotalBill] = useState('1800');
  const [billTitle, setBillTitle] = useState('Dinner at Social');
  const [taxTipPercent, setTaxTipPercent] = useState('5');
  const [upiId, setUpiId] = useState('nikhil@okhdfcbank');
  const [friends, setFriends] = useState<Friend[]>([
    { id: '1', name: 'Me (You)' },
    { id: '2', name: 'Rahul' },
    { id: '3', name: 'Aman' },
    { id: '4', name: 'Priya' },
  ]);
  const [newFriendName, setNewFriendName] = useState('');
  const [copied, setCopied] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const billNum = parseFloat(totalBill) || 0;
  const taxPct = parseFloat(taxTipPercent) || 0;
  const grandTotal = billNum + (billNum * taxPct) / 100;
  const count = Math.max(1, friends.length);
  const perPersonShare = Math.round((grandTotal / count) * 100) / 100;

  const handleAddFriend = () => {
    if (!newFriendName.trim()) return;
    setFriends([...friends, { id: String(Date.now()), name: newFriendName.trim() }]);
    setNewFriendName('');
  };

  const handleRemoveFriend = (id: string) => {
    if (friends.length <= 1) return;
    setFriends(friends.filter((f) => f.id !== id));
  };

  const generateShareMessage = () => {
    const lines = [
      `🧾 Bill Split: ${billTitle || 'Group Expense'}`,
      `Total: ${formatCurrency(grandTotal, 'INR')} split among ${count} people`,
      `👉 Your share: ${formatCurrency(perPersonShare, 'INR')}`,
      upiId ? `⚡ Pay via UPI: ${upiId}` : '',
      `Split using KuberPay Finance Tracker`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generateShareMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecordMyShare = () => {
    onRecordExpense(
      perPersonShare,
      billTitle || 'Group Split Expense',
      `Split with ${friends.filter((f) => f.name !== 'Me (You)').map((f) => f.name).join(', ')} (Total: ₹${grandTotal.toFixed(0)})`
    );
    setRecorded(true);
    setTimeout(() => setRecorded(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Group Bill & Trip Splitter</h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              UPI Ready
            </span>
          </div>
          <p className="text-xs text-zinc-400 pt-0.5">
            Instantly divide restaurant bills, rent, groceries, or road trips and request payments via UPI.
          </p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-right">
          <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Each Person Pays</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {formatCurrency(perPersonShare, 'INR')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bill Configuration Form */}
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expense Details</h3>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Event / Bill Name</label>
            <input
              type="text"
              value={billTitle}
              onChange={(e) => setBillTitle(e.target.value)}
              placeholder="e.g. Dinner at Social, Goa Villa, Flat Groceries"
              className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Total Bill (₹)</label>
              <input
                type="number"
                step="any"
                value={totalBill}
                onChange={(e) => setTotalBill(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Tax / Tip / GST (%)</label>
              <input
                type="number"
                step="any"
                value={taxTipPercent}
                onChange={(e) => setTaxTipPercent(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">Your UPI ID (For friends to pay)</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okaxis"
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Friends List */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300">People Sharing ({friends.length})</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add friend's name..."
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFriend();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddFriend}
                className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {friends.map((f) => (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 font-medium"
                >
                  <span>{f.name}</span>
                  {f.name !== 'Me (You)' && (
                    <button
                      onClick={() => handleRemoveFriend(f.id)}
                      className="text-zinc-500 hover:text-rose-400 ml-0.5"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Output & Share Request Preview */}
        <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Payment Request Preview
            </h3>

            {/* Receipt Summary Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 font-mono text-xs space-y-2 text-zinc-300">
              <div className="flex justify-between text-zinc-400">
                <span>Base Bill</span>
                <span>{formatCurrency(billNum, 'INR')}</span>
              </div>
              {taxPct > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Taxes / Charges ({taxPct}%)</span>
                  <span>{formatCurrency((billNum * taxPct) / 100, 'INR')}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold pt-1 border-t border-zinc-800 text-sm">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal, 'INR')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-zinc-800 text-sm">
                <span>Per Person ({count} pax)</span>
                <span>{formatCurrency(perPersonShare, 'INR')}</span>
              </div>
            </div>

            {/* Formatted WhatsApp Share Text */}
            <div className="mt-4 p-3.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs text-zinc-300 space-y-1 font-mono">
              <div className="font-semibold text-emerald-400 mb-1">WhatsApp / SMS Preview:</div>
              <div className="text-zinc-400 whitespace-pre-line">{generateShareMessage()}</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyMessage}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Payment Request Message'}</span>
            </button>

            <button
              onClick={handleRecordMyShare}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              {recorded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
              <span>{recorded ? 'Recorded in Expense Tracker!' : 'Record My Share in Expense Ledger'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
