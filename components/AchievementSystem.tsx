import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Expense, Budget } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'spending' | 'budgeting' | 'consistency' | 'milestone' | 'smart';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  progress: number; // 0-100
  isUnlocked: boolean;
  unlockedAt?: string;
  requirement: string;
  reward?: string;
}

interface AchievementSystemProps {
  visible: boolean;
  onClose: () => void;
}

// Define all possible achievements
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'progress' | 'isUnlocked' | 'unlockedAt'>[] = [
  // Spending Achievements
  {
    id: 'first_expense',
    title: 'First Steps',
    description: 'Log your first expense',
    icon: 'star',
    category: 'milestone',
    tier: 'bronze',
    requirement: 'Add 1 expense',
    reward: 'Welcome to Spendly!'
  },
  {
    id: 'expense_streak_7',
    title: 'Weekly Warrior',
    description: 'Track expenses for 7 consecutive days',
    icon: 'local-fire-department',
    category: 'consistency',
    tier: 'bronze',
    requirement: '7 day streak',
    reward: 'Discipline builds habits!'
  },
  {
    id: 'expense_streak_30',
    title: 'Monthly Master',
    description: 'Track expenses for 30 consecutive days',
    icon: 'whatshot',
    category: 'consistency',
    tier: 'silver',
    requirement: '30 day streak',
    reward: 'You\'re on fire!'
  },
  {
    id: 'expense_streak_100',
    title: 'Century Club',
    description: 'Track expenses for 100 consecutive days',
    icon: 'emoji-events',
    category: 'consistency',
    tier: 'gold',
    requirement: '100 day streak',
    reward: 'True dedication!'
  },
  
  // Budgeting Achievements
  {
    id: 'first_budget',
    title: 'Budget Beginner',
    description: 'Create your first budget',
    icon: 'account-balance-wallet',
    category: 'budgeting',
    tier: 'bronze',
    requirement: 'Create 1 budget',
    reward: 'Planning for success!'
  },
  {
    id: 'budget_success_1',
    title: 'Budget Boss',
    description: 'Stay within budget for 1 month',
    icon: 'task-alt',
    category: 'budgeting',
    tier: 'silver',
    requirement: 'Stay under budget for 1 month',
    reward: 'Financial discipline!'
  },
  {
    id: 'budget_success_3',
    title: 'Budget Master',
    description: 'Stay within budget for 3 consecutive months',
    icon: 'military-tech',
    category: 'budgeting',
    tier: 'gold',
    requirement: 'Stay under budget for 3 months',
    reward: 'Master of money!'
  },
  {
    id: 'savings_hero',
    title: 'Savings Hero',
    description: 'Finish a month using only 80% of your budget',
    icon: 'savings',
    category: 'budgeting',
    tier: 'gold',
    requirement: 'Use only 80% of budget in a month',
    reward: 'Frugality champion!'
  },

  // Smart Spending Achievements
  {
    id: 'category_conscious',
    title: 'Category Conscious',
    description: 'Use 5 different expense categories',
    icon: 'category',
    category: 'smart',
    tier: 'bronze',
    requirement: 'Use 5 different categories',
    reward: 'Organized spender!'
  },
  {
    id: 'detail_oriented',
    title: 'Detail Oriented',
    description: 'Add notes to 10 expenses',
    icon: 'edit-note',
    category: 'smart',
    tier: 'bronze',
    requirement: 'Add notes to 10 expenses',
    reward: 'Every detail matters!'
  },
  {
    id: 'ai_adopter',
    title: 'AI Adopter',
    description: 'Let AI categorize 25 expenses',
    icon: 'auto-awesome',
    category: 'smart',
    tier: 'silver',
    requirement: 'Use AI categorization 25 times',
    reward: 'Embracing the future!'
  },

  // Milestone Achievements
  {
    id: 'expense_100',
    title: 'Century Tracker',
    description: 'Log 100 total expenses',
    icon: 'count',
    category: 'milestone',
    tier: 'silver',
    requirement: 'Log 100 expenses',
    reward: 'Consistent tracking pays off!'
  },
  {
    id: 'expense_500',
    title: 'Expense Expert',
    description: 'Log 500 total expenses',
    icon: 'workspace-premium',
    category: 'milestone',
    tier: 'gold',
    requirement: 'Log 500 expenses',
    reward: 'You know your money!'
  },
  {
    id: 'big_spender',
    title: 'Big Spender',
    description: 'Track ₹10,000 in total expenses',
    icon: 'trending-up',
    category: 'milestone',
    tier: 'silver',
    requirement: 'Track ₹10,000 total',
    reward: 'Money moves!'
  },
  {
    id: 'spending_analyzer',
    title: 'Spending Analyzer',
    description: 'View analytics features 10 times',
    icon: 'analytics',
    category: 'smart',
    tier: 'bronze',
    requirement: 'Use analytics 10 times',
    reward: 'Knowledge is power!'
  }
];

