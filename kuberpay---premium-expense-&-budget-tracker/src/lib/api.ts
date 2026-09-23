import {
  Transaction,
  Category,
  Budget,
  RecurringItem,
  SavingsGoal,
  AnalyticsData,
  User,
  BudgetTrajectoryPrediction,
  SpendingTrendsData,
  MonthlySpendingTrend,
} from '../types';

const API_BASE = '/api';
const TOKEN_STORAGE_KEY = 'kuber_auth_token';

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in sandbox
  }
};

const getHeaders = (extraHeaders?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export interface HealthInfo {
  status: string;
  backend: string;
  database: string;
  timestamp: string;
}

export const api = {
  // Authentication
  async register(username: string, password: string, displayName?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, display_name: displayName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setAuthToken(data.token);
    return data;
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setAuthToken(data.token);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.authenticated ? data.user : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch {
      // Ignore network failures on logout
    } finally {
      setAuthToken(null);
    }
  },

  async getHealth(): Promise<HealthInfo> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'fallback',
        backend: 'Local Device Storage (Offline)',
        database: 'Browser SQLite Sync',
        timestamp: new Date().toISOString(),
      };
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      localStorage.setItem('kuber_categories', JSON.stringify(data));
      return data;
    } catch {
      const cached = localStorage.getItem('kuber_categories');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async getTransactions(params?: {
    search?: string;
    type?: string;
    category_id?: string;
    payment_method?: string;
    start_date?: string;
    end_date?: string;
    sort?: string;
  }): Promise<Transaction[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.search) qs.append('search', params.search);
      if (params?.type) qs.append('type', params.type);
      if (params?.category_id) qs.append('category_id', params.category_id);
      if (params?.payment_method) qs.append('payment_method', params.payment_method);
      if (params?.start_date) qs.append('start_date', params.start_date);
      if (params?.end_date) qs.append('end_date', params.end_date);
      if (params?.sort) qs.append('sort', params.sort);

      const res = await fetch(`${API_BASE}/transactions?${qs.toString()}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      localStorage.setItem('kuber_transactions_cache', JSON.stringify(data));
      return data;
    } catch {
      const cached = localStorage.getItem('kuber_transactions_cache');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async createTransaction(payload: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return await res.json();
  },

  async updateTransaction(id: string, payload: Partial<Transaction>): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },

  async getBudgets(month?: string): Promise<Budget[]> {
    try {
      const qs = month ? `?month=${month}` : '';
      const res = await fetch(`${API_BASE}/budgets${qs}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch budgets');
      return await res.json();
    } catch {
      return [];
    }
  },

  async upsertBudget(budget: { category_id: string; monthly_limit: number; month?: string; alert_threshold?: number }): Promise<void> {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(budget),
    });
    if (!res.ok) throw new Error('Failed to save budget');
  },

  async getRecurring(): Promise<RecurringItem[]> {
    try {
      const res = await fetch(`${API_BASE}/recurring`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch recurring items');
      return await res.json();
    } catch {
      return [];
    }
  },

  async createRecurring(item: Partial<RecurringItem>): Promise<RecurringItem> {
    const res = await fetch(`${API_BASE}/recurring`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to create recurring item');
    return await res.json();
  },

  async payRecurring(id: string): Promise<{ transaction_id: string; next_due_date: string }> {
    const res = await fetch(`${API_BASE}/recurring/${id}/pay`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to record recurring payment');
    return await res.json();
  },

  async deleteRecurring(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/recurring/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete recurring item');
  },

  async getGoals(): Promise<SavingsGoal[]> {
    try {
      const res = await fetch(`${API_BASE}/goals`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch savings goals');
      return await res.json();
    } catch {
      return [];
    }
  },

  async createGoal(goal: Partial<SavingsGoal>): Promise<{ id: string }> {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(goal),
    });
    if (!res.ok) throw new Error('Failed to create savings goal');
    return await res.json();
  },

  async updateGoalDeposit(id: string, amount: number, action: 'deposit' | 'withdraw'): Promise<void> {
    const res = await fetch(`${API_BASE}/goals/${id}/${action}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(`Failed to ${action} goal amount`);
  },

  async deleteGoal(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete goal');
  },

  async getAnalytics(month?: string): Promise<AnalyticsData> {
    const qs = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/analytics${qs}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return await res.json();
  },

  async getSpendingTrends(months: number = 6): Promise<SpendingTrendsData> {
    const res = await fetch(`${API_BASE}/analytics/spending-trends?months=${months}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch spending trends');
    return await res.json();
  },

  async depositGoal(id: string, amount: number): Promise<void> {
    return this.updateGoalDeposit(id, amount, 'deposit');
  },

  async exportJsonBackup(): Promise<any> {
    const res = await fetch(`${API_BASE}/export/json`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to export JSON backup');
    return await res.json();
  },

  async exportJson(): Promise<any> {
    return this.exportJsonBackup();
  },

  async importJsonBackup(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE}/import/json`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to import JSON backup');
  },

  async importJson(payload: any): Promise<void> {
    return this.importJsonBackup(payload);
  },

  async resetSampleData(): Promise<void> {
    const res = await fetch(`${API_BASE}/reset-sample-data`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset sample data');
  },

  async smartScanText(text: string): Promise<Partial<Transaction>> {
    const res = await fetch(`${API_BASE}/smart-scan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Failed to parse text');
    return await res.json();
  },

  async scanReceiptPhoto(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<ParsedReceiptData> {
    const res = await fetch(`${API_BASE}/receipt/scan-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ imageBase64, mimeType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to scan receipt image with Gemini');
    }
    const result = await res.json();
    return result.data;
  },

  async predictBudgetTrajectory(payload: {
    month: string;
    daysInMonth: number;
    currentDay: number;
    daysRemaining: number;
    totalBudgetLimit: number;
    totalSpentSoFar: number;
    categories: any[];
    recentTransactions: any[];
    upcomingBills: any[];
    currency?: string;
  }): Promise<BudgetTrajectoryPrediction> {
    const res = await fetch(`${API_BASE}/ai/budget-trajectory`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate budget trajectory prediction');
    }
    const result = await res.json();
    return result.data;
  },

  getCsvExportUrl(): string {
    const token = getAuthToken();
    return token ? `${API_BASE}/export/csv?token=${token}` : `${API_BASE}/export/csv`;
  },
};

export interface ParsedReceiptData {
  merchant?: string;
  amount?: number;
  date?: string;
  category_id?: string;
  payment_method?: string;
  currency?: string;
  items_summary?: string;
  confidence?: number;
  raw_text?: string;
}
