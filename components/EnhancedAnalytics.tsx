import React, { useState, useEffect } from 'react';
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

import { Expense, ExpenseCategory } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency, formatDateShort } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 60;
const chartHeight = 180;

interface TrendDataPoint {
  date: string;
  amount: number;
  label: string;
  dayOfWeek?: string;
}

interface SpendingTrend {
  period: 'daily' | 'weekly' | 'monthly';
  data: TrendDataPoint[];
  totalAmount: number;
  averageAmount: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

interface EnhancedAnalyticsProps {
  visible: boolean;
  onClose: () => void;
}

export default function EnhancedAnalytics({ visible, onClose }: EnhancedAnalyticsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '3months'>('30days');
  const [dailyTrend, setDailyTrend] = useState<SpendingTrend | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<SpendingTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAnalyticsData();
    }
  }, [visible, selectedPeriod]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getCategories()
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
      
      // Generate trend data based on selected period
      generateTrendAnalysis(expensesData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const generateTrendAnalysis = (expensesData: Expense[]) => {
    const now = new Date();
    const daysToShow = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    
    // Filter expenses within the selected period
    const periodExpenses = expensesData.filter(expense => {
      const expenseDate = new Date(expense.date);
      const daysDiff = Math.floor((now.getTime() - expenseDate.getTime()) / (1000 * 3600 * 24));
      return daysDiff >= 0 && daysDiff < daysToShow;
    });

    // Generate daily trend
    const dailyData = generateDailyTrend(periodExpenses, daysToShow);
    setDailyTrend(dailyData);

    // Generate weekly trend (only for 30 days and above)
    if (daysToShow >= 30) {
      const weeklyData = generateWeeklyTrend(periodExpenses, Math.ceil(daysToShow / 7));
      setWeeklyTrend(weeklyData);
    } else {
      setWeeklyTrend(null);
    }
  };

  const generateDailyTrend = (expenses: Expense[], days: number): SpendingTrend => {
    const dailyAmounts = new Map<string, number>();
    const now = new Date();

    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyAmounts.set(dateStr, 0);
    }

    // Sum expenses by day
    expenses.forEach(expense => {
      const dateStr = expense.date.split('T')[0];
      const current = dailyAmounts.get(dateStr) || 0;
      dailyAmounts.set(dateStr, current + expense.amount);
    });

    // Convert to data points
    const data: TrendDataPoint[] = Array.from(dailyAmounts.entries()).map(([date, amount]) => {
      const dateObj = new Date(date);
      return {
        date,
        amount,
        label: days <= 7 ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }) : 
               days <= 30 ? `${dateObj.getDate()}` : 
               dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' })
      };
    });

    const totalAmount = Array.from(dailyAmounts.values()).reduce((sum, amount) => sum + amount, 0);
    const averageAmount = totalAmount / days;
    
    // Calculate trend
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.amount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.amount, 0) / secondHalf.length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let changePercentage = 0;
    
    if (firstHalfAvg > 0) {
      changePercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      if (Math.abs(changePercentage) > 10) {
        trend = changePercentage > 0 ? 'up' : 'down';
      }
    }

    return {
      period: 'daily',
      data,
      totalAmount,
      averageAmount,
      trend,
      changePercentage: Math.abs(changePercentage)
    };
  };

  const generateWeeklyTrend = (expenses: Expense[], weeks: number): SpendingTrend => {
    const weeklyAmounts = new Map<string, number>();
    const now = new Date();

    // Initialize weeks
    for (let i = weeks - 1; i >= 0; i--) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (now.getDay() + i * 7));
      const weekStr = `Week ${weeks - i}`;
      weeklyAmounts.set(weekStr, 0);
    }

    // Sum expenses by week
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const weeksAgo = Math.floor((now.getTime() - expenseDate.getTime()) / (1000 * 3600 * 24 * 7));
      if (weeksAgo < weeks) {
        const weekStr = `Week ${weeks - weeksAgo}`;
        const current = weeklyAmounts.get(weekStr) || 0;
        weeklyAmounts.set(weekStr, current + expense.amount);
      }
    });

    const data: TrendDataPoint[] = Array.from(weeklyAmounts.entries()).map(([label, amount]) => ({
      date: label,
      amount,
      label: label.replace('Week ', 'W')
    }));

    const totalAmount = Array.from(weeklyAmounts.values()).reduce((sum, amount) => sum + amount, 0);
    const averageAmount = totalAmount / weeks;

    return {
      period: 'weekly',
      data,
      totalAmount,
      averageAmount,
      trend: 'stable',
      changePercentage: 0
    };
  };

  const renderLineChart = (trendData: SpendingTrend) => {
    if (!trendData || trendData.data.length === 0) return null;

    const maxAmount = Math.max(...trendData.data.map(d => d.amount));
    const padding = 40;
    const actualChartWidth = chartWidth - padding * 2;
    const actualChartHeight = chartHeight - padding * 2;

    // Generate points for visualization
    const points = trendData.data.map((point, index) => {
      const x = padding + (index / (trendData.data.length - 1)) * actualChartWidth;
      const y = padding + actualChartHeight - (maxAmount > 0 ? (point.amount / maxAmount) * actualChartHeight : 0);
      return { x, y, ...point };
    });

    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <View
              key={ratio}
              style={[
                styles.gridLine,
                {
                  top: padding + ratio * actualChartHeight,
                  left: padding,
                  width: actualChartWidth,
                }
              ]}
            />
          ))}
          
          {/* Data points */}
          {points.map((point, index) => (
            <View key={index}>
              {/* Connecting line to next point */}
              {index < points.length - 1 && (
                <View
                  style={[
                    styles.chartLine,
                    {
                      position: 'absolute',
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(points[index + 1].x - point.x, 2) + 
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          points[index + 1].y - point.y,
                          points[index + 1].x - point.x
                        )}rad`
                      }]
                    }
                  ]}
                />
              )}
              
              {/* Data point */}
              <TouchableOpacity
                style={[
                  styles.chartPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: point.amount > trendData.averageAmount ? theme.primary : theme.secondary
                  }
                ]}
              />
            </View>
          ))}
          
          {/* X-axis labels */}
          <View style={styles.xAxisLabels}>
            {points.map((point, index) => (
              <Text
                key={index}
                style={[
                  styles.axisLabel,
                  {
                    left: point.x - 15,
                    top: chartHeight - 30
                  }
                ]}
              >
                {point.label}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTrendInsights = (trendData: SpendingTrend) => {
    if (!trendData) return null;

    const insights = [];
    
    // Average spending insight
    insights.push({
      icon: 'trending-neutral',
      color: theme.primary,
      title: 'Daily Average',
      value: formatCurrency(trendData.averageAmount),
      description: `Your average daily spending over the last ${selectedPeriod.replace('days', ' days')}`
    });

    // Trend insight
    if (trendData.trend !== 'stable') {
      insights.push({
        icon: trendData.trend === 'up' ? 'trending-up' : 'trending-down',
        color: trendData.trend === 'up' ? theme.error : theme.success,
        title: `Spending ${trendData.trend === 'up' ? 'Increased' : 'Decreased'}`,
        value: `${trendData.changePercentage.toFixed(1)}%`,
        description: `${trendData.trend === 'up' ? 'Higher' : 'Lower'} than the first half of the period`
      });
    }

    // Highest spending day
    const maxDay = trendData.data.reduce((max, day) => day.amount > max.amount ? day : max);
    if (maxDay.amount > 0) {
      insights.push({
        icon: 'star',
        color: theme.orange,
        title: 'Highest Day',
        value: formatCurrency(maxDay.amount),
        description: `On ${maxDay.dayOfWeek || maxDay.label}`
      });
    }

    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Key Insights</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: insight.color + '15' }]}>
              <MaterialIcons name={insight.icon as any} size={20} color={insight.color} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
            <Text style={[styles.insightValue, { color: insight.color }]}>
              {insight.value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPeriodSelector = () => {
    const periods = [
      { key: '7days' as const, label: '7 Days' },
      { key: '30days' as const, label: '30 Days' },
      { key: '3months' as const, label: '3 Months' }
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Spending Trends</Text>
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
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing your spending patterns...</Text>
            </View>
          ) : (
            <>
              {/* Daily Trend Chart */}
              {dailyTrend && (
                <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>
                    Daily Spending Trend
                    {dailyTrend.trend !== 'stable' && (
                      <Text style={[styles.trendBadge, { 
                        color: dailyTrend.trend === 'up' ? theme.error : theme.success 
                      }]}>
                        {' '}({dailyTrend.trend === 'up' ? '+' : '-'}{dailyTrend.changePercentage.toFixed(0)}%)
                      </Text>
                    )}
                  </Text>
                  {renderLineChart(dailyTrend)}
                </View>
              )}

              {/* Weekly Trend Chart */}
              {weeklyTrend && weeklyTrend.data.length > 1 && (
                <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.chartTitle, { color: theme.text }]}>Weekly Spending Trend</Text>
                  {renderLineChart(weeklyTrend)}
                </View>
              )}

              {/* Insights */}
              {dailyTrend && renderTrendInsights(dailyTrend)}
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 20,
  },
  trendBadge: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: 8,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: theme.border,
  },
  chartLine: {
    height: 2,
    backgroundColor: theme.primary,
    position: 'absolute',
    transformOrigin: '0 50%',
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.surface,
  },
  xAxisLabels: {
    position: 'absolute',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: theme.textSecondary,
    textAlign: 'center',
    width: 30,
  },
  insightsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  insightDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
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