import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  PieChart,
  Repeat,
  Target,
  SlidersHorizontal,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileNavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090D14]/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] transition-colors ${
            activeTab === 'overview' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] transition-colors ${
            activeTab === 'transactions' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span className="text-[10px] font-medium">Ledger</span>
        </button>

        {/* Center Quick Add Floating Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 border-2 border-[#090D14] active:scale-90 transition-transform"
          aria-label="Add Transaction"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] transition-colors ${
            activeTab === 'budgets' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="text-[10px] font-medium">Budgets</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-1.5 min-w-[50px] transition-colors ${
            activeTab === 'analytics' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[10px] font-medium">Stats</span>
        </button>
      </div>
    </div>
  );
};
