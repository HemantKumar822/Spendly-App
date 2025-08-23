import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Budget, ExpenseCategory, AIInsight } from '../types';
import { DEFAULT_CATEGORIES } from '../types/categories';
import { SampleDataGenerator } from '../utils/sampleData';
import { ErrorHandler, ErrorType } from './errorHandler';
import type { Achievement } from '../components/AchievementSystem';


// Storage keys
const STORAGE_KEYS = {
  EXPENSES: '@spendly/expenses',
  BUDGETS: '@spendly/budgets',
  CATEGORIES: '@spendly/categories',
  INSIGHTS: '@spendly/insights',
  ACHIEVEMENTS: '@spendly/achievements',
  RECENT_SEARCHES: '@spendly/recent_searches',

  APP_VERSION: '@spendly/app_version',
  FIRST_LAUNCH: '@spendly/first_launch',
  ONBOARDING_COMPLETED: '@spendly/onboarding_completed',
  SAMPLE_DATA_ADDED: '@spendly/sample_data_added',
  GOAL_SETTING_COMPLETED: '@spendly/goal_setting_completed'
};

export class StorageService {
  // Initialize app with default data
  static async initializeApp(): Promise<void> {
    try {
      const isFirstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      
      if (!isFirstLaunch) {
        // First time launching the app, set up default categories
        await this.saveCategories(DEFAULT_CATEGORIES);
        await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
        await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
        await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify([]));
      }
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to initialize app storage',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  // Expense operations
  static async getExpenses(): Promise<Expense[]> {
    try {
      const expensesJson = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
      return expensesJson ? JSON.parse(expensesJson) : [];
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to load expenses',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError, false); // Don't show alert for read operations
      return [];
    }
  }

  static async saveExpense(expense: Expense): Promise<void> {
    try {
      const expenses = await this.getExpenses();
      const existingIndex = expenses.findIndex(e => e.id === expense.id);
      
      if (existingIndex >= 0) {
        expenses[existingIndex] = { ...expense, updatedAt: new Date().toISOString() };
      } else {
        expenses.push(expense);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to save expense',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      const expenses = await this.getExpenses();
      const filteredExpenses = expenses.filter(e => e.id !== expenseId);
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExpenses));
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to delete expense',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  static async updateExpense(expense: Expense): Promise<void> {
    try {
      const updatedExpense = { ...expense, updatedAt: new Date().toISOString() };
      await this.saveExpense(updatedExpense);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  // Search and filter operations
  static async searchExpenses(query: string): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses();
      const searchTerm = query.toLowerCase().trim();
      
      if (!searchTerm) return expenses;
      
      return expenses.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm) ||
        expense.category.name.toLowerCase().includes(searchTerm) ||
        expense.note?.toLowerCase().includes(searchTerm) ||
        expense.amount.toString().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching expenses:', error);
      return [];
    }
  }

