import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';

const { width: screenWidth } = Dimensions.get('window');

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
  example: {
    input: string;
    output: string;
    confidence: string;
  };
}

interface AIFeaturesShowcaseProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const aiFeatures: AIFeature[] = [
  {
    id: 'categorization',
    title: 'Smart Categorization',
    description: 'Our AI automatically categorizes your expenses as you type, learning from your spending patterns.',
    icon: 'category',
    color: '#4ECDC4',
    benefits: [
      'Saves 2-3 minutes per expense entry',
      'Learns your spending habits over time',
      '95% accuracy rate for common expenses',
      'Works offline with local intelligence'
    ],
    example: {
      input: 'Pizza Hut dinner with friends',
      output: 'Food & Dining 🍕',
      confidence: '96%'
    }
  },
  {
    id: 'insights',
    title: 'Spending Insights',
    description: 'Get personalized insights about your spending patterns and receive actionable recommendations.',
    icon: 'insights',
    color: '#96CEB4',
    benefits: [
      'Identifies overspending patterns',
      'Suggests budget optimizations',
      'Predicts future spending trends',
      'Tailored advice for your habits'
    ],
    example: {
      input: 'Weekly food spending: ₹1,200',
      output: 'You spend 40% more on weekends. Try meal prep!',
      confidence: '88%'
    }
  },
  {
    id: 'predictions',
    title: 'Budget Predictions',
    description: 'AI predicts when you might exceed your budget and suggests corrective actions.',
    icon: 'trending-up',
    color: '#FFEAA7',
    benefits: [
      'Early warning system for overspending',
      'Prevents budget overruns by 70%',
      'Smart spending alerts',
      'Adaptive budget recommendations'
    ],
    example: {
      input: 'Current month progress: 75% budget used',
      output: 'Warning: At this rate, you\'ll exceed budget by ₹500',
      confidence: '82%'
    }
  },
  {
    id: 'optimization',
    title: 'Smart Optimization',
    description: 'AI analyzes your spending to find opportunities for savings and better financial habits.',
    icon: 'auto-awesome',
    color: '#FFB6C1',
    benefits: [
      'Identifies unnecessary expenses',
      'Suggests alternative choices',
      'Finds recurring subscription waste',
      'Optimizes category allocations'
    ],
    example: {
      input: 'Monthly coffee shop visits: 22 times',
      output: 'Switch to home coffee 3x/week = Save ₹800/month',
      confidence: '91%'
    }
  }
];

