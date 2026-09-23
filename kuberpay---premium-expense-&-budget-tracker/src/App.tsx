/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Repeat,
  Target,
  BarChart3,
  Users,
  Settings,
  Plus,
  Wifi,
  Battery,
  Shield,
} from 'lucide-react';
import {
  ActiveTab,
  ViewMode,
  Transaction,
  Category,
  Budget,
  RecurringItem,
  SavingsGoal,
  AnalyticsData,
  TransactionType,
  User,
} from './types';
import { api, HealthInfo } from './lib/api';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetsTab } from './components/BudgetsTab';
import { RecurringTab } from './components/RecurringTab';
import { SavingsTab } from './components/SavingsTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { SplitterTab } from './components/SplitterTab';
import { SettingsTab } from './components/SettingsTab';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AuthModal } from './components/AuthModal';
import { MobileNavbar } from './components/MobileNavbar';
import {
  evaluateBudgetImpact,
  triggerDesktopBudgetNotification,
  BudgetAlertItem,
} from './lib/budgetEvaluator';
import { BudgetAlertToast } from './components/BudgetAlertToast';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('responsive');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });
  const [currency, setCurrency] = useState<string>('INR');

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Budget Alerts & Desktop Notification states
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlertItem[]>([]);
  const [desktopNotificationAllowed, setDesktopNotificationAllowed] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check initial authenticated user
  useEffect(() => {
    api.getMe().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadAllData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    await loadAllData();
  };

  // Fetch all applet data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [health, cats, txs, bdgts, recs, gls, anlytcs] = await Promise.all([
        api.getHealth(),
        api.getCategories(),
        api.getTransactions(),
        api.getBudgets(selectedMonth),
        api.getRecurring(),
        api.getGoals(),
        api.getAnalytics(selectedMonth),
      ]);

      setHealthInfo(health);
      setCategories(cats);
      setTransactions(txs);
      setBudgets(bdgts);
      setRecurring(recs);
      setGoals(gls);
      setAnalytics(anlytcs);
    } catch (err) {
      console.error('Error loading ledger data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Transaction Actions
  const handleOpenAddModal = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setModalInitialType(type);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalInitialType(tx.type);
    setIsAddModalOpen(true);
  };

  // Request native OS Desktop notification permissions
  const handleEnableDesktopNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setDesktopNotificationAllowed(perm === 'granted');
        if (perm === 'granted') {
          new Notification('KuberPay Budget Alerts Active', {
            body: 'Desktop notifications enabled. You will be alerted whenever a transaction pushes a category over budget.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.warn('Error requesting notification permission:', err);
      }
    }
  };

  // Trigger simulated test alert to easily demo and verify feature
  const handleTriggerTestAlert = () => {
    const diningCategory = categories.find((c) => c.id === 'food') || categories[0];
    const diningBudget = budgets.find((b) => b.category_id === 'food') || budgets[0];
    const limit = diningBudget?.monthly_limit || 5000;
    const currentSpent = diningBudget?.spent || 4200;
    const testAmount = 1450;
    const newSpent = currentSpent + testAmount;
    const exceededBy = newSpent - limit;

    const mockEvaluation = {
      hasBudget: true,
      categoryName: diningCategory?.name || 'Food & Dining',
      categoryIcon: diningCategory?.icon || 'utensils',
      categoryColor: diningCategory?.color || '#F97316',
      monthlyLimit: limit,
      currentSpent,
      transactionAmount: testAmount,
      newSpent,
      wasOverBudget: currentSpent > limit,
      isNowOverBudget: true,
      pushesOverBudget: true,
      furtherExceeds: false,
      exceededBy: Math.max(0, exceededBy),
      newPercentage: Math.round((newSpent / limit) * 100),
      isNearingThreshold: false,
      thresholdPercentage: 80,
      level: 'critical' as const,
      message: `⚠️ This transaction pushes ${diningCategory?.name || 'Food & Dining'} over its budget by ₹${Math.max(0, exceededBy).toLocaleString('en-IN')} (${Math.round((newSpent / limit) * 100)}% spent).`,
    };

    triggerDesktopBudgetNotification(mockEvaluation, 'Dinner at Social');

    const newAlert: BudgetAlertItem = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      evaluation: mockEvaluation,
      transactionTitle: 'Dinner at Social',
    };
    setBudgetAlerts((prev) => [newAlert, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setBudgetAlerts((prev) => prev.filter((a) => a.id !== newAlert.id));
    }, 9000);
  };

  const handleSaveTransaction = async (txData: Partial<Transaction>) => {
    // 1. Evaluate if this transaction pushes a category over its set budget
    const evalResult = evaluateBudgetImpact({
      transaction: txData,
      existingTransaction: editingTransaction,
      budgets,
      categories,
    });

    // 2. Persist transaction in backend
    if (txData.id) {
      await api.updateTransaction(txData.id, txData);
    } else {
      await api.createTransaction(txData);
    }
    await loadAllData();

    // 3. If it pushes the category over budget or further exceeds or nears threshold:
    if (evalResult.hasBudget && (evalResult.isNowOverBudget || evalResult.isNearingThreshold)) {
      // Trigger OS Desktop Notification
      triggerDesktopBudgetNotification(evalResult, txData.title);

      // Trigger High-Visibility UI Alert Toast
      const newAlert: BudgetAlertItem = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        evaluation: evalResult,
        transactionTitle: txData.title || 'Expense',
      };
      setBudgetAlerts((prev) => [newAlert, ...prev.slice(0, 3)]);

      // Auto-dismiss after 9 seconds if user doesn't dismiss
      setTimeout(() => {
        setBudgetAlerts((prev) => prev.filter((a) => a.id !== newAlert.id));
      }, 9000);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Delete this transaction from your device ledger?')) {
      await api.deleteTransaction(id);
      await loadAllData();
    }
  };

  // Budget Actions
  const handleSaveBudget = async (budget: { category_id: string; monthly_limit: number }) => {
    await api.upsertBudget({ ...budget, month: selectedMonth });
    const updated = await api.getBudgets(selectedMonth);
    setBudgets(updated);
  };

  // Recurring Actions
  const handlePayRecurring = async (id: string) => {
    await api.payRecurring(id);
    await loadAllData();
  };

  const handleCreateRecurring = async (item: Partial<RecurringItem>) => {
    await api.createRecurring(item);
    const updated = await api.getRecurring();
    setRecurring(updated);
  };

  const handleDeleteRecurring = async (id: string) => {
    if (window.confirm('Remove this recurring subscription?')) {
      await api.deleteRecurring(id);
      const updated = await api.getRecurring();
      setRecurring(updated);
    }
  };

  // Savings Goal Actions
  const handleCreateGoal = async (goal: Partial<SavingsGoal>) => {
    await api.createGoal(goal);
    const updated = await api.getGoals();
    setGoals(updated);
  };

  const handleDepositGoal = async (id: string, amount: number) => {
    await api.depositGoal(id, amount);
    await loadAllData();
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Remove this savings goal?')) {
      await api.deleteGoal(id);
      const updated = await api.getGoals();
      setGoals(updated);
    }
  };

  // Splitter Action: Record User's Share
  const handleRecordSplitShare = async (amount: number, title: string, note: string) => {
    await api.createTransaction({
      type: 'expense',
      amount,
      title,
      category_id: 'food',
      payment_method: 'UPI',
      date: new Date().toISOString().substring(0, 10),
      note,
      tags: ['#split', '#group'],
    });
    await loadAllData();
  };

  // Export Actions
  const handleExportCsv = () => {
    window.location.href = api.getCsvExportUrl();
  };

  const handleExportJson = async () => {
    const data = await api.exportJson();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kuberpay_backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (data: any) => {
    await api.importJson(data);
    await loadAllData();
  };

  const handleResetSampleData = async () => {
    await api.resetSampleData();
    await loadAllData();
  };

  // Nav Tabs configuration
  const navTabs: Array<{ id: ActiveTab; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: ReceiptText, count: transactions.length },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'recurring', label: 'Subscriptions', icon: Repeat, count: recurring.filter((r) => r.is_active).length },
    { id: 'savings', label: 'Savings Goals', icon: Target, count: goals.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'splitter', label: 'Split Bill', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Render Inner Application Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            selectedMonth={selectedMonth}
            currency={currency}
            analytics={analytics}
            transactions={transactions}
            recurring={recurring}
            budgets={budgets}
            goals={goals}
            onOpenAddModal={handleOpenAddModal}
            onSelectTab={setActiveTab}
            onPayRecurring={handlePayRecurring}
            onSelectTransaction={handleEditTransaction}
          />
        );
      case 'transactions':
        return (
          <TransactionsTab
            transactions={transactions}
            categories={categories}
            onOpenAddModal={() => handleOpenAddModal('expense')}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onExportCsv={handleExportCsv}
          />
        );
      case 'budgets':
        return (
          <BudgetsTab
            budgets={budgets}
            categories={categories}
            selectedMonth={selectedMonth}
            onSaveBudget={handleSaveBudget}
            desktopNotificationAllowed={desktopNotificationAllowed}
            onEnableDesktopNotifications={handleEnableDesktopNotifications}
            onTriggerTestAlert={handleTriggerTestAlert}
          />
        );
      case 'recurring':
        return (
          <RecurringTab
            recurring={recurring}
            categories={categories}
            onPayRecurring={handlePayRecurring}
            onCreateRecurring={handleCreateRecurring}
            onDeleteRecurring={handleDeleteRecurring}
          />
        );
      case 'savings':
        return (
          <SavingsTab
            goals={goals}
            onCreateGoal={handleCreateGoal}
            onDepositGoal={handleDepositGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'analytics':
        return (
          <AnalyticsTab
            analytics={analytics}
            transactions={transactions}
            selectedMonth={selectedMonth}
            currency={currency}
          />
        );
      case 'splitter':
        return <SplitterTab onRecordExpense={handleRecordSplitShare} />;
      case 'settings':
        return (
          <SettingsTab
            healthInfo={healthInfo}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onResetSampleData={handleResetSampleData}
            currency={currency}
            setCurrency={setCurrency}
            currentUser={currentUser}
            onOpenAuthModal={handleOpenAuthModal}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  const appContent = (
    <div className="min-h-screen bg-[#080B10] text-[#E6EDF3] flex flex-col pb-20 md:pb-10">
      {/* Top Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        onOpenAddModal={() => handleOpenAddModal('expense')}
        healthInfo={healthInfo}
        onRefresh={loadAllData}
        isLoading={isLoading}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {/* Navigation Tabs Bar for Desktop and Tablet */}
        <div className="hidden md:flex items-center gap-1.5 pb-5 border-b border-zinc-800/80 mb-6 overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/60'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isActive ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-800 text-zinc-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab View Body */}
        {renderTabContent()}
      </main>

      {/* Mobile Native-Feel Bottom Navigation */}
      <MobileNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal('expense')}
      />

      {/* Over-Budget Alert Toast Stack */}
      <BudgetAlertToast
        alerts={budgetAlerts}
        onDismiss={(id) => setBudgetAlerts((prev) => prev.filter((a) => a.id !== id))}
        onOpenBudgets={() => setActiveTab('budgets')}
        onEnableDesktopNotifications={handleEnableDesktopNotifications}
        desktopNotificationAllowed={desktopNotificationAllowed}
      />

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        budgets={budgets}
        initialType={modalInitialType}
        editingTransaction={editingTransaction}
        onSave={handleSaveTransaction}
      />

      {/* User Login / Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authInitialMode}
      />
    </div>
  );

  // If iOS Simulator Mode is chosen
  if (viewMode === 'mobile_ios') {
    return (
      <div className="min-h-screen bg-[#05070A] p-4 sm:p-8 flex flex-col items-center justify-center">
        {/* Switch back banner */}
        <div className="mb-4 flex items-center gap-3 text-xs text-zinc-400">
          <span>iPhone 16 Pro Viewport (393 × 852)</span>
          <button
            onClick={() => setViewMode('responsive')}
            className="text-emerald-400 hover:underline font-semibold"
          >
            ← Switch to Full Web Dashboard
          </button>
        </div>

        {/* iPhone Frame */}
        <div className="relative w-[393px] h-[844px] bg-[#080B10] rounded-[52px] ring-[12px] ring-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border border-zinc-700/50">
          {/* iOS Status Bar */}
          <div className="h-11 px-7 flex items-center justify-between text-white text-xs z-50 bg-[#0A0E17]/90 backdrop-blur select-none">
            <span className="font-semibold text-xs tracking-tight">9:41</span>
            {/* Dynamic Island */}
            <div className="w-28 h-6 bg-black rounded-full flex items-center justify-center -mt-1 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500/80 mr-2 animate-pulse"></div>
              <span className="text-[9px] font-mono text-zinc-400">KuberPay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-white" />
              <Battery className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* App Screen scroll container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {appContent}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-5 bg-[#090D14] flex items-center justify-center shrink-0 z-50">
            <div className="w-32 h-1 bg-zinc-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // If Android Simulator Mode is chosen
  if (viewMode === 'mobile_android') {
    return (
      <div className="min-h-screen bg-[#05070A] p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="mb-4 flex items-center gap-3 text-xs text-zinc-400">
          <span>Android Pixel Viewport (412 × 915)</span>
          <button
            onClick={() => setViewMode('responsive')}
            className="text-cyan-400 hover:underline font-semibold"
          >
            ← Switch to Full Web Dashboard
          </button>
        </div>

        {/* Pixel Frame */}
        <div className="relative w-[412px] h-[860px] bg-[#080B10] rounded-[44px] ring-[10px] ring-zinc-800 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col border border-zinc-700/50">
          {/* Android Status Bar with Camera Hole */}
          <div className="h-9 px-6 flex items-center justify-between text-white text-xs z-50 bg-[#0A0E17]/90 backdrop-blur select-none">
            <span className="font-medium text-xs font-mono">10:30</span>
            <div className="w-3 h-3 rounded-full bg-black ring-1 ring-zinc-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400">5G</span>
              <Battery className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {appContent}
          </div>

          <div className="h-4 bg-[#090D14] flex items-center justify-center shrink-0 z-50">
            <div className="w-20 h-1 bg-zinc-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default Responsive Full Web & Mobile Layout
  return appContent;
}
