// Core data types for Spendly expense tracker

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string; // ISO string
  note?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  emoji: string;
}

export interface Budget {
  id: string;
  categoryId?: string; // If null, it's a total budget
  amount: number;
  period: 'weekly' | 'monthly';
  startDate: string; // ISO string
  isActive: boolean;
  createdAt: string; // ISO string
}

export interface BudgetProgress {
  budgetId: string;
  totalSpent: number;
  remainingAmount: number;
  percentage: number;
  isOverBudget: boolean;
  daysRemaining: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  categoryBreakdown: CategorySpending[];
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export interface CategorySpending {
  category: ExpenseCategory;
  totalAmount: number;
  percentage: number;
  expenseCount: number;
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'prediction' | 'achievement';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  generatedAt: string; // ISO string
}

// API Types for AI features
export interface AICategorizationRequest {
  description: string;
  amount: number;
}

export interface AICategorizationResponse {
  categoryId: string;
  confidence: number;
  reasoning?: string;
}

export interface AIInsightRequest {
  expenses: Expense[];
  budgets: Budget[];
  timeframe: 'week' | 'month';
}

// UI State Types
export interface AppState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  budgets: Budget[];
  currentBudgetProgress: BudgetProgress[];
  insights: AIInsight[];
  isLoading: boolean;
  lastSyncDate?: string;
}

// Form Types
export interface AddExpenseForm {
  amount: string;
  description: string;
  categoryId: string;
  note?: string;
  date: Date;
}

export interface AddBudgetForm {
  amount: string;
  period: 'weekly' | 'monthly';
  categoryId?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  amount: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export type Period = 'today' | 'week' | 'month' | 'year';
export type SortOrder = 'date' | 'amount' | 'category';