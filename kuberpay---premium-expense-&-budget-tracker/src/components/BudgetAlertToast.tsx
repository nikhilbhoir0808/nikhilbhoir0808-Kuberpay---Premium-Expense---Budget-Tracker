import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Flame,
  X,
  ChevronRight,
  Bell,
  Check,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import { BudgetAlertItem } from '../lib/budgetEvaluator';
import { formatCurrency } from '../lib/formatters';

interface BudgetAlertToastProps {
  alerts: BudgetAlertItem[];
  onDismiss: (id: string) => void;
  onOpenBudgets: () => void;
  onEnableDesktopNotifications: () => Promise<void>;
  desktopNotificationAllowed: boolean;
}

export const BudgetAlertToast: React.FC<BudgetAlertToastProps> = ({
  alerts,
  onDismiss,
  onOpenBudgets,
  onEnableDesktopNotifications,
  desktopNotificationAllowed,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-16 sm:top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2.5 pointer-events-none">
      {alerts.map((item) => {
        const { evaluation, transactionTitle } = item;
        const isCritical = evaluation.level === 'critical';

        return (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-top-4 ${
              isCritical
                ? 'bg-[#180A0D]/95 border-rose-500/50 shadow-rose-950/40 text-white ring-1 ring-rose-500/30'
                : 'bg-[#191407]/95 border-amber-500/50 shadow-amber-950/40 text-white ring-1 ring-amber-500/30'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2.5 mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {isCritical ? (
                    <Flame className="w-4 h-4 animate-bounce" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-tight">
                    {isCritical
                      ? evaluation.pushesOverBudget
                        ? '🚨 Budget Limit Exceeded!'
                        : '🚨 Budget Over-Limit Warning'
                      : '⚠️ Budget Threshold Warning (≥80%)'}
                  </h4>
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    {evaluation.categoryName} · {evaluation.newPercentage}% spent
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDismiss(item.id)}
                className="text-zinc-500 hover:text-white p-1 rounded-md transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content description */}
            <p className="text-xs text-zinc-300 leading-relaxed pl-9">
              {evaluation.message}
            </p>

            {/* Metrics pills */}
            <div className="mt-3 pl-9 flex items-center gap-2 text-[11px] font-mono">
              <div className="bg-black/40 px-2 py-1 rounded-md border border-white/10">
                <span className="text-zinc-400 text-[10px] block">New Spent</span>
                <span className={isCritical ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                  {formatCurrency(evaluation.newSpent, 'INR')}
                </span>
              </div>
              <div className="bg-black/40 px-2 py-1 rounded-md border border-white/10">
                <span className="text-zinc-400 text-[10px] block">Budget Limit</span>
                <span className="text-white font-bold">
                  {formatCurrency(evaluation.monthlyLimit, 'INR')}
                </span>
              </div>
              {evaluation.exceededBy > 0 && (
                <div className="bg-rose-500/20 px-2 py-1 rounded-md border border-rose-500/40 text-rose-300">
                  <span className="text-rose-300 text-[10px] block">Over by</span>
                  <span className="font-bold">+{formatCurrency(evaluation.exceededBy, 'INR')}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2 pl-9">
              {!desktopNotificationAllowed && (
                <button
                  onClick={onEnableDesktopNotifications}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                  title="Enable OS Desktop Notifications"
                >
                  <Bell className="w-3 h-3 text-emerald-400" />
                  <span>Desktop alerts</span>
                </button>
              )}

              <button
                onClick={() => {
                  onDismiss(item.id);
                  onOpenBudgets();
                }}
                className={`ml-auto px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${
                  isCritical
                    ? 'bg-rose-500 hover:bg-rose-400 text-black'
                    : 'bg-amber-400 hover:bg-amber-300 text-black'
                }`}
              >
                <span>Adjust Budget</span>
                <ChevronRight className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
