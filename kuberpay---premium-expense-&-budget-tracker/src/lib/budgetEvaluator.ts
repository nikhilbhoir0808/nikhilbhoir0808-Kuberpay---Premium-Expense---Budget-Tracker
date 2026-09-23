import { Budget, Category, Transaction, TransactionType } from '../types';
import { formatCurrency } from './formatters';

export interface BudgetEvaluationResult {
  hasBudget: boolean;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  monthlyLimit: number;
  currentSpent: number;
  transactionAmount: number;
  newSpent: number;
  wasOverBudget: boolean;
  isNowOverBudget: boolean;
  pushesOverBudget: boolean; // True specifically if this transaction tipped it from under to over
  furtherExceeds: boolean; // True if already over, and this added more
  exceededBy: number;
  newPercentage: number;
  isNearingThreshold: boolean; // e.g. >= 80% but <= 100%
  thresholdPercentage: number;
  level: 'critical' | 'warning' | 'safe';
  message: string;
}

export interface BudgetAlertItem {
  id: string;
  timestamp: string;
  evaluation: BudgetEvaluationResult;
  transactionTitle: string;
}

/**
 * Evaluates whether an incoming or proposed transaction will push a category over budget.
 */
export function evaluateBudgetImpact({
  transaction,
  existingTransaction,
  budgets,
  categories,
}: {
  transaction: {
    type?: TransactionType;
    category_id?: string;
    amount?: number;
    title?: string;
  };
  existingTransaction?: Transaction | null;
  budgets: Budget[];
  categories: Category[];
}): BudgetEvaluationResult {
  const isExpense = (transaction.type || 'expense') === 'expense';
  const categoryId = transaction.category_id || 'food';
  const amount = Math.max(0, Number(transaction.amount) || 0);

  const category = categories.find((c) => c.id === categoryId);
  const categoryName = category?.name || 'Category';
  const categoryIcon = category?.icon;
  const categoryColor = category?.color;

  const budget = budgets.find((b) => b.category_id === categoryId);

  // If not an expense or category has no budget set or limit <= 0
  if (!isExpense || !budget || !budget.monthly_limit || budget.monthly_limit <= 0) {
    return {
      hasBudget: false,
      categoryName,
      categoryIcon,
      categoryColor,
      monthlyLimit: 0,
      currentSpent: budget?.spent || 0,
      transactionAmount: amount,
      newSpent: (budget?.spent || 0) + (isExpense ? amount : 0),
      wasOverBudget: false,
      isNowOverBudget: false,
      pushesOverBudget: false,
      furtherExceeds: false,
      exceededBy: 0,
      newPercentage: 0,
      isNearingThreshold: false,
      thresholdPercentage: 80,
      level: 'safe',
      message: 'No budget set for this category',
    };
  }

  const limit = budget.monthly_limit;
  let currentSpent = budget.spent || 0;

  // If editing an existing transaction in the same category, offset its previous amount
  if (existingTransaction && existingTransaction.category_id === categoryId && existingTransaction.type === 'expense') {
    currentSpent = Math.max(0, currentSpent - existingTransaction.amount);
  }

  const newSpent = currentSpent + amount;
  const wasOverBudget = currentSpent > limit;
  const isNowOverBudget = newSpent > limit;
  const pushesOverBudget = !wasOverBudget && isNowOverBudget;
  const furtherExceeds = wasOverBudget && isNowOverBudget;
  const exceededBy = Math.max(0, newSpent - limit);
  const newPercentage = Math.round((newSpent / limit) * 100);

  const threshold = budget.alert_threshold || 0.8;
  const thresholdPercentage = Math.round(threshold * 100);
  const isNearingThreshold = !isNowOverBudget && (newSpent / limit) >= threshold;

  let level: 'critical' | 'warning' | 'safe' = 'safe';
  let message = `Budget safe (${newPercentage}% used)`;

  if (pushesOverBudget) {
    level = 'critical';
    message = `⚠️ This transaction pushes ${categoryName} over its budget by ${formatCurrency(exceededBy, 'INR')} (${newPercentage}% spent).`;
  } else if (furtherExceeds) {
    level = 'critical';
    message = `🚨 ${categoryName} is already over budget! This adds ${formatCurrency(amount, 'INR')}, total overage: ${formatCurrency(exceededBy, 'INR')} (${newPercentage}%).`;
  } else if (isNearingThreshold) {
    level = 'warning';
    message = `⚡ Heads up: This transaction brings ${categoryName} to ${newPercentage}% of monthly budget limit.`;
  }

  return {
    hasBudget: true,
    categoryName,
    categoryIcon,
    categoryColor,
    monthlyLimit: limit,
    currentSpent,
    transactionAmount: amount,
    newSpent,
    wasOverBudget,
    isNowOverBudget,
    pushesOverBudget,
    furtherExceeds,
    exceededBy,
    newPercentage,
    isNearingThreshold,
    thresholdPercentage,
    level,
    message,
  };
}

/**
 * Triggers a Desktop notification and sound/haptic if permitted
 */
export async function triggerDesktopBudgetNotification(evaluation: BudgetEvaluationResult, txTitle?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      const title = evaluation.isNowOverBudget
        ? `🚨 Budget Exceeded: ${evaluation.categoryName}`
        : `⚠️ Budget Warning: ${evaluation.categoryName} (${evaluation.newPercentage}%)`;

      const body = evaluation.isNowOverBudget
        ? `Transaction "${txTitle || 'Expense'}" of ${formatCurrency(evaluation.transactionAmount, 'INR')} pushes ${evaluation.categoryName} over budget by ${formatCurrency(evaluation.exceededBy, 'INR')}. New spent: ${formatCurrency(evaluation.newSpent, 'INR')} / ${formatCurrency(evaluation.monthlyLimit, 'INR')}.`
        : `Transaction "${txTitle || 'Expense'}" brings ${evaluation.categoryName} to ${evaluation.newPercentage}% of its ${formatCurrency(evaluation.monthlyLimit, 'INR')} limit.`;

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: `budget-alert-${evaluation.categoryName.toLowerCase().replace(/\s+/g, '-')}`,
      });
      return true;
    }
  } catch (err) {
    console.warn('Desktop notification failed:', err);
  }
  return false;
}
