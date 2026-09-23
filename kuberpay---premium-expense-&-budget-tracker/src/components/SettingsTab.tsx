import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  RefreshCcw,
  Shield,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Server,
  HardDrive,
  Info,
  User as UserIcon,
  LogOut,
  UserPlus,
  Lock,
} from 'lucide-react';
import { HealthInfo } from '../lib/api';
import { User } from '../types';

interface SettingsTabProps {
  healthInfo: HealthInfo | null;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (data: any) => Promise<void>;
  onResetSampleData: () => Promise<void>;
  currency: string;
  setCurrency: (c: string) => void;
  currentUser: User | null;
  onOpenAuthModal: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  healthInfo,
  onExportCsv,
  onExportJson,
  onImportJson,
  onResetSampleData,
  currency,
  setCurrency,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Importing backup...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          await onImportJson(json);
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3000);
        } catch (err) {
          setImportStatus('Invalid JSON backup file.');
          setTimeout(() => setImportStatus(null), 4000);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setImportStatus('Failed to read file.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the database with fresh sample INR data?')) {
      setIsResetting(true);
      try {
        await onResetSampleData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 sm:p-6">
        <h2 className="text-base font-bold text-white">App Settings & Local Storage</h2>
        <p className="text-xs text-zinc-400 pt-0.5">
          Local device storage configuration, backup & restore, and Python SQLite diagnostics.
        </p>
      </div>

      {/* User Account & Security */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">User Account & Authentication</h3>
          </div>
          {currentUser ? (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Authenticated
            </span>
          ) : (
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Guest Mode
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="p-4 bg-zinc-900/70 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-black flex items-center justify-center font-bold text-base shadow-md shadow-emerald-500/20">
                {currentUser.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentUser.display_name}</span>
                  <span className="text-xs font-normal font-mono text-emerald-400">@{currentUser.username}</span>
                </h4>
                <p className="text-xs text-zinc-400 pt-0.5">
                  Private local ledger attached to User ID: <span className="font-mono text-[11px] text-zinc-500">{currentUser.id}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Switch Account</span>
              </button>
              <button
                onClick={onLogout}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-900/70 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Guest Session</h4>
              <p className="text-xs text-zinc-400 pt-0.5">
                Sign in or register a username to manage isolated budgets, custom transactions, and personalized settings.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('register')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backend & Architecture Status */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Backend Architecture</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Execution Engine</span>
            <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {healthInfo?.backend || 'Python 3.10 + SQLite'}
            </span>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Storage Engine</span>
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              SQLite (Local Device)
            </span>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-semibold block">Account Privacy</span>
            <span className="text-xs font-bold text-zinc-300 font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              PBKDF2 SHA-256 Auth
            </span>
          </div>
        </div>
      </div>

      {/* Backup & Export Data */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Backup, Export & Restore
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-white text-xs font-bold mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Transactions to CSV</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Download a clean spreadsheet of all your ledger transactions, categories, and payment modes.
              </p>
            </div>
            <button
              onClick={onExportCsv}
              className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV File</span>
            </button>
          </div>

          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-white text-xs font-bold mb-1">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Full JSON Backup</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Export all transactions, monthly budgets, subscriptions, and savings goals into a JSON file.
              </p>
            </div>
            <button
              onClick={onExportJson}
              className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-white block">Restore from Backup</span>
            <span className="text-[11px] text-zinc-400">Upload a previously exported KuberPay JSON file.</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload JSON File</span>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}
      </div>

      {/* Currency Preference */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Currency & Formatting</h3>
        <p className="text-xs text-zinc-400">Default currency is Indian Rupee (₹ INR) with Lakhs & Crores formatting.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {[
            { code: 'INR', label: 'INR (₹) - Rupee', flag: '🇮🇳' },
            { code: 'USD', label: 'USD ($) - Dollar', flag: '🇺🇸' },
            { code: 'EUR', label: 'EUR (€) - Euro', flag: '🇪🇺' },
            { code: 'GBP', label: 'GBP (£) - Pound', flag: '🇬🇧' },
          ].map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                currency === c.code
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="text-base mr-1.5">{c.flag}</span>
              <span className="text-xs font-bold">{c.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset to Sample INR Data */}
      <div className="bg-[#0E131C] border border-zinc-800/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Reset Sample Ledger</h3>
            <p className="text-xs text-zinc-400 pt-0.5">
              Reload initial realistic Indian transactions (Salary, Rent, SIP, Swiggy, Blinkit, Cult.fit).
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset to Sample Data'}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Sample data loaded successfully. Check your Overview and Ledger!</span>
          </div>
        )}
      </div>
    </div>
  );
};
