import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
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
  // Show export result to user
  private static showExportResult(fileContent: string, fileName: string, format: ExportFormat): void {
    // Create a more user-friendly message
    let message = `Your data has been prepared for export as ${fileName}.\n\n`;
    
    switch (format) {
      case ExportFormat.CSV:
        message += "This is a CSV file that can be opened in Excel or other spreadsheet applications.\n\n";
        break;
      case ExportFormat.JSON:
        message += "This is a JSON file containing all your data in a structured format.\n\n";
        break;
      case ExportFormat.BACKUP:
        message += "This is a backup file that can be used to restore your data.\n\n";
        break;
    }
    
    message += "To save this data:\n" +
               "1. Copy the content below\n" +
               "2. Create a new file on your computer\n" +
               "3. Paste the content\n" +
               "4. Save with the filename shown above";

    Alert.alert(
      'Export Ready',
      message,
      [
        {
          text: 'Copy Content',
          onPress: () => {
            // In a real implementation with Clipboard API:
            // Clipboard.setStringAsync(fileContent);
            Alert.alert(
              'Content Ready', 
              'In a full implementation, the content would be copied to your clipboard. For now, here is your data:\n\n' + fileContent.substring(0, 1000) + (fileContent.length > 1000 ? '\n\n... (truncated)' : ''),
              [{ text: 'OK' }]
            );
          },
        },
        { text: 'Close' },
      ]
    );
  }

  // Export data with specified options (enhanced version with file system support)
  static async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🗂️ Starting data export:', options);

      // Try to use full file system export if available
      if (FileSystem && Sharing) {
        return await this.exportDataToFileSystem(options);
      }

      // Fallback to simplified version
      console.log('⚠️ File system functionality not available, using simplified export');

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

  // Export data with full file system functionality
  static async exportDataToFileSystem(options: ExportOptions): Promise<ExportResult> {
    try {
      console.log('🗂️ Starting file system export:', options);

      // Gather data based on options
      const exportData = await this.gatherExportData(options);
      
      // Generate file content based on format
      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      switch (options.format) {
        case ExportFormat.CSV:
          fileContent = this.generateCSV(exportData, options);
          fileName = `spendly-export-${this.getDateStamp()}.csv`;
          mimeType = 'text/csv';
          break;
        case ExportFormat.JSON:
          fileContent = this.generateJSON(exportData);
          fileName = `spendly-export-${this.getDateStamp()}.json`;
          mimeType = 'application/json';
          break;
        case ExportFormat.BACKUP:
          fileContent = this.generateBackup(exportData);
          fileName = `spendly-backup-${this.getDateStamp()}.json`;
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Write file to file system
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, fileContent);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Export ${options.format.toUpperCase()} data from Spendly`,
        });
      } else {
        // Fallback to showing file content
        this.showExportResult(fileContent, fileName, options.format);
      }

      return {
        success: true,
        filePath: fileUri,
        fileName,
      };

    } catch (error) {
      console.error('❌ File system export failed:', error);
      const appError = ErrorHandler.storageError(
        'Failed to export data to file system',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Import backup data with full file system functionality
  static async importBackupFromFileSystem(): Promise<{ success: boolean; error?: string }> {
    try {
      // Request file from user
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) {
        return { success: false, error: 'User cancelled import' };
      }

      const fileUri = result.assets?.[0]?.uri;
      if (!fileUri) {
        return { success: false, error: 'No file selected' };
      }

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(fileContent);

      // Validate backup data
      if (!this.validateBackupData(backupData)) {
        return { success: false, error: 'Invalid backup file format' };
      }

      // Restore backup data
      await this.restoreBackupData(backupData);

      Alert.alert('Success', 'Data imported successfully!');
      return { success: true };

    } catch (error) {
      console.error('❌ Import failed:', error);
      const appError = ErrorHandler.storageError(
        'Failed to import backup data',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  // Import backup data (enhanced version with file system support)
  static async importBackup(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to use full file system import if available
      if (FileSystem && DocumentPicker) {
        return await this.importBackupFromFileSystem();
      }

      // Fallback to simplified version
      Alert.alert(
        'Import Feature',
        'To enable full import functionality, install expo-file-system and expo-document-picker packages.\n\nFor now, you can manually restore data by pasting backup JSON in the developer console.',
        [{ text: 'OK' }]
      );
      
      return { success: false, error: 'Feature requires additional packages' };
    } catch (error) {
      console.error('❌ Import failed:', error);
      const appError = ErrorHandler.storageError(
        'Failed to import backup data',
        error as Error
      );
      ErrorHandler.getInstance().handleError(appError);
      
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
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