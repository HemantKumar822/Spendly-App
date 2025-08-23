import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { Expense, ExpenseSummary, Period } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency, generateExpenseSummary, formatDateShort } from '@/utils';
import ExpenseSearchModal from '@/components/ExpenseSearchModal';
import EnhancedAnalytics from '@/components/EnhancedAnalytics';
import CategoryDeepDive from '@/components/CategoryDeepDive';
import SpendingVelocity from '@/components/SpendingVelocity';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { NoExpensesState, NoAnalyticsDataState } from '@/components/ui/EmptyStatePresets';
import ResponsiveContainer, { ResponsiveTwoColumn, ResponsiveCardLayout } from '@/components/ui/ResponsiveContainer';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons, useResponsiveLayout } from '@/hooks/useResponsive';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

// Add state for showing different modals
interface SummaryScreenState {
  insightsVisible: boolean;
  velocityVisible: boolean;
}

export default function SummaryScreen() {
  const { theme } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic } = useHaptics();
  const styles = getStyles(theme);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [insightsVisible, setInsightsVisible] = useState(false);
  const [velocityVisible, setVelocityVisible] = useState(false);
  const [showingAllTransactions, setShowingAllTransactions] = useState(false);
  // Add state variables for search and bulk operations modals
  const [searchVisible, setSearchVisible] = useState(false);
  
  const chartWidth = 300;

  // Memoized expensive calculations
  const periodExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      
      switch (selectedPeriod) {
        case 'today':
          return expenseDate.toDateString() === now.toDateString();
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          return expenseDate >= weekStart;
        case 'month':
          return expenseDate.getMonth() === now.getMonth() && 
                 expenseDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [expenses, selectedPeriod]);

  const topExpensesList = useMemo(() => {
    return periodExpenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodExpenses]);

  const loadData = useCallback(async () => {
    try {
      const allExpenses = await StorageService.getExpenses();
      setExpenses(allExpenses);
      
      const periodSummary = generateExpenseSummary(allExpenses, selectedPeriod);
      setSummary(periodSummary);
    } catch (error) {
      console.error('Error loading summary data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const renderIntegratedPeriodSelector = () => {
    const periods: { key: Period; label: string }[] = [
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
    ];

    return (
      <View style={styles.integratedPeriodSelector}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodTab,
              selectedPeriod === period.key && styles.periodTabActive,
            ]}
            onPress={() => {
              triggerLightHaptic();
              setSelectedPeriod(period.key);
            }}
          >
            <Text
              style={[
                styles.periodTabText,
                selectedPeriod === period.key && styles.periodTabTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSimplifiedCategoryBreakdown = () => {
    if (!summary || summary.categoryBreakdown.length === 0) {
      return (
        <View style={styles.emptyCategories}>
          <MaterialIcons name="pie-chart" size={48} color={theme.textTertiary} />
          <Text style={styles.emptyText}>No spending data for this period</Text>
        </View>
      );
    }

    const topCategories = summary.categoryBreakdown.slice(0, 4);

    return (
      <View style={styles.categoryBreakdown}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>Spending Breakdown</Text>
          {summary.categoryBreakdown.length > 4 && (
            <TouchableOpacity
              onPress={() => {
                triggerLightHaptic();
                setInsightsVisible(true);
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {topCategories.map((item, index) => (
          <TouchableOpacity 
            key={item.category.id} 
            style={styles.categoryRow}
            onPress={() => {
              triggerLightHaptic();
              setInsightsVisible(true);
            }}
          >
            <View style={styles.categoryRowLeft}>
              <Text style={styles.categoryEmoji}>{item.category.emoji}</Text>
              <Text style={styles.categoryRowName}>{item.category.name}</Text>
            </View>
            <View style={styles.categoryRowRight}>
              <Text style={styles.categoryRowAmount}>{formatCurrency(item.totalAmount)}</Text>
              <Text style={styles.categoryRowPercentage}>{item.percentage.toFixed(0)}%</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity 
          style={styles.viewAnalysisButton}
          onPress={() => {
            triggerMediumHaptic();
            setInsightsVisible(true);
          }}
        >
          <MaterialIcons name="analytics" size={20} color={theme.primary} />
          <Text style={styles.viewAnalysisText}>View Detailed Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentActivity = () => {
    if (!expenses.length || periodExpenses.length === 0) {
      return (
        <View style={styles.emptyActivity}>
          <MaterialIcons name="receipt" size={48} color={theme.textTertiary} />
          <Text style={styles.emptyText}>No transactions for this period</Text>
          <Text style={styles.emptySubtext}>Start adding expenses to see your activity</Text>
        </View>
      );
    }

    // Group expenses by date
    const groupedExpenses = periodExpenses.reduce((groups, expense) => {
      const date = new Date(expense.date).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(expense);
      return groups;
    }, {} as Record<string, Expense[]>);

    const sortedDates = Object.keys(groupedExpenses)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, showingAllTransactions ? undefined : 3);

    return (
      <View style={styles.recentActivity}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          {periodExpenses.length > 6 && (
            <TouchableOpacity
              onPress={() => {
                triggerLightHaptic();
                setShowingAllTransactions(!showingAllTransactions);
              }}
            >
              <Text style={styles.viewAllText}>
                {showingAllTransactions ? 'Show Less' : 'View All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {sortedDates.map(date => {
          const dayExpenses = groupedExpenses[date]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, showingAllTransactions ? undefined : 3);
          
          const dateObj = new Date(date);
          const isToday = dateObj.toDateString() === new Date().toDateString();
          const isYesterday = dateObj.toDateString() === new Date(Date.now() - 86400000).toDateString();
          
          let dateLabel = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
          });
          if (isToday) dateLabel = 'Today';
          else if (isYesterday) dateLabel = 'Yesterday';
          
          return (
            <View key={date} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>{dateLabel}</Text>
              {dayExpenses.map(expense => (
                <View key={expense.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <Text style={styles.activityEmoji}>{expense.category.emoji}</Text>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityDescription}>{expense.description}</Text>
                      <Text style={styles.activityCategory}>{expense.category.name}</Text>
                    </View>
                  </View>
                  <Text style={styles.activityAmount}>{formatCurrency(expense.amount)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.scrollView}
      >
        {/* Streamlined Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.text }]}>Summary</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your spending analytics</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => {
                triggerLightHaptic();
                setSearchVisible(true);
              }}
            >
              <MaterialIcons name="search" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => {
                triggerLightHaptic();
                setInsightsVisible(true);
              }}
            >
              <MaterialIcons name="insights" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => {
                triggerMediumHaptic();
                setVelocityVisible(true);
              }}
            >
              <MaterialIcons name="speed" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Integrated Spending Overview */}
        <View style={[styles.spendingOverview, { backgroundColor: theme.surface }]}>
          {renderIntegratedPeriodSelector()}
          
          <View style={styles.totalSpendingSection}>
            <Text style={[styles.totalAmount, { color: theme.text }]}>
              {formatCurrency(summary?.totalAmount || 0)}
            </Text>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
              Total Spent {selectedPeriod === 'today' ? 'Today' : 
                          selectedPeriod === 'week' ? 'This Week' : 'This Month'}
            </Text>
            {summary && summary.categoryBreakdown.length > 0 && (
              <Text style={[styles.quickStats, { color: theme.textTertiary }]}>
                {summary.categoryBreakdown.length} categories • {periodExpenses.length} transactions
              </Text>
            )}
          </View>
        </View>

        {/* Simplified Category Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: theme.surface }]}>
          {renderSimplifiedCategoryBreakdown()}
        </View>

        {/* Enhanced Recent Activity */}
        <View style={[styles.activityCard, { backgroundColor: theme.surface }]}>
          {renderRecentActivity()}
        </View>
      </ScrollView>
      
      {/* Expense Search Modal */}
      <ExpenseSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onExpenseSelect={(expense) => {
          // Handle expense selection if needed
          setSearchVisible(false);
        }}
      />
      
      {/* Enhanced Analytics Modal */}
      <EnhancedAnalytics
        visible={insightsVisible}
        onClose={() => setInsightsVisible(false)}
      />
      
      {/* Spending Velocity Modal */}
      <SpendingVelocity
        visible={velocityVisible}
        onClose={() => setVelocityVisible(false)}
      />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
  },
  
  // Integrated Spending Overview
  spendingOverview: {
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
  integratedPeriodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: theme.surface,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  periodTabTextActive: {
    color: theme.text,
    fontWeight: '600',
  },
  totalSpendingSection: {
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 6,
  },
  quickStats: {
    fontSize: 13,
    color: theme.textTertiary,
  },
  
  // Simplified Category Breakdown
  breakdownCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryBreakdown: {
    // Main breakdown container
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  categoryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryRowName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    flex: 1,
  },
  categoryRowRight: {
    alignItems: 'flex-end',
  },
  categoryRowAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  categoryRowPercentage: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  viewAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: theme.primaryContainer,
  },
  viewAnalysisText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
    marginLeft: 6,
  },
  
  // Enhanced Recent Activity
  activityCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 30,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentActivity: {
    // Activity container
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  dayGroup: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  activityCategory: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  
  // Empty States
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
});