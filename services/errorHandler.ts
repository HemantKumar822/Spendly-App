import { Alert } from 'react-native';

export enum ErrorType {
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  AI_SERVICE = 'AI_SERVICE',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string;
  originalError?: Error;
  context?: any;
  timestamp: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Create a standardized error
  createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    originalError?: Error,
    context?: any
  ): AppError {
    const error: AppError = {
      type,
      message,
      userMessage,
      originalError,
      context,
      timestamp: new Date().toISOString(),
    };

    // Log the error
    this.logError(error);

    return error;
  }

  // Log error for debugging and reporting
  private logError(error: AppError): void {
    console.error('🔴 App Error:', error);
    
    // Keep a limited log in memory
    this.errorLog.push(error);
    if (this.errorLog.length > 50) {
      this.errorLog.shift(); // Remove oldest
    }

    // In production, send to crash reporting service
    if (!__DEV__) {
      this.reportToService(error);
    }
  }

  // Report to external service (placeholder)
  private async reportToService(error: AppError): Promise<void> {
    try {
      // Example: Send to Crashlytics, Sentry, etc.
      console.log('📤 Reporting error to service:', error.message);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Handle different types of errors
  handleError(error: AppError, showAlert: boolean = true): void {
    if (showAlert) {
      this.showErrorAlert(error);
    }
  }

  // Show user-friendly error alert
  private showErrorAlert(error: AppError): void {
    const title = this.getErrorTitle(error.type);
    const actions = this.getErrorActions(error);

    Alert.alert(title, error.userMessage, actions);
  }

  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.STORAGE:
        return 'Storage Error';
      case ErrorType.VALIDATION:
        return 'Invalid Input';
      case ErrorType.AI_SERVICE:
        return 'AI Service Error';
      case ErrorType.PERMISSION:
        return 'Permission Required';
      default:
        return 'Error';
    }
  }

  private getErrorActions(error: AppError): Array<{ text: string; style?: any; onPress?: () => void }> {
    const actions: Array<{ text: string; style?: any; onPress?: () => void }> = [
      { text: 'OK', style: 'default' }
    ];

    // Add retry option for certain error types
    if (error.type === ErrorType.NETWORK || error.type === ErrorType.AI_SERVICE) {
      actions.unshift({
        text: 'Retry',
        onPress: () => {
          // Retry logic can be passed via context
          if (error.context?.retry && typeof error.context.retry === 'function') {
            error.context.retry();
          }
        },
      });
    }

    return actions;
  }

  // Get recent errors for debugging
  getRecentErrors(): AppError[] {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Predefined error factories
  static networkError(message: string, originalError?: Error, retryFn?: () => void): AppError {
    return ErrorHandler.getInstance().createError(
      ErrorType.NETWORK,
      message,
      'Unable to connect to the internet. Please check your connection and try again.',
      originalError,
      { retry: retryFn }
    );
  }

  static storageError(message: string, originalError?: Error): AppError {
    return ErrorHandler.getInstance().createError(
      ErrorType.STORAGE,
      message,
      'There was an issue saving your data. Please try again.',
      originalError
    );
  }

  static validationError(message: string, field?: string): AppError {
    return ErrorHandler.getInstance().createError(
      ErrorType.VALIDATION,
      message,
      field ? `Please check the ${field} field and try again.` : 'Please check your input and try again.',
      undefined,
      { field }
    );
  }

  static aiServiceError(message: string, originalError?: Error, retryFn?: () => void): AppError {
    return ErrorHandler.getInstance().createError(
      ErrorType.AI_SERVICE,
      message,
      'AI features are temporarily unavailable. The app will use basic categorization instead.',
      originalError,
      { retry: retryFn }
    );
  }

  static unknownError(message: string, originalError?: Error): AppError {
    return ErrorHandler.getInstance().createError(
      ErrorType.UNKNOWN,
      message,
      'Something unexpected happened. Please try again.',
      originalError
    );
  }
}

// Async error wrapper utility
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  errorType: ErrorType = ErrorType.UNKNOWN,
  showAlert: boolean = true
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const appError = ErrorHandler.getInstance().createError(
      errorType,
      errorMessage,
      'An error occurred while processing your request.',
      error as Error
    );
    
    ErrorHandler.getInstance().handleError(appError, showAlert);
    return null;
  }
}

// React hook for error handling
import { useState, useCallback } from 'react';

export function useErrorHandler() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      errorMessage?: string;
      errorType?: ErrorType;
      showAlert?: boolean;
      loadingState?: boolean;
    } = {}
  ): Promise<T | null> => {
    const {
      errorMessage = 'An error occurred',
      errorType = ErrorType.UNKNOWN,
      showAlert = true,
      loadingState = true,
    } = options;

    try {
      if (loadingState) setLoading(true);
      setError(null);
      
      const result = await operation();
      return result;
    } catch (err) {
      const appError = ErrorHandler.getInstance().createError(
        errorType,
        errorMessage,
        'An error occurred while processing your request.',
        err as Error
      );
      
      setError(appError);
      ErrorHandler.getInstance().handleError(appError, showAlert);
      return null;
    } finally {
      if (loadingState) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeWithErrorHandling,
    clearError,
  };
}

export default ErrorHandler;