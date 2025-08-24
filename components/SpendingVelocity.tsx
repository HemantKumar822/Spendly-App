import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Expense, ExpenseCategory, Budget } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency, formatDateShort } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface VelocityData {
  currentVelocity: number; // Spending per day
  optimalVelocity: number; // Ideal spending per day to stay on budget
  velocityRatio: number; // Current vs optimal ratio
  projectedOverage: number; // How much over budget at current rate
  daysRemaining: number;
  trend: 'accelerating' | 'decelerating' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

interface PeriodVelocity {
  period: string;
  velocity: number;
  amount: number;
  days: number;
}

interface CategoryVelocity {
  category: ExpenseCategory;
  velocity: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high';
}

interface SpendingVelocityProps {
  visible: boolean;
  onClose: () => void;
}

export default function SpendingVelocity({ visible, onClose }: SpendingVelocityProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('month');
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null);
  const [weeklyVelocity, setWeeklyVelocity] = useState<PeriodVelocity[]>([]);
  const [categoryVelocities, setCategoryVelocities] = useState<CategoryVelocity[]>([]);

  useEffect(() => {
    if (visible) {
      loadVelocityData();
    }
  }, [visible, selectedPeriod]);

  const loadVelocityData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, budgetsData, categoriesData] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getBudgets(),
        StorageService.getCategories()
      ]);
      
      setExpenses(expensesData);
      setBudgets(budgetsData);
      setCategories(categoriesData);
      
      // Generate velocity analysis based on selected period
      generateVelocityAnalysis(expensesData, budgetsData, categoriesData);
    } catch (error) {
      console.error('Error loading velocity data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVelocityData();
    setRefreshing(false);
  }, [loadVelocityData]);

  const generateVelocityAnalysis = useCallback((
    expensesData: Expense[], 
    budgetsData: Budget[], 
    categoriesData: ExpenseCategory[]
  ) => {
    const now = new Date();
    const periodDays = selectedPeriod === 'week' ? 7 : 30;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - periodDays);
    
    // Filter expenses within the selected period
    const periodExpenses = expensesData.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate;
    });

    // Calculate current velocity (daily spending rate)
    const totalAmount = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const currentVelocity = totalAmount / periodDays;

    // Calculate optimal velocity based on budgets
    const totalBudget = budgetsData.reduce((sum, budget) => {
      if (budget.period === 'monthly') return sum + budget.amount;
      if (budget.period === 'weekly') return sum + (budget.amount * 4.33);
      return sum + budget.amount;
    }, 0);

    const monthlyBudget = selectedPeriod === 'month' ? totalBudget : totalBudget / 4.33;
    const optimalVelocity = monthlyBudget / (selectedPeriod === 'week' ? 7 : 30);

    // Calculate projections
    const velocityRatio = optimalVelocity > 0 ? currentVelocity / optimalVelocity : 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;
    const projectedMonthlySpend = currentVelocity * daysInMonth;
    const projectedOverage = Math.max(0, projectedMonthlySpend - monthlyBudget);

    // Determine trend
    const firstHalf = periodExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const midPoint = new Date(startDate);
      midPoint.setDate(startDate.getDate() + Math.floor(periodDays / 2));
      return expenseDate <= midPoint;
    });
    const secondHalf = periodExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const midPoint = new Date(startDate);
      midPoint.setDate(startDate.getDate() + Math.floor(periodDays / 2));
      return expenseDate > midPoint;
    });

    const firstHalfVelocity = firstHalf.reduce((sum, expense) => sum + expense.amount, 0) / Math.floor(periodDays / 2);
    const secondHalfVelocity = secondHalf.reduce((sum, expense) => sum + expense.amount, 0) / Math.ceil(periodDays / 2);
    
    let trend: 'accelerating' | 'decelerating' | 'stable' = 'stable';
    if (firstHalfVelocity > 0) {
      const change = (secondHalfVelocity - firstHalfVelocity) / firstHalfVelocity;
      if (change > 0.2) trend = 'accelerating';
      else if (change < -0.2) trend = 'decelerating';
    }

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (velocityRatio > 2) riskLevel = 'critical';
    else if (velocityRatio > 1.5) riskLevel = 'high';
    else if (velocityRatio > 1.1) riskLevel = 'moderate';

    setVelocityData({
      currentVelocity,
      optimalVelocity,
      velocityRatio,
      projectedOverage,
      daysRemaining,
      trend,
      riskLevel
    });

    // Calculate weekly velocity breakdown
    calculateWeeklyVelocity(expensesData);

    // Calculate category velocities
    calculateCategoryVelocities(periodExpenses, categoriesData);
  }, [selectedPeriod]);

  const calculateWeeklyVelocity = useCallback((expensesData: Expense[]) => {
    const weeks: PeriodVelocity[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekExpenses = expensesData.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });

      const totalAmount = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      weeks.push({
        period: `W${4 - i}`,
        velocity: totalAmount / 7,
        amount: totalAmount,
        days: 7
      });
    }

    setWeeklyVelocity(weeks);
  }, []);

  const calculateCategoryVelocities = useCallback((
    periodExpenses: Expense[], 
    categoriesData: ExpenseCategory[]
  ) => {
    const categorySpending = new Map<string, number>();
    const totalSpent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Sum spending by category
    periodExpenses.forEach(expense => {
      const current = categorySpending.get(expense.category.id) || 0;
      categorySpending.set(expense.category.id, current + expense.amount);
    });

    // Create category velocity data
    const velocities: CategoryVelocity[] = [];
    for (const [categoryId, amount] of categorySpending.entries()) {
      const category = categoriesData.find(cat => cat.id === categoryId);
      if (!category) continue;

      const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      const velocity = amount / (selectedPeriod === 'week' ? 7 : 30);

      // Determine trend and risk (simplified for this example)
      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      if (percentage > 40) riskLevel = 'high';
      else if (percentage > 25) riskLevel = 'moderate';

      velocities.push({
        category,
        velocity,
        percentage,
        trend: 'stable', // Could be enhanced with historical comparison
        riskLevel
      });
    }

    // Sort by percentage
    velocities.sort((a, b) => b.percentage - a.percentage);
    setCategoryVelocities(velocities.slice(0, 5)); // Top 5 categories
  }, [selectedPeriod]);

  // Memoized velocity data to prevent unnecessary recalculations
  const memoizedVelocityData = useMemo(() => {
    return velocityData;
  }, [velocityData]);

  const memoizedWeeklyVelocity = useMemo(() => {
    return weeklyVelocity;
  }, [weeklyVelocity]);

  const memoizedCategoryVelocities = useMemo(() => {
    return categoryVelocities;
  }, [categoryVelocities]);

  const renderVelocityOverview = useCallback(() => {
    if (!memoizedVelocityData) return null;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'critical': return theme.error;
        case 'high': return theme.warning;
        case 'moderate': return theme.orange;
        default: return theme.success;
      }
    };

    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'accelerating': return 'trending-up';
        case 'decelerating': return 'trending-down';
        default: return 'trending-flat';
      }
    };

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>Spending Velocity</Text>
        
        <View style={styles.velocityGrid}>
          <View style={styles.velocityItem}>
            <View style={[styles.velocityIcon, { backgroundColor: getRiskColor(memoizedVelocityData.riskLevel) + '15' }]}>
              <MaterialIcons name="speed" size={24} color={getRiskColor(memoizedVelocityData.riskLevel)} />
            </View>
            <Text style={styles.velocityLabel}>Current Rate</Text>
            <Text style={[styles.velocityValue, { color: getRiskColor(memoizedVelocityData.riskLevel) }]}>
              {formatCurrency(memoizedVelocityData.currentVelocity)}/day
            </Text>
          </View>

          <View style={styles.velocityItem}>
            <View style={[styles.velocityIcon, { backgroundColor: theme.primary + '15' }]}>
              <MaterialIcons name="my-location" size={24} color={theme.primary} />
            </View>
            <Text style={styles.velocityLabel}>Optimal Rate</Text>
            <Text style={[styles.velocityValue, { color: theme.primary }]}>
              {formatCurrency(memoizedVelocityData.optimalVelocity)}/day
            </Text>
          </View>

          <View style={styles.velocityItem}>
            <View style={[styles.velocityIcon, { backgroundColor: theme.secondary + '15' }]}>
              <MaterialIcons name={getTrendIcon(memoizedVelocityData.trend) as any} size={24} color={theme.secondary} />
            </View>
            <Text style={styles.velocityLabel}>Trend</Text>
            <Text style={[styles.velocityValue, { color: theme.secondary }]}>
              {memoizedVelocityData.trend.charAt(0).toUpperCase() + memoizedVelocityData.trend.slice(1)}
            </Text>
          </View>

          <View style={styles.velocityItem}>
            <View style={[styles.velocityIcon, { backgroundColor: theme.orange + '15' }]}>
              <MaterialIcons name="warning" size={24} color={theme.orange} />
            </View>
            <Text style={styles.velocityLabel}>Risk Level</Text>
            <Text style={[styles.velocityValue, { color: getRiskColor(memoizedVelocityData.riskLevel) }]}>
              {memoizedVelocityData.riskLevel.charAt(0).toUpperCase() + memoizedVelocityData.riskLevel.slice(1)}
            </Text>
          </View>
        </View>

        {memoizedVelocityData.projectedOverage > 0 && (
          <View style={styles.warningCard}>
            <MaterialIcons name="warning" size={20} color={theme.warning} />
            <Text style={styles.warningText}>
              At current rate, you'll exceed budget by {formatCurrency(memoizedVelocityData.projectedOverage)} this month
            </Text>
          </View>
        )}
      </View>
    );
  }, [memoizedVelocityData, theme, styles]);

  const renderVelocityChart = useCallback(() => {
    if (memoizedWeeklyVelocity.length === 0) return null;

    const maxVelocity = Math.max(...memoizedWeeklyVelocity.map(w => w.velocity));
    const chartHeight = 120;

    return (
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Weekly Velocity Trend</Text>
        
        <View style={styles.velocityChart}>
          {memoizedWeeklyVelocity.map((week, index) => {
            const barHeight = maxVelocity > 0 ? (week.velocity / maxVelocity) * chartHeight : 0;
            
            return (
              <View key={week.period} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: barHeight,
                        backgroundColor: week.velocity > (memoizedVelocityData?.optimalVelocity || 0) ? theme.error : theme.primary
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{week.period}</Text>
                <Text style={styles.barValue}>{formatCurrency(week.velocity)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [memoizedWeeklyVelocity, memoizedVelocityData, theme, styles]);

  const renderCategoryVelocities = useCallback(() => {
    if (memoizedCategoryVelocities.length === 0) return null;

    return (
      <View style={styles.categoryCard}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        
        {memoizedCategoryVelocities.map((catVel, index) => {
          const getRiskColor = (risk: string) => {
            switch (risk) {
              case 'high': return '#E53E3E';
              case 'moderate': return '#DD6B20';
              default: return '#48BB78';
            }
          };

          return (
            <View key={catVel.category.id} style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIcon, { backgroundColor: catVel.category.color }]}>
                  <Text style={styles.categoryEmoji}>{catVel.category.emoji}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{catVel.category.name}</Text>
                  <Text style={styles.categoryPercentage}>{catVel.percentage.toFixed(1)}% of spending</Text>
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryVelocity, { color: getRiskColor(catVel.riskLevel) }]}>
                  {formatCurrency(catVel.velocity)}/day
                </Text>
                <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(catVel.riskLevel) }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  }, [memoizedCategoryVelocities, styles]);

  const renderPeriodSelector = useCallback(() => {
    return (
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[styles.periodOption, selectedPeriod === 'week' && styles.periodOptionActive]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[
            styles.periodOptionText,
            selectedPeriod === 'week' && styles.periodOptionTextActive
          ]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodOption, selectedPeriod === 'month' && styles.periodOptionActive]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[
            styles.periodOptionText,
            selectedPeriod === 'month' && styles.periodOptionTextActive
          ]}>
          Month
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [selectedPeriod, styles]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Spending Velocity</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={[styles.selectorCard, { backgroundColor: theme.surface }]}>
            {renderPeriodSelector()}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing spending velocity...</Text>
            </View>
          ) : (
            <>
              {renderVelocityOverview()}
              {renderVelocityChart()}
              {renderCategoryVelocities()}
            </>
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
  selectorCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodOptionActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  periodOptionTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  overviewCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  velocityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  velocityItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  velocityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  velocityLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  velocityValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.secondaryContainer,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 12,
    color: theme.warning,
    marginLeft: 8,
    flex: 1,
  },
  chartCard: {
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
  velocityChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    width: 32,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 32,
    borderRadius: 4,
    backgroundColor: theme.primary,
  },
  barLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.text,
  },
  categoryCard: {
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  categoryPercentage: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryVelocity: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
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
});