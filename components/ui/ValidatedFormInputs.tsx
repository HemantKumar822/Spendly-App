import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsiveSpacing, useResponsiveTypography } from '@/hooks/useResponsive';
import { ValidationResult } from '@/services/validation';

interface ValidatedTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  validation?: ValidationResult;
  showValidationFeedback?: boolean;
  showSuggestions?: boolean;
  showWarnings?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  warningStyle?: TextStyle;
  suggestionStyle?: TextStyle;
  prefix?: string;
  suffix?: string;
  required?: boolean;
}

export function ValidatedTextInput({
  label,
  validation,
  showValidationFeedback = true,
  showSuggestions = true,
  showWarnings = true,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  warningStyle,
  suggestionStyle,
  prefix,
  suffix,
  required = false,
  ...textInputProps
}: ValidatedTextInputProps) {
  const { theme } = useTheme();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const styles = getStyles(theme, spacing, typography);

  const hasErrors = validation && !validation.isValid;
  const hasWarnings = validation && validation.warnings.length > 0;
  const hasSuggestions = validation && validation.suggestions.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={[styles.label, labelStyle]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Input Container */}
      <View style={[
        styles.inputContainer,
        hasErrors && styles.inputContainerError,
        hasWarnings && !hasErrors && styles.inputContainerWarning
      ]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[
            styles.input,
            prefix && styles.inputWithPrefix,
            suffix && styles.inputWithSuffix,
            inputStyle
          ]}
          placeholderTextColor={theme.textTertiary}
          {...textInputProps}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
        
        {/* Validation Icon */}
        {showValidationFeedback && validation && (
          <View style={styles.validationIcon}>
            {hasErrors && (
              <MaterialIcons name="error" size={20} color={theme.error} />
            )}
            {!hasErrors && hasWarnings && (
              <MaterialIcons name="warning" size={20} color={theme.warning} />
            )}
            {!hasErrors && !hasWarnings && validation.isValid && textInputProps.value && (
              <MaterialIcons name="check-circle" size={20} color={theme.success} />
            )}
          </View>
        )}
      </View>

      {/* Validation Feedback */}
      {showValidationFeedback && validation && (
        <View style={styles.feedbackContainer}>
          {/* Errors */}
          {hasErrors && validation.errors.map((error, index) => (
            <View key={`error-${index}`} style={styles.feedbackItem}>
              <MaterialIcons name="error" size={14} color={theme.error} />
              <Text style={[styles.errorText, errorStyle]}>{error}</Text>
            </View>
          ))}

          {/* Warnings */}
          {!hasErrors && showWarnings && validation.warnings.map((warning, index) => (
            <View key={`warning-${index}`} style={styles.feedbackItem}>
              <MaterialIcons name="warning" size={14} color={theme.warning} />
              <Text style={[styles.warningText, warningStyle]}>{warning}</Text>
            </View>
          ))}

          {/* Suggestions */}
          {!hasErrors && showSuggestions && validation.suggestions.map((suggestion, index) => (
            <View key={`suggestion-${index}`} style={styles.feedbackItem}>
              <MaterialIcons name="lightbulb" size={14} color={theme.primary} />
              <Text style={[styles.suggestionText, suggestionStyle]}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface ValidatedAmountInputProps extends Omit<ValidatedTextInputProps, 'prefix' | 'keyboardType'> {
  currency?: string;
}

export function ValidatedAmountInput({
  currency = '₹',
  ...props
}: ValidatedAmountInputProps) {
  return (
    <ValidatedTextInput
      {...props}
      prefix={currency}
      keyboardType="numeric"
    />
  );
}

interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  required?: boolean;
}

export function FormSection({
  children,
  title,
  description,
  containerStyle,
  titleStyle,
  descriptionStyle,
  required = false,
}: FormSectionProps) {
  const { theme } = useTheme();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const styles = getStyles(theme, spacing, typography);

  return (
    <View style={[styles.sectionContainer, containerStyle]}>
      {title && (
        <Text style={[styles.sectionTitle, titleStyle]}>
          {title}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      {description && (
        <Text style={[styles.sectionDescription, descriptionStyle]}>{description}</Text>
      )}
      {children}
    </View>
  );
}

interface ValidationSummaryProps {
  errors: string[];
  warnings: string[];
  suggestions: string[];
  showErrors?: boolean;
  showWarnings?: boolean;
  showSuggestions?: boolean;
  containerStyle?: ViewStyle;
}

export function ValidationSummary({
  errors,
  warnings,
  suggestions,
  showErrors = true,
  showWarnings = true,
  showSuggestions = true,
  containerStyle,
}: ValidationSummaryProps) {
  const { theme } = useTheme();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const styles = getStyles(theme, spacing, typography);

  const hasContent = (showErrors && errors.length > 0) ||
                    (showWarnings && warnings.length > 0) ||
                    (showSuggestions && suggestions.length > 0);

  if (!hasContent) return null;

  return (
    <View style={[styles.summaryContainer, containerStyle]}>
      {/* Errors */}
      {showErrors && errors.length > 0 && (
        <View style={styles.summarySection}>
          <View style={styles.summarySectionHeader}>
            <MaterialIcons name="error" size={16} color={theme.error} />
            <Text style={styles.summarySectionTitle}>Issues to fix:</Text>
          </View>
          {errors.map((error, index) => (
            <Text key={index} style={styles.summaryError}>• {error}</Text>
          ))}
        </View>
      )}

      {/* Warnings */}
      {showWarnings && warnings.length > 0 && (
        <View style={styles.summarySection}>
          <View style={styles.summarySectionHeader}>
            <MaterialIcons name="warning" size={16} color={theme.warning} />
            <Text style={styles.summarySectionTitle}>Consider:</Text>
          </View>
          {warnings.map((warning, index) => (
            <Text key={index} style={styles.summaryWarning}>• {warning}</Text>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.summarySection}>
          <View style={styles.summarySectionHeader}>
            <MaterialIcons name="lightbulb" size={16} color={theme.primary} />
            <Text style={styles.summarySectionTitle}>Tips:</Text>
          </View>
          {suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.summarySuggestion}>• {suggestion}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any, spacing: any, typography: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.itemMargin,
  },
  label: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.listGap,
  },
  required: {
    color: theme.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.buttonRadius,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: spacing.itemMargin,
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: theme.error,
    backgroundColor: theme.error + '10',
  },
  inputContainerWarning: {
    borderColor: theme.warning,
    backgroundColor: theme.warning + '10',
  },
  input: {
    flex: 1,
    fontSize: typography.body,
    color: theme.text,
    paddingVertical: spacing.listGap,
  },
  inputWithPrefix: {
    marginLeft: spacing.listGap,
  },
  inputWithSuffix: {
    marginRight: spacing.listGap,
  },
  prefix: {
    fontSize: typography.body,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  suffix: {
    fontSize: typography.body,
    color: theme.textSecondary,
  },
  validationIcon: {
    marginLeft: spacing.listGap,
  },
  feedbackContainer: {
    marginTop: spacing.listGap,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  errorText: {
    fontSize: typography.caption,
    color: theme.error,
    marginLeft: spacing.listGap,
    flex: 1,
  },
  warningText: {
    fontSize: typography.caption,
    color: theme.warning,
    marginLeft: spacing.listGap,
    flex: 1,
  },
  suggestionText: {
    fontSize: typography.caption,
    color: theme.primary,
    marginLeft: spacing.listGap,
    flex: 1,
  },
  sectionContainer: {
    padding: spacing.cardPadding,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.itemMargin,
  },
  sectionDescription: {
    fontSize: typography.bodySmall,
    color: theme.textSecondary,
    marginBottom: spacing.itemMargin,
  },
  summaryContainer: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginVertical: spacing.itemMargin,
  },
  summarySection: {
    marginBottom: spacing.itemMargin,
  },
  summarySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  summarySectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: theme.text,
    marginLeft: spacing.listGap,
  },
  summaryError: {
    fontSize: typography.caption,
    color: theme.error,
    marginLeft: spacing.itemMargin,
    lineHeight: 18,
  },
  summaryWarning: {
    fontSize: typography.caption,
    color: theme.warning,
    marginLeft: spacing.itemMargin,
    lineHeight: 18,
  },
  summarySuggestion: {
    fontSize: typography.caption,
    color: theme.primary,
    marginLeft: spacing.itemMargin,
    lineHeight: 18,
  },
});

export default ValidatedTextInput;