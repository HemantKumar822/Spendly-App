import { ExpenseCategory } from '@/types';
import { ErrorHandler, ErrorType } from './errorHandler';

export interface ValidationRule<T = any> {
  test: (value: T) => boolean;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface FieldValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customRules?: ValidationRule[];
  realTime?: boolean;
}

class FormValidationService {
  private static instance: FormValidationService;
  
  static getInstance(): FormValidationService {
    if (!FormValidationService.instance) {
      FormValidationService.instance = new FormValidationService();
    }
    return FormValidationService.instance;
  }

  // Enhanced expense amount validation
  validateExpenseAmount(amount: string, options: FieldValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required check
    if (options.required && (!amount || amount.trim() === '')) {
      result.errors.push('Amount is required');
      result.isValid = false;
      return result;
    }

    if (!amount || amount.trim() === '') {
      return result; // Not required and empty
    }

    // Remove any non-numeric characters except decimal point
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    
    // Check for invalid number format
    if (!/^\d*\.?\d*$/.test(cleanAmount)) {
      result.errors.push('Please enter a valid number');
      result.isValid = false;
      return result;
    }

    const numAmount = parseFloat(cleanAmount);
    
    // Check if it's a valid number
    if (isNaN(numAmount)) {
      result.errors.push('Please enter a valid amount');
      result.isValid = false;
      return result;
    }

    // Check minimum value
    const minValue = options.min ?? 0.01;
    if (numAmount <= 0) {
      result.errors.push('Amount must be greater than ₹0');
      result.isValid = false;
    } else if (numAmount < minValue) {
      result.errors.push(`Minimum amount is ₹${minValue}`);
      result.isValid = false;
    }

    // Check maximum value
    const maxValue = options.max ?? 1000000;
    if (numAmount > maxValue) {
      result.errors.push(`Maximum amount is ₹${maxValue.toLocaleString()}`);
      result.isValid = false;
    }

    // Warnings for unusual amounts
    if (numAmount > 50000) {
      result.warnings.push('This is a large amount. Please double-check.');
    }

    // Suggestions for decimal places
    if (cleanAmount.includes('.') && cleanAmount.split('.')[1]?.length > 2) {
      result.suggestions.push('Amounts are rounded to 2 decimal places');
    }

    // Check for common mistakes
    if (amount.includes(',')) {
      result.suggestions.push('Use only numbers and decimal point (no commas)');
    }

    return result;
  }

  // Enhanced description validation
  validateExpenseDescription(description: string, options: FieldValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required check
    if (options.required && (!description || description.trim() === '')) {
      result.errors.push('Description is required');
      result.isValid = false;
      return result;
    }

    if (!description || description.trim() === '') {
      return result; // Not required and empty
    }

    const trimmedDesc = description.trim();
    
    // Length validations
    const minLength = options.minLength ?? 2;
    const maxLength = options.maxLength ?? 100;
    
    if (trimmedDesc.length < minLength) {
      result.errors.push(`Description must be at least ${minLength} characters`);
      result.isValid = false;
    }
    
    if (trimmedDesc.length > maxLength) {
      result.errors.push(`Description cannot exceed ${maxLength} characters`);
      result.isValid = false;
    }

    // Content quality checks
    if (trimmedDesc.length < 5) {
      result.warnings.push('Consider adding more details to your description');
    }

    // Check for common patterns
    if (/^[a-z]/.test(trimmedDesc)) {
      result.suggestions.push('Consider starting with a capital letter');
    }

    // Check for inappropriate content (basic)
    const inappropriatePatterns = [
      /test/gi,
      /^(a|an|the)\s*$/gi,
      /^\s*\d+\s*$/
    ];
    
    if (inappropriatePatterns.some(pattern => pattern.test(trimmedDesc))) {
      result.warnings.push('Please provide a meaningful description');
    }

    // Suggestions for better descriptions
    if (trimmedDesc.length > 50 && trimmedDesc.length < maxLength) {
      result.suggestions.push('Great detail! This will help with expense tracking.');
    }

    return result;
  }

  // Category validation
  validateExpenseCategory(
    categoryId: string, 
    categories: ExpenseCategory[], 
    options: FieldValidationOptions = {}
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required check
    if (options.required && (!categoryId || categoryId.trim() === '')) {
      result.errors.push('Please select a category');
      result.isValid = false;
      return result;
    }

    if (!categoryId || categoryId.trim() === '') {
      return result; // Not required and empty
    }

    // Check if category exists
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      result.errors.push('Selected category is not valid');
      result.isValid = false;
      return result;
    }

