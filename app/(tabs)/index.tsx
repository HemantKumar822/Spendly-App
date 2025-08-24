import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Expense, ExpenseSummary } from '@/types';
import { StorageService } from '@/services/storage';
import { AIService } from '@/services/ai';
import { formatCurrency, generateExpenseSummary, formatDate } from '@/utils';
import EditExpenseModal from '@/components/EditExpenseModal';
import AchievementSystem from '@/components/AchievementSystem';
import SpendingStreak from '@/components/SpendingStreak';
import LevelSystem from '@/components/LevelSystem';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useExpenseSubscription } from '@/hooks/useDataSubscription';
import {
  SkeletonSummaryCard,
  SkeletonOverviewCard,
  SkeletonInsightCard,
  SkeletonTransactionsList,
} from '@/components/ui/Skeleton';
import AnimatedCard from '@/components/ui/AnimatedCard';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { NoTodayExpensesState } from '@/components/ui/EmptyStatePresets';
import ResponsiveContainer, { ResponsiveTwoColumn, ResponsiveGrid } from '@/components/ui/ResponsiveContainer';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';

// Memoized sub-components for better performance
const SummaryCard = memo(({ todaySummary, todayExpenses, theme }: {
  todaySummary: any;
  todayExpenses: Expense[];
  theme: Theme;
}) => (
  <AnimatedCard 
    style={getStyles(theme).summaryCard}
    animationType="slide"
    delay={100}
  >
    <View style={getStyles(theme).summaryHeader}>
      <MaterialIcons name="today" size={24} color={theme.primary} />
      <Text style={getStyles(theme).summaryTitle}>Today's Spending</Text>
    </View>
    <Text style={getStyles(theme).summaryAmount}>
      {formatCurrency(todaySummary?.totalAmount || 0)}
    </Text>
    <Text style={getStyles(theme).summarySubtext}>
      {todayExpenses.length} transaction{todayExpenses.length !== 1 ? 's' : ''}
    </Text>
  </AnimatedCard>
));

