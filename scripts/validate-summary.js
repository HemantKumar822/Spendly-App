const { generateExpenseSummary } = require('../utils');

// Mock expenses for testing
const mockExpenses = [
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

console.log('Testing dashboard summary calculations...\n');

// Test today summary
const todayExpenses = mockExpenses.filter(expense => 
  new Date(expense.date).toDateString() === new Date().toDateString()
);
const todaySummary = generateExpenseSummary(todayExpenses, 'today');

console.log('Today Summary:');
console.log('- Total Amount:', todaySummary.totalAmount);
console.log('- Period:', todaySummary.period);
console.log('- Expenses Count:', todayExpenses.length);
console.log('');

// Test week summary
const weekSummary = generateExpenseSummary(mockExpenses, 'week');

console.log('Week Summary:');
console.log('- Total Amount:', weekSummary.totalAmount);
console.log('- Period:', weekSummary.period);
console.log('- Start Date:', weekSummary.startDate);
console.log('- End Date:', weekSummary.endDate);

// Calculate the number of days in the week period
const startDate = new Date(weekSummary.startDate);
const endDate = new Date(weekSummary.endDate);
const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
const avgPerDay = weekSummary.totalAmount / daysInPeriod;

console.log('- Days in Period:', daysInPeriod);
console.log('- Average per Day:', avgPerDay.toFixed(2));
console.log('');

console.log('Validation complete. If values are non-zero, the fix is working correctly.');