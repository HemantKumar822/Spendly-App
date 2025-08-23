import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';
import { StorageService } from '@/services/storage';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  gradientColors: string[];
}

interface RedesignedOnboardingProps {
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
    gradientColors: ['#4ECDC4', '#43B3AA'],
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
    gradientColors: ['#96CEB4', '#7AB39A'],
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
    gradientColors: ['#FFEAA7', '#FFD76E'],
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
    gradientColors: ['#FFB6C1', '#FF9AA2'],
    features: [
      'Interactive spending charts',
      'Category breakdowns',
      'Trend analysis over time',
      'Spending velocity insights'
    ]
  }
];

export default function RedesignedOnboarding({ onComplete }: RedesignedOnboardingProps) {
  const { theme, isDark } = useTheme();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const featureOpacity = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate slide transition
    Animated.parallel([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(featureOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [currentSlide]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const selectedIndex = Math.floor(contentOffset.x / viewSize.width);
    
    if (selectedIndex !== currentSlide) {
      // Reset animations
      slideAnimation.setValue(0);
      iconScale.setValue(0.8);
      textOpacity.setValue(0);
      featureOpacity.setValue(0);
      
      setCurrentSlide(selectedIndex);
    }
  };

  const nextSlide = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      const nextIndex = currentSlide + 1;
      
      // Reset animations
      slideAnimation.setValue(0);
      iconScale.setValue(0.8);
      textOpacity.setValue(0);
      featureOpacity.setValue(0);
      
      setCurrentSlide(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    } else {
      handleCompleteOnboarding();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      const prevIndex = currentSlide - 1;
      
      // Reset animations
      slideAnimation.setValue(0);
      iconScale.setValue(0.8);
      textOpacity.setValue(0);
      featureOpacity.setValue(0);
      
      setCurrentSlide(prevIndex);
      scrollViewRef.current?.scrollTo({
        x: prevIndex * screenWidth,
        animated: true,
      });
    }
  };

  const skipOnboarding = () => {
    handleCompleteOnboarding();
  };

  const handleCompleteOnboarding = async () => {
    try {
      // Mark onboarding as completed
      await StorageService.setOnboardingCompleted();
      await StorageService.setFirstLaunchCompleted();
      
      // Populate with sample data
      await StorageService.populateSampleData();
      
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Still complete onboarding to avoid getting stuck
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    return (
      <View key={slide.id} style={styles.slide}>
        <Animated.View 
          style={[
            styles.slideContent,
            {
              transform: [{
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })
              }],
              opacity: slideAnimation,
            }
          ]}
        >
          {/* Icon with enhanced animation */`}
          <Animated.View 
            style={[
              styles.iconContainer, 
              { 
                backgroundColor: slide.color + (isDark ? '25' : '15'),
                transform: [{
                  scale: iconScale.interpolate({
                    inputRange: [0.8, 1],
                    outputRange: [0.8, 1],
                  })
                }],
                shadowColor: slide.color,
              }
            ]}
          >
            <MaterialIcons 
              name={slide.icon as any} 
              size={isTablet ? 90 : 70} 
              color={slide.color} 
            />
          </Animated.View>

          {/* Content with fade animation */}
          <Animated.View 
            style={[
              styles.textContent,
              { opacity: textOpacity }
            ]}
          >
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            <Text style={styles.slideDescription}>{slide.description}</Text>
          </Animated.View>

          {/* Features List with staggered animation */}
          <Animated.View 
            style={[
              styles.featuresList,
              { opacity: featureOpacity }
            ]}
          >
            {slide.features.map((feature, featureIndex) => (
              <Animated.View 
                key={featureIndex} 
                style={[
                  styles.featureItem,
                  {
                    transform: [{
                      translateX: featureOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      })
                    }],
                    opacity: featureOpacity,
                  }
                ]}
              >
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={slide.color} 
                />
                <Text style={styles.featureText}>{feature}</Text>
              </Animated.View>
            ))}
          </Animated.View>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingSlides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              // Reset animations
              slideAnimation.setValue(0);
              iconScale.setValue(0.8);
              textOpacity.setValue(0);
              featureOpacity.setValue(0);
              
              setCurrentSlide(index);
              scrollViewRef.current?.scrollTo({
                x: index * screenWidth,
                animated: true,
              });
            }}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === currentSlide ? onboardingSlides[currentSlide].color : theme.textTertiary,
                width: index === currentSlide ? 24 : 8,
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
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        // Disable scrolling during animations
        scrollEnabled={true}
      >
        {onboardingSlides.map((slide, index) => renderSlide(slide, index))}
      </Animated.ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { backgroundColor: theme.surface }]}>
        {/* Progress Text */}
        <Text style={[styles.progressText, { color: theme.textTertiary }]}>
          {currentSlide + 1} of {onboardingSlides.length}
        </Text>
        
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
            style={[styles.navButton, styles.nextButton, { backgroundColor: onboardingSlides[currentSlide].color }]}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <MaterialIcons 
              name={currentSlide === onboardingSlides.length - 1 ? "rocket-launch" : "arrow-forward"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.itemMargin,
    width: '100%',
    marginBottom: spacing.sectionPadding,
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
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  progressText: {
    fontSize: typography.caption,
    color: theme.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.listGap,
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
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: spacing.listGap,
  },
  spacer: {
    flex: 1,
  },
});