import { generateExpenseSummary } from '../utils';
import { Expense } from '../types';

// Mock expenses for testing
const mockExpenses: Expense[] = [
  {
    id: '1',
    amount: 100,
    description: 'Coffee',
    category: {
      id: 'food',
      name: 'Food & Dining',
      icon: 'restaurant',
      color: '#FF6B6B',
      emoji: '☕'
    },
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    amount: 50,
    description: 'Groceries',
    category: {
      id: 'food',
      name: 'Food & Dining',
      icon: 'restaurant',
      color: '#FF6B6B',
      emoji: '🛒'
    },
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('Dashboard Summary Calculations', () => {
  test('generates correct today summary', () => {
    const todayExpenses = mockExpenses.filter(expense => 
      new Date(expense.date).toDateString() === new Date().toDateString()
    );
    const todaySummary = generateExpenseSummary(todayExpenses, 'today');
    
    expect(todaySummary.totalAmount).toBe(100);
    expect(todaySummary.period).toBe('daily');
  });

  test('generates correct week summary', () => {
    const weekSummary = generateExpenseSummary(mockExpenses, 'week');
    
    // Should include both expenses since they're within the week
    expect(weekSummary.totalAmount).toBe(150);
    expect(weekSummary.period).toBe('weekly');
    expect(weekSummary.startDate).toBeDefined();
    expect(weekSummary.endDate).toBeDefined();
  });

  test('calculates correct average per day', () => {
    const weekSummary = generateExpenseSummary(mockExpenses, 'week');
    
    // Calculate the number of days in the week period
    const startDate = new Date(weekSummary.startDate);
    const endDate = new Date(weekSummary.endDate);
    const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    const avgPerDay = weekSummary.totalAmount / daysInPeriod;
    
    // Verify that the calculation is working
    expect(avgPerDay).toBeGreaterThan(0);
  });
});