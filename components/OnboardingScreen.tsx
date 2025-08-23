import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AIFeaturesShowcase from './AIFeaturesShowcase';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Spendly',
    subtitle: 'Your Smart Expense Companion',
    description: 'Track expenses effortlessly with AI-powered insights designed to help you save money and achieve your financial goals.',
    icon: 'celebration',
    color: '#4ECDC4',
    features: [
      'Track daily expenses instantly',
      'AI-powered smart categorization',
      'Beautiful insights and charts',
      'Budget management made easy'
    ]
  },
  {
    id: 'ai-features',
    title: 'AI-Powered Smart Features',
    subtitle: 'Let AI Do the Work',
    description: 'Our intelligent system automatically categorizes your expenses and provides personalized insights to help you make better financial decisions.',
    icon: 'auto-awesome',
    color: '#96CEB4',
    features: [
      'Automatic expense categorization',
      'Smart spending predictions',
      'Personalized financial insights',
      'Budget optimization suggestions'
    ]
  },
  {
    id: 'budgeting',
    title: 'Smart Budget Management',
    subtitle: 'Stay on Track',
    description: 'Set budgets, track progress, and get alerts when you\'re close to your limits. Take control of your spending with intelligent budgeting tools.',
    icon: 'account-balance-wallet',
    color: '#FFEAA7',
    features: [
      'Weekly & monthly budgets',
      'Real-time progress tracking',
      'Smart spending alerts',
      'Category-wise budget limits'
    ]
  },
  {
    id: 'insights',
    title: 'Beautiful Analytics',
    subtitle: 'Understand Your Spending',
    description: 'Visualize your spending patterns with interactive charts and detailed breakdowns. Make informed decisions with powerful analytics.',
    icon: 'bar-chart',
    color: '#FFB6C1',
    features: [
      'Interactive spending charts',
      'Category breakdowns',
      'Trend analysis over time',
      'Spending velocity insights'
    ]
  }
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme } = useTheme();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAIShowcase, setShowAIShowcase] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const nextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      const nextIndex = currentSlide + 1;
      setCurrentSlide(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      const prevIndex = currentSlide - 1;
      setCurrentSlide(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * screenWidth,
        animated: true,
      });
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    return (
      <View key={slide.id} style={styles.slide}>
        <View style={styles.slideContent}>
          {/* Icon */}
          <Animated.View style={[styles.iconContainer, { 
            backgroundColor: slide.color + '15',
            transform: [{
              scale: scrollX.interpolate({
                inputRange: [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
                outputRange: [0.9, 1, 0.9],
                extrapolate: 'clamp'
              })
            }]
          }]}>
            <MaterialIcons name={slide.icon as any} size={isTablet ? 90 : 70} color={slide.color} />
          </Animated.View>

          {/* Content */}
          <View style={styles.textContent}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>

            {/* Features List */}
            <View style={styles.featuresList}>
              {slide.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={20} color={slide.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* AI Features Learn More Button */}
            {slide.id === 'ai-features' && (
              <TouchableOpacity
                onPress={() => setShowAIShowcase(true)}
                style={[styles.learnMoreButton, { backgroundColor: slide.color + '15', borderColor: slide.color }]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="auto-awesome" size={20} color={slide.color} />
                <Text style={[styles.learnMoreText, { color: slide.color }]}>
                  Explore AI Features
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingSlides.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: theme.textTertiary,
                width: 8,
                opacity: scrollX.interpolate({
                  inputRange: [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp'
                })
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={skipOnboarding}
          style={styles.skipButton}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.slideContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingSlides.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination */}
        {renderPagination()}

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentSlide > 0 && (
            <TouchableOpacity
              onPress={prevSlide}
              style={styles.navButton}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-back" size={20} color={theme.text} />
              <Text style={styles.navButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />

          <TouchableOpacity
            onPress={nextSlide}
            style={[styles.navButton, styles.nextButton]}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <MaterialIcons 
              name={currentSlide === onboardingSlides.length - 1 ? "rocket-launch" : "arrow-forward"} 
              size={20} 
              color={currentSlide === onboardingSlides.length - 1 ? theme.onPrimary : theme.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Features Showcase Modal */}
      <AIFeaturesShowcase 
        visible={showAIShowcase}
        onClose={() => setShowAIShowcase(false)}
        onComplete={() => {
          setShowAIShowcase(false);
          // Continue to next slide after AI showcase
          nextSlide();
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme, isTablet: boolean, spacing: any, typography: any, icons: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.itemMargin,
  },
  skipButton: {
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.surfaceVariant,
  },
  skipButtonText: {
    fontSize: typography.caption,
    color: theme.text,
    fontWeight: '500',
  },
  slideContainer: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.sectionPadding,
  },
  iconContainer: {
    width: isTablet ? 180 : 140,
    height: isTablet ? 180 : 140,
    borderRadius: isTablet ? 90 : 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sectionPadding,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.itemMargin,
    width: '100%',
  },
  slideTitle: {
    fontSize: isTablet ? typography.h1 : typography.h2,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: spacing.listGap,
  },
  slideSubtitle: {
    fontSize: isTablet ? typography.h3 : typography.h4,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.itemMargin,
  },
  slideDescription: {
    fontSize: typography.body,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: typography.body * 1.5,
    marginBottom: spacing.sectionPadding,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: spacing.sectionPadding,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.listGap,
    paddingHorizontal: spacing.listGap,
  },
  featureText: {
    fontSize: typography.bodySmall,
    color: theme.text,
    marginLeft: spacing.listGap,
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.sectionPadding,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sectionPadding,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.itemMargin,
    paddingVertical: spacing.listGap,
    borderRadius: spacing.buttonRadius,
    backgroundColor: theme.surfaceVariant,
  },
  navButtonText: {
    fontSize: typography.bodySmall,
    color: theme.text,
    fontWeight: '500',
    marginLeft: spacing.listGap,
  },
  nextButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row-reverse',
  },
  nextButtonText: {
    fontSize: typography.bodySmall,
    color: theme.onPrimary,
    fontWeight: '600',
    marginRight: spacing.listGap,
  },
  spacer: {
    flex: 1,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    borderRadius: spacing.buttonRadius,
    borderWidth: 1.5,
    marginTop: spacing.itemMargin,
    alignSelf: 'center',
  },
  learnMoreText: {
    fontSize: typography.caption,
    fontWeight: '600',
    marginHorizontal: spacing.listGap,
  },
});