export default function AchievementSystem({ visible, onClose }: AchievementSystemProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  useEffect(() => {
    if (visible) {
      loadAchievements();
    }
  }, [visible]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const [expenses, budgets, savedAchievements] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getBudgets(),
        StorageService.getAchievements().catch(() => [])
      ]);

      const calculatedAchievements = await calculateAchievements(expenses, budgets, savedAchievements);
      setAchievements(calculatedAchievements);

      // Check for newly unlocked achievements
      const newlyUnlockedAchievements = calculatedAchievements.filter(
        achievement => achievement.isUnlocked && 
        !savedAchievements.find(saved => saved.id === achievement.id && saved.isUnlocked)
      );
      
      if (newlyUnlockedAchievements.length > 0) {
        setNewlyUnlocked(newlyUnlockedAchievements);
        // Save updated achievements
        await StorageService.saveAchievements(calculatedAchievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = async (
    expenses: Expense[], 
    budgets: Budget[], 
    savedAchievements: Achievement[]
  ): Promise<Achievement[]> => {
    const now = new Date();
    
    return ACHIEVEMENT_DEFINITIONS.map(definition => {
      const saved = savedAchievements.find(a => a.id === definition.id);
      let progress = 0;
      let isUnlocked = saved?.isUnlocked || false;
      let unlockedAt = saved?.unlockedAt;

      // Calculate progress based on achievement type
      switch (definition.id) {
        case 'first_expense':
          progress = expenses.length > 0 ? 100 : 0;
          break;

        case 'expense_streak_7':
        case 'expense_streak_30':
        case 'expense_streak_100':
          const requiredDays = parseInt(definition.id.split('_')[2]);
          const streak = calculateExpenseStreak(expenses);
          progress = Math.min((streak / requiredDays) * 100, 100);
          break;

        case 'first_budget':
          progress = budgets.length > 0 ? 100 : 0;
          break;

        case 'budget_success_1':
        case 'budget_success_3':
          const successMonths = parseInt(definition.id.split('_')[2]);
          const monthsInBudget = calculateBudgetSuccessMonths(expenses, budgets);
          progress = Math.min((monthsInBudget / successMonths) * 100, 100);
          break;

        case 'savings_hero':
          progress = calculateSavingsHeroProgress(expenses, budgets);
          break;

        case 'category_conscious':
          const uniqueCategories = new Set(expenses.map(e => e.category.id)).size;
          progress = Math.min((uniqueCategories / 5) * 100, 100);
          break;

        case 'detail_oriented':
          const expensesWithNotes = expenses.filter(e => e.note && e.note.trim().length > 0).length;
          progress = Math.min((expensesWithNotes / 10) * 100, 100);
          break;

        case 'ai_adopter':
          // This would require tracking AI usage - for now, assume manual categorization = 0 AI usage
          progress = 0; // This would be implemented based on actual AI usage tracking
          break;

        case 'expense_100':
          progress = Math.min((expenses.length / 100) * 100, 100);
          break;

        case 'expense_500':
          progress = Math.min((expenses.length / 500) * 100, 100);
          break;

        case 'big_spender':
          const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
          progress = Math.min((totalAmount / 10000) * 100, 100);
          break;

        case 'spending_analyzer':
          // This would require tracking analytics usage - placeholder for now
          progress = 0;
          break;

        default:
          progress = saved?.progress || 0;
      }

      // Check if achievement should be unlocked
      if (!isUnlocked && progress >= 100) {
        isUnlocked = true;
        unlockedAt = now.toISOString();
      }

      return {
        ...definition,
        progress: Math.round(progress),
        isUnlocked,
        unlockedAt
      };
    });
  };

  const calculateExpenseStreak = (expenses: Expense[]): number => {
    if (expenses.length === 0) return 0;

    const sortedExpenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const expenseDates = Array.from(new Set(sortedExpenses.map(e => e.date.split('T')[0])))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < expenseDates.length; i++) {
      const expenseDate = new Date(expenseDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      if (expenseDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateBudgetSuccessMonths = (expenses: Expense[], budgets: Budget[]): number => {
    if (budgets.length === 0) return 0;

    const now = new Date();
    let successMonths = 0;

    // Check last 6 months
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthBudget = budgets.reduce((sum, budget) => {
        if (budget.period === 'monthly') return sum + budget.amount;
        if (budget.period === 'weekly') return sum + (budget.amount * 4.33);
        return sum + budget.amount;
      }, 0);

      if (monthTotal <= monthBudget) {
        successMonths++;
      } else {
        break; // Need consecutive months
      }
    }

    return successMonths;
  };

  const calculateSavingsHeroProgress = (expenses: Expense[], budgets: Budget[]): number => {
    if (budgets.length === 0) return 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart;
    });

    const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthBudget = budgets.reduce((sum, budget) => {
      if (budget.period === 'monthly') return sum + budget.amount;
      if (budget.period === 'weekly') return sum + (budget.amount * 4.33);
      return sum + budget.amount;
    }, 0);

    const usagePercentage = monthBudget > 0 ? (monthTotal / monthBudget) * 100 : 0;
    
    // Achievement unlocked if used 80% or less
    return usagePercentage <= 80 ? 100 : 0;
  };

  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return theme.orange;
      case 'silver': return theme.textSecondary;
      case 'gold': return theme.gold;
      case 'platinum': return theme.textTertiary;
      default: return theme.orange;
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'spending': return 'payments';
      case 'budgeting': return 'account-balance-wallet';
      case 'consistency': return 'event-repeat';
      case 'milestone': return 'flag';
      case 'smart': return 'psychology';
      default: return 'star';
    }
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const tierColor = getTierColor(achievement.tier);
    
    return (
      <View key={achievement.id} style={[
        styles.achievementCard,
        achievement.isUnlocked && styles.achievementCardUnlocked
      ]}>
        <View style={styles.achievementHeader}>
          <View style={[
            styles.achievementIcon,
            { backgroundColor: achievement.isUnlocked ? tierColor + '20' : '#F7FAFC' }
          ]}>
            <MaterialIcons 
              name={achievement.icon as any} 
              size={24} 
              color={achievement.isUnlocked ? tierColor : '#A0AEC0'} 
            />
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              achievement.isUnlocked && styles.achievementTitleUnlocked
            ]}>
              {achievement.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>
            <Text style={styles.achievementRequirement}>
              {achievement.requirement}
            </Text>
          </View>

          <View style={styles.achievementStatus}>
            {achievement.isUnlocked ? (
              <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                <Text style={styles.tierText}>{achievement.tier.toUpperCase()}</Text>
              </View>
            ) : (
              <Text style={styles.progressText}>{achievement.progress}%</Text>
            )}
          </View>
        </View>

        {!achievement.isUnlocked && (
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${achievement.progress}%`, backgroundColor: tierColor }
            ]} />
          </View>
        )}

        {achievement.isUnlocked && achievement.reward && (
          <View style={styles.rewardContainer}>
            <MaterialIcons name="card-giftcard" size={16} color={tierColor} />
            <Text style={[styles.rewardText, { color: tierColor }]}>
              {achievement.reward}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryFilter = () => {
    const categories = [
      { key: 'all', label: 'All', icon: 'apps' },
      { key: 'spending', label: 'Spending', icon: 'payments' },
      { key: 'budgeting', label: 'Budgeting', icon: 'account-balance-wallet' },
      { key: 'consistency', label: 'Consistency', icon: 'event-repeat' },
      { key: 'milestone', label: 'Milestones', icon: 'flag' },
      { key: 'smart', label: 'Smart', icon: 'psychology' }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <MaterialIcons 
              name={category.icon as any} 
              size={18} 
              color={selectedCategory === category.key ? theme.primary : theme.textSecondary} 
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.key && styles.categoryButtonTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderStats = () => {
    const unlockedCount = achievements.filter(a => a.isUnlocked).length;
    const totalCount = achievements.length;
    const totalProgress = achievements.reduce((sum, a) => sum + a.progress, 0) / achievements.length;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round(totalProgress)}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {achievements.filter(a => a.tier === 'gold' && a.isUnlocked).length}
            </Text>
            <Text style={styles.statLabel}>Gold</Text>
          </View>
        </View>
      </View>
    );
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#4A5568" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          {renderStats()}

          {/* Category Filter */}
          {renderCategoryFilter()}

          {/* Achievements List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ECDC4" />
              <Text style={styles.loadingText}>Loading achievements...</Text>
            </View>
          ) : (
            <View style={styles.achievementsList}>
              {filteredAchievements.map(renderAchievementCard)}
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
  statsCard: {
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
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    paddingHorizontal: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryButtonActive: {
    backgroundColor: theme.primaryContainer,
    borderColor: theme.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  achievementsList: {
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    opacity: 0.6,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textTertiary,
  },
  achievementTitleUnlocked: {
    color: theme.text,
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  achievementRequirement: {
    fontSize: 12,
    color: theme.textTertiary,
    marginTop: 4,
  },
  achievementStatus: {
    alignItems: 'center',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
  },
  rewardText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 6,
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
