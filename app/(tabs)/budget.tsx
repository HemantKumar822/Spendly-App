import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Budget, BudgetProgress, Expense, ExpenseCategory } from '@/types';
import { StorageService } from '@/services/storage';
import { calculateBudgetProgress, formatCurrency, generateId } from '@/utils';
import { DEFAULT_CATEGORIES } from '@/types/categories';
import BudgetComparison from '@/components/BudgetComparison';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { NoBudgetsState } from '@/components/ui/EmptyStatePresets';
import ResponsiveContainer, { ResponsiveTwoColumn, ResponsiveCardLayout } from '@/components/ui/ResponsiveContainer';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

// Add this interface for the budget creation form
interface BudgetCreationForm {
  amount: string;
  period: 'weekly' | 'monthly';
  categoryId: string;
}

export default function BudgetScreen() {
  const { theme } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic, triggerSuccessHaptic } = useHaptics();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme);
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgress[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  
  // Add state for budget creation
  const [newBudget, setNewBudget] = useState<BudgetCreationForm>({
    amount: '',
    period: 'monthly',
    categoryId: '',
  });


  // Memoized budget progress calculations
  const memoizedBudgetProgress = useMemo(() => {
    // We still want to show budgets even if there are no expenses yet
    if (!budgets.length) {
      console.log('📉 No budgets, returning empty progress array');
      return [];
    }
    
    // Calculate progress even if there are no expenses (progress will be 0%)
    const progress = budgets
      .filter(b => b.isActive)
      .map(budget => calculateBudgetProgress(budget, expenses));
    
    console.log('📊 Calculated budget progress:', progress);
    return progress;
  }, [budgets, expenses]);

  const loadData = useCallback(async () => {
    try {
      const [budgetsData, expensesData, categoriesData] = await Promise.all([
        StorageService.getBudgets(),
        StorageService.getExpenses(),
        StorageService.getCategories()
      ]);
      
      console.log('📊 Loaded budgets data:', budgetsData);
      console.log('📊 Budgets with isActive=true:', budgetsData.filter(b => b.isActive));
      console.log('📊 Budgets with isActive=false or undefined:', budgetsData.filter(b => !b.isActive));
      console.log('📊 Loaded expenses data:', expensesData.length, 'expenses');
      console.log('📊 Loaded categories data:', categoriesData.length, 'categories');
      
      const activeBudgets = budgetsData.filter(b => b.isActive);
      console.log('📊 Setting active budgets:', activeBudgets);
      setBudgets(activeBudgets);
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update budget progress when budgets or expenses change
  useEffect(() => {
    console.log('🔄 Budget progress updated with:', memoizedBudgetProgress.length, 'items');
    setBudgetProgress(memoizedBudgetProgress);
  }, [memoizedBudgetProgress]);

  const onRefresh = useCallback(async () => {
    console.log('🔄 Refreshing budget data');
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    console.log('🔄 Initial data loading');
    loadData();
  }, []);

  const validateBudgetForm = (): boolean => {
    const amount = parseFloat(newBudget.amount);
    return newBudget.amount.trim() !== '' && !isNaN(amount) && amount > 0;
  };

  const handleCreateBudget = useCallback(async () => {
    if (!validateBudgetForm()) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }
    
    try {
      const budget: Budget = {
        id: generateId(),
        amount: parseFloat(newBudget.amount),
        period: newBudget.period,
        categoryId: newBudget.categoryId || undefined,
        startDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      
      await StorageService.saveBudget(budget);
      setShowCreateFlow(false);
      setNewBudget({ amount: '', period: 'monthly', categoryId: '' });
      await loadData();
      
      triggerSuccessHaptic();
      Alert.alert('Success', 'Budget created successfully!');
    } catch (error) {
      console.error('Error creating budget:', error);
      Alert.alert('Error', 'Failed to create budget. Please try again.');
    }
  }, [newBudget, loadData]);

  const handleDeleteBudget = (budgetId: string) => {
    triggerMediumHaptic();
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => triggerLightHaptic()
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteBudget(budgetId);
              await loadData();
              triggerSuccessHaptic();
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget.');
            }
          },
        },
      ]
    );
  };

  const renderBudgetHealthCard = () => {
    if (budgets.length === 0) return null;

    // Only consider active budgets for health calculation
    const activeBudgetIds = budgets.filter(b => b.isActive).map(b => b.id);
    const activeBudgetProgress = budgetProgress.filter(p => activeBudgetIds.includes(p.budgetId));
    
    const onTrack = activeBudgetProgress.filter(p => !p.isOverBudget && p.percentage <= 80).length;
    const atRisk = activeBudgetProgress.filter(p => !p.isOverBudget && p.percentage > 80).length;
    const overLimit = activeBudgetProgress.filter(p => p.isOverBudget).length;

    return (
      <View style={styles.healthCard}>
        <Text style={styles.healthTitle}>Budget Health</Text>
        <View style={styles.healthStats}>
          <View style={styles.healthStat}>
            <View style={[styles.healthIndicator, { backgroundColor: theme.success }]} />
            <Text style={styles.healthCount}>{onTrack}</Text>
            <Text style={styles.healthLabel}>on track</Text>
          </View>
          <View style={styles.healthStat}>
            <View style={[styles.healthIndicator, { backgroundColor: theme.warning }]} />
            <Text style={styles.healthCount}>{atRisk}</Text>
            <Text style={styles.healthLabel}>at risk</Text>
          </View>
          <View style={styles.healthStat}>
            <View style={[styles.healthIndicator, { backgroundColor: theme.error }]} />
            <Text style={styles.healthCount}>{overLimit}</Text>
            <Text style={styles.healthLabel}>over limit</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.detailedAnalysisButton}
          onPress={() => {
            triggerLightHaptic();
            setShowInsights(true);
          }}
        >
          <MaterialIcons name="analytics" size={16} color={theme.primary} />
          <Text style={styles.detailedAnalysisText}>View Detailed Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEnhancedBudgetCard = (budget: Budget, progress: BudgetProgress) => {
    const categoryName = budget.categoryId 
      ? categories.find(cat => cat.id === budget.categoryId)?.name || 'Unknown'
      : 'All Categories';
    
    const category = budget.categoryId 
      ? categories.find(cat => cat.id === budget.categoryId)
      : null;

    const getProgressColor = () => {
      if (progress.isOverBudget) return theme.error;
      if (progress.percentage > 80) return theme.warning;
      return theme.success;
    };

    // Calculate days passed based on budget period
    const getDaysPassed = () => {
      const budgetStart = new Date(budget.startDate);
      const now = new Date();
      const periodEnd = budget.period === 'weekly' 
        ? new Date(budgetStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        : new Date(budgetStart.getFullYear(), budgetStart.getMonth() + 1, budgetStart.getDate());
      
      const daysInPeriod = Math.ceil((periodEnd.getTime() - budgetStart.getTime()) / (1000 * 60 * 60 * 24));
      return daysInPeriod - progress.daysRemaining;
    };

    const getDailyStatus = () => {
      const dailyBudget = budget.amount / (budget.period === 'weekly' ? 7 : 30);
      const daysPassed = getDaysPassed();
      const averageDaily = progress.totalSpent / Math.max(1, daysPassed);
      return averageDaily <= dailyBudget;
    };

    const getDailyAverage = () => {
      const daysPassed = getDaysPassed();
      return progress.totalSpent / Math.max(1, daysPassed);
    };

    return (
      <View key={budget.id} style={styles.enhancedBudgetCard}>
        <View style={styles.budgetCardHeader}>
          <View style={styles.budgetCardLeft}>
            {category ? (
              <Text style={styles.budgetCardEmoji}>{category.emoji}</Text>
            ) : (
              <View style={styles.allCategoriesIndicator}>
                <MaterialIcons name="category" size={20} color={theme.textSecondary} />
              </View>
            )}
            <View style={styles.budgetCardInfo}>
              <Text style={styles.budgetCardCategory}>{categoryName}</Text>
              <Text style={styles.budgetCardPeriod}>
                {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteBudget(budget.id)}
            style={styles.budgetCardMenu}
          >
            <MaterialIcons name="more-vert" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.budgetProgress}>
          <Text style={styles.budgetProgressAmount}>
            {formatCurrency(progress.totalSpent)} / {formatCurrency(budget.amount)}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress.percentage, 100)}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercentage, { color: getProgressColor() }]}>
              {progress.percentage.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.budgetFooter}>
            <Text style={styles.remainingText}>
              {progress.isOverBudget 
                ? `Over by ${formatCurrency(Math.abs(progress.remainingAmount))}`
                : `${formatCurrency(progress.remainingAmount)} remaining`
              }
            </Text>
            <Text style={styles.daysText}>{progress.daysRemaining} days left</Text>
          </View>
          
          <View style={styles.dailyInsight}>
            <MaterialIcons 
              name={getDailyStatus() ? "trending-down" : "trending-up"} 
              size={14} 
              color={getDailyStatus() ? theme.success : theme.warning} 
            />
            <Text style={[styles.dailyInsightText, { 
              color: getDailyStatus() ? theme.success : theme.warning 
            }]}>
              Daily avg: {formatCurrency(getDailyAverage())} 
              ({getDailyStatus() ? 'under budget' : 'over budget'})
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCreateBudgetFlow = () => {
    if (!showCreateFlow) return null;

    return (
      <View style={styles.createBudgetModal}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Budget</Text>
            <TouchableOpacity 
              onPress={() => setShowCreateFlow(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Budget Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={newBudget.amount}
                onChangeText={(text) => setNewBudget(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Period</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  newBudget.period === 'weekly' && styles.segmentButtonActive
                ]}
                onPress={() => setNewBudget(prev => ({ ...prev, period: 'weekly' }))}
              >
                <Text style={[
                  styles.segmentButtonText,
                  newBudget.period === 'weekly' && styles.segmentButtonTextActive
                ]}>
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  newBudget.period === 'monthly' && styles.segmentButtonActive
                ]}
                onPress={() => setNewBudget(prev => ({ ...prev, period: 'monthly' }))}
              >
                <Text style={[
                  styles.segmentButtonText,
                  newBudget.period === 'monthly' && styles.segmentButtonTextActive
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  !newBudget.categoryId && styles.categoryOptionSelected
                ]}
                onPress={() => setNewBudget(prev => ({ ...prev, categoryId: '' }))}
              >
                <Text style={styles.categoryOptionText}>All Categories</Text>
              </TouchableOpacity>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    newBudget.categoryId === category.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => setNewBudget(prev => ({ ...prev, categoryId: category.id }))}
                >
                  <Text style={styles.categoryOptionText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton]}
              onPress={() => setShowCreateFlow(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, !validateBudgetForm() && styles.createButtonDisabled]}
              onPress={handleCreateBudget}
              disabled={!validateBudgetForm()}
            >
              <Text style={styles.createButtonText}>Create Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Budget</Text>
              <Text style={styles.subtitle}>Manage your spending limits</Text>
            </View>
            <TouchableOpacity
              style={styles.newBudgetButton}
              onPress={() => {
                triggerLightHaptic();
                setShowCreateFlow(true);
              }}
            >
              <MaterialIcons name="add" size={20} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
          
          {/* Skeleton Budget Cards */}
          <View style={styles.budgetsContainer}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {(() => {
        console.log('📈 Rendering budgets:', budgets);
        console.log('📈 Budget progress data:', budgetProgress);
        return null;
      })()}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.scrollView}
      >
        {/* Streamlined Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Budget</Text>
            <Text style={styles.subtitle}>Track your spending limits</Text>
          </View>
          <TouchableOpacity
            style={styles.newBudgetButton}
            onPress={() => {
              triggerMediumHaptic();
              setShowCreateFlow(true);
            }}
          >
            <MaterialIcons name="add" size={20} color={theme.onPrimary} />
            <Text style={styles.newBudgetText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Budget Health Overview */}
        {renderBudgetHealthCard()}

        {/* Budget Cards */}
        {budgets.length === 0 ? (
          <NoBudgetsState onAction={() => {
            triggerLightHaptic();
            setShowCreateFlow(true);
          }} />
        ) : (
          <View style={styles.budgetsContainer}>
            {budgets.filter(b => b.isActive).map(budget => {
              const progress = budgetProgress.find(p => p.budgetId === budget.id);
              console.log('📈 Rendering budget card:', budget.id, progress);
              return progress ? renderEnhancedBudgetCard(budget, progress) : null;
            })}
          </View>
        )}
      </ScrollView>

      {/* Budget Insights Modal */}
      <BudgetComparison
        visible={showInsights}
        onClose={() => setShowInsights(false)}
      />
      
      {/* Create Budget Flow */}
      {renderCreateBudgetFlow()}
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 12,
  },
  
  // Streamlined Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  newBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.primary,
    gap: 6,
  },
  newBudgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  
  // Budget Health Card
  healthCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  healthStat: {
    alignItems: 'center',
  },
  healthIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  healthCount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  healthLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  detailedAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.primaryContainer,
    gap: 6,
  },
  detailedAnalysisText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
  },
  
  // Budget Cards Container
  budgetsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  
  // Enhanced Budget Card
  enhancedBudgetCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetCardEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  allCategoriesIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetCardInfo: {
    flex: 1,
  },
  budgetCardCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  budgetCardPeriod: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  budgetCardMenu: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: theme.surfaceVariant,
  },
  
  // Budget Progress Section
  budgetProgress: {
    gap: 12,
  },
  budgetProgressAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 12,
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  daysText: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  dailyInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  dailyInsightText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Add these new styles for the create budget flow
  createBudgetModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    padding: 0,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  segmentButtonTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
    marginRight: 10,
  },
  categoryOptionSelected: {
    backgroundColor: theme.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.surfaceVariant,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: theme.primary,
    marginLeft: 10,
  },
  createButtonDisabled: {
    backgroundColor: theme.textTertiary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  
});
