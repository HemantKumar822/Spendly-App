import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Expense } from '@/types';
import { StorageService } from '@/services/storage';
import { useTheme, Theme } from '@/contexts/ThemeContext';

interface UserLevel {
  level: number;
  title: string;
  xp: number;
  xpToNext: number;
  totalXp: number;
  benefits: string[];
}

interface LevelSystemProps {
  visible: boolean;
  onClose: () => void;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000];
const LEVEL_TITLES = [
  'Newcomer', 'Tracker', 'Saver', 'Planner', 'Analyzer', 
  'Expert', 'Master', 'Legend', 'Champion', 'Grandmaster'
];

export default function LevelSystem({ visible, onClose }: LevelSystemProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) calculateLevel();
  }, [visible]);

  const calculateLevel = async () => {
    try {
      const [expenses, achievements] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getAchievements().catch(() => [])
      ]);

      const xpData = calculateXP(expenses, achievements);
      setUserLevel(xpData);
    } catch (error) {
      console.error('Error calculating level:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateXP = (expenses: Expense[], achievements: any[]): UserLevel => {
    let totalXp = 0;

    // XP from expenses (5 XP per expense)
    totalXp += expenses.length * 5;

    // XP from streaks
    const streakDays = calculateStreak(expenses);
    totalXp += streakDays * 2;

    // XP from achievements
    totalXp += achievements.filter(a => a.isUnlocked).length * 50;

    // XP from categories used
    const uniqueCategories = new Set(expenses.map(e => e.category.id)).size;
    totalXp += uniqueCategories * 10;

    // Find current level
    let level = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (totalXp >= LEVEL_THRESHOLDS[i]) {
        level = i;
      } else {
        break;
      }
    }

    const currentLevelXp = level > 0 ? LEVEL_THRESHOLDS[level] : 0;
    const nextLevelXp = level < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[level + 1] : totalXp;
    const xpInCurrentLevel = totalXp - currentLevelXp;
    const xpToNext = nextLevelXp - totalXp;

    return {
      level,
      title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)],
      xp: xpInCurrentLevel,
      xpToNext: Math.max(0, xpToNext),
      totalXp,
      benefits: getLevelBenefits(level)
    };
  };

  const calculateStreak = (expenses: Expense[]): number => {
    const expenseDates = Array.from(new Set(expenses.map(e => e.date.split('T')[0]))).sort();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < expenseDates.length; i++) {
      const expenseDate = new Date(expenseDates[expenseDates.length - 1 - i]);
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

  const getLevelBenefits = (level: number): string[] => {
    const benefits = [
      ['Welcome to Spendly!'],
      ['Basic analytics unlocked'],
      ['Advanced charts available'],
      ['Budget optimization tips'],
      ['AI insights enabled'],
      ['Premium analytics'],
      ['Expert recommendations'],
      ['Master-level features'],
      ['Legend status perks'],
      ['Grandmaster privileges']
    ];
    return benefits[Math.min(level, benefits.length - 1)];
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Level System</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Calculating level...</Text>
            </View>
          ) : userLevel && (
            <>
              <View style={styles.levelCard}>
                <Text style={styles.levelNumber}>Level {userLevel.level}</Text>
                <Text style={styles.levelTitle}>{userLevel.title}</Text>
                <Text style={styles.totalXp}>{userLevel.totalXp} Total XP</Text>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { 
                      width: userLevel.xpToNext > 0 ? 
                        `${(userLevel.xp / (userLevel.xp + userLevel.xpToNext)) * 100}%` : 
                        '100%' 
                    }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {userLevel.xpToNext > 0 ? `${userLevel.xpToNext} XP to next level` : 'Max level reached!'}
                  </Text>
                </View>
              </View>

              <View style={styles.benefitsCard}>
                <Text style={styles.benefitsTitle}>Level Benefits</Text>
                {userLevel.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <MaterialIcons name="check-circle" size={16} color={theme.primary} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
  placeholder: { width: 32 },
  content: { flex: 1, padding: 20 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 14, color: theme.textSecondary },
  levelCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 20, marginBottom: 16, alignItems: 'center', shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  levelNumber: { fontSize: 36, fontWeight: 'bold', color: theme.primary },
  levelTitle: { fontSize: 20, fontWeight: '600', color: theme.text, marginBottom: 8 },
  totalXp: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
  progressContainer: { width: '100%' },
  progressBar: { height: 8, backgroundColor: theme.surfaceVariant, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 8, backgroundColor: theme.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: theme.textSecondary, textAlign: 'center' },
  benefitsCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 20, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  benefitsTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  benefitText: { fontSize: 14, color: theme.textSecondary, marginLeft: 8 }
});
