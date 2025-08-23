import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StorageService } from '@/services/storage';
import WelcomeScreen from '@/components/WelcomeScreen';
import IntegratedOnboardingFlow from '@/components/IntegratedOnboardingFlow';
import GoalSettingFlow from '@/components/GoalSettingFlow';
import ErrorBoundary, { ScreenErrorBoundary } from '@/components/ErrorBoundary';
import { Budget } from '@/types';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

interface AppWrapperProps {
  children: React.ReactNode;
}

function AppContent({ children }: AppWrapperProps) {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGoalSetting, setShowGoalSetting] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize storage
      await StorageService.initializeApp();
      
      // Debug storage values
      await StorageService.debugStorage();
      
      // Check if this is first launch
      const isFirstLaunch = await StorageService.isFirstLaunch();
      const onboardingCompleted = await StorageService.isOnboardingCompleted();
      const goalSettingCompleted = await StorageService.isGoalSettingCompleted();
      
      console.log('🚀 App initialization:', { isFirstLaunch, onboardingCompleted, goalSettingCompleted });
      
      // Show welcome screen for first-time users or users who haven't completed onboarding
      if (isFirstLaunch || !onboardingCompleted) {
        console.log('📱 Showing welcome screen because:', isFirstLaunch ? 'first launch' : 'onboarding not completed');
        setShowWelcome(true);
      } 
      // For returning users who completed onboarding but haven't set goals
      else if (!goalSettingCompleted) {
        // Check if user has any budgets set up
        const existingBudgets = await StorageService.getBudgets();
        console.log('📊 Checking goal setting:', { goalSettingCompleted, budgetCount: existingBudgets.length });
        if (existingBudgets.length === 0) {
          console.log('🎯 Showing goal setting because no budgets exist');
          setShowGoalSetting(true);
        }
      }
      // For users who have completed everything, go to main app
      else {
        console.log('✅ User has completed onboarding and goal setting, showing main app');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWelcomeStart = () => {
    console.log('▶️ User started onboarding flow');
    setShowWelcome(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async () => {
    try {
      console.log('🎉 Onboarding completed, setting flags');
      // Mark onboarding as completed
      await StorageService.setOnboardingCompleted();
      await StorageService.setFirstLaunchCompleted();
      
      // Don't populate with sample data - let new users start with a clean app
      // await StorageService.populateSampleData();
      
      setShowOnboarding(false);
      
      // Check if we need to show goal setting for new users with no budgets
      const goalSettingCompleted = await StorageService.isGoalSettingCompleted();
      const existingBudgets = await StorageService.getBudgets();
      
      console.log('🎯 Checking goal setting after onboarding:', { goalSettingCompleted, budgetCount: existingBudgets.length });
      
      if (!goalSettingCompleted && existingBudgets.length === 0) {
        setShowGoalSetting(true);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setShowOnboarding(false);
    }
  };

  const handleGoalSettingComplete = async (budgets: Budget[]) => {
    try {
      console.log('🎯 Goal setting completed with budgets:', budgets.length);
      await StorageService.setGoalSettingCompleted(true);
      setShowGoalSetting(false);
    } catch (error) {
      console.error('Error completing goal setting:', error);
      setShowGoalSetting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </>
    );
  }

  if (showWelcome) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
        <ScreenErrorBoundary>
          <WelcomeScreen onStart={handleWelcomeStart} />
        </ScreenErrorBoundary>
      </>
    );
  }

  if (showOnboarding) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
        <ScreenErrorBoundary>
          <IntegratedOnboardingFlow onComplete={handleOnboardingComplete} />
        </ScreenErrorBoundary>
      </>
    );
  }

  if (showGoalSetting) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
        <ScreenErrorBoundary>
          <GoalSettingFlow 
            visible={true}
            onClose={() => setShowGoalSetting(false)}
            onComplete={handleGoalSettingComplete}
          />
        </ScreenErrorBoundary>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.background} />
      <ScreenErrorBoundary>
        {children}
      </ScreenErrorBoundary>
    </>
  );
}

export default function AppWrapper({ children }: AppWrapperProps) {
  return (
    <ErrorBoundary
      showDetails={__DEV__} // Show error details in development
      onError={(error, errorInfo) => {
        // In production, send to crash reporting service
        console.error('🚨 App-level error:', error.message);
        // Example: Crashlytics.recordError(error);
      }}
    >
      <ThemeProvider>
        <AppContent>{children}</AppContent>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});