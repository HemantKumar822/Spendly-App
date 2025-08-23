import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { Expense, ExpenseSummary, CategorySpending, BudgetProgress, Budget, Period } from '../types';
import { DEFAULT_CATEGORIES } from '../types/categories';

// Date utility functions
export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Debounce utility function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Period calculation functions
export function getPeriodDates(period: Period, date: Date = new Date()) {
  const today = new Date(date);
  
  switch (period) {
    case 'today':
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      return { start: startOfDay, end: endOfDay };
    
    case 'week':
      return { 
        start: startOfWeek(today, { weekStartsOn: 1 }), // Monday start
        end: endOfWeek(today, { weekStartsOn: 1 })
      };
    
    case 'month':
      return {
        start: startOfMonth(today),
        end: endOfMonth(today)
      };
    
    default:
      return { start: today, end: today };
  }
}

// Expense filtering and calculation
export function filterExpensesByPeriod(expenses: Expense[], period: Period, date?: Date): Expense[] {
  const { start, end } = getPeriodDates(period, date);
  
  return expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    return isWithinInterval(expenseDate, { start, end });
  });
}

export function calculateTotalAmount(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function calculateCategoryBreakdown(expenses: Expense[]): CategorySpending[] {
  const totalAmount = calculateTotalAmount(expenses);
  const categoryMap = new Map<string, { total: number; count: number }>();

  // Group expenses by category
  expenses.forEach(expense => {
    const categoryId = expense.category.id;
    const current = categoryMap.get(categoryId) || { total: 0, count: 0 };
    categoryMap.set(categoryId, {
      total: current.total + expense.amount,
      count: current.count + 1
    });
  });

  // Convert to CategorySpending array
  const categorySpending: CategorySpending[] = [];
  categoryMap.forEach((data, categoryId) => {
    const category = DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
    if (category) {
      categorySpending.push({
        category,
        totalAmount: data.total,
        percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
        expenseCount: data.count
      });
    }
  });

  return categorySpending.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function generateExpenseSummary(expenses: Expense[], period: Period): ExpenseSummary {
  const filteredExpenses = filterExpensesByPeriod(expenses, period);
  const { start, end } = getPeriodDates(period);

  return {
    totalAmount: calculateTotalAmount(filteredExpenses),
    categoryBreakdown: calculateCategoryBreakdown(filteredExpenses),
    period: period === 'today' ? 'daily' : period === 'week' ? 'weekly' : 'monthly',
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}

// Budget calculations
export function calculateBudgetProgress(budget: Budget, expenses: Expense[]): BudgetProgress {
  const budgetStart = parseISO(budget.startDate);
  const now = new Date();
  
  // Calculate period end based on budget period
  let periodEnd: Date;
  if (budget.period === 'weekly') {
    periodEnd = new Date(budgetStart);
    periodEnd.setDate(periodEnd.getDate() + 7);
  } else {
    periodEnd = new Date(budgetStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Filter expenses for this budget period and category
  const relevantExpenses = expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    const isInPeriod = isWithinInterval(expenseDate, { start: budgetStart, end: periodEnd });
    const isRightCategory = !budget.categoryId || expense.category.id === budget.categoryId;
    return isInPeriod && isRightCategory;
  });

  const totalSpent = calculateTotalAmount(relevantExpenses);
  const remainingAmount = budget.amount - totalSpent;
  const percentage = (totalSpent / budget.amount) * 100;
  const daysRemaining = differenceInDays(periodEnd, now);

  return {
    budgetId: budget.id,
    totalSpent,
    remainingAmount,
    percentage: Math.min(percentage, 100),
    isOverBudget: totalSpent > budget.amount,
    daysRemaining: Math.max(0, daysRemaining)
  };
}

// Data validation
export function validateExpenseAmount(amount: string): { isValid: boolean; error?: string } {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount too large' };
  }
  
  return { isValid: true };
}

export function validateExpenseDescription(description: string): { isValid: boolean; error?: string } {
  if (!description.trim()) {
    return { isValid: false, error: 'Description is required' };
  }
  
  if (description.trim().length > 100) {
    return { isValid: false, error: 'Description too long (max 100 characters)' };
  }
  
  return { isValid: true };
}

// Chart data helpers
export function prepareChartData(expenses: Expense[], period: Period) {
  const { start, end } = getPeriodDates(period);
  const filteredExpenses = filterExpensesByPeriod(expenses, period);
  
  // Group expenses by date
  const dateMap = new Map<string, number>();
  
  filteredExpenses.forEach(expense => {
    const date = formatDateShort(expense.date);
    const current = dateMap.get(date) || 0;
    dateMap.set(date, current + expense.amount);
  });

  return Array.from(dateMap.entries()).map(([date, amount]) => ({
    date,
    amount,
    label: formatCurrency(amount)
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function preparePieChartData(categoryBreakdown: CategorySpending[]) {
  return categoryBreakdown.map(item => ({
    name: item.category.name,
    value: item.totalAmount,
    color: item.category.color
  }));
}