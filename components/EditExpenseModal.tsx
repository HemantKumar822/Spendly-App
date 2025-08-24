import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Expense, ExpenseCategory, AddExpenseForm } from '@/types';
import { StorageService } from '@/services/storage';
import useFormValidation from '@/hooks/useFormValidation';
import { ValidatedAmountInput, ValidatedTextInput, FormSection, ValidationSummary } from '@/components/ui/ValidatedFormInputs';
import { DEFAULT_CATEGORIES } from '@/types/categories';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useExpenseSubscription } from '@/hooks/useDataSubscription';

interface EditExpenseModalProps {
  visible: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSave: (updatedExpense: Expense) => void;
}

export default function EditExpenseModal({ visible, expense, onClose, onSave }: EditExpenseModalProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [form, setForm] = useState<AddExpenseForm>({
    amount: '',
    description: '',
    categoryId: '',
    note: '',
    date: new Date(),
  });
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Subscribe to expense changes to keep data fresh
  useExpenseSubscription(() => {
    // This will help keep the UI consistent when expenses are added/updated elsewhere
  });

  // Enhanced validation with real-time feedback
  const {
    validateAmount,
    validateDescription,
    validateCategory,
    validateNote,
    getFieldValidation,
    getFieldError,
    hasFieldError,
    isFormValid,
    getAllErrors,
    getAllWarnings,
    getAllSuggestions,
    clearAllValidation
  } = useFormValidation();

  useEffect(() => {
    if (visible && expense) {
      setForm({
        amount: expense.amount.toString(),
        description: expense.description,
        categoryId: expense.category.id,
        note: expense.note || '',
        date: new Date(expense.date),
      });
      loadCategories();
    }
  }, [visible, expense]);

  const loadCategories = useCallback(async () => {
    try {
      const loadedCategories = await StorageService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!expense) return false;
    
    // Validate all fields with immediate feedback
    validateAmount(form.amount, { required: true }, true);
    validateDescription(form.description, { required: true }, true);
    validateCategory(form.categoryId, categories, { required: true }, true);
    validateNote(form.note || '', {}, true);
    
    return isFormValid;
  }, [expense, form, categories, validateAmount, validateDescription, validateCategory, validateNote, isFormValid]);

  const handleSave = useCallback(async () => {
    if (!expense || !validateForm()) return;
    
    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === form.categoryId);
      if (!selectedCategory) {
        Alert.alert('Error', 'Invalid category selected');
        return;
      }
      
      const updatedExpense: Expense = {
        ...expense,
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        category: selectedCategory,
        date: form.date.toISOString(),
        note: form.note?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      
      await StorageService.updateExpense(updatedExpense);
      onSave(updatedExpense);
      onClose();
      
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [expense, form, categories, validateForm, onSave, onClose]);

  const handleClose = useCallback(() => {
    clearAllValidation();
    onClose();
  }, [clearAllValidation, onClose]);

  const renderCategoryGrid = useCallback(() => {
    const rows = [];
    for (let i = 0; i < categories.length; i += 3) {
      const rowCategories = categories.slice(i, i + 3);
      rows.push(
        <View key={i} style={styles.categoryRow}>
          {rowCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                form.categoryId === category.id && styles.categoryButtonSelected,
              ]}
              onPress={() => {
                setForm(prev => ({ ...prev, categoryId: category.id }));
                validateCategory(category.id, categories, { required: true });
              }}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color },
                  form.categoryId === category.id && styles.categoryIconSelected,
                ]}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  form.categoryId === category.id && styles.categoryLabelSelected,
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Fill empty spaces to maintain grid layout */}
          {rowCategories.length < 3 &&
            Array(3 - rowCategories.length)
              .fill(null)
              .map((_, index) => <View key={`empty-${index}`} style={styles.categoryButton} />)
          }
        </View>
      );
    }
    return rows;
  }, [categories, form.categoryId, validateCategory, styles]);

  if (!expense) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Expense</Text>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <FormSection title="Amount">
            <ValidatedAmountInput
              label=""
              value={form.amount}
              onChangeText={(text) => {
                setForm(prev => ({ ...prev, amount: text }));
                validateAmount(text, { required: true });
              }}
              placeholder="0.00"
              validation={getFieldValidation('amount')}
              required
            />
          </FormSection>

          {/* Description Input */}
          <FormSection title="Description">
            <ValidatedTextInput
              label=""
              value={form.description}
              onChangeText={(text) => {
                setForm(prev => ({ ...prev, description: text }));
                validateDescription(text, { required: true });
              }}
              placeholder="What did you buy?"
              maxLength={100}
              validation={getFieldValidation('description')}
              required
            />
          </FormSection>

          {/* Category Selection */}
          <FormSection title="Category">
            {hasFieldError('category') && (
              <Text style={styles.errorText}>{getFieldError('category')}</Text>
            )}
            <View style={styles.categoryGrid}>
              {renderCategoryGrid()}
            </View>
          </FormSection>

          {/* Note Input */}
          <FormSection title="Note (Optional)">
            <ValidatedTextInput
              label=""
              value={form.note || ''}
              onChangeText={(text) => {
                setForm(prev => ({ ...prev, note: text }));
                validateNote(text);
              }}
              placeholder="Add a note..."
              multiline
              numberOfLines={3}
              maxLength={200}
              validation={getFieldValidation('note')}
            />
          </FormSection>
          
          {/* Validation Summary */}
          <ValidationSummary
            errors={getAllErrors()}
            warnings={getAllWarnings()}
            suggestions={getAllSuggestions()}
          />
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: theme.textTertiary,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surfaceVariant,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    paddingVertical: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.surfaceVariant,
  },
  categoryGrid: {
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surfaceVariant,
  },
  categoryButtonSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryContainer,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  categoryLabelSelected: {
    color: theme.text,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.surfaceVariant,
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.error,
  },
  errorText: {
    fontSize: 12,
    color: theme.error,
    marginTop: 4,
  },
});