const OverviewCard = memo(({ weekSummary, theme }: {
  weekSummary: any;
  theme: Theme;
}) => (
  <AnimatedCard 
    style={getStyles(theme).overviewCard}
    animationType="slide"
    delay={200}
  >
    <View style={getStyles(theme).overviewRow}>
      <View style={getStyles(theme).overviewItem}>
        <MaterialIcons name="calendar-today" size={20} color={theme.secondary} />
        <Text style={getStyles(theme).overviewLabel}>This Week</Text>
        <Text style={getStyles(theme).overviewValue}>
          {formatCurrency(weekSummary?.totalAmount || 0)}
        </Text>
      </View>
      <View style={getStyles(theme).divider} />
      <View style={getStyles(theme).overviewItem}>
        <MaterialIcons name="trending-up" size={20} color={theme.orange} />
        <Text style={getStyles(theme).overviewLabel}>Avg/Day</Text>
        <Text style={getStyles(theme).overviewValue}>
          {formatCurrency(weekSummary?.totalAmount && weekSummary?.startDate && weekSummary?.endDate 
            ? weekSummary.totalAmount / ((new Date(weekSummary.endDate).getTime() - new Date(weekSummary.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1)
            : 0)}
        </Text>
      </View>
    </View>
  </AnimatedCard>
));

const AIInsightsCard = memo(({ aiInsights, theme }: {
  aiInsights: any[];
  theme: Theme;
}) => {
  if (aiInsights.length === 0) return null;
  
  return (
    <AnimatedCard 
      style={getStyles(theme).insightsCard}
      animationType="scale"
      delay={300}
    >
      <View style={getStyles(theme).insightsHeader}>
        <MaterialIcons name="lightbulb" size={20} color={theme.primary} />
        <Text style={getStyles(theme).insightsTitle}>AI Insights</Text>
      </View>
      {aiInsights.map((insight, index) => (
        <View key={insight.id} style={getStyles(theme).insightItem}>
          <View style={[
            getStyles(theme).insightIcon,
            { backgroundColor: 
              insight.type === 'warning' ? theme.error + '20' :
              insight.type === 'achievement' ? theme.success + '20' : theme.primaryContainer
            }
          ]}>
            <MaterialIcons 
              name={
                insight.type === 'warning' ? 'warning' :
                insight.type === 'achievement' ? 'star' : 'tips-and-updates'
              } 
              size={16} 
              color={
                insight.type === 'warning' ? theme.error :
                insight.type === 'achievement' ? theme.success : theme.primary
              } 
            />
          </View>
          <View style={getStyles(theme).insightContent}>
            <Text style={getStyles(theme).insightTitle}>{insight.title}</Text>
            <Text style={getStyles(theme).insightMessage}>{insight.message}</Text>
          </View>
        </View>
      ))}
    </AnimatedCard>
  );
});

const TransactionItem = memo(({ expense, onEdit, onDelete, theme }: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  theme: Theme;
}) => {
  const { triggerLightHaptic, triggerMediumHaptic } = useHaptics();
  
  return (
    <View style={getStyles(theme).transactionItem}>
      <View style={getStyles(theme).transactionLeft}>
        <View style={[getStyles(theme).categoryIcon, { backgroundColor: expense.category.color }]}>
          <Text style={getStyles(theme).categoryEmoji}>{expense.category.emoji}</Text>
        </View>
        <View style={getStyles(theme).transactionDetails}>
          <Text style={getStyles(theme).transactionDesc}>{expense.description}</Text>
          <Text style={getStyles(theme).transactionCategory}>{expense.category.name}</Text>
        </View>
      </View>
      <View style={getStyles(theme).transactionRight}>
        <Text style={getStyles(theme).transactionAmount}>
          {formatCurrency(expense.amount)}
        </Text>
        <View style={getStyles(theme).transactionActions}>
          <TouchableOpacity 
            onPress={() => {
              triggerLightHaptic();
              onEdit(expense);
            }}
            style={getStyles(theme).actionButton}
          >
            <MaterialIcons name="edit" size={16} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              triggerMediumHaptic();
              onDelete(expense);
            }}
            style={getStyles(theme).actionButton}
          >
            <MaterialIcons name="delete" size={16} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

function DashboardScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic, triggerSuccessHaptic, triggerErrorHaptic } = useHaptics();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const router = useRouter();
  const styles = getStyles(theme);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [achievementsVisible, setAchievementsVisible] = useState(false);
  const [streakVisible, setStreakVisible] = useState(false);
  const [levelVisible, setLevelVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await StorageService.initializeApp();
      const [allExpenses, budgets] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getBudgets()
      ]);
      
      setExpenses(allExpenses);
      
      // Load AI insights only if we have expenses
      if (allExpenses.length > 0) {
        try {
          const insights = await AIService.generateInsights({
            expenses: allExpenses,
            budgets: budgets,
            timeframe: 'week'
          });
          setAiInsights(insights.slice(0, 2)); // Show top 2 insights
        } catch (error) {
          console.error('Error loading AI insights:', error);
          setAiInsights([]); // Clear insights on error
        }
      } else {
        setAiInsights([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Show error state
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to expense changes for automatic updates
  useExpenseSubscription(useCallback(() => {
    loadData();
  }, [loadData]));

  // Optimized memoized calculations for better performance
  const { todayExpenses, todaySummary, weekSummary } = useMemo(() => {
    const today = new Date().toDateString();
    
    const todayExpenses = expenses.filter(expense => 
      new Date(expense.date).toDateString() === today
    );
    
    const todaySummary = generateExpenseSummary(todayExpenses, 'today');
    const weekSummary = generateExpenseSummary(expenses, 'week');
    
    return { todayExpenses, todaySummary, weekSummary };
  }, [expenses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditExpense = useCallback((expense: Expense) => {
    triggerLightHaptic();
    setSelectedExpense(expense);
    setEditModalVisible(true);
  }, [triggerLightHaptic]);

  const handleDeleteExpense = useCallback((expense: Expense) => {
    triggerMediumHaptic();
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
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
              triggerErrorHaptic();
              await StorageService.deleteExpense(expense.id);
              await loadData(); // Refresh data
              triggerSuccessHaptic();
              Alert.alert('Success', 'Expense deleted successfully!');
            } catch (error) {
              console.error('Error deleting expense:', error);
              triggerErrorHaptic();
              Alert.alert('Error', 'Failed to delete expense.');
            }
          },
        },
      ]
    );
  }, [triggerMediumHaptic, triggerLightHaptic, triggerErrorHaptic, triggerSuccessHaptic, loadData]);

  const handleExpenseUpdated = useCallback(async (updatedExpense: Expense) => {
    await loadData(); // Refresh data after update
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <Text style={styles.appName}>Spendly</Text>
              <Text style={styles.dateText}>{formatDate(new Date())}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.streakButton}
                onPress={() => {
                  triggerLightHaptic();
                  setStreakVisible(true);
                }}
              >
                <MaterialIcons name="local-fire-department" size={20} color={theme.error} />
                <Text style={[styles.levelButtonText, { color: theme.error }]}>Streak</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.levelButton}
                onPress={() => {
                  triggerLightHaptic();
                  setLevelVisible(true);
                }}
              >
                <MaterialIcons name="auto-awesome" size={20} color={theme.purple} />
                <Text style={styles.levelButtonText}>Level</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.achievementButton}
                onPress={() => {
                  triggerLightHaptic();
                  setAchievementsVisible(true);
                }}
              >
                <MaterialIcons name="emoji-events" size={20} color={theme.gold} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Skeleton Loading States */}
          <SkeletonSummaryCard />
          <SkeletonOverviewCard />
          <SkeletonInsightCard />
          <SkeletonTransactionsList />
        </ScrollView>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.scrollView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>Spendly</Text>
            <Text style={styles.dateText}>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.streakButton}
              onPress={() => {
                triggerLightHaptic();
                setStreakVisible(true);
              }}
            >
              <MaterialIcons name="local-fire-department" size={20} color={theme.error} />
              <Text style={[styles.levelButtonText, { color: theme.error }]}>Streak</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.levelButton}
              onPress={() => {
                triggerLightHaptic();
                setLevelVisible(true);
              }}
            >
              <MaterialIcons name="auto-awesome" size={20} color={theme.purple} />
              <Text style={styles.levelButtonText}>Level</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.achievementButton}
              onPress={() => {
                triggerLightHaptic();
                setAchievementsVisible(true);
              }}
            >
              <MaterialIcons name="emoji-events" size={20} color={theme.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Summary */}
        <SummaryCard 
          todaySummary={todaySummary}
          todayExpenses={todayExpenses}
          theme={theme}
        />

        {/* Week Overview */}
        <OverviewCard 
          weekSummary={weekSummary}
          theme={theme}
        />

        {/* AI Insights */}
        <AIInsightsCard 
          aiInsights={aiInsights}
          theme={theme}
        />

        {/* Recent Transactions */}
        <AnimatedCard 
          style={styles.transactionsCard}
          animationType="slide"
          delay={400}
        >
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Today's Transactions</Text>
            {todayExpenses.length > 0 && (
              <Text style={styles.seeAllText}>See all</Text>
            )}
          </View>
          
          {todayExpenses.length === 0 ? (
            <NoTodayExpensesState />
          ) : (
            todayExpenses.map((expense) => (
              <TransactionItem
                key={expense.id}
                expense={expense}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                theme={theme}
              />
            ))
          )}
        </AnimatedCard>
      </ScrollView>
      
      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        onPress={() => {
          triggerMediumHaptic();
          router.push('/(tabs)/add-expense');
        }}
        delay={600}
      />
      
      {/* Edit Expense Modal */}
      <EditExpenseModal
        visible={editModalVisible}
        expense={selectedExpense}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedExpense(null);
        }}
        onSave={handleExpenseUpdated}
      />
      
      {/* Achievement System Modal */}
      <AchievementSystem
        visible={achievementsVisible}
        onClose={() => setAchievementsVisible(false)}
      />
      
      {/* Spending Streak Modal */}
      <SpendingStreak
        visible={streakVisible}
        onClose={() => setStreakVisible(false)}
      />
      
      {/* Level System Modal */}
      <LevelSystem
        visible={levelVisible}
        onClose={() => setLevelVisible(false)}
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
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: theme.surface,
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
  },
  levelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.purple,
    marginLeft: 4,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
  },
  achievementButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '400',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: theme.textTertiary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  overviewCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: theme.border,
    marginHorizontal: 20,
  },
  transactionsCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  transactionDesc: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  transactionCategory: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  insightsCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
});

export default memo(DashboardScreen);
