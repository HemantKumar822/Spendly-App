import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { StorageService } from '@/services/storage';
import { AIService } from '@/services/ai';
import DataExportService, { ExportFormat } from '@/services/dataExport';
import { formatCurrency } from '@/utils';
import ResponsiveContainer from '@/components/ui/ResponsiveContainer';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import AnimatedCard from '@/components/ui/AnimatedCard';
import { OverlayLoadingState } from '@/components/ui/LoadingState';

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigate' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic } = useHaptics();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);
  
  const [aiStatus, setAiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudgets, setTotalBudgets] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSettings();
    checkAIStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const expenses = await StorageService.getExpenses();
      const budgets = await StorageService.getBudgets();
      
      setTotalExpenses(expenses.length);
      setTotalBudgets(budgets.filter(b => b.isActive).length);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    await checkAIStatus();
    setRefreshing(false);
  };

  const checkAIStatus = async () => {
    try {
      const health = await AIService.checkAIServiceHealth();
      setAiStatus(health.available ? 'available' : 'unavailable');
    } catch (error) {
      setAiStatus('unavailable');
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        {
          text: 'CSV (Spreadsheet)',
          onPress: () => exportData(ExportFormat.CSV),
        },
        {
          text: 'JSON (Complete)',
          onPress: () => exportData(ExportFormat.JSON),
        },
        {
          text: 'Backup (Restore)',
          onPress: () => exportData(ExportFormat.BACKUP),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const exportData = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const result = await DataExportService.exportData({
        format,
        includeExpenses: true,
        includeBudgets: true,
        includeCategories: true,
      });

      if (result.success) {
        console.log('✅ Export completed:', result.fileName);
      } else {
        Alert.alert('Export Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      Alert.alert('Export Failed', 'An unexpected error occurred during export.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Data',
      'This will replace all your current data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            const result = await DataExportService.importBackup();
            if (result.success) {
              await loadSettings(); // Refresh the stats
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your expenses and budgets. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data has been cleared.');
              setTotalExpenses(0);
              setTotalBudgets(0);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Spendly',
      'Spendly v1.0.0-beta\n\nA smart expense tracker for college students with AI-powered insights.\n\nBuilt with React Native & Expo',
      [{ text: 'OK' }]
    );
  };

  const handleInstagram = () => {
    Linking.openURL('https://www.instagram.com/tech_hemant.ai?igsh=MXZ3bnJwdzNvcTl3OQ==');
  };

  const settingsData: SettingsItem[] = [
    {
      id: 'theme',
      title: 'Dark Mode',
      subtitle: isDark ? 'Dark theme enabled' : 'Light theme enabled',
      icon: isDark ? 'dark-mode' : 'light-mode',
      type: 'toggle',
      value: isDark,
      onToggle: (value) => {
        toggleTheme();
      }
    },
    {
      id: 'export-data',
      title: 'Export Data',
      subtitle: 'Coming Soon',
      icon: 'file-download',
      type: 'action',
      onPress: () => Alert.alert('Coming Soon', 'This feature will be available in a future update.')
    },
    {
      id: 'import-data',
      title: 'Import Data',
      subtitle: 'Coming Soon',
      icon: 'file-upload',
      type: 'action',
      onPress: () => Alert.alert('Coming Soon', 'This feature will be available in a future update.')
    },
    {
      id: 'clear-data',
      title: 'Clear All Data',
      subtitle: 'Delete all expenses and budgets',
      icon: 'delete-sweep',
      type: 'action',
      onPress: handleClearData
    },
    {
      id: 'instagram',
      title: 'Follow on Instagram',
      subtitle: 'tech_hemant.ai',
      icon: 'photo-camera',
      type: 'action',
      onPress: handleInstagram
    },
    {
      id: 'about',
      title: 'About Spendly',
      subtitle: 'App version and information',
      icon: 'info',
      type: 'action',
      onPress: handleAbout
    }
  ];

  const renderSettingsItem = (item: SettingsItem, index: number) => {
    // Apply special styling to the last item to remove the bottom border
    const isLastItem = index === settingsData.length - 1;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={isLastItem ? styles.settingsItemLast : styles.settingsItem}
        onPress={() => {
          if (item.type === 'action' && item.onPress) {
            triggerLightHaptic();
            item.onPress();
          }
        }}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingsItemLeft}>
          <View style={styles.settingsIcon}>
            <MaterialIcons name={item.icon as any} size={icons.buttonIcon} color={theme.primary} />
          </View>
          <View style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={(value) => {
              triggerMediumHaptic();
              if (item.onToggle) item.onToggle(value);
            }}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={item.value ? theme.surface : theme.surfaceVariant}
            disabled={item.id === 'ai-features' && aiStatus !== 'available'}
          />
        )}
        
        {item.type === 'action' && (
          <MaterialIcons name="chevron-right" size={icons.buttonIcon} color={theme.textTertiary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        {/* App Statistics */}
        <AnimatedCard 
          style={styles.statsCard}
          animationType="slide"
          delay={100}
        >
          <Text style={styles.statsTitle}>Your Activity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="receipt" size={icons.cardIcon} color={theme.primary} />
              <Text style={styles.statNumber}>{totalExpenses}</Text>
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <MaterialIcons name="account-balance-wallet" size={icons.cardIcon} color={theme.secondary} />
              <Text style={styles.statNumber}>{totalBudgets}</Text>
              <Text style={styles.statLabel}>Active Budgets</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* AI Status Card */}
        <AnimatedCard 
          style={styles.aiStatusCard}
          animationType="scale"
          delay={200}
        >
          <View style={styles.aiStatusHeader}>
            <MaterialIcons 
              name="auto-awesome" 
              size={icons.buttonIcon} 
              color={aiStatus === 'available' ? theme.primary : theme.textTertiary} 
            />
            <Text style={styles.aiStatusTitle}>AI Service Status</Text>
          </View>
          <View style={styles.aiStatusContent}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: aiStatus === 'available' ? '#C6F6D5' : '#FED7D7' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: aiStatus === 'available' ? '#38A169' : '#E53E3E' }
              ]}>
                {aiStatus === 'checking' ? 'Checking...' :
                 aiStatus === 'available' ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Text style={styles.aiStatusDescription}>
              {aiStatus === 'available' 
                ? 'Smart categorization and insights are enabled'
                : 'Using rule-based categorization'
              }
            </Text>
          </View>
        </AnimatedCard>

        {/* Settings Items */}
        <AnimatedCard 
          style={styles.settingsCard}
          animationType="slide"
          delay={300}
        >
          <Text style={styles.sectionTitle}>Preferences</Text>
          {settingsData.map((item, index) => renderSettingsItem(item, index))}
        </AnimatedCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ by Hemant
          </Text>
          <Text style={styles.versionText}>Version 1.0.0-beta</Text>
        </View>
      </ScrollView>
      
      {/* Loading Overlay */}
      <OverlayLoadingState 
        visible={exporting}
        message="Exporting your data..."
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme, isTablet: boolean, spacing: any, typography: any, icons: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.sectionPadding,
    backgroundColor: theme.surface,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: theme.text,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    color: theme.textSecondary,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.itemMargin,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: typography.caption,
    color: theme.textTertiary,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: isTablet ? 50 : 40,
    backgroundColor: theme.border,
    marginHorizontal: spacing.cardPadding,
  },
  aiStatusCard: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aiStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  aiStatusTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  aiStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    paddingHorizontal: spacing.listGap,
    paddingVertical: 6,
    borderRadius: spacing.buttonRadius,
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  aiStatusDescription: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    flex: 1,
    marginLeft: spacing.listGap,
  },
  settingsCard: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.itemMargin,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.itemMargin,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIcon: {
    width: isTablet ? 48 : 40,
    height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.itemMargin,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: typography.body,
    fontWeight: '500',
    color: theme.text,
  },
  settingsSubtitle: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    marginTop: 2,
  },
  settingsItemLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.itemMargin,
    // No borderBottom - this is the last item in the section
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.sectionPadding,
    marginTop: spacing.cardMargin,
  },
  footerText: {
    fontSize: typography.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  versionText: {
    fontSize: typography.caption,
    color: theme.textTertiary,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    marginBottom: spacing.sectionPadding,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginTop: spacing.listGap,
    marginBottom: spacing.listGap,
  },
  infoText: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
