export type TransactionType = 'expense' | 'income' | 'transfer';

export type PaymentMethod = 'UPI' | 'Cash' | 'Credit Card' | 'Debit Card' | 'Net Banking';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  title: string;
  note: string;
  date: string;
  payment_method: PaymentMethod;
  tags: string[];
  receipt_url?: string;
  account: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface Budget {
  id: string;
  category_id: string;
  name?: string;
  icon?: string;
  color?: string;
  monthly_limit: number;
  month: string;
  alert_threshold: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  payment_method: PaymentMethod;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  is_active: number | boolean;
  auto_pay: number | boolean;
  note: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  icon: string;
  color: string;
  progress_percentage?: number;
  created_at?: string;
}

export interface CategoryBreakdown {
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface PaymentBreakdown {
  payment_method: string;
  total_amount: number;
  count: number;
}

export interface DailyTrend {
  date: string;
  expense: number;
  income: number;
}

export interface AnalyticsData {
  month: string;
  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate: number;
  category_breakdown: CategoryBreakdown[];
  payment_breakdown: PaymentBreakdown[];
  daily_trend: DailyTrend[];
  all_time_balance: number;
  total_transactions: number;
}

export type ViewMode = 'responsive' | 'mobile_ios' | 'mobile_android' | 'desktop';

export type ActiveTab = 'overview' | 'transactions' | 'budgets' | 'recurring' | 'savings' | 'analytics' | 'splitter' | 'settings';

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar?: string;
  currency?: string;
  created_at?: string;
}

export interface AuthResponse {
  status: string;
  token?: string;
  user?: User;
  error?: string;
}

export interface CategoryRisk {
  category_name: string;
  monthly_limit: number;
  spent: number;
  projected_spend: number;
  will_exceed: boolean;
  overrun_amount: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface BudgetTrajectoryPrediction {
  will_exceed_budget: boolean;
  status: 'on_track' | 'caution' | 'critical_overrun' | 'under_budget';
  headline: string;
  projected_total_spend: number;
  predicted_variance: number;
  confidence_score: number;
  current_daily_burn: number;
  recommended_daily_limit: number;
  days_remaining: number;
  spending_velocity_analysis: string;
  pattern_insights: string[];
  actionable_recommendations: string[];
  category_risks: CategoryRisk[];
  analyzed_at?: string;
}

export interface MonthlySpendingTrend {
  month: string;
  label: string;
  short_label: string;
  expense: number;
  income: number;
  net_savings: number;
  savings_rate: number;
  budget_limit: number;
  tx_count: number;
  mom_change: number;
  mom_percentage: number;
}

export interface SpendingTrendsData {
  trends: MonthlySpendingTrend[];
  average_monthly_expense: number;
  total_period_expense: number;
  highest_month: {
    month: string;
    label: string;
    amount: number;
  };
  lowest_month: {
    month: string;
    label: string;
    amount: number;
  };
  overall_trend: 'increasing' | 'decreasing' | 'stable';
  latest_mom_percentage: number;
}
