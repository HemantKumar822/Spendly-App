import { Expense, Budget, AIInsight } from '../types';
import { DEFAULT_CATEGORIES } from '../types/categories';
import { generateId } from '../utils';
import { subDays, subWeeks, subMonths } from 'date-fns';

export class SampleDataGenerator {
  /**
   * Generate sample expenses for demonstration
   */
  static generateSampleExpenses(): Expense[] {
    const now = new Date();
    const sampleExpenses: Expense[] = [];

    // Student-focused expense examples
    const expenseTemplates = [
      // Food & Dining
      { description: 'Campus Cafeteria Lunch', categoryId: 'food', amount: 120, daysAgo: 0 },
      { description: 'Coffee with Study Group', categoryId: 'food', amount: 80, daysAgo: 1 },
      { description: 'Pizza Night with Friends', categoryId: 'food', amount: 250, daysAgo: 2 },
      { description: 'Grocery Shopping', categoryId: 'food', amount: 400, daysAgo: 3 },
      { description: 'Street Food Lunch', categoryId: 'food', amount: 60, daysAgo: 5 },
      
      // Transportation
      { description: 'Metro Card Recharge', categoryId: 'transport', amount: 200, daysAgo: 1 },
      { description: 'Uber to Airport', categoryId: 'transport', amount: 350, daysAgo: 7 },
      { description: 'Bus Ticket Home', categoryId: 'transport', amount: 180, daysAgo: 14 },
      
      // Books & Education
      { description: 'Data Structures Textbook', categoryId: 'books', amount: 800, daysAgo: 15 },
      { description: 'Online Course Subscription', categoryId: 'books', amount: 600, daysAgo: 20 },
      { description: 'Printing Assignment', categoryId: 'books', amount: 25, daysAgo: 4 },
      
      // Entertainment
      { description: 'Movie Ticket', categoryId: 'entertainment', amount: 180, daysAgo: 6 },
      { description: 'Netflix Subscription', categoryId: 'entertainment', amount: 200, daysAgo: 10 },
      { description: 'Gaming Tournament Entry', categoryId: 'entertainment', amount: 100, daysAgo: 12 },
      
      // Health & Fitness
      { description: 'Gym Membership', categoryId: 'health', amount: 500, daysAgo: 8 },
      { description: 'Pharmacy Visit', categoryId: 'health', amount: 150, daysAgo: 18 },
      
      // Shopping
      { description: 'New Headphones', categoryId: 'shopping', amount: 1200, daysAgo: 9 },
      { description: 'Stationery Items', categoryId: 'shopping', amount: 180, daysAgo: 11 },
      { description: 'Winter Jacket', categoryId: 'shopping', amount: 2000, daysAgo: 25 },
      
      // Technology
      { description: 'Phone Data Recharge', categoryId: 'tech', amount: 299, daysAgo: 2 },
      { description: 'Laptop Charger', categoryId: 'tech', amount: 800, daysAgo: 16 },
      
      // Bills & Utilities
      { description: 'Hostel Electricity Bill', categoryId: 'bills', amount: 300, daysAgo: 13 },
      { description: 'Internet Recharge', categoryId: 'bills', amount: 400, daysAgo: 19 },
      
      // Miscellaneous
      { description: 'Birthday Gift for Friend', categoryId: 'misc', amount: 500, daysAgo: 17 },
      { description: 'Laundry Service', categoryId: 'misc', amount: 120, daysAgo: 21 },
    ];

    // Generate expenses with realistic dates
    expenseTemplates.forEach(template => {
      const category = DEFAULT_CATEGORIES.find(cat => cat.id === template.categoryId);
      if (category) {
        const expenseDate = subDays(now, template.daysAgo);
        
        sampleExpenses.push({
          id: generateId(),
          amount: template.amount,
          description: template.description,
          category,
          date: expenseDate.toISOString(),
          createdAt: expenseDate.toISOString(),
          updatedAt: expenseDate.toISOString(),
        });
      }
    });

    return sampleExpenses;
  }

