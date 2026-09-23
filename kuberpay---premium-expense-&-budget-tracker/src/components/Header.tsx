import React, { useState, useRef, useEffect } from 'react';
import {
  Smartphone,
  Monitor,
  Plus,
  Calendar,
  RefreshCw,
  Wallet,
  User as UserIcon,
  LogOut,
  ChevronDown,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { ViewMode, User } from '../types';
import { HealthInfo } from '../lib/api';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onOpenAddModal: () => void;
  healthInfo: HealthInfo | null;
  onRefresh: () => void;
  isLoading: boolean;
  currentUser: User | null;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  selectedMonth,
  setSelectedMonth,
  onOpenAddModal,
  onRefresh,
  isLoading,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format month label (e.g. "Sep 2026")
  const [yearStr, monthStr] = selectedMonth.split('-');
  const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
  const monthLabel = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  const handlePrevMonth = () => {
    const prev = new Date(parseInt(yearStr), parseInt(monthStr) - 2, 1);
    setSelectedMonth(prev.toISOString().substring(0, 7));
  };

  const handleNextMonth = () => {
    const next = new Date(parseInt(yearStr), parseInt(monthStr), 1);
    setSelectedMonth(next.toISOString().substring(0, 7));
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.toISOString().substring(0, 7));
  };

  return (
    <header className="border-b border-zinc-800/80 bg-[#0A0E17]/95 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
              <Wallet className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  KuberPay
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                    ₹ INR
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Python 3 + SQLite
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>Local Storage</span>
              </div>
            </div>
          </div>

          {/* User Account / Auth (Mobile Only) & Quick Add */}
          <div className="flex md:hidden items-center gap-2">
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  {currentUser.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[70px] truncate font-medium">@{currentUser.username}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

            <button
              onClick={onOpenAddModal}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-md active:scale-95 transition-all"
              aria-label="Add Transaction"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Center: Month Navigator & Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-center">
          {/* Month Switcher */}
          <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={handlePrevMonth}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors font-medium"
              title="Previous Month"
            >
              ←
            </button>
            <div className="px-3 py-1 font-semibold text-zinc-200 min-w-[90px] text-center flex items-center justify-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {monthLabel}
            </div>
            <button
              onClick={handleNextMonth}
              className="px-2.5 py-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-colors font-medium"
              title="Next Month"
            >
              →
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-2 py-1 text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 rounded-md transition-colors font-medium ml-1 border-l border-zinc-800"
            >
              Today
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
            title="Sync Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Device View Switcher, User Profile & Action Button */}
        <div className="hidden md:flex items-center gap-3">
          {/* Device Frame Switcher */}
          <div className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('responsive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors font-medium ${
                viewMode === 'responsive'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Full Width Web View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Web</span>
            </button>
            <button
              onClick={() => setViewMode('mobile_ios')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors font-medium ${
                viewMode === 'mobile_ios'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="iPhone 16 Mobile Preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS Frame</span>
            </button>
            <button
              onClick={() => setViewMode('mobile_android')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors font-medium ${
                viewMode === 'mobile_android'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Android Pixel Preview"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Frame</span>
            </button>
          </div>

          {/* User Account / Auth Dropdown */}
          <div className="relative" ref={userMenuRef}>
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-xs text-white transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center font-bold text-[11px] shadow-sm">
                  {currentUser.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left flex flex-col leading-none">
                  <span className="font-semibold text-zinc-200 group-hover:text-white max-w-[90px] truncate">
                    {currentUser.display_name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 truncate">
                    @{currentUser.username}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Dropdown Menu */}
            {isUserMenuOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0E131F] border border-zinc-800 rounded-2xl shadow-xl shadow-black/60 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{currentUser.display_name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    @{currentUser.username}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Local Device Storage
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuthModal('login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors text-left"
                >
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                  <span>Switch User Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuthModal('register');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors text-left"
                >
                  <UserPlus className="w-4 h-4 text-zinc-400" />
                  <span>Register New User</span>
                </button>

                <div className="my-1 border-t border-zinc-800/80" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Transaction Primary CTA */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
