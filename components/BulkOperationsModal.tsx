import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Expense, ExpenseCategory } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency, formatDateShort } from '@/utils';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';
import AnimatedCard from './ui/AnimatedCard';
import LoadingState from './ui/LoadingState';

interface BulkOperationsModalProps {
  visible: boolean;
  expenses: Expense[];
  onClose: () => void;
  onExpensesUpdated: () => void;
}

interface BulkUpdateForm {
  categoryId: string;
  note: string;
  addToNote: boolean; // If true, append to existing note instead of replacing
}

type BulkAction = 'delete' | 'update_category' | 'update_note' | 'export';

export default function BulkOperationsModal({
  visible,
  expenses,
  onClose,
  onExpensesUpdated
}: BulkOperationsModalProps) {
  const { theme } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic, triggerSuccessHaptic, triggerErrorHaptic } = useHaptics();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);

  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [bulkUpdateForm, setBulkUpdateForm] = useState<BulkUpdateForm>({
    categoryId: '',
    note: '',
    addToNote: false,
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter expenses based on search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    
    const query = searchQuery.toLowerCase().trim();
    return expenses.filter(expense =>
      expense.description.toLowerCase().includes(query) ||
      expense.category.name.toLowerCase().includes(query) ||
      expense.note?.toLowerCase().includes(query)
    );
  }, [expenses, searchQuery]);

  // Calculate totals for selected expenses
  const selectedTotals = useMemo(() => {
    const selected = filteredExpenses.filter(exp => selectedExpenses.has(exp.id));
    return {
      count: selected.length,
      totalAmount: selected.reduce((sum, exp) => sum + exp.amount, 0),
      categories: new Set(selected.map(exp => exp.category.name)),
    };
  }, [filteredExpenses, selectedExpenses]);

  useEffect(() => {
    if (visible) {
      loadCategories();
      setSelectedExpenses(new Set());
      setBulkAction(null);
      setSearchQuery('');
    }
  }, [visible]);

  const loadCategories = useCallback(async () => {
    try {
      const loadedCategories = await StorageService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const toggleExpenseSelection = useCallback((expenseId: string) => {
    triggerLightHaptic();
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  }, [triggerLightHaptic]);

  const selectAllVisible = useCallback(() => {
    triggerMediumHaptic();
    const allVisibleIds = new Set(filteredExpenses.map(exp => exp.id));
    setSelectedExpenses(allVisibleIds);
  }, [filteredExpenses, triggerMediumHaptic]);

  const clearSelection = useCallback(() => {
    triggerLightHaptic();
    setSelectedExpenses(new Set());
  }, [triggerLightHaptic]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedExpenses.size === 0) return;

    Alert.alert(
      'Delete Expenses',
      `Are you sure you want to delete ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await StorageService.bulkDeleteExpenses(Array.from(selectedExpenses));
              triggerSuccessHaptic();
              onExpensesUpdated();
              setSelectedExpenses(new Set());
              setBulkAction(null);
              Alert.alert('Success', `${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''} deleted successfully!`);
            } catch (error) {
              triggerErrorHaptic();
              console.error('Error deleting expenses:', error);
              Alert.alert('Error', 'Failed to delete expenses. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [selectedExpenses, onExpensesUpdated, triggerSuccessHaptic, triggerErrorHaptic]);

  const handleBulkUpdateCategory = useCallback(async () => {
    if (selectedExpenses.size === 0 || !bulkUpdateForm.categoryId) return;

    setLoading(true);
    try {
      await StorageService.bulkUpdateExpenseCategory(
        Array.from(selectedExpenses),
        categories.find(cat => cat.id === bulkUpdateForm.categoryId)!
      );
      triggerSuccessHaptic();
      onExpensesUpdated();
      setSelectedExpenses(new Set());
      setBulkAction(null);
      setBulkUpdateForm({ categoryId: '', note: '', addToNote: false });
      Alert.alert('Success', `Category updated for ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}!`);
    } catch (error) {
      triggerErrorHaptic();
      console.error('Error updating expense categories:', error);
      Alert.alert('Error', 'Failed to update categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedExpenses, bulkUpdateForm.categoryId, categories, onExpensesUpdated, triggerSuccessHaptic, triggerErrorHaptic]);

  const handleBulkUpdateNote = useCallback(async () => {
    if (selectedExpenses.size === 0 || !bulkUpdateForm.note.trim()) return;

    setLoading(true);
    try {
      await StorageService.bulkUpdateExpenseNote(
        Array.from(selectedExpenses),
        bulkUpdateForm.note,
        bulkUpdateForm.addToNote
      );
      triggerSuccessHaptic();
      onExpensesUpdated();
      setSelectedExpenses(new Set());
      setBulkAction(null);
      setBulkUpdateForm({ categoryId: '', note: '', addToNote: false });
      Alert.alert('Success', `Note updated for ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}!`);
    } catch (error) {
      triggerErrorHaptic();
      console.error('Error updating expense notes:', error);
      Alert.alert('Error', 'Failed to update notes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedExpenses, bulkUpdateForm, onExpensesUpdated, triggerSuccessHaptic, triggerErrorHaptic]);

  const handleExportSelected = useCallback(async () => {
    if (selectedExpenses.size === 0) return;

    setLoading(true);
    try {
      const selectedExpensesData = expenses.filter(exp => selectedExpenses.has(exp.id));
      await StorageService.exportSelectedExpenses(selectedExpensesData);
      triggerSuccessHaptic();
      Alert.alert('Success', 'Selected expenses exported successfully!');
    } catch (error) {
      triggerErrorHaptic();
      console.error('Error exporting expenses:', error);
      Alert.alert('Error', 'Failed to export expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedExpenses, expenses, triggerSuccessHaptic, triggerErrorHaptic]);

  const handleBulkExport = useCallback(async () => {
    if (selectedExpenses.size === 0) return;

    setLoading(true);
    try {
      const selectedExpensesData = expenses.filter(exp => selectedExpenses.has(exp.id));
      await StorageService.exportSelectedExpenses(selectedExpensesData);
      triggerSuccessHaptic();
      Alert.alert('Success', 'Selected expenses exported successfully!');
    } catch (error) {
      triggerErrorHaptic();
      console.error('Error exporting expenses:', error);
      Alert.alert('Error', 'Failed to export expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedExpenses, expenses, triggerSuccessHaptic, triggerErrorHaptic]);

  const renderExpenseItem = useCallback(({ item: expense }: { item: Expense }) => {
    const isSelected = selectedExpenses.has(expense.id);
    
    return (
      <TouchableOpacity
        style={[styles.expenseItem, isSelected && styles.expenseItemSelected]}
        onPress={() => toggleExpenseSelection(expense.id)}
        activeOpacity={0.8}
      >
        <View style={styles.expenseLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: expense.category.color }]}>
            <Text style={styles.categoryEmoji}>{expense.category.emoji}</Text>
          </View>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseDescription} numberOfLines={1}>
              {expense.description}
            </Text>
            <Text style={styles.expenseCategory}>
              {expense.category.name} • {formatDateShort(expense.date)}
            </Text>
            {expense.note && (
              <Text style={styles.expenseNote} numberOfLines={1}>
                {expense.note}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.expenseAmount}>
          {formatCurrency(expense.amount)}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedExpenses, toggleExpenseSelection, styles]);

  const renderBulkActionPanel = useCallback(() => {
    if (!bulkAction) return null;

    switch (bulkAction) {
      case 'update_category':
        return (
          <AnimatedCard style={styles.actionPanel} animationType="slide" delay={100}>
            <View style={styles.actionPanelHeader}>
              <Text style={styles.actionPanelTitle}>Update Category</Text>
              <TouchableOpacity 
                onPress={() => setBulkAction(null)}
                style={styles.closeActionPanel}
              >
                <MaterialIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.actionPanelSubtitle}>
              Select a new category for {selectedExpenses.size} expense{selectedExpenses.size > 1 ? 's' : ''}
            </Text>
            
            <ScrollView style={styles.categorySelector} horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    bulkUpdateForm.categoryId === category.id && styles.categoryChipSelected
                  ]}
                  onPress={() => {
                    triggerLightHaptic();
                    setBulkUpdateForm(prev => ({ ...prev, categoryId: category.id }));
                  }}
                >
                  <View style={[styles.categoryIconSmall, { backgroundColor: category.color }]}>
                    <Text style={styles.categoryEmojiSmall}>{category.emoji}</Text>
                  </View>
                  <Text style={[
                    styles.categoryChipText,
                    bulkUpdateForm.categoryId === category.id && styles.categoryChipTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setBulkAction(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleBulkUpdateCategory}
                activeOpacity={0.8}
                disabled={!bulkUpdateForm.categoryId || loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        );

      case 'update_note':
        return (
          <AnimatedCard style={styles.actionPanel} animationType="slide" delay={100}>
            <View style={styles.actionPanelHeader}>
              <Text style={styles.actionPanelTitle}>Update Notes</Text>
              <TouchableOpacity 
                onPress={() => setBulkAction(null)}
                style={styles.closeActionPanel}
              >
                <MaterialIcons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.actionPanelSubtitle}>
              {bulkUpdateForm.addToNote ? 'Add to existing notes' : 'Replace existing notes'} for {selectedExpenses.size} expense{selectedExpenses.size > 1 ? 's' : ''}
            </Text>
            
            <TextInput
              style={styles.noteInput}
              placeholder="Enter note..."
              value={bulkUpdateForm.note}
              onChangeText={(text) => setBulkUpdateForm(prev => ({ ...prev, note: text }))}
              multiline
              maxLength={200}
              placeholderTextColor={theme.textTertiary}
            />
            
            <TouchableOpacity
              style={styles.noteOptionRow}
              onPress={() => {
                triggerLightHaptic();
                setBulkUpdateForm(prev => ({ ...prev, addToNote: !prev.addToNote }));
              }}
            >
              <View style={[
                styles.checkbox,
                bulkUpdateForm.addToNote && styles.checkboxSelected
              ]}>
                {bulkUpdateForm.addToNote && (
                  <MaterialIcons name="check" size={16} color={theme.surface} />
                )}
              </View>
              <Text style={styles.noteOptionText}>
                Add to existing notes (instead of replacing)
              </Text>
            </TouchableOpacity>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setBulkAction(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={handleBulkUpdateNote}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        );

      default:
        return null;
    }
  }, [bulkAction, selectedExpenses.size, categories, bulkUpdateForm, theme, styles, triggerLightHaptic, handleBulkUpdateCategory, handleBulkUpdateNote, loading]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={icons.buttonIcon} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Bulk Operations</Text>
          <View style={styles.headerRight}>
            {selectedExpenses.size > 0 && (
              <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={icons.cardIcon} color={theme.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search expenses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        {/* Selection Summary */}
        {selectedExpenses.size > 0 && (
          <AnimatedCard style={styles.selectionSummary} animationType="fade" delay={100}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>
                  {selectedTotals.count} expense{selectedTotals.count > 1 ? 's' : ''} selected
                </Text>
                <Text style={styles.summaryAmount}>
                  Total: {formatCurrency(selectedTotals.totalAmount)}
                </Text>
              </View>
              {selectedTotals.categories.size > 0 && (
                <Text style={styles.summaryCategories}>
                  Categories: {Array.from(selectedTotals.categories).join(', ')}
                </Text>
              )}
              
              {/* Action Buttons */}
              <View style={styles.selectionActions}>
                <TouchableOpacity
                  style={[styles.selectionActionButton, styles.deleteButton]}
                  onPress={handleBulkDelete}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <MaterialIcons name="delete" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectionActionButton, styles.secondaryButton]}
                  onPress={() => setBulkAction('update_category')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="category" size={16} color={theme.primary} />
                  <Text style={styles.secondaryButtonText}>Category</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectionActionButton, styles.secondaryButton]}
                  onPress={() => setBulkAction('update_note')}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="note" size={16} color={theme.primary} />
                  <Text style={styles.secondaryButtonText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectionActionButton, styles.primaryButton]}
                  onPress={handleBulkExport}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <MaterialIcons name="file-download" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Export</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.secondaryButton]}
              onPress={selectedExpenses.size === filteredExpenses.length ? clearSelection : selectAllVisible}
              activeOpacity={0.8}
            >
              <MaterialIcons 
                name={selectedExpenses.size === filteredExpenses.length ? "check-box" : "check-box-outline-blank"} 
                size={16} 
                color={theme.primary} 
              />
              <Text style={styles.secondaryButtonText}>
                {selectedExpenses.size === filteredExpenses.length ? "Deselect All" : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bulk Action Panel */}
        {renderBulkActionPanel()}

        {/* Expenses List */}
        <View style={styles.expensesList}>
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={theme.textTertiary} />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No expenses match your search' : 'No expenses to manage'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              scrollEventThrottle={16}
              scrollEnabled={true}
            />
          )}
        </View>

        {/* Loading Overlay */}
        {loading && (
          <LoadingState
            type="overlay"
            message={
              bulkAction === 'delete' ? 'Deleting expenses...' :
              bulkAction === 'update_category' ? 'Updating categories...' :
              bulkAction === 'update_note' ? 'Updating notes...' :
              bulkAction === 'export' ? 'Exporting expenses...' :
              'Processing...'
            }
            visible={loading}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (theme: Theme, isTablet: boolean, spacing: any, typography: any, icons: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    padding: spacing.listGap,
    borderRadius: spacing.buttonRadius,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: theme.text,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  clearButton: {
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.surfaceVariant,
  },
  clearButtonText: {
    fontSize: typography.caption,
    color: theme.primary,
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.buttonRadius,
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: theme.text,
    marginLeft: spacing.listGap,
  },
  selectionSummary: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
  },
  summaryAmount: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: theme.primary,
  },
  summaryCategories: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.listGap,
  },
  selectionActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    gap: 4,
  },
  quickActionsSection: {
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    gap: 6,
  },
  actionPanel: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginBottom: spacing.cardMargin,
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  actionPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionPanelTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
  },
  closeActionPanel: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: theme.surfaceVariant,
  },
  actionPanelSubtitle: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    marginBottom: spacing.itemMargin,
  },
  categorySelector: {
    marginBottom: spacing.itemMargin,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    marginRight: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
  },
  categoryChipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryChipTextSelected: {
    color: theme.surface,
  },
  categoryIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmojiSmall: {
    fontSize: 12,
  },
  noteInput: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.buttonRadius,
    padding: spacing.itemMargin,
    fontSize: typography.body,
    color: theme.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: spacing.itemMargin,
  },
  noteOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.itemMargin,
  },
  noteOptionText: {
    fontSize: typography.bodySmall,
    color: theme.textSecondary,
    marginLeft: spacing.listGap,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.itemMargin,
  },
  actionButton: {
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: theme.primary || '#4ECDC4',
    borderRadius: spacing.buttonRadius,
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.primary || '#4ECDC4',
    borderRadius: spacing.buttonRadius,
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: theme.error || '#E53E3E',
    borderRadius: spacing.buttonRadius,
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.primary || '#4ECDC4',
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  expensesList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: spacing.sectionPadding,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  expenseItemSelected: {
    backgroundColor: theme.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  selectionIndicator: {
    marginRight: spacing.itemMargin,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  checkboxSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  expenseContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: isTablet ? 44 : 36,
    height: isTablet ? 44 : 36,
    borderRadius: isTablet ? 22 : 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.itemMargin,
  },
  categoryEmoji: {
    fontSize: isTablet ? 20 : 16,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: typography.body,
    fontWeight: '500',
    color: theme.text,
  },
  expenseCategory: {
    fontSize: typography.caption,
    color: theme.textTertiary,
    marginTop: 2,
  },
  expenseNote: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  expenseAmount: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sectionPadding,
  },
  emptyStateText: {
    fontSize: typography.body,
    color: theme.textSecondary,
    marginTop: spacing.itemMargin,
    textAlign: 'center',
  },
});