export default function AIFeaturesShowcase({ visible, onClose, onComplete }: AIFeaturesShowcaseProps) {
  const { theme } = useTheme();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);
  
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [exampleLoading, setExampleLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentFeature(0);
      setShowExample(false);
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const nextFeature = () => {
    if (currentFeature < aiFeatures.length - 1) {
      setCurrentFeature(currentFeature + 1);
      setShowExample(false);
    } else {
      if (onComplete) {
        onComplete();
      } else {
        onClose();
      }
    }
  };

  const prevFeature = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
      setShowExample(false);
    }
  };

  const demonstrateFeature = () => {
    setExampleLoading(true);
    setTimeout(() => {
      setExampleLoading(false);
      setShowExample(true);
    }, 1500); // Simulate AI processing time
  };

  const feature = aiFeatures[currentFeature];

  const renderFeatureDemo = () => {
    if (!showExample && !exampleLoading) {
      return (
        <TouchableOpacity 
          style={[styles.demoButton, { backgroundColor: feature.color }]}
          onPress={demonstrateFeature}
        >
          <MaterialIcons name="play-circle-fill" size={24} color="white" />
          <Text style={styles.demoButtonText}>See AI in Action</Text>
        </TouchableOpacity>
      );
    }

    if (exampleLoading) {
      return (
        <View style={styles.demoContainer}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={feature.color} />
            <Text style={styles.processingText}>AI is thinking...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.demoContainer}>
        <View style={[styles.exampleCard, { backgroundColor: theme.surface }]}>
          <View style={styles.exampleHeader}>
            <MaterialIcons name="input" size={16} color={theme.textTertiary} />
            <Text style={[styles.exampleLabel, { color: theme.textSecondary }]}>Input</Text>
          </View>
          <Text style={[styles.exampleInput, { color: theme.text }]}>{feature.example.input}</Text>
          
          <View style={[styles.exampleHeader, { marginTop: spacing.itemMargin }]}>
            <MaterialIcons name="auto-awesome" size={16} color={feature.color} />
            <Text style={[styles.exampleLabel, { color: theme.textSecondary }]}>AI Result</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: feature.color + '20' }]}>
              <Text style={[styles.confidenceText, { color: feature.color }]}>{feature.example.confidence}</Text>
            </View>
          </View>
          <Text style={[styles.exampleOutput, { color: feature.color }]}>
            {feature.example.output}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.tryAgainButton, { borderColor: feature.color }]}
          onPress={() => setShowExample(false)}
        >
          <Text style={[styles.tryAgainText, { color: feature.color }]}>Try Another Example</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>AI Features</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Feature Icon */}
          <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
            <MaterialIcons name={feature.icon as any} size={isTablet ? 70 : 60} color={feature.color} />
          </View>

          {/* Feature Info */}
          <View style={styles.featureInfo}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{feature.description}</Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Benefits</Text>
            {feature.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={20} color={feature.color} />
                <Text style={[styles.benefitText, { color: theme.text }]}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Demo Section */}
          <View style={styles.demoSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Demo</Text>
            {renderFeatureDemo()}
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressDots}>
              {aiFeatures.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index === currentFeature ? feature.color : theme.textTertiary,
                      width: index === currentFeature ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.progressText, { color: theme.textTertiary }]}>
              {currentFeature + 1} of {aiFeatures.length} features
            </Text>
          </View>
        </ScrollView>

        {/* Navigation */}
        <View style={[styles.navigationSection, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentFeature === 0 && styles.navButtonDisabled,
              { backgroundColor: theme.surfaceVariant }
            ]}
            onPress={prevFeature}
            disabled={currentFeature === 0}
          >
            <MaterialIcons 
              name="arrow-back" 
              size={20} 
              color={currentFeature === 0 ? theme.textTertiary : theme.text} 
            />
            <Text style={[
              styles.prevButtonText,
              currentFeature === 0 && styles.navButtonTextDisabled,
              { color: currentFeature === 0 ? theme.textTertiary : theme.text }
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton, { backgroundColor: feature.color }]}
            onPress={nextFeature}
          >
            <Text style={styles.nextButtonText}>
              {currentFeature === aiFeatures.length - 1 ? 'Get Started' : 'Next Feature'}
            </Text>
            <MaterialIcons 
              name={currentFeature === aiFeatures.length - 1 ? 'rocket-launch' : 'arrow-forward'} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
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
  },
  closeButton: {
    padding: spacing.listGap,
  },
  headerTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.containerPadding,
  },
  featureIcon: {
    width: isTablet ? 140 : 120,
    height: isTablet ? 140 : 120,
    borderRadius: isTablet ? 70 : 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: spacing.sectionPadding,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  featureInfo: {
    alignItems: 'center',
    marginBottom: spacing.sectionPadding,
    paddingHorizontal: spacing.itemMargin,
  },
  featureTitle: {
    fontSize: isTablet ? typography.h2 : typography.h3,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: spacing.listGap,
  },
  featureDescription: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.5,
    paddingHorizontal: spacing.itemMargin,
  },
  benefitsSection: {
    marginBottom: spacing.sectionPadding,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing.itemMargin,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  benefitText: {
    fontSize: typography.bodySmall,
    color: theme.text,
    marginLeft: spacing.listGap,
    flex: 1,
    lineHeight: typography.bodySmall * 1.4,
  },
  demoSection: {
    marginBottom: spacing.sectionPadding,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    borderRadius: spacing.buttonRadius,
    marginTop: spacing.itemMargin,
  },
  demoButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: 'white',
    marginLeft: spacing.listGap,
  },
  demoContainer: {
    marginTop: spacing.itemMargin,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sectionPadding,
  },
  processingText: {
    fontSize: typography.caption,
    color: theme.textSecondary,
    marginLeft: spacing.listGap,
  },
  exampleCard: {
    backgroundColor: theme.surface,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.itemMargin,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  exampleLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: theme.textSecondary,
    marginLeft: spacing.listGap,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: theme.primaryContainer,
    paddingHorizontal: spacing.listGap,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: typography.captionSmall,
    fontWeight: '600',
    color: theme.primary,
  },
  exampleInput: {
    fontSize: typography.bodySmall,
    color: theme.text,
    lineHeight: typography.bodySmall * 1.4,
  },
  exampleOutput: {
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: typography.body * 1.4,
  },
  tryAgainButton: {
    borderWidth: 1.5,
    borderRadius: spacing.buttonRadius,
    paddingVertical: spacing.listGap,
    alignItems: 'center',
  },
  tryAgainText: {
    fontSize: typography.caption,
    fontWeight: '500',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing.itemMargin,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.listGap,
  },
  progressText: {
    fontSize: typography.captionSmall,
    color: theme.textTertiary,
  },
  navigationSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    borderRadius: spacing.buttonRadius,
  },
  prevButton: {
    backgroundColor: theme.surfaceVariant,
    marginRight: spacing.listGap,
  },
  nextButton: {
    flex: 1,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  prevButtonText: {
    fontSize: typography.caption,
    color: theme.text,
    fontWeight: '500',
    marginLeft: spacing.listGap,
  },
  nextButtonText: {
    fontSize: typography.caption,
    color: 'white',
    fontWeight: '600',
    marginRight: spacing.listGap,
  },
  navButtonTextDisabled: {
    color: theme.textTertiary,
  },
});