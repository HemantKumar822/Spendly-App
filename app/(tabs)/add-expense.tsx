import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';

import { Expense, ExpenseCategory, AddExpenseForm } from '@/types';
import { StorageService } from '@/services/storage';
import { AIService } from '@/services/ai';
import { generateId } from '@/utils';
import useFormValidation from '@/hooks/useFormValidation';
import { ValidatedAmountInput, ValidatedTextInput, FormSection, ValidationSummary } from '@/components/ui/ValidatedFormInputs';
import { DEFAULT_CATEGORIES } from '@/types/categories';
import DatePickerModal from '@/components/DatePickerModal';
import { format } from 'date-fns';
import AnimatedCard from '@/components/ui/AnimatedCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import ResponsiveContainer, { ResponsiveGrid } from '@/components/ui/ResponsiveContainer';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

export default function AddExpenseScreen() {
  return (
    <ComponentErrorBoundary componentName="AddExpenseScreen">
      <AddExpenseContent />
    </ComponentErrorBoundary>
  );
}

function AddExpenseContent() {
  const { theme } = useTheme();
  const { triggerLightHaptic, triggerMediumHaptic, triggerSuccessHaptic } = useHaptics();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);
  
  const [form, setForm] = useState<AddExpenseForm>({
    amount: '',
    description: '',
    categoryId: '',
    note: '',
    date: new Date(),
  });
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  // Enhanced validation with real-time feedback
  const {
    validateAmount,
    validateDescription,
    validateCategory,
    validateNote,
    validateDate,
    getFieldValidation,
    getFieldError,
    hasFieldError,
    getFieldSuggestions,
    isFormValid,
    getAllErrors,
    getAllWarnings,
    getAllSuggestions,
    clearAllValidation
  } = useFormValidation();
  const [isAICategorizing, setIsAICategorizing] = useState(false);
  const [aiStatus, setAiStatus] = useState<'unknown' | 'available' | 'unavailable'>('unknown');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    loadCategories();
    checkAIStatus();
  }, []);
  
  const checkAIStatus = async () => {
    try {
      const health = await AIService.checkAIServiceHealth();
      setAiStatus(health.available ? 'available' : 'unavailable');
      if (health.error) {
        console.log('AI Status:', health.error);
      }
    } catch (error) {
      setAiStatus('unavailable');
    }
  };

  const loadCategories = async () => {
    try {
      const loadedCategories = await StorageService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const validateForm = (): boolean => {
    // Validate all fields with immediate feedback
    validateAmount(form.amount, { required: true }, true);
    validateDescription(form.description, { required: true }, true);
    validateCategory(form.categoryId, categories, { required: true }, true);
    validateNote(form.note || '', {}, true);
    validateDate(form.date, { required: true }, true);
    
    return isFormValid;
  };

  const handleAICategorization = async () => {
    if (!form.description || !form.amount) return;
    
    setIsAICategorizing(true);
    setAiResponse('');
    
    try {
      const result = await AIService.categorizeExpense({
        description: form.description,
        amount: parseFloat(form.amount),
      });
      
      if (result.categoryId && categories.some(cat => cat.id === result.categoryId)) {
        setForm(prev => ({ ...prev, categoryId: result.categoryId }));
        setAiResponse(`${result.reasoning} (${(result.confidence * 100).toFixed(0)}% confidence)`);
      } else {
        setAiResponse('Could not determine category automatically');
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
      setAiResponse('AI categorization failed, please select manually');
    } finally {
      setIsAICategorizing(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === form.categoryId);
      if (!selectedCategory) {
        Alert.alert('Error', 'Invalid category selected');
        return;
      }
      
      const expense: Expense = {
        id: generateId(),
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        category: selectedCategory,
        date: form.date.toISOString(),
        note: form.note?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await StorageService.saveExpense(expense);
      
      Alert.alert(
        'Success',
        'Expense added successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setForm({
                amount: '',
                description: '',
                categoryId: '',
                note: '',
                date: new Date(),
              });
              clearAllValidation();
            },
          },
          {
            text: 'Go to Dashboard',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving expense:', error);
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryGrid = () => {
    const selectedCategory = categories.find(cat => cat.id === form.categoryId);
    
    return (
      <View style={styles.categorySection}>
        {/* Selected Category Display */}
        {selectedCategory ? (
          <View style={styles.selectedCategoryDisplay}>
            <View style={[styles.selectedCategoryIcon, { backgroundColor: selectedCategory.color }]}>
              <Text style={styles.selectedCategoryEmoji}>{selectedCategory.emoji}</Text>
            </View>
            <View style={styles.selectedCategoryInfo}>
              <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
              <Text style={styles.selectedCategoryLabel}>Category selected</Text>
            </View>
            <TouchableOpacity 
              style={styles.changeCategoryButton}
              onPress={() => {
                triggerLightHaptic();
                setForm(prev => ({ ...prev, categoryId: '' }));
              }}
            >
              <Text style={styles.changeCategoryText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Category Selection Grid */
          <View style={styles.categoryGrid}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryButton}
                onPress={() => {
                  triggerMediumHaptic();
                  setForm(prev => ({ ...prev, categoryId: category.id }));
                  validateCategory(category.id, categories, { required: true });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                </View>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Add Expense</Text>
            <Text style={styles.subtitle}>Track your spending</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Main Form Container */}
          <View style={styles.formContainer}>
            
            {/* Step 1: Amount */}
            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>How much did you spend?</Text>
              </View>
              
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    hasFieldError('amount') && styles.inputError
                  ]}
                  value={form.amount}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    // Prevent multiple decimal points
                    const parts = cleaned.split('.');
                    const final = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                    setForm(prev => ({ ...prev, amount: final }));
                    validateAmount(final, { required: true });
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />
              </View>
              
              {hasFieldError('amount') && (
                <View style={styles.fieldError}>
                  <MaterialIcons name="error" size={16} color={theme.error} />
                  <Text style={styles.fieldErrorText}>{getFieldError('amount')}</Text>
                </View>
              )}
            </View>

            {/* Step 2: Description */}
            {form.amount && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepTitle}>What did you buy?</Text>
                </View>
                
                <TextInput
                  style={[
                    styles.descriptionInput,
                    hasFieldError('description') && styles.inputError
                  ]}
                  value={form.description}
                  onChangeText={(text) => {
                    setForm(prev => ({ ...prev, description: text }));
                    validateDescription(text, { required: true });
                  }}
                  placeholder="Coffee, Lunch, Groceries..."
                  maxLength={100}
                  returnKeyType="done"
                />
                
                {/* AI Suggestion */}
                {form.description.length > 2 && form.amount && aiStatus === 'available' && (
                  <TouchableOpacity
                    onPress={() => {
                      triggerMediumHaptic();
                      handleAICategorization();
                    }}
                    disabled={isAICategorizing}
                    style={styles.aiSuggestionButton}
                  >
                    <MaterialIcons 
                      name={isAICategorizing ? "hourglass-empty" : "auto-awesome"} 
                      size={16} 
                      color={theme.primary} 
                    />
                    <Text style={styles.aiSuggestionText}>
                      {isAICategorizing ? 'Getting suggestion...' : 'Get AI category suggestion'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {aiResponse && (
                  <View style={styles.aiResponse}>
                    <MaterialIcons name="psychology" size={16} color={theme.primary} />
                    <Text style={styles.aiResponseText}>{aiResponse}</Text>
                  </View>
                )}
                
                {hasFieldError('description') && (
                  <View style={styles.fieldError}>
                    <MaterialIcons name="error" size={16} color={theme.error} />
                    <Text style={styles.fieldErrorText}>{getFieldError('description')}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Step 3: Category */}
            {form.description && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepTitle}>Choose a category</Text>
                </View>
                
                {hasFieldError('category') && (
                  <View style={styles.fieldError}>
                    <MaterialIcons name="error" size={16} color={theme.error} />
                    <Text style={styles.fieldErrorText}>{getFieldError('category')}</Text>
                  </View>
                )}
                
                {renderCategoryGrid()}
              </View>
            )}

            {/* Step 4: Additional Details (Optional) */}
            {form.categoryId && (
              <View style={styles.step}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, styles.stepNumberOptional]}>
                    <MaterialIcons name="add" size={16} color={theme.textSecondary} />
                  </View>
                  <Text style={styles.stepTitle}>Add details (optional)</Text>
                </View>
                
                {/* Date */}
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => {
                    triggerLightHaptic();
                    setDatePickerVisible(true);
                  }}
                >
                  <MaterialIcons name="calendar-today" size={20} color={theme.primary} />
                  <Text style={styles.dateSelectorText}>
                    {format(form.date, 'MMM d, yyyy')}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
                
                {/* Note */}
                <TextInput
                  style={styles.noteInput}
                  value={form.note || ''}
                  onChangeText={(text) => {
                    setForm(prev => ({ ...prev, note: text }));
                    validateNote(text);
                  }}
                  placeholder="Add a note (e.g., with friends, for work...)"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        {form.amount && form.description && form.categoryId && (
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading || !isFormValid}
              style={[styles.primaryButton, (loading || !isFormValid) && styles.disabledButton]}
              activeOpacity={0.8}
            >
              <MaterialIcons 
                name="save" 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save Expense'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Validation Summary */}
        {/* Removed - Now using inline validation */}

        {/* Date Picker Modal */}
        <DatePickerModal
          visible={datePickerVisible}
          selectedDate={form.date}
          onClose={() => setDatePickerVisible(false)}
          onDateSelect={(date) => {
            setForm(prev => ({ ...prev, date }));
            validateDate(date, { required: true });
            setDatePickerVisible(false);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme, isTablet: boolean, spacing: any, typography: any, icons: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formContainer: {
    gap: 32,
  },
  step: {
    gap: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberOptional: {
    backgroundColor: theme.surfaceVariant,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.onPrimary,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  
  // Amount Input Styles
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '600',
    color: theme.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    padding: 0,
  },
  
  // Description Input Styles
  descriptionInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Error Styles
  inputError: {
    borderColor: theme.error,
    borderWidth: 2,
  },
  fieldError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.error + '15',
    borderRadius: 8,
  },
  fieldErrorText: {
    fontSize: 14,
    color: theme.error,
    flex: 1,
  },
  
  // AI Suggestion Styles
  aiSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  aiSuggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.primary,
  },
  aiResponse: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
  },
  aiResponseText: {
    fontSize: 13,
    color: theme.primary,
    flex: 1,
    fontStyle: 'italic',
  },
  
  // Category Styles
  categorySection: {
    gap: 16,
  },
  selectedCategoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryContainer,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.primary + '30',
  },
  selectedCategoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCategoryEmoji: {
    fontSize: 24,
  },
  selectedCategoryInfo: {
    flex: 1,
  },
  selectedCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  selectedCategoryLabel: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  changeCategoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  changeCategoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: isTablet ? '18%' : '22%',
    aspectRatio: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  
  // Date and Note Styles
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  noteInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Footer
  footer: {
    padding: 20,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: theme.primary || '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
