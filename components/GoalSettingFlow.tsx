import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography } from '@/hooks/useResponsive';
import { Budget, ExpenseCategory } from '@/types';
import { formatCurrency, generateId } from '@/utils';
import LoadingState from '@/components/ui/LoadingState';
import { StorageService } from '@/services/storage';

interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  monthlyAmount: number;
  categories: {
    categoryId: string;
    percentage: number;
    suggestedAmount: number;
  }[];
  icon: string;
  color: string;
}

interface GoalSettingFlowProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (goals: Budget[]) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const goalTemplates: GoalTemplate[] = [
  {
    id: 'tight',
    name: 'Tight Budget',
    description: 'Perfect for managing expenses with limited funds',
    monthlyAmount: 5000,
    categories: [
      { categoryId: 'food', percentage: 40, suggestedAmount: 2000 },
      { categoryId: 'transport', percentage: 20, suggestedAmount: 1000 },
      { categoryId: 'education', percentage: 15, suggestedAmount: 750 },
      { categoryId: 'entertainment', percentage: 10, suggestedAmount: 500 },
      { categoryId: 'misc', percentage: 15, suggestedAmount: 750 },
    ],
    icon: 'savings',
    color: '#FF6B6B',
  },
  {
    id: 'moderate',
    name: 'Moderate Budget',
    description: 'Balanced approach for average student expenses',
    monthlyAmount: 8000,
    categories: [
      { categoryId: 'food', percentage: 35, suggestedAmount: 2800 },
      { categoryId: 'transport', percentage: 20, suggestedAmount: 1600 },
      { categoryId: 'education', percentage: 15, suggestedAmount: 1200 },
      { categoryId: 'entertainment', percentage: 15, suggestedAmount: 1200 },
      { categoryId: 'shopping', percentage: 10, suggestedAmount: 800 },
      { categoryId: 'misc', percentage: 5, suggestedAmount: 400 },
    ],
    icon: 'account-balance-wallet',
    color: '#4ECDC4',
  },
  {
    id: 'comfortable',
    name: 'Comfortable Budget',
    description: 'For students with higher allowances or income',
    monthlyAmount: 12000,
    categories: [
      { categoryId: 'food', percentage: 30, suggestedAmount: 3600 },
      { categoryId: 'transport', percentage: 15, suggestedAmount: 1800 },
      { categoryId: 'education', percentage: 20, suggestedAmount: 2400 },
      { categoryId: 'entertainment', percentage: 20, suggestedAmount: 2400 },
      { categoryId: 'shopping', percentage: 10, suggestedAmount: 1200 },
      { categoryId: 'misc', percentage: 5, suggestedAmount: 600 },
    ],
    icon: 'diamond',
    color: '#95E1D3',
  },
];

