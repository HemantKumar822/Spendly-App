import { useState, useCallback, useMemo } from 'react';
import FormValidationService, { ValidationResult } from '@/services/validation';
import { ExpenseCategory } from '@/types';
import { debounce } from '@/utils';

interface UseFormValidationOptions {
  realTimeValidation?: boolean;
  debounceDelay?: number;
}

interface FormValidationState {
  [fieldName: string]: ValidationResult;
}

export function useFormValidation(options: UseFormValidationOptions = {}) {
  const { realTimeValidation = true, debounceDelay = 300 } = options;
  const [validationState, setValidationState] = useState<FormValidationState>({});
  const validationService = FormValidationService.getInstance();

  // Debounced validation function for real-time validation
  const debouncedValidate = useMemo(
    () => debounce((fieldName: string, validationResult: ValidationResult) => {
      setValidationState(prev => ({
        ...prev,
        [fieldName]: validationResult
      }));
    }, debounceDelay),
    [debounceDelay]
  );

  // Validate individual field
  const validateField = useCallback((
    fieldName: string,
    value: any,
    validationFn: (value: any) => ValidationResult,
    immediate: boolean = false
  ) => {
    const result = validationFn(value);
    
    if (realTimeValidation && !immediate) {
      debouncedValidate(fieldName, result);
    } else {
      setValidationState(prev => ({
        ...prev,
        [fieldName]: result
      }));
    }
    
    return result;
  }, [realTimeValidation, debouncedValidate]);

  // Expense amount validation
  const validateAmount = useCallback((
    amount: string,
    options = { required: true },
    immediate = false
  ) => {
    return validateField(
      'amount',
      amount,
      (value) => validationService.validateExpenseAmount(value, options),
      immediate
    );
  }, [validateField]);

  // Expense description validation
  const validateDescription = useCallback((
    description: string,
    options = { required: true },
    immediate = false
  ) => {
    return validateField(
      'description',
      description,
      (value) => validationService.validateExpenseDescription(value, options),
      immediate
    );
  }, [validateField]);

  // Category validation
  const validateCategory = useCallback((
    categoryId: string,
    categories: ExpenseCategory[],
    options = { required: true },
    immediate = false
  ) => {
    return validateField(
      'category',
      categoryId,
      (value) => validationService.validateExpenseCategory(value, categories, options),
      immediate
    );
  }, [validateField]);

  // Note validation
  const validateNote = useCallback((
    note: string,
    options = {},
    immediate = false
  ) => {
    return validateField(
      'note',
      note,
      (value) => validationService.validateExpenseNote(value, options),
      immediate
    );
  }, [validateField]);

  // Date validation
  const validateDate = useCallback((
    date: Date,
    options = { required: true },
    immediate = false
  ) => {
    return validateField(
      'date',
      date,
      (value) => validationService.validateExpenseDate(value, options),
      immediate
    );
  }, [validateField]);

  // Budget amount validation
  const validateBudgetAmount = useCallback((
    amount: string,
    period: 'weekly' | 'monthly',
    options = { required: true },
    immediate = false
  ) => {
    return validateField(
      'amount',
      amount,
      (value) => validationService.validateBudgetAmount(value, period, options),
      immediate
    );
  }, [validateField]);

  // Validate entire expense form
  const validateExpenseForm = useCallback((
    formData: {
      amount: string;
      description: string;
      categoryId: string;
      note?: string;
      date: Date;
    },
    categories: ExpenseCategory[]
  ) => {
    const results = validationService.validateExpenseForm(formData, categories);
    setValidationState(results);
    return results;
  }, []);

  // Get validation result for a specific field
  const getFieldValidation = useCallback((fieldName: string): ValidationResult => {
    return validationState[fieldName] || {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }, [validationState]);

  // Check if entire form is valid
  const isFormValid = useMemo(() => {
    return validationService.isFormValid(validationState);
  }, [validationState]);

  // Get all errors across the form
  const getAllErrors = useCallback(() => {
    return validationService.getAllErrors(validationState);
  }, [validationState]);

  // Get all warnings across the form
  const getAllWarnings = useCallback(() => {
    return validationService.getAllWarnings(validationState);
  }, [validationState]);

  // Get all suggestions across the form
  const getAllSuggestions = useCallback(() => {
    return validationService.getAllSuggestions(validationState);
  }, [validationState]);

  // Clear validation for specific field
  const clearFieldValidation = useCallback((fieldName: string) => {
    setValidationState(prev => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  }, []);

  // Clear all validation
  const clearAllValidation = useCallback(() => {
    setValidationState({});
  }, []);

  // Get error message for field (first error only)
  const getFieldError = useCallback((fieldName: string): string => {
    const validation = getFieldValidation(fieldName);
    return validation.errors[0] || '';
  }, [getFieldValidation]);

  // Check if field has any errors
  const hasFieldError = useCallback((fieldName: string): boolean => {
    const validation = getFieldValidation(fieldName);
    return !validation.isValid;
  }, [getFieldValidation]);

  // Get suggestions for field
  const getFieldSuggestions = useCallback((fieldName: string): string[] => {
    const validation = getFieldValidation(fieldName);
    return validation.suggestions;
  }, [getFieldValidation]);

  // Get warnings for field
  const getFieldWarnings = useCallback((fieldName: string): string[] => {
    const validation = getFieldValidation(fieldName);
    return validation.warnings;
  }, [getFieldValidation]);

  return {
    // Validation functions
    validateAmount,
    validateDescription,
    validateCategory,
    validateNote,
    validateDate,
    validateBudgetAmount,
    validateExpenseForm,
    
    // State getters
    getFieldValidation,
    getFieldError,
    hasFieldError,
    getFieldSuggestions,
    getFieldWarnings,
    isFormValid,
    getAllErrors,
    getAllWarnings,
    getAllSuggestions,
    
    // State management
    clearFieldValidation,
    clearAllValidation,
    
    // Raw validation state (for advanced use cases)
    validationState
  };
}

export default useFormValidation;