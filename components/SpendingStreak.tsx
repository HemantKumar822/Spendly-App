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

import { Expense } from '@/types';
import { StorageService } from '@/services/storage';
import { formatDate, formatDateShort } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
  streakStartDate: string | null;
  daysWithoutLogging: number;
  isActiveToday: boolean;
  weeklyProgress: boolean[];
  monthlyStats: {
    daysLogged: number;
    totalDays: number;
    percentage: number;
  };
}

interface StreakCalendarDay {
  date: string;
  hasExpense: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  streakDay?: number;
}

interface SpendingStreakProps {
  visible: boolean;
  onClose: () => void;
}

export default function SpendingStreak({ visible, onClose }: SpendingStreakProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [calendarDays, setCalendarDays] = useState<StreakCalendarDay[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    if (visible) {
      loadStreakData();
    }
  }, [visible, selectedMonth]);

  const loadStreakData = async () => {
    setLoading(true);
    try {
      const expenses = await StorageService.getExpenses();
      const streakInfo = calculateStreakData(expenses);
      setStreakData(streakInfo);
      
      const calendar = generateCalendarDays(expenses, selectedMonth);
      setCalendarDays(calendar);
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreakData = (expenses: Expense[]): StreakData => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get unique dates when expenses were logged
    const expenseDates = Array.from(new Set(
      expenses.map(expense => expense.date.split('T')[0])
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (expenseDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastLoggedDate: null,
        streakStartDate: null,
        daysWithoutLogging: 0,
        isActiveToday: false,
        weeklyProgress: [false, false, false, false, false, false, false],
        monthlyStats: {
          daysLogged: 0,
          totalDays: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
          percentage: 0
        }
      };
    }

    // Check if user logged today
    const todayString = today.toISOString().split('T')[0];
    const isActiveToday = expenseDates.includes(todayString);

    // Calculate current streak
    let currentStreak = 0;
    let streakStartDate: string | null = null;
    const currentDate = new Date(today);
    
    // If not active today, start checking from yesterday
    if (!isActiveToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (true) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (expenseDates.includes(dateString)) {
        currentStreak++;
        streakStartDate = dateString;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate: Date | null = null;

    for (const dateString of expenseDates.reverse()) {
      const currentExpenseDate = new Date(dateString);
      
      if (previousDate === null) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((currentExpenseDate.getTime() - previousDate.getTime()) / (1000 * 3600 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      previousDate = currentExpenseDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate days without logging
    const lastLoggedDate = expenseDates[expenseDates.length - 1];
    const lastLogged = new Date(lastLoggedDate);
    const daysWithoutLogging = Math.floor((today.getTime() - lastLogged.getTime()) / (1000 * 3600 * 24));

    // Calculate weekly progress (last 7 days)
    const weeklyProgress: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateString = checkDate.toISOString().split('T')[0];
      weeklyProgress.push(expenseDates.includes(checkDateString));
    }

    // Calculate monthly stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const totalDaysInMonth = monthEnd.getDate();
    const daysLoggedThisMonth = expenseDates.filter(date => {
      const expenseDate = new Date(date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    }).length;

    return {
      currentStreak,
      longestStreak,
      lastLoggedDate,
      streakStartDate,
      daysWithoutLogging: isActiveToday ? 0 : daysWithoutLogging,
      isActiveToday,
      weeklyProgress,
      monthlyStats: {
        daysLogged: daysLoggedThisMonth,
        totalDays: totalDaysInMonth,
        percentage: (daysLoggedThisMonth / totalDaysInMonth) * 100
      }
    };
  };

  const generateCalendarDays = (expenses: Expense[], month: Date): StreakCalendarDay[] => {
    const expenseDates = new Set(expenses.map(expense => expense.date.split('T')[0]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    // Get first day of month and its day of week
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from Sunday of the week containing the first day
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days: StreakCalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const hasExpense = expenseDates.has(dateString);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isCurrentMonth = currentDate.getMonth() === monthIndex;
      
      days.push({
        date: dateString,
        hasExpense,
        isToday,
        isCurrentMonth
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak === 0) return '😴';
    if (streak < 3) return '🌱';
    if (streak < 7) return '🔥';
    if (streak < 14) return '💪';
    if (streak < 30) return '⭐';
    if (streak < 50) return '🏆';
    if (streak < 100) return '💎';
    return '👑';
  };

  const getStreakLevel = (streak: number): string => {
    if (streak === 0) return 'Starter';
    if (streak < 3) return 'Beginner';
    if (streak < 7) return 'Getting Warm';
    if (streak < 14) return 'On Fire';
    if (streak < 30) return 'Dedicated';
    if (streak < 50) return 'Champion';
    if (streak < 100) return 'Legend';
    return 'Master';
  };

  const getMotivationalMessage = (streakData: StreakData): string => {
    if (!streakData.isActiveToday && streakData.daysWithoutLogging === 0) {
      return "Great job! You've logged expenses today. Keep the streak alive! 🎯";
    }
    if (streakData.daysWithoutLogging === 1) {
      return "You missed yesterday, but it's not too late! Log an expense today to start a new streak! 💪";
    }
    if (streakData.daysWithoutLogging > 1) {
      return `It's been ${streakData.daysWithoutLogging} days since your last log. Start fresh today! 🌟`;
    }
    if (streakData.currentStreak >= 7) {
      return "Amazing! You're building fantastic financial habits! 🔥";
    }
    if (streakData.currentStreak >= 3) {
      return "You're getting into a great rhythm! Keep it up! ⭐";
    }
    return "Every day counts! Log your expenses to build momentum! 🚀";
  };

  const renderStreakStats = () => {
    if (!streakData) return null;

    return (
      <View style={styles.statsContainer}>
        {/* Current Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakEmoji}>{getStreakEmoji(streakData.currentStreak)}</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <Text style={styles.streakLevel}>{getStreakLevel(streakData.currentStreak)}</Text>
          {streakData.currentStreak > 0 && streakData.streakStartDate && (
            <Text style={styles.streakSince}>
              Since {formatDateShort(new Date(streakData.streakStartDate))}
            </Text>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={24} color={theme.gold} />
            <Text style={styles.statValue}>{streakData.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="calendar-month" size={24} color={theme.primary} />
            <Text style={styles.statValue}>{streakData.monthlyStats.daysLogged}/{streakData.monthlyStats.totalDays}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="percent" size={24} color={theme.secondary} />
            <Text style={styles.statValue}>{Math.round(streakData.monthlyStats.percentage)}%</Text>
            <Text style={styles.statLabel}>Consistency</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWeeklyProgress = () => {
    if (!streakData) return null;

    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <View style={styles.weeklyCard}>
        <Text style={styles.weeklyTitle}>This Week</Text>
        <View style={styles.weeklyDays}>
          {streakData.weeklyProgress.map((hasExpense, index) => (
            <View key={index} style={styles.weeklyDay}>
              <Text style={styles.weeklyDayLabel}>{dayLabels[index]}</Text>
              <View style={[
                styles.weeklyDot,
                { backgroundColor: hasExpense ? theme.primary : theme.border }
              ]} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCalendar = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendarCard}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(selectedMonth);
              newMonth.setMonth(newMonth.getMonth() - 1);
              setSelectedMonth(newMonth);
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <Text style={styles.calendarTitle}>
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity
            onPress={() => {
              const newMonth = new Date(selectedMonth);
              newMonth.setMonth(newMonth.getMonth() + 1);
              setSelectedMonth(newMonth);
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Day Labels */}
        <View style={styles.calendarDayLabels}>
          {dayLabels.map(label => (
            <Text key={label} style={styles.calendarDayLabel}>{label}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => (
            <View key={index} style={[
              styles.calendarDay,
              !day.isCurrentMonth && styles.calendarDayOtherMonth,
              day.isToday && styles.calendarDayToday
            ]}>
              <Text style={[
                styles.calendarDayText,
                !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                day.isToday && styles.calendarDayTextToday
              ]}>
                {new Date(day.date).getDate()}
              </Text>
              {day.hasExpense && (
                <View style={styles.calendarDayDot} />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMotivation = () => {
    if (!streakData) return null;

    return (
      <View style={styles.motivationCard}>
        <MaterialIcons name="psychology" size={24} color={theme.primary} />
        <Text style={styles.motivationText}>
          {getMotivationalMessage(streakData)}
        </Text>
      </View>
    );
  };

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
          <Text style={styles.headerTitle}>Spending Streaks</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ECDC4" />
              <Text style={styles.loadingText}>Loading streak data...</Text>
            </View>
          ) : (
            <>
              {renderMotivation()}
              {renderStreakStats()}
              {renderWeeklyProgress()}
              {renderCalendar()}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 12,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryContainer,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  motivationText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  statsContainer: {
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.primary,
  },
  streakLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  streakLevel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  streakSince: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  weeklyCard: {
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
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  weeklyDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyDay: {
    alignItems: 'center',
  },
  weeklyDayLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  weeklyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  calendarCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  calendarDayLabels: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  calendarDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: theme.text,
  },
  calendarDayTextOtherMonth: {
    color: theme.textTertiary,
  },
  calendarDayTextToday: {
    fontWeight: '600',
    color: theme.primary,
  },
  calendarDayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.primary,
  },
});
