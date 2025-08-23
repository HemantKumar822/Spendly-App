import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
  Switch,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Expense, ExpenseCategory } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency, formatDateShort, debounce } from '@/utils';
import { NoSearchResultsState } from './ui/EmptyStatePresets';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';
import AnimatedCard from './ui/AnimatedCard';
import ResponsiveContainer from './ui/ResponsiveContainer';
import LoadingState from './ui/LoadingState';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface AmountRange {
  min: number | null;
  max: number | null;
}

interface SearchFilters {
  categories: string[];
  dateRange: DateRange;
  amountRange: AmountRange;
  hasNote: boolean | null;
}

interface ExpenseSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onExpenseSelect?: (expense: Expense) => void;
  initialSearchQuery?: string;
  initialFilters?: Partial<SearchFilters>;
}

export default function ExpenseSearchModal({ 
  visible, 
  onClose, 
  onExpenseSelect, 
  initialSearchQuery = '', 
  initialFilters = {} 
}: ExpenseSearchModalProps) {
  const { theme } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic } = useHaptics();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filters
  const [filters, setFilters] = useState<SearchFilters>({
    categories: initialFilters.categories || [],
    dateRange: initialFilters.dateRange || { startDate: null, endDate: null },
    amountRange: initialFilters.amountRange || { min: null, max: null },
    hasNote: initialFilters.hasNote || null,
  });
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Debounced search effect
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    if (visible) {
      loadData();
      loadRecentSearches();
    }
  }, [visible]);

  useEffect(() => {
    filterAndSortExpenses();
  }, [debouncedSearchQuery, filters, sortBy, sortOrder, expenses]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesData, categoriesData] = await Promise.all([
        StorageService.getExpenses(),
        StorageService.getCategories()
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const searches = await StorageService.getRecentSearches();
      setRecentSearches(searches);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveSearchQuery = async (query: string) => {
    if (query.trim().length < 2) return;
    
    try {
      await StorageService.addRecentSearch(query.trim());
      await loadRecentSearches();
    } catch (error) {
      console.error('Error saving search query:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterAndSortExpenses = useCallback(() => {
    let filtered = [...expenses];

    // Apply text search with improved algorithm
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      const searchTerms = query.split(' ').filter(term => term.length > 0);
      
      filtered = filtered.filter(expense => {
        const searchableText = [
          expense.description.toLowerCase(),
          expense.category.name.toLowerCase(),
          expense.note?.toLowerCase() || '',
          expense.amount.toString()
        ].join(' ');
        
        // All search terms must be found
        return searchTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter(expense => 
        filters.categories.includes(expense.category.id)
      );
    }

    // Apply date range filter
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const start = filters.dateRange.startDate;
        const end = filters.dateRange.endDate;
        
        if (start && expenseDate < start) return false;
        if (end && expenseDate > end) return false;
        return true;
      });
    }

    // Apply amount range filter
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
      filtered = filtered.filter(expense => {
        if (filters.amountRange.min !== null && expense.amount < filters.amountRange.min) return false;
        if (filters.amountRange.max !== null && expense.amount > filters.amountRange.max) return false;
        return true;
      });
    }

    // Apply note filter
    if (filters.hasNote !== null) {
      filtered = filtered.filter(expense => {
        const hasNote = Boolean(expense.note && expense.note.trim());
        return filters.hasNote ? hasNote : !hasNote;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.name.localeCompare(b.category.name);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredExpenses(filtered);
  }, [expenses, debouncedSearchQuery, filters, sortBy, sortOrder]);

  const clearFilters = () => {
    triggerLightHaptic();
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setFilters({
      categories: [],
      dateRange: { startDate: null, endDate: null },
      amountRange: { min: null, max: null },
      hasNote: null,
    });
    setSortBy('date');
    setSortOrder('desc');
    setShowAdvancedFilters(false);
  };

  const toggleCategoryFilter = (categoryId: string) => {
    triggerLightHaptic();
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const updateAmountRange = (min: number | null, max: number | null) => {
    setFilters(prev => ({
      ...prev,
      amountRange: { min, max }
    }));
  };

  const updateDateRange = (startDate: Date | null, endDate: Date | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { startDate, endDate }
    }));
  };

  const handleSearchSubmit = () => {
    if (debouncedSearchQuery.trim()) {
      saveSearchQuery(debouncedSearchQuery);
    }
  };

  const handleRecentSearchSelect = (query: string) => {
    triggerLightHaptic();
    setSearchQuery(query);
    setDebouncedSearchQuery(query);
  };

  const renderExpenseItem = useCallback(({ item: expense, index }: { item: Expense; index: number }) => {
    return (
      <TouchableOpacity
        style={styles.expenseItem}
        onPress={() => {
          triggerLightHaptic();
          if (onExpenseSelect) {
            onExpenseSelect(expense);
          }
          onClose();
        }}
        activeOpacity={0.7}
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
              <Text style={styles.expenseNote} numberOfLines={2}>
                {expense.note}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>
            {formatCurrency(expense.amount)}
          </Text>
          <MaterialIcons name="chevron-right" size={16} color={theme.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  }, [onExpenseSelect, onClose, theme, triggerLightHaptic, styles]);

  const hasActiveFilters = useMemo(() => {
    return filters.categories.length > 0 ||
           filters.dateRange.startDate !== null ||
           filters.dateRange.endDate !== null ||
           filters.amountRange.min !== null ||
           filters.amountRange.max !== null ||
           filters.hasNote !== null;
  }, [filters]);

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
          <Text style={styles.title}>Search Expenses</Text>
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <AnimatedCard style={styles.searchSection} animationType="fade" delay={100}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={icons.cardIcon} color={theme.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search expenses, categories, notes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholderTextColor={theme.textTertiary}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                }}
                style={styles.clearSearchButton}
              >
                <MaterialIcons name="clear" size={icons.cardIcon} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Recent Searches */}
          {!debouncedSearchQuery && recentSearches.length > 0 && (
            <View style={styles.recentSearches}>
              <Text style={styles.recentSearchesTitle}>Recent searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentSearchesList}>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchChip}
                    onPress={() => handleRecentSearchSelect(search)}
                  >
                    <MaterialIcons name="history" size={14} color={theme.textSecondary} />
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </AnimatedCard>

        {/* Quick Filters */}
        <AnimatedCard style={styles.filtersSection} animationType="slide" delay={200}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Sort by Date */}
            <TouchableOpacity 
              style={[styles.filterChip, sortBy === 'date' && styles.filterChipActive]}
              onPress={() => {
                triggerLightHaptic();
                if (sortBy === 'date') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('date');
                  setSortOrder('desc');
                }
              }}
            >
              <MaterialIcons 
                name={sortBy === 'date' && sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
                size={16} 
                color={sortBy === 'date' ? theme.surface : theme.primary} 
              />
              <Text style={[styles.filterChipText, sortBy === 'date' && styles.filterChipTextActive]}>
                Date
              </Text>
            </TouchableOpacity>

            {/* Sort by Amount */}
            <TouchableOpacity 
              style={[styles.filterChip, sortBy === 'amount' && styles.filterChipActive]}
              onPress={() => {
                triggerLightHaptic();
                if (sortBy === 'amount') {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                } else {
                  setSortBy('amount');
                  setSortOrder('desc');
                }
              }}
            >
              <MaterialIcons 
                name={sortBy === 'amount' && sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
                size={16} 
                color={sortBy === 'amount' ? theme.surface : theme.primary} 
              />
              <Text style={[styles.filterChipText, sortBy === 'amount' && styles.filterChipTextActive]}>
                Amount
              </Text>
            </TouchableOpacity>

            {/* Advanced Filters Toggle */}
            <TouchableOpacity 
              style={[styles.filterChip, (showAdvancedFilters || hasActiveFilters) && styles.filterChipActive]}
              onPress={() => {
                triggerMediumHaptic();
                setShowAdvancedFilters(!showAdvancedFilters);
              }}
            >
              <MaterialIcons 
                name="tune" 
                size={16} 
                color={(showAdvancedFilters || hasActiveFilters) ? theme.surface : theme.primary} 
              />
              <Text style={[styles.filterChipText, (showAdvancedFilters || hasActiveFilters) && styles.filterChipTextActive]}>
                Filters{hasActiveFilters ? ` (${filters.categories.length + (filters.dateRange.startDate ? 1 : 0) + (filters.amountRange.min !== null ? 1 : 0) + (filters.hasNote !== null ? 1 : 0)})` : ''}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </AnimatedCard>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <AnimatedCard style={styles.advancedFiltersPanel} animationType="slide" delay={100}>
            <Text style={styles.advancedFiltersTitle}>Advanced Filters</Text>
            
            {/* Categories */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      filters.categories.includes(category.id) && styles.categoryChipActive
                    ]}
                    onPress={() => toggleCategoryFilter(category.id)}
                  >
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      filters.categories.includes(category.id) && styles.categoryChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Has Note Filter */}
            <View style={styles.filterGroup}>
              <View style={styles.filterRowHeader}>
                <Text style={styles.filterGroupTitle}>Notes</Text>
                <View style={styles.noteFilterOptions}>
                  <TouchableOpacity
                    style={[styles.noteFilterChip, filters.hasNote === true && styles.noteFilterChipActive]}
                    onPress={() => {
                      triggerLightHaptic();
                      setFilters(prev => ({ ...prev, hasNote: filters.hasNote === true ? null : true }));
                    }}
                  >
                    <Text style={[styles.noteFilterText, filters.hasNote === true && styles.noteFilterTextActive]}>With Notes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.noteFilterChip, filters.hasNote === false && styles.noteFilterChipActive]}
                    onPress={() => {
                      triggerLightHaptic();
                      setFilters(prev => ({ ...prev, hasNote: filters.hasNote === false ? null : false }));
                    }}
                  >
                    <Text style={[styles.noteFilterText, filters.hasNote === false && styles.noteFilterTextActive]}>No Notes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </AnimatedCard>
        )}

        {/* Results */}
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {loading ? 'Searching...' : `${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'expense' : 'expenses'} found`}
            </Text>
            {filteredExpenses.length > 0 && (
              <Text style={styles.resultsSummary}>
                Total: {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
              </Text>
            )}
          </View>
          
          {loading ? (
            <LoadingState type="inline" message="Searching expenses..." />
          ) : filteredExpenses.length > 0 ? (
            <FlatList
              data={filteredExpenses}
              renderItem={renderExpenseItem}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              getItemLayout={(data, index) => ({
                length: isTablet ? 80 : 70,
                offset: (isTablet ? 80 : 70) * index,
                index,
              })}
            />
          ) : (
            <NoSearchResultsState searchQuery={debouncedSearchQuery} />
          )}
        </View>
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
  clearSearchButton: {
    padding: 4,
  },
  recentSearches: {
    marginTop: spacing.itemMargin,
  },
  recentSearchesTitle: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.listGap,
  },
  recentSearchesList: {
    marginHorizontal: -spacing.listGap,
  },
  recentSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.listGap,
    paddingVertical: 6,
    marginRight: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  recentSearchText: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    marginLeft: 4,
  },
  filtersSection: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.itemMargin,
    borderRadius: spacing.cardRadius,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    marginRight: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    borderWidth: 1,
    borderColor: theme.primary,
    backgroundColor: theme.surface,
  },
  filterChipActive: {
    backgroundColor: theme.primary,
  },
  filterChipText: {
    fontSize: typography.caption,
    color: theme.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: theme.surface,
  },
  advancedFiltersPanel: {
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
  advancedFiltersTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.itemMargin,
  },
  filterGroup: {
    marginBottom: spacing.itemMargin,
  },
  filterGroupTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: spacing.listGap,
  },
  filterRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteFilterOptions: {
    flexDirection: 'row',
  },
  noteFilterChip: {
    paddingHorizontal: spacing.listGap,
    paddingVertical: 4,
    marginLeft: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.border,
  },
  noteFilterChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  noteFilterText: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  noteFilterTextActive: {
    color: theme.surface,
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
  categoryChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryChipTextActive: {
    color: theme.surface,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
    marginHorizontal: spacing.cardMargin,
    marginTop: spacing.cardMargin,
    backgroundColor: theme.surface,
    borderRadius: spacing.cardRadius,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.itemMargin,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  resultsTitle: {
    fontSize: typography.bodySmall,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  resultsSummary: {
    fontSize: typography.bodySmall,
    color: theme.primary,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.itemMargin,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    minHeight: isTablet ? 80 : 70,
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
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
});