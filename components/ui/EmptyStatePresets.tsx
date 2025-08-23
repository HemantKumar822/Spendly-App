import React from 'react';
import { useRouter } from 'expo-router';
import EmptyState from './EmptyState';

interface EmptyStatePresetProps {
  onAction?: () => void;
}

interface SmartEmptyStateProps extends EmptyStatePresetProps {
  userHasAnyExpenses?: boolean;
  daysSinceLastExpense?: number;
  suggestedAction?: string;
}

// Enhanced no expenses empty state with contextual intelligence
export const NoExpensesState = React.memo(function NoExpensesState({ 
  onAction, 
  userHasAnyExpenses = false, 
  daysSinceLastExpense = 0 
}: SmartEmptyStateProps) {
  const router = useRouter();
  
  const handleAddExpense = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/(tabs)/add-expense');
    }
  };

  // Smart messaging based on user context
  const getSmartMessage = () => {
    if (userHasAnyExpenses && daysSinceLastExpense > 7) {
      return `It's been ${daysSinceLastExpense} days since your last expense. Time to catch up on your spending!`;
    }
    if (userHasAnyExpenses) {
      return "Ready to add another expense? Keep your financial tracking on point!";
    }
    return "Start tracking your spending by adding your first expense. It only takes a few seconds!";
  };

  const getTitle = () => {
    if (userHasAnyExpenses) {
      return "Ready for More?";
    }
    return "No Expenses Yet";
  };

  return (
    <EmptyState
      illustration="expenses"
      title={getTitle()}
      message={getSmartMessage()}
      actionText={userHasAnyExpenses ? "Add Expense" : "Add First Expense"}
      onAction={handleAddExpense}
      type="default"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced no budgets empty state
export const NoBudgetsState = React.memo(function NoBudgetsState({ 
  onAction, 
  userHasAnyExpenses = false 
}: SmartEmptyStateProps) {
  const router = useRouter();
  
  const handleCreateBudget = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/(tabs)/budget');
    }
  };

  const getMessage = () => {
    if (userHasAnyExpenses) {
      return "Great! You're tracking expenses. Now create budgets to set spending goals and stay on target.";
    }
    return "Create your first budget to keep track of your spending goals and stay on target.";
  };

  return (
    <EmptyState
      illustration="budget"
      title="No Budgets Set"
      message={getMessage()}
      actionText="Create Budget"
      onAction={handleCreateBudget}
      type="default"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced search results with suggestions
export const NoSearchResultsState = React.memo(function NoSearchResultsState({ 
  searchQuery, 
  totalExpenses = 0 
}: { 
  searchQuery?: string; 
  totalExpenses?: number; 
}) {
  const getSuggestionMessage = () => {
    if (!searchQuery) {
      return "No expenses match your current filters. Try adjusting your search criteria.";
    }
    
    if (totalExpenses === 0) {
      return "You haven't added any expenses yet. Start tracking your spending to enable search!";
    }
    
    return `We couldn't find any expenses matching "${searchQuery}". Try different keywords, check spelling, or adjust your filters.`;
  };

  return (
    <EmptyState
      illustration="search"
      title="No Results Found"
      message={getSuggestionMessage()}
      type="search"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced analytics state with progressive messaging
export const NoAnalyticsDataState = React.memo(function NoAnalyticsDataState({ 
  onAction, 
  expenseCount = 0 
}: EmptyStatePresetProps & { expenseCount?: number }) {
  const router = useRouter();
  
  const handleAddExpense = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/(tabs)/add-expense');
    }
  };

  const getMessage = () => {
    if (expenseCount === 0) {
      return "Start tracking expenses to unlock powerful analytics and spending insights!";
    }
    if (expenseCount < 5) {
      return `You have ${expenseCount} expense${expenseCount > 1 ? 's' : ''}. Add a few more to unlock detailed charts and trends!`;
    }
    return "Add more expenses to unlock detailed analytics and spending insights. We need at least a few transactions to show meaningful charts.";
  };

  const getTitle = () => {
    if (expenseCount === 0) {
      return "No Data Yet";
    }
    return "Not Enough Data";
  };

  return (
    <EmptyState
      illustration="analytics"
      title={getTitle()}
      message={getMessage()}
      actionText="Add Expenses"
      onAction={handleAddExpense}
      type="default"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced achievements with motivational messaging
export const NoAchievementsState = React.memo(function NoAchievementsState({ 
  onAction, 
  expenseCount = 0,
  daysTracking = 0 
}: EmptyStatePresetProps & { expenseCount?: number; daysTracking?: number }) {
  const router = useRouter();
  
  const handleStartTracking = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/(tabs)/add-expense');
    }
  };

  const getMessage = () => {
    if (expenseCount === 0) {
      return "Start tracking your expenses to unlock achievements and build your spending streak!";
    }
    if (daysTracking < 7) {
      return `You're on day ${daysTracking} of tracking! Keep going to unlock your first achievement badge.`;
    }
    return "You're doing great! Continue tracking to unlock more achievement badges and build longer streaks.";
  };

  const getActionText = () => {
    if (expenseCount === 0) {
      return "Start Tracking";
    }
    return "Continue Tracking";
  };

  return (
    <EmptyState
      illustration="achievements"
      title="No Achievements Yet"
      message={getMessage()}
      actionText={getActionText()}
      onAction={handleStartTracking}
      type="default"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced offline state
export const OfflineState = React.memo(function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      illustration="offline"
      title="You're Offline"
      message="Check your internet connection and try again. Don't worry - your data is safely stored locally and will sync when you're back online."
      actionText={onRetry ? "Try Again" : undefined}
      onAction={onRetry}
      type="error"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced error state with better guidance
export const ErrorState = React.memo(function ErrorState({ 
  title = "Something Went Wrong",
  message = "We encountered an unexpected error. Please try again.",
  onRetry,
  errorType = 'general'
}: { 
  title?: string;
  message?: string;
  onRetry?: () => void;
  errorType?: 'general' | 'network' | 'storage' | 'permission';
}) {
  const getContextualMessage = () => {
    switch (errorType) {
      case 'network':
        return "Network connection issue. Please check your internet and try again.";
      case 'storage':
        return "Unable to save data locally. Please check your device storage and try again.";
      case 'permission':
        return "Permission denied. Please check app permissions in your device settings.";
      default:
        return message;
    }
  };

  return (
    <EmptyState
      title={title}
      message={getContextualMessage()}
      actionText={onRetry ? "Try Again" : undefined}
      onAction={onRetry}
      type="error"
      icon="error-outline"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced success state with celebration
export const SuccessState = React.memo(function SuccessState({ 
  title = "All Done!",
  message = "Your action was completed successfully.",
  actionText,
  onAction,
  celebrationType = 'default'
}: { 
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  celebrationType?: 'default' | 'achievement' | 'milestone';
}) {
  const getType = () => {
    return celebrationType === 'achievement' || celebrationType === 'milestone' ? 'celebration' : 'success';
  };

  return (
    <EmptyState
      title={title}
      message={message}
      actionText={actionText}
      onAction={onAction}
      type={getType()}
      icon="check-circle"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced today's expenses with time-aware messaging
export const NoTodayExpensesState = React.memo(function NoTodayExpensesState({ 
  onAction,
  timeOfDay = 'morning' 
}: EmptyStatePresetProps & { timeOfDay?: 'morning' | 'afternoon' | 'evening' }) {
  const router = useRouter();
  
  const handleAddExpense = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/(tabs)/add-expense');
    }
  };

  const getTimeAwareMessage = () => {
    switch (timeOfDay) {
      case 'morning':
        return "Starting fresh today! Add your first expense when you make a purchase.";
      case 'afternoon':
        return "No expenses logged yet today. Been saving money or forgot to track?";
      case 'evening':
        return "No expenses today? Great job saving, or time to catch up on any missed spending!";
      default:
        return "You haven't logged any expenses today. Great job saving money, or time to add today's spending!";
    }
  };

  return (
    <EmptyState
      illustration="expenses"
      title="No Expenses Today"
      message={getTimeAwareMessage()}
      actionText="Add Expense"
      onAction={handleAddExpense}
      type="success"
      enableMicroInteractions={true}
    />
  );
});

// No category data with helpful suggestions
export const NoCategoryDataState = React.memo(function NoCategoryDataState({ 
  categoryName,
  timeFilter = 'this period' 
}: { 
  categoryName?: string; 
  timeFilter?: string; 
}) {
  const getMessage = () => {
    if (categoryName) {
      return `No expenses found in the ${categoryName} category for ${timeFilter}. Try selecting a different time range or category.`;
    }
    return `No expenses found for the selected category and ${timeFilter}. Try adjusting your filters.`;
  };

  return (
    <EmptyState
      illustration="analytics"
      title="No Data Available"
      message={getMessage()}
      type="search"
      enableMicroInteractions={true}
    />
  );
});

// Enhanced loading failed state
export const LoadingFailedState = React.memo(function LoadingFailedState({ 
  onRetry,
  attemptCount = 0 
}: { 
  onRetry?: () => void;
  attemptCount?: number;
}) {
  const getMessage = () => {
    if (attemptCount > 2) {
      return "Still having trouble loading. Please check your connection or try again later.";
    }
    return "We couldn't load your data. Please check your connection and try again.";
  };

  return (
    <EmptyState
      title="Failed to Load"
      message={getMessage()}
      actionText="Reload"
      onAction={onRetry}
      type="error"
      icon="refresh"
      enableMicroInteractions={true}
    />
  );
});

// New: Onboarding welcome state
export const OnboardingWelcomeState = React.memo(function OnboardingWelcomeState({ 
  onAction,
  userName = "there" 
}: EmptyStatePresetProps & { userName?: string }) {
  const router = useRouter();
  
  const handleGetStarted = () => {
    if (onAction) {
      onAction();
    } else {
      router.push('/(tabs)/add-expense');
    }
  };

  return (
    <EmptyState
      illustration="onboarding"
      title={`Welcome${userName !== "there" ? `, ${userName}` : ""}!`}
      message="Ready to take control of your finances? Start by adding your first expense and watch your spending patterns unfold."
      actionText="Get Started"
      onAction={handleGetStarted}
      type="celebration"
      enableMicroInteractions={true}
    />
  );
});

// New: Data export success state
export const DataExportSuccessState = React.memo(function DataExportSuccessState({ 
  onAction,
  exportFormat = 'CSV' 
}: EmptyStatePresetProps & { exportFormat?: string }) {
  return (
    <EmptyState
      title="Export Complete!"
      message={`Your expense data has been successfully exported as a ${exportFormat} file. Check your downloads folder or email.`}
      actionText={onAction ? "Done" : undefined}
      onAction={onAction}
      type="celebration"
      icon="download-done"
      enableMicroInteractions={true}
    />
  );
});

// New: Budget goal achieved state
export const BudgetGoalAchievedState = React.memo(function BudgetGoalAchievedState({ 
  onAction,
  budgetName = "budget",
  savingsAmount = "₹0" 
}: EmptyStatePresetProps & { budgetName?: string; savingsAmount?: string }) {
  return (
    <EmptyState
      illustration="achievements"
      title="Goal Achieved! 🎉"
      message={`Congratulations! You've successfully stayed within your ${budgetName} budget and saved ${savingsAmount} this month.`}
      actionText={onAction ? "Continue" : undefined}
      onAction={onAction}
      type="celebration"
      enableMicroInteractions={true}
    />
  );
});