import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton = React.memo(function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const { theme, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? theme.surfaceVariant : theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
});

interface SkeletonCardProps {
  style?: any;
}

export const SkeletonCard = React.memo(function SkeletonCard({ style }: SkeletonCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardContent}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={60} height={16} />
      </View>
    </View>
  );
});

export const SkeletonSummaryCard = React.memo(function SkeletonSummaryCard() {
  const { theme } = useTheme();

  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
      <View style={styles.summaryHeader}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width="50%" height={16} style={{ marginLeft: 8 }} />
      </View>
      <Skeleton width="70%" height={36} style={{ marginTop: 12 }} />
      <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
});

export const SkeletonOverviewCard = React.memo(function SkeletonOverviewCard() {
  const { theme } = useTheme();

  return (
    <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
      <View style={styles.overviewRow}>
        <View style={styles.overviewItem}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
          <Skeleton width="60%" height={18} style={{ marginTop: 4 }} />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.overviewItem}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
          <Skeleton width="60%" height={18} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
});

export const SkeletonInsightCard = React.memo(function SkeletonInsightCard() {
  const { theme } = useTheme();

  return (
    <View style={[styles.insightCard, { backgroundColor: theme.surface }]}>
      <View style={styles.insightHeader}>
        <Skeleton width={20} height={20} borderRadius={10} />
        <Skeleton width="40%" height={16} style={{ marginLeft: 8 }} />
      </View>
      {[1, 2].map((index) => (
        <View key={index} style={styles.insightItem}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <View style={styles.insightContent}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="90%" height={13} style={{ marginTop: 4 }} />
            <Skeleton width="60%" height={13} style={{ marginTop: 2 }} />
          </View>
        </View>
      ))}
    </View>
  );
});

export const SkeletonTransactionsList = React.memo(function SkeletonTransactionsList() {
  const { theme } = useTheme();

  return (
    <View style={[styles.transactionsCard, { backgroundColor: theme.surface }]}>
      <View style={styles.transactionHeader}>
        <Skeleton width="60%" height={18} />
        <Skeleton width="20%" height={14} />
      </View>
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.transactionItem}>
          <View style={styles.transactionLeft}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.transactionDetails}>
              <Skeleton width="80%" height={16} />
              <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Skeleton width={60} height={16} />
            <View style={styles.transactionActions}>
              <Skeleton width={16} height={16} style={{ marginLeft: 8 }} />
              <Skeleton width={16} height={16} style={{ marginLeft: 8 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
});

export const SkeletonQuickActions = React.memo(function SkeletonQuickActions() {
  const { theme } = useTheme();

  return (
    <View style={[styles.quickActionsCard, { backgroundColor: theme.surface }]}>
      <Skeleton width="50%" height={18} style={{ marginBottom: 16 }} />
      <View style={styles.quickActionsRow}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={[styles.quickActionButton, { backgroundColor: theme.surfaceVariant }]}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width="70%" height={12} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
      <View style={styles.quickActionsRow}>
        {[1, 2].map((index) => (
          <View key={index} style={[styles.quickActionButton, { backgroundColor: theme.surfaceVariant }]}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width="70%" height={12} style={{ marginTop: 4 }} />
          </View>
        ))}
        <View style={styles.quickActionButton} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
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
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
  insightCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  transactionsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  quickActionsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 30,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
});

export default Skeleton;