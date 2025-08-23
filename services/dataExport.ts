// import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
// import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { StorageService } from './storage';
import { Expense, Budget, ExpenseCategory } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { ErrorHandler, ErrorType } from './errorHandler';

// Note: For full file system functionality, install these packages:
// expo install expo-file-system expo-sharing expo-document-picker

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  BACKUP = 'backup',
}

export interface ExportOptions {
  format: ExportFormat;
  includeExpenses: boolean;
  includeBudgets: boolean;
  includeCategories: boolean;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export class DataExportService {
  // Export data with specified options (simplified version)
  static async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🗂️ Starting data export:', options);

      // Gather data based on options
      const exportData = await this.gatherExportData(options);
      
      // Generate file content based on format
      let fileContent: string;
      let fileName: string;

      switch (options.format) {
        case ExportFormat.CSV:
          fileContent = this.generateCSV(exportData, options);
          fileName = `spendly-export-${this.getDateStamp()}.csv`;
          break;
        case ExportFormat.JSON:
          fileContent = this.generateJSON(exportData);
          fileName = `spendly-export-${this.getDateStamp()}.json`;
          break;
        case ExportFormat.BACKUP:
          fileContent = this.generateBackup(exportData);
          fileName = `spendly-backup-${this.getDateStamp()}.json`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // For now, show the data in a copyable format
      this.showExportResult(fileContent, fileName, options.format);

      return {
        success: true,
        fileName,
      };

    } catch (error) {
      console.error('❌ Export failed:', error);
      const appError = ErrorHandler.storageError(
        'Failed to export data',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Import backup data (simplified version)
  static async importBackup(): Promise<{ success: boolean; error?: string }> {
    Alert.alert(
      'Import Feature',
      'To enable full import functionality, install expo-file-system and expo-document-picker packages.\n\nFor now, you can manually restore data by pasting backup JSON in the developer console.',
      [{ text: 'OK' }]
    );
    
    return { success: false, error: 'Feature requires additional packages' };
  }

  // Gather data for export
  private static async gatherExportData(options: ExportOptions) {
    const data: any = {};

    if (options.includeExpenses) {
      let expenses = await StorageService.getExpenses();
      
      // Apply date range filter if specified
      if (options.dateRange) {
        expenses = expenses.filter(expense => {
          const expenseDate = expense.date.split('T')[0];
          return expenseDate >= options.dateRange!.startDate && 
                 expenseDate <= options.dateRange!.endDate;
        });
      }
      
      data.expenses = expenses;
    }

    if (options.includeBudgets) {
      data.budgets = await StorageService.getBudgets();
    }

    if (options.includeCategories) {
      data.categories = await StorageService.getCategories();
    }

    return data;
  }

  // Generate CSV format
  private static generateCSV(data: any, options: ExportOptions): string {
    let csv = '';

    if (options.includeExpenses && data.expenses) {
      csv += 'EXPENSES\n';
      csv += 'Date,Description,Amount,Category,Note\n';
      
      data.expenses.forEach((expense: Expense) => {
        const row = [
          formatDate(expense.date),
          `"${expense.description.replace(/"/g, '""')}"`,
          expense.amount.toString(),
          expense.category.name,
          expense.note ? `"${expense.note.replace(/"/g, '""')}"` : '',
        ].join(',');
        csv += row + '\n';
      });
      csv += '\n';
    }

    if (options.includeBudgets && data.budgets) {
      csv += 'BUDGETS\n';
      csv += 'Amount,Period,Category,Start Date,Status\n';
      
      data.budgets.forEach((budget: Budget) => {
        const row = [
          budget.amount.toString(),
          budget.period,
          budget.categoryId || 'All Categories',
          formatDate(budget.startDate),
          budget.isActive ? 'Active' : 'Inactive',
        ].join(',');
        csv += row + '\n';
      });
    }

    return csv;
  }

  // Generate JSON format
  private static generateJSON(data: any): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data,
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Generate backup format (includes metadata)
  private static generateBackup(data: any): string {
    const backup = {
      appName: 'Spendly',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      platform: 'React Native',
      dataVersion: '1.0',
      ...data,
    };
    return JSON.stringify(backup, null, 2);
  }

  // Validate backup data structure
  private static validateBackupData(data: any): boolean {
    try {
      // Check required fields
      if (!data.appName || data.appName !== 'Spendly') return false;
      if (!data.version) return false;
      if (!data.exportDate) return false;

      // Validate expenses structure if present
      if (data.expenses) {
        if (!Array.isArray(data.expenses)) return false;
        for (const expense of data.expenses) {
          if (!expense.id || !expense.amount || !expense.description || !expense.category) {
            return false;
          }
        }
      }

      // Validate budgets structure if present
      if (data.budgets) {
        if (!Array.isArray(data.budgets)) return false;
        for (const budget of data.budgets) {
          if (!budget.id || !budget.amount || !budget.period) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Restore backup data
  private static async restoreBackupData(backup: any): Promise<void> {
    try {
      // Clear existing data first
      await StorageService.clearAllData();

      // Restore expenses
      if (backup.expenses && Array.isArray(backup.expenses)) {
        for (const expense of backup.expenses) {
          await StorageService.saveExpense(expense);
        }
      }

      // Restore budgets
      if (backup.budgets && Array.isArray(backup.budgets)) {
        for (const budget of backup.budgets) {
          await StorageService.saveBudget(budget);
        }
      }

      // Restore categories if present
      if (backup.categories && Array.isArray(backup.categories)) {
        await StorageService.saveCategories(backup.categories);
      }

      console.log('✅ Backup data restored successfully');
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      throw error;
    }
  }

  // Generate timestamp for file names
  private static getDateStamp(): string {
    const now = new Date();
    return now.toISOString().split('T')[0].replace(/-/g, '');
  }

  // Quick export presets
  static async exportExpensesCSV(dateRange?: { startDate: string; endDate: string }) {
    return this.exportData({
      format: ExportFormat.CSV,
      includeExpenses: true,
      includeBudgets: false,
      includeCategories: false,
      dateRange,
    });
  }

  static async exportAllDataJSON() {
    return this.exportData({
      format: ExportFormat.JSON,
      includeExpenses: true,
      includeBudgets: true,
      includeCategories: true,
    });
  }

  static async createFullBackup() {
    return this.exportData({
      format: ExportFormat.BACKUP,
      includeExpenses: true,
      includeBudgets: true,
      includeCategories: true,
    });
  }
}

export default DataExportService;