  /**
   * Generate sample budgets
   */
  static generateSampleBudgets(): Budget[] {
    const now = new Date();
    
    return [
      {
        id: generateId(),
        amount: 2000,
        period: 'weekly' as const,
        categoryId: 'food',
        startDate: subWeeks(now, 1).toISOString(),
        isActive: true,
        createdAt: subWeeks(now, 1).toISOString(),
      },
      {
        id: generateId(),
        amount: 8000,
        period: 'monthly' as const,
        startDate: subMonths(now, 1).toISOString(),
        isActive: true,
        createdAt: subMonths(now, 1).toISOString(),
      },
      {
        id: generateId(),
        amount: 1000,
        period: 'weekly' as const,
        categoryId: 'entertainment',
        startDate: subWeeks(now, 1).toISOString(),
        isActive: true,
        createdAt: subWeeks(now, 1).toISOString(),
      }
    ];
  }

  /**
   * Generate sample AI insights
   */
  static generateSampleInsights(): AIInsight[] {
    const now = new Date();
    
    return [
      {
        id: generateId(),
        type: 'tip',
        title: 'Food Spending Tip',
        message: 'You spend 40% more on weekends. Try meal prep to save ₹500/week!',
        category: 'food',
        amount: 500,
        generatedAt: subDays(now, 1).toISOString(),
      },
      {
        id: generateId(),
        type: 'achievement',
        title: 'Budget Champion!',
        message: 'Great job staying under your entertainment budget this week!',
        category: 'entertainment',
        generatedAt: subDays(now, 2).toISOString(),
      },
      {
        id: generateId(),
        type: 'warning',
        title: 'Transport Alert',
        message: 'You\'re 80% through your monthly transport budget. Consider walking more!',
        category: 'transport',
        amount: 200,
        generatedAt: subDays(now, 3).toISOString(),
      },
      {
        id: generateId(),
        type: 'tip',
        title: 'Smart Saving',
        message: 'Your average daily spending is ₹280. Small changes can save big!',
        amount: 280,
        generatedAt: subDays(now, 4).toISOString(),
      }
    ];
  }

  /**
   * Generate motivational messages for first-time users
   */
  static getWelcomeMessages(): string[] {
    return [
      "Welcome to your financial journey! 🚀",
      "Every penny tracked is a step towards your goals! 💰",
      "Smart spending starts today! 🎯",
      "You're about to become a budgeting pro! ⭐",
      "Financial freedom begins with awareness! 🌟"
    ];
  }

  /**
   * Generate achievement templates for gamification
   */
  static getAchievementTemplates() {
    return {
      firstExpense: {
        title: "First Step! 👶",
        description: "You've logged your first expense!",
        icon: "celebration",
        color: "#4ECDC4"
      },
      weekStreak: {
        title: "Week Warrior! 🔥",
        description: "7 days of consistent tracking!",
        icon: "local-fire-department",
        color: "#FF6B6B"
      },
      budgetMaster: {
        title: "Budget Master! 🎯",
        description: "Created your first budget!",
        icon: "account-balance-wallet",
        color: "#4ECDC4"
      },
      underBudget: {
        title: "Saver Superstar! ⭐",
        description: "Stayed under budget for a week!",
        icon: "star",
        color: "#FFD93D"
      },
      categoryKing: {
        title: "Category King! 👑",
        description: "Used all expense categories!",
        icon: "emoji-events",
        color: "#6BCF7F"
      }
    };
  }

  /**
   * Get helpful tips for students
   */
  static getStudentTips(): Array<{ title: string; tip: string; category?: string }> {
    return [
      {
        title: "Meal Prep Magic",
        tip: "Cooking in bulk can save you ₹2000+ per month compared to eating out daily.",
        category: "food"
      },
      {
        title: "Textbook Savings",
        tip: "Buy used books, rent, or use library copies. Save up to 70% on textbook costs.",
        category: "books"
      },
      {
        title: "Transport Hack",
        tip: "Walking to nearby places can save ₹500/month and improve your health!",
        category: "transport"
      },
      {
        title: "Entertainment Budget",
        tip: "Set aside ₹1000/month for fun activities. It's important to enjoy college life!",
        category: "entertainment"
      },
      {
        title: "Emergency Fund",
        tip: "Try to save ₹100/week for emergencies. Small amounts add up quickly!",
      },
      {
        title: "Track Everything",
        tip: "Even small expenses like chai or snacks matter. They add up to ₹1000+/month!",
      }
    ];
  }
}