    // Suggestions based on category
    if (category.name.toLowerCase().includes('food')) {
      result.suggestions.push('💡 Add restaurant name or meal type for better tracking');
    } else if (category.name.toLowerCase().includes('transport')) {
      result.suggestions.push('💡 Include destination or distance for better records');
    } else if (category.name.toLowerCase().includes('entertainment')) {
      result.suggestions.push('💡 Mention the activity or venue for clearer tracking');
    }

    return result;
  }

  // Note validation
  validateExpenseNote(note: string, options: FieldValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!note || note.trim() === '') {
      if (options.required) {
        result.errors.push('Note is required');
        result.isValid = false;
      }
      return result;
    }

    const trimmedNote = note.trim();
    const maxLength = options.maxLength ?? 200;
    
    if (trimmedNote.length > maxLength) {
      result.errors.push(`Note cannot exceed ${maxLength} characters`);
      result.isValid = false;
    }

    // Quality suggestions
    if (trimmedNote.length > 0 && trimmedNote.length < 10) {
      result.suggestions.push('Consider adding more context to your note');
    }

    return result;
  }

  // Date validation
  validateExpenseDate(date: Date, options: FieldValidationOptions = {}): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!date) {
      if (options.required) {
        result.errors.push('Date is required');
        result.isValid = false;
      }
      return result;
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Future date check
    if (date > tomorrow) {
      result.warnings.push('This expense is dated in the future');
    }

    // Very old date check
    if (date < oneYearAgo) {
      result.warnings.push('This expense is over a year old');
    }

    // Weekend spending suggestion
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      result.suggestions.push('📊 Weekend expense - consider your leisure budget');
    }

    return result;
  }

  // Budget amount validation
  validateBudgetAmount(amount: string, period: 'weekly' | 'monthly', options: FieldValidationOptions = {}): ValidationResult {
    const baseValidation = this.validateExpenseAmount(amount, options);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const numAmount = parseFloat(amount);
    const result = { ...baseValidation };

    // Period-specific validations
    if (period === 'weekly') {
      if (numAmount < 100) {
        result.warnings.push('This seems like a very low weekly budget');
      } else if (numAmount > 10000) {
        result.warnings.push('This is a high weekly budget. Make sure it\'s realistic.');
      }
    } else if (period === 'monthly') {
      if (numAmount < 500) {
        result.warnings.push('This seems like a very low monthly budget');
      } else if (numAmount > 50000) {
        result.warnings.push('This is a high monthly budget. Make sure it\'s realistic.');
      }
    }

    return result;
  }

  // Comprehensive form validation
  validateExpenseForm(formData: {
    amount: string;
    description: string;
    categoryId: string;
    note?: string;
    date: Date;
  }, categories: ExpenseCategory[]): { [key: string]: ValidationResult } {
    return {
      amount: this.validateExpenseAmount(formData.amount, { required: true }),
      description: this.validateExpenseDescription(formData.description, { required: true }),
      category: this.validateExpenseCategory(formData.categoryId, categories, { required: true }),
      note: this.validateExpenseNote(formData.note || ''),
      date: this.validateExpenseDate(formData.date, { required: true })
    };
  }

  // Get overall form validity
  isFormValid(validationResults: { [key: string]: ValidationResult }): boolean {
    return Object.values(validationResults).every(result => result.isValid);
  }

  // Get all errors from form validation
  getAllErrors(validationResults: { [key: string]: ValidationResult }): string[] {
    return Object.values(validationResults)
      .flatMap(result => result.errors)
      .filter(error => error.length > 0);
  }

  // Get all warnings from form validation
  getAllWarnings(validationResults: { [key: string]: ValidationResult }): string[] {
    return Object.values(validationResults)
      .flatMap(result => result.warnings)
      .filter(warning => warning.length > 0);
  }

  // Get helpful suggestions
  getAllSuggestions(validationResults: { [key: string]: ValidationResult }): string[] {
    return Object.values(validationResults)
      .flatMap(result => result.suggestions)
      .filter(suggestion => suggestion.length > 0);
  }

  // Real-time validation with debouncing
  createDebouncedValidator<T>(
    validationFn: (value: T) => ValidationResult,
    delay: number = 300
  ): (value: T, callback: (result: ValidationResult) => void) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (value: T, callback: (result: ValidationResult) => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const result = validationFn(value);
        callback(result);
      }, delay);
    };
  }

  // Validation error reporting
  reportValidationIssue(field: string, value: any, error: string): void {
    const validationError = ErrorHandler.validationError(
      `Validation failed for field \"${field}\": ${error}`,
      field
    );
    
    ErrorHandler.getInstance().handleError(validationError, false); // Don't show alert
  }
}

export default FormValidationService;