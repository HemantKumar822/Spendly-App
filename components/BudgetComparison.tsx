import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Budget, Expense, ExpenseCategory, BudgetProgress } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 60;

interface BudgetAnalysis {
  budget: Budget;
  category?: ExpenseCategory;
  budgetAmount: number;
  actualSpent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  dailyAverage: number;
  projectedTotal: number;
  daysInPeriod: number;
  daysRemaining: number;
  status: 'good' | 'warning' | 'danger';
  expenses: Expense[];
}

interface BudgetComparisonProps {
  visible: boolean;
  onClose: () => void;
}

export default function BudgetComparison({ visible, onClose }: BudgetComparisonProps) {
  const { theme } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgetAnalyses, setBudgetAnalyses] = useState<BudgetAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last'>('current');

  useEffect(() => {
    if (visible) {
      loadBudgetData();
    }
  }, [visible, selectedPeriod]);

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetsData, expensesData, categoriesData] = await Promise.all([
        StorageService.getBudgets(),
        StorageService.getExpenses(),
        StorageService.getCategories()
      ]);
      
      setBudgets(budgetsData);
      setExpenses(expensesData);
      setCategories(categoriesData);
      
      generateBudgetAnalyses(budgetsData, expensesData, categoriesData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateBudgetAnalyses = useCallback((budgets: Budget[], expenses: Expense[], categories: ExpenseCategory[]) => {
    const activeBudgets = budgets.filter(budget => budget.isActive);
    const analyses: BudgetAnalysis[] = [];

    activeBudgets.forEach(budget => {
      const analysis = calculateBudgetAnalysis(budget, expenses, categories);
      if (analysis) {
        analyses.push(analysis);
      }
    });

    setBudgetAnalyses(analyses);
  }, []);

  // Memoized budget analyses to prevent unnecessary recalculations
  const memoizedBudgetAnalyses = useMemo(() => {
    return budgetAnalyses;
  }, [budgetAnalyses]);

  const calculateBudgetAnalysis = (budget: Budget, expenses: Expense[], categories: ExpenseCategory[]): BudgetAnalysis | null => {
    const now = new Date();
    const budgetStart = new Date(budget.startDate);
    
    // Calculate period dates
    let periodStart: Date;
    let periodEnd: Date;
    
    if (budget.period === 'monthly') {
      if (selectedPeriod === 'current') {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      }
    } else { // weekly
      const dayOfWeek = now.getDay();
      if (selectedPeriod === 'current') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
      } else {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek - 7);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
      }
    }

    // Filter expenses for this budget and period
    const relevantExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= periodStart && 
             expenseDate <= periodEnd && 
             (!budget.categoryId || expense.category.id === budget.categoryId);
    });

    const actualSpent = relevantExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget.amount - actualSpent;
    const percentage = (actualSpent / budget.amount) * 100;
    const isOverBudget = actualSpent > budget.amount;

    // Calculate time-based metrics
    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24)) + 1;
    const daysPassed = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 3600 * 24));
    const daysRemaining = Math.max(0, daysInPeriod - daysPassed);
    const dailyAverage = daysPassed > 0 ? actualSpent / daysPassed : 0;
    const projectedTotal = dailyAverage * daysInPeriod;

    // Determine status
    let status: 'good' | 'warning' | 'danger' = 'good';
    if (isOverBudget) {
      status = 'danger';
    } else if (percentage > 80 || projectedTotal > budget.amount) {
      status = 'warning';
    }

    // Find category info
    const category = budget.categoryId ? categories.find(cat => cat.id === budget.categoryId) : undefined;

    return {
      budget,
      category,
      budgetAmount: budget.amount,
      actualSpent,
      remaining,
      percentage,
      isOverBudget,
      dailyAverage,
      projectedTotal,
      daysInPeriod,
      daysRemaining,
      status,
      expenses: relevantExpenses
    };
  };

  const renderBudgetCard = (analysis: BudgetAnalysis) => {
    const statusColors = {
      good: '#48BB78',
      warning: '#ED8936',
      danger: '#F56565'
    };

    const statusColor = statusColors[analysis.status];
    const progressBarColor = analysis.isOverBudget ? statusColors.danger : statusColors.good;

    return (
      <View key={analysis.budget.id} style={styles.budgetCard}>
        {/* Header */}
        <View style={styles.budgetHeader}>
          <View style={styles.budgetTitleRow}>
            {analysis.category ? (
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: analysis.category.color }]}>
                  <Text style={styles.categoryEmoji}>{analysis.category.emoji}</Text>
                </View>
                <Text style={styles.budgetTitle}>{analysis.category.name} Budget</Text>
              </View>
            ) : (
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: '#4ECDC4' }]}>
                  <MaterialIcons name="account-balance-wallet" size={20} color="white" />
                </View>
                <Text style={styles.budgetTitle}>Total Budget</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {analysis.status === 'good' ? 'On Track' : 
                 analysis.status === 'warning' ? 'Watch Out' : 'Over Budget'}
              </Text>
            </View>
          </View>
          <Text style={styles.budgetPeriod}>
            {analysis.budget.period === 'monthly' ? 'Monthly' : 'Weekly'} • 
            {selectedPeriod === 'current' ? ' Current Period' : ' Last Period'}
          </Text>
        </View>

        {/* Amount Comparison */}
        <View style={styles.amountComparison}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Budget</Text>
            <Text style={styles.budgetAmount}>{formatCurrency(analysis.budgetAmount)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Spent</Text>
            <Text style={[styles.spentAmount, { color: analysis.isOverBudget ? statusColors.danger : '#2D3748' }]}>
              {formatCurrency(analysis.actualSpent)}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>
              {analysis.isOverBudget ? 'Over by' : 'Remaining'}
            </Text>
            <Text style={[styles.remainingAmount, { color: analysis.isOverBudget ? statusColors.danger : statusColors.good }]}>
              {formatCurrency(Math.abs(analysis.remaining))}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(analysis.percentage, 100)}%`,
                  backgroundColor: progressBarColor
                }
              ]}
            />
            {analysis.percentage > 100 && (
              <View
                style={[
                  styles.overProgressBar,
                  {
                    width: `${Math.min(analysis.percentage - 100, 50)}%`,
                    backgroundColor: statusColors.danger
                  }
                ]}
              />
            )}
          </View>
          <Text style={styles.progressText}>
            {analysis.percentage.toFixed(1)}% used
          </Text>
        </View>

        {/* Projections */}
        <View style={styles.projectionsSection}>
          <View style={styles.projectionItem}>
            <MaterialIcons name="trending-up" size={16} color="#718096" />
            <Text style={styles.projectionLabel}>Daily Average</Text>
            <Text style={styles.projectionValue}>{formatCurrency(analysis.dailyAverage)}</Text>
          </View>
          <View style={styles.projectionItem}>
            <MaterialIcons name="timeline" size={16} color="#718096" />
            <Text style={styles.projectionLabel}>Projected Total</Text>
            <Text style={[
              styles.projectionValue,
              { color: analysis.projectedTotal > analysis.budgetAmount ? statusColors.warning : '#4A5568' }
            ]}>
              {formatCurrency(analysis.projectedTotal)}
            </Text>
          </View>
          {analysis.daysRemaining > 0 && (
            <View style={styles.projectionItem}>
              <MaterialIcons name="schedule" size={16} color="#718096" />
              <Text style={styles.projectionLabel}>
                {analysis.daysRemaining} day{analysis.daysRemaining !== 1 ? 's' : ''} left
              </Text>
              <Text style={styles.projectionValue}>
                {formatCurrency(analysis.remaining / Math.max(analysis.daysRemaining, 1))}/day
              </Text>
            </View>
          )}
        </View>

        {/* Insights */}
        {renderBudgetInsights(analysis)}
      </View>
    );
  };

  const renderBudgetInsights = (analysis: BudgetAnalysis) => {
    const insights = [];

    if (analysis.isOverBudget) {
      insights.push({
        icon: 'warning',
        text: `You're ₹${Math.abs(analysis.remaining).toFixed(0)} over budget this ${analysis.budget.period === 'monthly' ? 'month' : 'week'}`,
        color: '#F56565'
      });
    } else if (analysis.projectedTotal > analysis.budgetAmount) {
      const overage = analysis.projectedTotal - analysis.budgetAmount;
      insights.push({
        icon: 'info',
        text: `At current pace, you'll exceed budget by ₹${overage.toFixed(0)}`,
        color: '#ED8936'
      });
    } else if (analysis.percentage < 50 && analysis.daysRemaining < 5) {
      insights.push({
        icon: 'check-circle',
        text: `Great job! You're under budget with ₹${analysis.remaining.toFixed(0)} to spare`,
        color: '#48BB78'
      });
    }

    if (analysis.dailyAverage > 0 && analysis.daysRemaining > 0) {
      const recommendedDaily = analysis.remaining / analysis.daysRemaining;
      if (recommendedDaily < analysis.dailyAverage) {
        insights.push({
          icon: 'lightbulb',
          text: `Try to spend ₹${recommendedDaily.toFixed(0)}/day for the rest of the period`,
          color: '#4ECDC4'
        });
      }
    }

    if (insights.length === 0) return null;

    return (
      <View style={styles.insightsSection}>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <MaterialIcons name={insight.icon as any} size={16} color={insight.color} />
            <Text style={styles.insightText}>{insight.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderOverallSummary = () => {
    if (budgetAnalyses.length === 0) return null;

    const totalBudget = budgetAnalyses.reduce((sum, analysis) => sum + analysis.budgetAmount, 0);
    const totalSpent = budgetAnalyses.reduce((sum, analysis) => sum + analysis.actualSpent, 0);
    const overallPercentage = (totalSpent / totalBudget) * 100;
    const budgetsOverLimit = budgetAnalyses.filter(a => a.isOverBudget).length;
    const budgetsAtRisk = budgetAnalyses.filter(a => a.status === 'warning').length;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{formatCurrency(totalSpent)}</Text>
            <Text style={styles.summaryStatLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={styles.summaryStatValue}>{formatCurrency(totalBudget)}</Text>
            <Text style={styles.summaryStatLabel}>Total Budget</Text>
          </View>
          <View style={styles.summaryStatItem}>
            <Text style={[
              styles.summaryStatValue,
              { color: overallPercentage > 100 ? '#F56565' : '#48BB78' }
            ]}>
              {overallPercentage.toFixed(1)}%
            </Text>
            <Text style={styles.summaryStatLabel}>Used</Text>
          </View>
        </View>
        
        {(budgetsOverLimit > 0 || budgetsAtRisk > 0) && (
          <View style={styles.summaryAlerts}>
            {budgetsOverLimit > 0 && (
              <View style={styles.alertItem}>
                <MaterialIcons name="error" size={16} color="#F56565" />
                <Text style={styles.alertText}>
                  {budgetsOverLimit} budget{budgetsOverLimit !== 1 ? 's' : ''} over limit
                </Text>
              </View>
            )}
            {budgetsAtRisk > 0 && (
              <View style={styles.alertItem}>
                <MaterialIcons name="warning" size={16} color="#ED8936" />
                <Text style={styles.alertText}>
                  {budgetsAtRisk} budget{budgetsAtRisk !== 1 ? 's' : ''} at risk
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderPeriodSelector = () => {
    const periods = [
      { key: 'current' as const, label: 'Current Period' },
      { key: 'last' as const, label: 'Last Period' }
    ];

    return (
      <View style={styles.periodSelector}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  const styles = getStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Budget vs Actual</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Period Selector */}
        <View style={[styles.periodCard, { backgroundColor: theme.surface }]}>
          {renderPeriodSelector()}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing your budgets...</Text>
            </View>
          ) : budgetAnalyses.length > 0 ? (
            <>
              {/* Overall Summary */}
              {renderOverallSummary()}

              {/* Individual Budget Analyses */}
              {budgetAnalyses.map(renderBudgetCard)}
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color={theme.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No Active Budgets</Text>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                Create some budgets to see comparison analysis
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodCard: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  periodButtonTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  summaryAlerts: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 8,
  },
  budgetCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetHeader: {
    marginBottom: 16,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetPeriod: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  amountComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  spentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  overProgressBar: {
    height: '100%',
    position: 'absolute',
    left: '100%',
    top: 0,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  projectionsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 16,
    marginBottom: 16,
  },
  projectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectionLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  projectionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  insightsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: theme.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