  static async filterExpensesByCategory(categoryId: string): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses();
      return expenses.filter(expense => expense.category.id === categoryId);
    } catch (error) {
      console.error('Error filtering expenses by category:', error);
      return [];
    }
  }

  static async filterExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses();
      return expenses.filter(expense => {
        const expenseDate = expense.date.split('T')[0];
        return expenseDate >= startDate && expenseDate <= endDate;
      });
    } catch (error) {
      console.error('Error filtering expenses by date range:', error);
      return [];
    }
  }

  static async getExpensesSorted(sortBy: 'date' | 'amount' | 'category', order: 'asc' | 'desc' = 'desc'): Promise<Expense[]> {
    try {
      const expenses = await this.getExpenses();
      
      return expenses.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'category':
            comparison = a.category.name.localeCompare(b.category.name);
            break;
        }
        
        return order === 'asc' ? comparison : -comparison;
      });
    } catch (error) {
      console.error('Error sorting expenses:', error);
      return [];
    }
  }

  // Budget operations
  static async getBudgets(): Promise<Budget[]> {
    try {
      const budgetsJson = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
      return budgetsJson ? JSON.parse(budgetsJson) : [];
    } catch (error) {
      console.error('Error getting budgets:', error);
      return [];
    }
  }

  static async saveBudget(budget: Budget): Promise<void> {
    try {
      const budgets = await this.getBudgets();
      const existingIndex = budgets.findIndex(b => b.id === budget.id);
      
      if (existingIndex >= 0) {
        budgets[existingIndex] = budget;
      } else {
        budgets.push(budget);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  }

  static async deleteBudget(budgetId: string): Promise<void> {
    try {
      const budgets = await this.getBudgets();
      const filteredBudgets = budgets.filter(b => b.id !== budgetId);
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filteredBudgets));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }

  // Category operations
  static async getCategories(): Promise<ExpenseCategory[]> {
    try {
      const categoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return categoriesJson ? JSON.parse(categoriesJson) : DEFAULT_CATEGORIES;
    } catch (error) {
      console.error('Error getting categories:', error);
      return DEFAULT_CATEGORIES;
    }
  }

  static async saveCategories(categories: ExpenseCategory[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  static async addCustomCategory(category: ExpenseCategory): Promise<void> {
    try {
      const categories = await this.getCategories();
      categories.push(category);
      await this.saveCategories(categories);
    } catch (error) {
      console.error('Error adding custom category:', error);
      throw error;
    }
  }

  // AI Insights operations
  static async getInsights(): Promise<AIInsight[]> {
    try {
      const insightsJson = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
      return insightsJson ? JSON.parse(insightsJson) : [];
    } catch (error) {
      console.error('Error getting insights:', error);
      return [];
    }
  }

  static async saveInsight(insight: AIInsight): Promise<void> {
    try {
      const insights = await this.getInsights();
      
      // Keep only the latest 50 insights to prevent storage bloat
      if (insights.length >= 50) {
        insights.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        insights.splice(49); // Keep only 49, then add the new one
      }
      
      insights.unshift(insight); // Add new insight to the beginning
      await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
    } catch (error) {
      console.error('Error saving insight:', error);
      throw error;
    }
  }

  static async clearOldInsights(): Promise<void> {
    try {
      const insights = await this.getInsights();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentInsights = insights.filter(insight => 
        new Date(insight.generatedAt) > thirtyDaysAgo
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(recentInsights));
    } catch (error) {
      console.error('Error clearing old insights:', error);
      throw error;
    }
  }

  // Goal setting operations
  static async isGoalSettingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.GOAL_SETTING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking goal setting completion:', error);
      return false;
    }
  }

  static async setGoalSettingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GOAL_SETTING_COMPLETED, completed.toString());
    } catch (error) {
      console.error('Error setting goal setting completion:', error);
      throw error;
    }
  }

  // Achievement operations
  static async getAchievements(): Promise<Achievement[]> {
    try {
      const achievementsJson = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return achievementsJson ? JSON.parse(achievementsJson) : [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  static async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
      throw error;
    }
  }

  static async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const achievements = await this.getAchievements();
      const achievementIndex = achievements.findIndex(a => a.id === achievementId);
      
      if (achievementIndex >= 0) {
        achievements[achievementIndex].isUnlocked = true;
        achievements[achievementIndex].unlockedAt = new Date().toISOString();
        await this.saveAchievements(achievements);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  // Recent searches operations
  static async getRecentSearches(): Promise<string[]> {
    try {
      const searchesJson = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      return searchesJson ? JSON.parse(searchesJson) : [];
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  static async addRecentSearch(query: string): Promise<void> {
    try {
      const searches = await this.getRecentSearches();
      
      // Remove the query if it already exists
      const filteredSearches = searches.filter(search => search !== query);
      
      // Add the new query to the beginning
      filteredSearches.unshift(query);
      
      // Keep only the last 10 searches
      const limitedSearches = filteredSearches.slice(0, 10);
      
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(limitedSearches));
    } catch (error) {
      console.error('Error adding recent search:', error);
      throw error;
    }
  }

  static async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
      throw error;
    }
  }

  // Bulk operations
  static async bulkDeleteExpenses(expenseIds: string[]): Promise<void> {
    try {
      const expenses = await this.getExpenses();
      const filteredExpenses = expenses.filter(expense => !expenseIds.includes(expense.id));
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExpenses));
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to delete expenses in bulk',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  static async bulkUpdateExpenseCategory(expenseIds: string[], newCategory: ExpenseCategory): Promise<void> {
    try {
      const expenses = await this.getExpenses();
      const updatedExpenses = expenses.map(expense => {
        if (expenseIds.includes(expense.id)) {
          return {
            ...expense,
            category: newCategory,
            updatedAt: new Date().toISOString()
          };
        }
        return expense;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to update expense categories in bulk',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  static async bulkUpdateExpenseNote(expenseIds: string[], note: string, addToExisting: boolean = false): Promise<void> {
    try {
      const expenses = await this.getExpenses();
      const updatedExpenses = expenses.map(expense => {
        if (expenseIds.includes(expense.id)) {
          let newNote = note;
          if (addToExisting && expense.note) {
            newNote = expense.note + (expense.note.endsWith('.') ? ' ' : '. ') + note;
          }
          return {
            ...expense,
            note: newNote || undefined,
            updatedAt: new Date().toISOString()
          };
        }
        return expense;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to update expense notes in bulk',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  static async exportSelectedExpenses(expenses: Expense[]): Promise<void> {
    try {
      const exportData = {
        expenses,
        exportType: 'selected_expenses',
        exportDate: new Date().toISOString(),
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        expenseCount: expenses.length
      };
      
      // For now, just log the data (in real app, would use expo-file-system and expo-sharing)
      console.log('📄 Selected expenses export data:', JSON.stringify(exportData, null, 2));
      
      // In a real implementation:
      // const fileName = `spendly-selected-expenses-${Date.now()}.json`;
      // const fileUri = FileSystem.documentDirectory + fileName;
      // await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      // await Sharing.shareAsync(fileUri);
      
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to export selected expenses',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  static async bulkUpdateExpenses(updates: Array<{ id: string; updates: Partial<Expense> }>): Promise<void> {
    try {
      const expenses = await this.getExpenses();
      const updatedExpenses = expenses.map(expense => {
        const update = updates.find(u => u.id === expense.id);
        if (update) {
          return {
            ...expense,
            ...update.updates,
            updatedAt: new Date().toISOString()
          };
        }
        return expense;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));
    } catch (error) {
      const appError = ErrorHandler.storageError(
        'Failed to update expenses in bulk',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      throw appError;
    }
  }

  // Utility operations
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EXPENSES,
        STORAGE_KEYS.BUDGETS,
        STORAGE_KEYS.INSIGHTS
      ]);
      
      // Reset categories to default
      await this.saveCategories(DEFAULT_CATEGORIES);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  static async exportData(): Promise<{
    expenses: Expense[];
    budgets: Budget[];
    categories: ExpenseCategory[];
    insights: AIInsight[];
    exportDate: string;
  }> {
    try {
      const [expenses, budgets, categories, insights] = await Promise.all([
        this.getExpenses(),
        this.getBudgets(),
        this.getCategories(),
        this.getInsights()
      ]);

      return {
        expenses,
        budgets,
        categories,
        insights,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  static async getStorageInfo(): Promise<{
    expenseCount: number;
    budgetCount: number;
    categoryCount: number;
    insightCount: number;
    estimatedSize: string;
  }> {
    try {
      const [expenses, budgets, categories, insights] = await Promise.all([
        this.getExpenses(),
        this.getBudgets(),
        this.getCategories(),
        this.getInsights()
      ]);

      // Rough estimation of storage size
      const dataString = JSON.stringify({ expenses, budgets, categories, insights });
      const sizeInBytes = new Blob([dataString]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);

      return {
        expenseCount: expenses.length,
        budgetCount: budgets.length,
        categoryCount: categories.length,
        insightCount: insights.length,
        estimatedSize: `${sizeInKB} KB`
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      throw error;
    }
  }

  // Onboarding and first launch methods
  static async isFirstLaunch(): Promise<boolean> {
    try {
      // FOR TESTING PURPOSES: Always return true to show welcome screen
      // Uncomment the following lines to restore normal behavior
      /*
      const isFirstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH);
      return isFirstLaunch === null;
      */
      
      // FOR TESTING: Always return true
      return true;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true;
    }
  }

  static async setFirstLaunchCompleted(): Promise<void> {
    try {
      // FOR TESTING PURPOSES: Don't actually set first launch completed
      // Uncomment the following lines to restore normal behavior
      /*
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
      */
      
      // FOR TESTING: Do nothing
      console.log('First launch completed (but not actually saved for testing)');
    } catch (error) {
      console.error('Error setting first launch completed:', error);
      throw error;
    }
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      // FOR TESTING PURPOSES: Always return false to show onboarding
      // Uncomment the following lines to restore normal behavior
      /*
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return completed === 'true';
      */
      
      // FOR TESTING: Always return false
      return false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    try {
      // FOR TESTING PURPOSES: Don't actually set onboarding completed
      // Uncomment the following lines to restore normal behavior
      /*
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      */
      
      // FOR TESTING: Do nothing
      console.log('Onboarding completed (but not actually saved for testing)');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
      throw error;
    }
  }

  static async populateSampleData(): Promise<void> {
    try {
      // FOR TESTING PURPOSES: Always populate sample data
      // Uncomment the following lines to restore normal behavior
      /*
      const sampleDataAdded = await AsyncStorage.getItem(STORAGE_KEYS.SAMPLE_DATA_ADDED);
      
      if (sampleDataAdded === 'true') {
        console.log('Sample data already added, skipping...');
        return;
      }
      */

      // Generate and save sample data
      const sampleExpenses = SampleDataGenerator.generateSampleExpenses();
      const sampleBudgets = SampleDataGenerator.generateSampleBudgets();
      const sampleInsights = SampleDataGenerator.generateSampleInsights();

      // Save sample expenses
      for (const expense of sampleExpenses) {
        await this.saveExpense(expense);
      }

      // Save sample budgets
      for (const budget of sampleBudgets) {
        await this.saveBudget(budget);
      }

      // Save sample insights
      for (const insight of sampleInsights) {
        await this.saveInsight(insight);
      }

      // FOR TESTING: Don't mark sample data as added so it runs every time
      // Uncomment the following line to restore normal behavior
      // await AsyncStorage.setItem(STORAGE_KEYS.SAMPLE_DATA_ADDED, 'true');
      
      console.log('✅ Sample data populated successfully!');
    } catch (error) {
      console.error('Error populating sample data:', error);
      throw error;
    }
  }

  static async clearSampleDataFlag(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SAMPLE_DATA_ADDED);
    } catch (error) {
      console.error('Error clearing sample data flag:', error);
      throw error;
    }
  }
}