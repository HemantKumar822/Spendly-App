// Lazy-loaded analytics and heavy components
import { createLazyComponent } from '@/utils/lazyLoading';

// Analytics Components - Heavy charts and calculations
export const LazyEnhancedAnalytics = createLazyComponent(
  () => import('@/components/EnhancedAnalytics'),
  'Enhanced Analytics'
);

export const LazyCategoryDeepDive = createLazyComponent(
  () => import('@/components/CategoryDeepDive'),
  'Category Deep Dive'
);

export const LazyBudgetComparison = createLazyComponent(
  () => import('@/components/BudgetComparison'),
  'Budget Comparison'
);

export const LazySpendingVelocity = createLazyComponent(
  () => import('@/components/SpendingVelocity'),
  'Spending Velocity'
);

// Modal Components - Only load when user opens them
export const LazyEditExpenseModal = createLazyComponent(
  () => import('@/components/EditExpenseModal'),
  'Edit Expense Modal'
);

export const LazyExpenseSearchModal = createLazyComponent(
  () => import('@/components/ExpenseSearchModal'),
  'Expense Search'
);

export const LazyDatePickerModal = createLazyComponent(
  () => import('@/components/DatePickerModal'),
  'Date Picker'
);

// Gamification Components - Optional features
export const LazyAchievementSystem = createLazyComponent(
  () => import('@/components/AchievementSystem'),
  'Achievement System'
);

export const LazySpendingStreak = createLazyComponent(
  () => import('@/components/SpendingStreak'),
  'Spending Streak'
);

export const LazyLevelSystem = createLazyComponent(
  () => import('@/components/LevelSystem'),
  'Level System'
);

// Onboarding Components - Only load for new users
export const LazyIntegratedOnboardingFlow = createLazyComponent(
  () => import('@/components/IntegratedOnboardingFlow'),
  'Integrated Onboarding'
);

export const LazyWelcomeScreen = createLazyComponent(
  () => import('@/components/WelcomeScreen'),
  'Welcome Screen'
);

export const LazyGoalSettingFlow = createLazyComponent(
  () => import('@/components/GoalSettingFlow'),
  'Goal Setting'
);