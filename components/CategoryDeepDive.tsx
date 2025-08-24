import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Expense, ExpenseCategory, CategorySpending } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency, formatDateShort } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 60;

interface CategoryAnalysis {
  category: ExpenseCategory;
  totalAmount: number;
  percentage: number;
  expenseCount: number;
  averageExpense: number;
  recentExpenses: Expense[];
  monthlyTrend: { month: string; amount: number }[];
  topExpenses: Expense[];
  frequencyData: { day: string; count: number }[];
}

interface CategoryDeepDiveProps {
  visible: boolean;
  onClose: () => void;
  selectedCategoryId?: string;
}

export default function CategoryDeepDive({ visible, onClose, selectedCategoryId }: CategoryDeepDiveProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'3months' | '6months' | '1year'>('3months');

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, selectedPeriod]);

  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      if (category) {
        setSelectedCategory(category);
        generateCategoryAnalysis(category);
      }
    }
  }, [selectedCategoryId, categories, expenses]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getCategories()
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
      
      // If no specific category selected, pick the category with most expenses
      if (!selectedCategoryId && expensesData.length > 0) {
        const categoryTotals = new Map<string, number>();
        expensesData.forEach(expense => {
          const current = categoryTotals.get(expense.category.id) || 0;
          categoryTotals.set(expense.category.id, current + expense.amount);
        });
        
        const topCategoryId = Array.from(categoryTotals.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        
        if (topCategoryId) {
          const topCategory = categoriesData.find(cat => cat.id === topCategoryId);
          if (topCategory) {
            setSelectedCategory(topCategory);
            generateCategoryAnalysis(topCategory);
          }
        }
      }
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const generateCategoryAnalysis = useCallback((category: ExpenseCategory) => {
    const now = new Date();
    const periodMonths = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12;
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - periodMonths);

    // Filter expenses for this category and period
    const categoryExpenses = expenses.filter(expense => 
      expense.category.id === category.id && 
      new Date(expense.date) >= startDate
    );

    if (categoryExpenses.length === 0) {
      setCategoryAnalysis({
        category,
        totalAmount: 0,
        percentage: 0,
        expenseCount: 0,
        averageExpense: 0,
        recentExpenses: [],
        monthlyTrend: [],
        topExpenses: [],
        frequencyData: []
      });
      return;
    }

    const totalAmount = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalAllExpenses = expenses
      .filter(exp => new Date(exp.date) >= startDate)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    const percentage = totalAllExpenses > 0 ? (totalAmount / totalAllExpenses) * 100 : 0;
    const averageExpense = totalAmount / categoryExpenses.length;

    // Recent expenses (last 10)
    const recentExpenses = categoryExpenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Top expenses
    const topExpenses = categoryExpenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly trend
    const monthlyTrend = generateMonthlyTrend(categoryExpenses, periodMonths);

    // Frequency data (day of week)
    const frequencyData = generateFrequencyData(categoryExpenses);

    setCategoryAnalysis({
      category,
      totalAmount,
      percentage,
      expenseCount: categoryExpenses.length,
      averageExpense,
      recentExpenses,
      monthlyTrend,
      topExpenses,
      frequencyData
    });
  }, [expenses, selectedPeriod]);

  const generateMonthlyTrend = useCallback((expenses: Expense[], months: number) => {
    const monthlyData = new Map<string, number>();
    const now = new Date();
    
    // Initialize all months
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData.set(monthKey, 0);
    }

    // Sum expenses by month
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const monthKey = expenseDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const current = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, current + expense.amount);
    });

    return Array.from(monthlyData.entries()).map(([month, amount]) => ({
      month,
      amount
    }));
  }, []);

  const generateFrequencyData = useCallback((expenses: Expense[]) => {
    const dayCount = new Map<string, number>();
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize all days
    daysOfWeek.forEach(day => dayCount.set(day, 0));

    // Count expenses by day of week
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const dayOfWeek = daysOfWeek[expenseDate.getDay()];
      const current = dayCount.get(dayOfWeek) || 0;
      dayCount.set(dayOfWeek, current + 1);
    });

    return daysOfWeek.map(day => ({
      day,
      count: dayCount.get(day) || 0
    }));
  }, []);

  // Memoized category analysis to prevent unnecessary recalculations
  const memoizedCategoryAnalysis = useMemo(() => {
    return categoryAnalysis;
  }, [categoryAnalysis]);

  const renderCategorySelector = useCallback(() => {
    if (categories.length === 0) return null;

    return (
      <View style={styles.categorySelectorCard}>
        <Text style={styles.sectionTitle}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map(category => {
            const categoryExpenses = expenses.filter(exp => exp.category.id === category.id);
            const isSelected = selectedCategory?.id === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                  { borderColor: isSelected ? category.color : '#E2E8F0' }
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  generateCategoryAnalysis(category);
                }}
              >
                <View style={[styles.categoryIconSmall, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmojiSmall}>{category.emoji}</Text>
                </View>
                <View style={styles.categoryChipInfo}>
                  <Text style={[styles.categoryChipName, isSelected && styles.categoryChipNameSelected]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.categoryChipCount, isSelected && styles.categoryChipCountSelected]}>
                    {categoryExpenses.length} expenses
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }, [categories, expenses, selectedCategory, generateCategoryAnalysis, styles]);

  const renderOverviewStats = useCallback(() => {
    if (!categoryAnalysis) return null;

    const stats = [
      {
        icon: 'account-balance-wallet',
        label: 'Total Spent',
        value: formatCurrency(categoryAnalysis.totalAmount),
        color: '#4ECDC4'
      },
      {
        icon: 'pie-chart',
        label: 'Share of Budget',
        value: `${categoryAnalysis.percentage.toFixed(1)}%`,
        color: '#96CEB4'
      },
      {
        icon: 'receipt',
        label: 'Transactions',
        value: categoryAnalysis.expenseCount.toString(),
        color: '#FFEAA7'
      },
      {
        icon: 'trending-up',
        label: 'Avg per Transaction',
        value: formatCurrency(categoryAnalysis.averageExpense),
        color: '#FFB6C1'
      }
    ];

    return (
      <View style={styles.overviewCard}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <MaterialIcons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }, [categoryAnalysis, styles]);

  const renderMonthlyTrend = useCallback(() => {
    if (!categoryAnalysis || categoryAnalysis.monthlyTrend.length === 0) return null;

    const maxAmount = Math.max(...categoryAnalysis.monthlyTrend.map(m => m.amount));
    
    return (
      <View style={styles.trendCard}>
        <Text style={styles.sectionTitle}>Monthly Trend</Text>
        <View style={styles.trendChart}>
          {categoryAnalysis.monthlyTrend.map((month, index) => {
            const barHeight = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
            
            return (
              <View key={index} style={styles.trendBar}>
                <View style={styles.trendBarContainer}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${barHeight}%`,
                        backgroundColor: categoryAnalysis.category.color
                      }
                    ]}
                  />
                </View>
                <Text style={styles.trendBarLabel}>{month.month}</Text>
                <Text style={styles.trendBarValue}>
                  {month.amount > 0 ? formatCurrency(month.amount) : '-'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }, [categoryAnalysis, styles]);

  const renderFrequencyAnalysis = useCallback(() => {
    if (!categoryAnalysis || categoryAnalysis.frequencyData.length === 0) return null;

    const maxCount = Math.max(...categoryAnalysis.frequencyData.map(d => d.count));
    const mostFrequentDay = categoryAnalysis.frequencyData.reduce((max, day) => 
      day.count > max.count ? day : max
    );

    return (
      <View style={styles.frequencyCard}>
        <Text style={styles.sectionTitle}>Spending Pattern</Text>
        <View style={styles.frequencyChart}>
          {categoryAnalysis.frequencyData.map((day, index) => {
            const barHeight = maxCount > 0 ? (day.count / maxCount) * 80 : 0;
            
            return (
              <View key={index} style={styles.frequencyBar}>
                <View style={styles.frequencyBarContainer}>
                  <View
                    style={[
                      styles.frequencyBarFill,
                      {
                        height: barHeight,
                        backgroundColor: day.day === mostFrequentDay.day 
                          ? categoryAnalysis.category.color 
                          : categoryAnalysis.category.color + '60'
                      }
                    ]}
                  />
                </View>
                <Text style={styles.frequencyBarLabel}>{day.day}</Text>
                <Text style={styles.frequencyBarCount}>{day.count}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.frequencyInsight}>
          You spend most on {categoryAnalysis.category.name.toLowerCase()} on {mostFrequentDay.day}s
        </Text>
      </View>
    );
  }, [categoryAnalysis, styles]);

  const renderTopExpenses = useCallback(() => {
    if (!categoryAnalysis || categoryAnalysis.topExpenses.length === 0) return null;

    return (
      <View style={styles.topExpensesCard}>
        <Text style={styles.sectionTitle}>Highest Expenses</Text>
        {categoryAnalysis.topExpenses.map((expense, index) => (
          <View key={expense.id} style={styles.expenseItem}>
            <View style={styles.expenseRank}>
              <Text style={styles.expenseRankText}>{index + 1}</Text>
            </View>
            <View style={styles.expenseDetails}>
              <Text style={styles.expenseDescription} numberOfLines={1}>
                {expense.description}
              </Text>
              <Text style={styles.expenseDate}>
                {formatDateShort(expense.date)}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatCurrency(expense.amount)}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [categoryAnalysis, styles]);

  const renderRecentExpenses = useCallback(() => {
    if (!categoryAnalysis || categoryAnalysis.recentExpenses.length === 0) return null;

    return (
      <View style={styles.recentExpensesCard}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {categoryAnalysis.recentExpenses.slice(0, 5).map((expense) => (
          <View key={expense.id} style={styles.recentExpenseItem}>
            <View style={styles.recentExpenseDetails}>
              <Text style={styles.recentExpenseDescription} numberOfLines={1}>
                {expense.description}
              </Text>
              <Text style={styles.recentExpenseDate}>
                {formatDateShort(expense.date)}
              </Text>
            </View>
            <Text style={styles.recentExpenseAmount}>
              {formatCurrency(expense.amount)}
            </Text>
          </View>
        ))}
      </View>
    );
  }, [categoryAnalysis, styles]);

  const renderPeriodSelector = useCallback(() => {
    const periods = [
      { key: '3months' as const, label: '3 Months' },
      { key: '6months' as const, label: '6 Months' },
      { key: '1year' as const, label: '1 Year' }
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
  }, [selectedPeriod, styles]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Category Analysis</Text>
            {selectedCategory && (
              <Text style={styles.headerSubtitle}>{selectedCategory.name}</Text>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Analyzing category data...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Period Selector */}
            <View style={styles.headerSection}>
              <View style={styles.periodSelector}>
                {(['3months', '6months', '1year'] as const).map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      selectedPeriod === period && styles.periodButtonActive
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive
                    ]}>
                      {period === '3months' ? '3M' : period === '6months' ? '6M' : '1Y'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Selector */}
            {renderCategorySelector()}

            {/* Overview Stats */}
            {renderOverviewStats()}

            {/* Monthly Trend */}
            {renderMonthlyTrend()}

            {/* Frequency Analysis */}
            {renderFrequencyAnalysis()}

            {/* Top Expenses */}
            {renderTopExpenses()}

            {/* Recent Expenses */}
            {renderRecentExpenses()}
          </ScrollView>
        )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border, // Changed from '#F7FAFC'
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceVariant, // Changed from '#F7FAFC'
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
    backgroundColor: theme.surface, // Changed from 'white'
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary, // Changed from '#4A5568'
  },
  periodButtonTextActive: {
    color: theme.text, // Changed from '#2D3748'
    fontWeight: '600',
  },
  categorySelectorCard: {
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    minWidth: 140,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderColor: theme.border, // Added border color
  },
  categoryChipSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    borderColor: theme.primary, // Added border color for selected state
  },
  categoryIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryEmojiSmall: {
    fontSize: 14,
  },
  categoryChipInfo: {
    flex: 1,
  },
  categoryChipName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text, // Changed from '#2D3748'
  },
  categoryChipNameSelected: {
    color: theme.text, // Changed from '#2D3748'
  },
  categoryChipCount: {
    fontSize: 12,
    color: theme.textSecondary, // Changed from '#718096'
    marginTop: 2,
  },
  categoryChipCountSelected: {
    color: theme.text, // Changed from '#4A5568'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text, // Changed from '#2D3748'
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: theme.surfaceVariant, // Added background color
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text, // Changed from '#2D3748'
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary, // Changed from '#718096'
    textAlign: 'center',
  },
  trendCard: {
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  trendBarContainer: {
    height: 80,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: theme.surfaceVariant, // Changed from '#F7FAFC'
    borderRadius: 4,
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  trendBarLabel: {
    fontSize: 10,
    color: theme.textSecondary, // Changed from '#718096'
    marginTop: 4,
    textAlign: 'center',
  },
  trendBarValue: {
    fontSize: 9,
    color: theme.text, // Changed from '#4A5568'
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  frequencyCard: {
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  frequencyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: 16,
  },
  frequencyBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  frequencyBarContainer: {
    height: 60,
    width: 20,
    justifyContent: 'flex-end',
    backgroundColor: theme.surfaceVariant, // Changed from '#F7FAFC'
    borderRadius: 10,
  },
  frequencyBarFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 2,
  },
  frequencyBarLabel: {
    fontSize: 10,
    color: theme.textSecondary, // Changed from '#718096'
    marginTop: 4,
    textAlign: 'center',
  },
  frequencyBarCount: {
    fontSize: 10,
    color: theme.text, // Changed from '#4A5568'
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  frequencyInsight: {
    fontSize: 14,
    color: theme.textSecondary, // Changed from '#718096'
    textAlign: 'center',
    fontStyle: 'italic',
  },
  topExpensesCard: {
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border, // Changed from '#F7FAFC'
  },
  expenseRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary, // Changed from '#4ECDC4'
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.onPrimary, // Changed from 'white'
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text, // Changed from '#2D3748'
  },
  expenseDate: {
    fontSize: 12,
    color: theme.textSecondary, // Changed from '#718096'
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text, // Changed from '#2D3748'
  },
  recentExpensesCard: {
    backgroundColor: theme.surface, // Changed from 'white'
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.shadow, // Changed from '#000'
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border, // Changed from '#F7FAFC'
  },
  recentExpenseDetails: {
    flex: 1,
  },
  recentExpenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text, // Changed from '#2D3748'
  },
  recentExpenseDate: {
    fontSize: 12,
    color: theme.textSecondary, // Changed from '#718096'
    marginTop: 2,
  },
  recentExpenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text, // Changed from '#2D3748'
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary, // Changed from '#718096'
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
    color: theme.text, // Changed from '#4A5568'
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textTertiary, // Changed from '#A0AEC0'
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