export default function GoalSettingFlow({ visible, onClose, onComplete }: GoalSettingFlowProps) {
  const { theme } = useTheme();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const styles = getStyles(theme, spacing, typography);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [adjustedCategories, setAdjustedCategories] = useState<{ categoryId: string; amount: number }[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      loadCategories();
      setCurrentStep(0);
      setSelectedTemplate(null);
      setCustomAmount('');
      setAdjustedCategories([]);
    }
  }, [visible]);

  const loadCategories = async () => {
    try {
      const categoriesData = await StorageService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: (currentStep + 1) * screenWidth, animated: true });
    } else {
      createGoals();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: (currentStep - 1) * screenWidth, animated: true });
    }
  };

  const selectTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setCustomAmount(template.monthlyAmount.toString());
    
    // Initialize adjusted categories with template values
    const adjusted = template.categories.map(cat => ({
      categoryId: cat.categoryId,
      amount: cat.suggestedAmount,
    }));
    setAdjustedCategories(adjusted);
  };

  const updateCustomAmount = (amount: string) => {
    setCustomAmount(amount);
    
    if (selectedTemplate && amount && !isNaN(parseFloat(amount))) {
      const totalAmount = parseFloat(amount);
      const adjusted = selectedTemplate.categories.map(cat => ({
        categoryId: cat.categoryId,
        amount: Math.round((totalAmount * cat.percentage) / 100),
      }));
      setAdjustedCategories(adjusted);
    }
  };

  const updateCategoryAmount = (categoryId: string, amount: string) => {
    const numAmount = amount ? parseFloat(amount) : 0;
    setAdjustedCategories(prev => 
      prev.map(cat => 
        cat.categoryId === categoryId ? { ...cat, amount: numAmount } : cat
      )
    );
  };

  const createGoals = async () => {
    if (!selectedTemplate || adjustedCategories.length === 0) return;

    setLoading(true);
    try {
      const goals: Budget[] = [];
      
      // Create overall goal
      const totalGoal: Budget = {
        id: generateId(),
        amount: parseFloat(customAmount),
        period: 'monthly',
        startDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      goals.push(totalGoal);

      // Create category goals
      for (const catGoal of adjustedCategories) {
        if (catGoal.amount > 0) {
          const goal: Budget = {
            id: generateId(),
            categoryId: catGoal.categoryId,
            amount: catGoal.amount,
            period: 'monthly',
            startDate: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          goals.push(goal);
        }
      }

      // Save goals
      for (const goal of goals) {
        await StorageService.saveBudget(goal);
      }

      // Mark goal setting as completed
      await StorageService.setGoalSettingCompleted(true);

      onComplete(goals);
    } catch (error) {
      console.error('Error creating goals:', error);
      Alert.alert('Error', 'Failed to create goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAllocated = () => {
    return adjustedCategories.reduce((sum, cat) => sum + cat.amount, 0);
  };

  const getRemainingAmount = () => {
    const total = parseFloat(customAmount) || 0;
    return total - getTotalAllocated();
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        {[0, 1, 2].map(step => (
          <View key={step} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              {
                backgroundColor: step <= currentStep ? theme.primary : theme.border,
              }
            ]}>
              <Text style={[
                styles.stepNumber,
                { color: step <= currentStep ? theme.onPrimary : theme.textTertiary }
              ]}>
                {step + 1}
              </Text>
            </View>
            {step < 2 && (
              <View style={[
                styles.stepLine,
                { backgroundColor: step < currentStep ? theme.primary : theme.border }
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderTemplateSelection = () => {
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Choose Your Budget Style</Text>
        <Text style={styles.stepDescription}>
          Select a template that matches your financial situation. You can customize it in the next step.
        </Text>
        
        <ScrollView style={styles.templatesContainer}>
          {goalTemplates.map(template => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate?.id === template.id && styles.templateCardSelected,
                { borderColor: selectedTemplate?.id === template.id ? template.color : theme.border }
              ]}
              onPress={() => selectTemplate(template)}
            >
              <View style={[styles.templateIcon, { backgroundColor: template.color + '15' }]}>
                <MaterialIcons name={template.icon as any} size={32} color={template.color} />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <Text style={[styles.templateAmount, { color: template.color }]}>
                  ₹{template.monthlyAmount.toLocaleString()}/month
                </Text>
              </View>
              {selectedTemplate?.id === template.id && (
                <MaterialIcons name="check-circle" size={24} color={template.color} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCustomization = () => {
    if (!selectedTemplate) return null;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Customize Your Budget</Text>
        <Text style={styles.stepDescription}>
          Adjust the total amount and category allocations to fit your needs.
        </Text>

        {/* Total Amount */}
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Monthly Budget</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountTextInput}
              value={customAmount}
              onChangeText={updateCustomAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.customSection}>
          <Text style={styles.sectionTitle}>Category Allocation</Text>
          <ScrollView style={styles.categoryList}>
            {adjustedCategories.map(catGoal => {
              const category = categories.find(cat => cat.id === catGoal.categoryId);
              if (!category) return null;
              
              const templateCat = selectedTemplate.categories.find(tc => tc.categoryId === catGoal.categoryId);
              const suggestedAmount = templateCat?.suggestedAmount || 0;
              
              return (
                <View key={catGoal.categoryId} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.suggestedAmount}>
                        Suggested: ₹{suggestedAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryAmountContainer}>
                    <Text style={styles.currencySymbolSmall}>₹</Text>
                    <TextInput
                      style={styles.categoryAmountInput}
                      value={catGoal.amount.toString()}
                      onChangeText={(text) => updateCategoryAmount(catGoal.categoryId, text)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.textTertiary}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Budget:</Text>
            <Text style={styles.summaryValue}>₹{customAmount || '0'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Allocated:</Text>
            <Text style={styles.summaryValue}>₹{getTotalAllocated().toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining:</Text>
            <Text style={[
              styles.summaryValue,
              { color: getRemainingAmount() >= 0 ? theme.success : theme.error }
            ]}>
              ₹{getRemainingAmount().toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderConfirmation = () => {
    if (!selectedTemplate) return null;

    return (
      <View style={styles.stepContent}>
        <View style={styles.confirmationIcon}>
          <MaterialIcons name="check-circle" size={80} color={theme.success} />
        </View>
        <Text style={styles.stepTitle}>Perfect! You're All Set</Text>
        <Text style={styles.stepDescription}>
          Your budget has been configured. Start tracking expenses and watch your financial goals come to life!
        </Text>

        <View style={styles.confirmationSummary}>
          <Text style={styles.confirmationTitle}>Your Budget Summary</Text>
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>Monthly Budget:</Text>
            <Text style={styles.confirmationValue}>₹{customAmount}</Text>
          </View>
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>Categories:</Text>
            <Text style={styles.confirmationValue}>{adjustedCategories.length} categories</Text>
          </View>
          <View style={styles.confirmationItem}>
            <Text style={styles.confirmationLabel}>Template:</Text>
            <Text style={styles.confirmationValue}>{selectedTemplate.name}</Text>
          </View>
        </View>

        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>What happens next?</Text>
          {[
            'Track expenses with AI categorization',
            'Get real-time budget progress updates',
            'Receive smart spending insights',
            'Achieve your financial goals!'
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <MaterialIcons name="auto-awesome" size={16} color={theme.primary} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderTemplateSelection();
      case 1:
        return renderCustomization();
      case 2:
        return renderConfirmation();
      default:
        return renderTemplateSelection();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedTemplate !== null;
      case 1:
        return customAmount && parseFloat(customAmount) > 0 && getRemainingAmount() >= 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

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
            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Set Your Financial Goals</Text>
          <View style={styles.progressContainer}>
            {[0, 1, 2].map(step => (
              <View 
                key={step} 
                style={[
                  styles.progressDot,
                  { backgroundColor: step <= currentStep ? theme.primary : theme.border }
                ]} 
              />
            ))}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.content}
        >
          {/* Step 1: Choose Template */}
          <View style={[styles.step, { width: screenWidth }]}>
            <Text style={styles.stepTitle}>Choose a Budget Template</Text>
            <Text style={styles.stepSubtitle}>
              Select a template that matches your spending habits or create a custom budget
            </Text>
            
            <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
              {goalTemplates.map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === template.id && styles.templateCardSelected,
                    { borderColor: selectedTemplate?.id === template.id ? template.color : theme.border }
                  ]}
                  onPress={() => selectTemplate(template)}
                >
                  <View style={[styles.templateIcon, { backgroundColor: template.color + '15' }]}>
                    <MaterialIcons name={template.icon as any} size={32} color={template.color} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                    <Text style={[styles.templateAmount, { color: template.color }]}>
                      ₹{template.monthlyAmount.toLocaleString()}/month
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Custom Option */}
              <TouchableOpacity
                style={[
                  styles.templateCard,
                  !selectedTemplate && styles.templateCardSelected,
                  { borderColor: !selectedTemplate ? theme.primary : theme.border }
                ]}
                onPress={() => {
                  setSelectedTemplate(null);
                  setCustomAmount('');
                  setAdjustedCategories([]);
                }}
              >
                <View style={[styles.templateIcon, { backgroundColor: theme.primary + '15' }]}>
                  <MaterialIcons name="edit" size={32} color={theme.primary} />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>Custom Budget</Text>
                  <Text style={styles.templateDescription}>
                    Create your own budget from scratch
                  </Text>
                  <Text style={[styles.templateAmount, { color: theme.primary }]}>
                    Set your own amount
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Step 2: Customize Amount */}
          <View style={[styles.step, { width: screenWidth }]}>
            <Text style={styles.stepTitle}>Set Your Budget Amount</Text>
            <Text style={styles.stepSubtitle}>
              Adjust the total monthly budget amount
            </Text>
            
            <View style={styles.customSection}>
              <Text style={styles.sectionTitle}>Monthly Budget</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInputField}
                  value={customAmount}
                  onChangeText={updateCustomAmount}
                  placeholder="Enter amount"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Step 3: Adjust Categories */}
          <View style={[styles.step, { width: screenWidth }]}>
            <Text style={styles.stepTitle}>Adjust Category Allocations</Text>
            <Text style={styles.stepSubtitle}>
              Fine-tune how your budget is distributed across categories
            </Text>
            
            <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
              {adjustedCategories.map((catGoal, index) => {
                const category = categories.find(cat => cat.id === catGoal.categoryId);
                if (!category) return null;
                
                const templateCat = selectedTemplate?.categories.find(tc => tc.categoryId === catGoal.categoryId);
                const suggestedAmount = templateCat?.suggestedAmount || 0;
                
                return (
                  <View key={category.id} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.suggestedAmount}>
                          Suggested: ₹{suggestedAmount.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.currencySymbolSmall}>₹</Text>
                      <TextInput
                        style={styles.categoryAmountInput}
                        value={catGoal.amount.toString()}
                        onChangeText={(text) => updateCategoryAmount(category.id, text)}
                        placeholder="0"
                        placeholderTextColor={theme.textTertiary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigationSection}>
          <TouchableOpacity 
            onPress={prevStep} 
            style={styles.backButton}
            disabled={currentStep === 0}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.textSecondary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.spacer} />
          
          <TouchableOpacity 
            onPress={nextStep} 
            style={[styles.continueButton, loading && styles.continueButtonDisabled]}
            disabled={loading || (currentStep === 0 && !selectedTemplate)}
          >
            <Text style={styles.continueButtonText}>
              {currentStep === 2 ? 'Create Budgets' : 'Continue'}
            </Text>
            {currentStep < 2 && (
              <MaterialIcons name="arrow-forward" size={20} color={theme.onPrimary} />
            )}
            {loading && currentStep === 2 && (
              <LoadingState />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: any, spacing: ReturnType<typeof useResponsiveSpacing>, typography: ReturnType<typeof useResponsiveTypography>) => StyleSheet.create({
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
  },
  closeButton: {
    padding: spacing.listGap,
  },
  title: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: spacing.listGap / 1.5,
    height: spacing.listGap / 1.5,
    borderRadius: spacing.listGap / 3,
    marginHorizontal: spacing.listGap / 3,
  },
  content: {
    flex: 1,
  },
  step: {
    flex: 1,
    padding: spacing.containerPadding,
  },
  stepTitle: {
    fontSize: typography.h1,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: spacing.listGap,
  },
  stepSubtitle: {
    fontSize: typography.body,
    color: theme.textSecondary,
    marginBottom: spacing.itemMargin,
  },
  templatesContainer: {
    flex: 1,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: spacing.buttonRadius,
    padding: spacing.itemMargin,
    marginBottom: spacing.listGap,
    borderWidth: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  templateCardSelected: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  templateIcon: {
    width: spacing.sectionPadding * 2.4,
    height: spacing.sectionPadding * 2.4,
    borderRadius: spacing.sectionPadding * 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.itemMargin,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.listGap / 3,
  },
  templateDescription: {
    fontSize: typography.bodySmall,
    color: theme.textSecondary,
    marginBottom: spacing.listGap,
    lineHeight: spacing.listGap * 1.67,
  },
  templateAmount: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.primary,
  },
  customSection: {
    marginBottom: spacing.itemMargin,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.listGap,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.buttonRadius,
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.itemMargin,
    borderWidth: 1,
    borderColor: theme.border,
  },
  currencySymbol: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: theme.textSecondary,
    marginRight: spacing.listGap,
  },
  amountInputField: {
    flex: 1,
    fontSize: typography.h3,
    fontWeight: '600',
    color: theme.text,
    paddingVertical: 0,
  },
  categoriesContainer: {
    flex: 1,
    marginTop: spacing.listGap,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    borderRadius: spacing.buttonRadius,
    padding: spacing.itemMargin,
    marginBottom: spacing.listGap,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: spacing.cardPadding * 2,
    height: spacing.cardPadding * 2,
    borderRadius: spacing.cardPadding,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.listGap,
  },
  categoryEmoji: {
    fontSize: typography.h4,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.listGap / 3,
  },
  suggestedAmount: {
    fontSize: typography.caption,
    color: theme.textSecondary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.listGap,
    paddingHorizontal: spacing.listGap,
    paddingVertical: spacing.listGap,
  },
  currencySymbolSmall: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.textSecondary,
    marginRight: spacing.listGap / 3,
  },
  categoryAmountInput: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
    minWidth: spacing.sectionPadding * 2.4,
  },
  navigationSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.surfaceVariant,
  },
  backButtonText: {
    fontSize: typography.body,
    color: theme.text,
    fontWeight: '500',
    marginLeft: spacing.listGap,
  },
  spacer: {
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.primary,
    minWidth: spacing.sectionPadding * 4,
  },
  continueButtonDisabled: {
    backgroundColor: theme.textTertiary,
  },
  continueButtonText: {
    fontSize: typography.body,
    color: theme.onPrimary,
    fontWeight: '600',
    marginRight: spacing.listGap,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.itemMargin,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: spacing.sectionPadding * 2,
    height: spacing.sectionPadding * 2,
    borderRadius: spacing.sectionPadding,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  stepLine: {
    width: spacing.sectionPadding * 2,
    height: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: typography.body,
    color: theme.textSecondary,
    marginBottom: spacing.itemMargin,
  },
  amountTextInput: {
    flex: 1,
    fontSize: typography.h3,
    fontWeight: '600',
    color: theme.text,
    paddingVertical: 0,
  },
  categoryList: {
    flex: 1,
  },
  categoryAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.listGap,
    paddingHorizontal: spacing.listGap,
    paddingVertical: spacing.listGap,
  },
  summaryContainer: {
    marginTop: spacing.itemMargin,
    padding: spacing.itemMargin,
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.buttonRadius,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  summaryLabel: {
    fontSize: typography.body,
    color: theme.text,
  },
  summaryValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
  },
  confirmationIcon: {
    alignItems: 'center',
    marginBottom: spacing.itemMargin,
  },
  confirmationSummary: {
    backgroundColor: theme.surface,
    borderRadius: spacing.buttonRadius,
    padding: spacing.itemMargin,
    marginBottom: spacing.itemMargin,
  },
  confirmationTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.listGap,
  },
  confirmationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  confirmationLabel: {
    fontSize: typography.body,
    color: theme.textSecondary,
  },
  confirmationValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.text,
  },
  benefitsContainer: {
    backgroundColor: theme.surface,
    borderRadius: spacing.buttonRadius,
    padding: spacing.itemMargin,
  },
  benefitsTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.listGap,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  benefitText: {
    fontSize: typography.body,
    color: theme.text,
    marginLeft: spacing.listGap,
  },
});
