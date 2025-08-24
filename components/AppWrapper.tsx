import React, { useState, useEffect, useCallback, memo } from 'react';
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

  const initializeApp = useCallback(async () => {
    try {
      // Initialize storage
      await StorageService.initializeApp();
      
      // Check if this is first launch
      const isFirstLaunch = await StorageService.isFirstLaunch();
      const onboardingCompleted = await StorageService.isOnboardingCompleted();
      const goalSettingCompleted = await StorageService.isGoalSettingCompleted();
      
      if (isFirstLaunch || !onboardingCompleted) {
        setShowWelcome(true);
      } else if (!goalSettingCompleted) {
        // Check if user has any budgets set up
        const existingBudgets = await StorageService.getBudgets();
        if (existingBudgets.length === 0) {
          setShowGoalSetting(true);
        }
      }
      
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleWelcomeStart = useCallback(() => {
    setShowWelcome(false);
    setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    try {
      // Mark onboarding as completed
      await StorageService.setOnboardingCompleted();
      await StorageService.setFirstLaunchCompleted();
      
      // Populate with sample data
      await StorageService.populateSampleData();
      
      setShowOnboarding(false);
      
      // Check if we need to show goal setting
      const goalSettingCompleted = await StorageService.isGoalSettingCompleted();
      const existingBudgets = await StorageService.getBudgets();
      
      if (!goalSettingCompleted && existingBudgets.length === 0) {
        setShowGoalSetting(true);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setShowOnboarding(false);
    }
  }, []);

  const handleGoalSettingComplete = useCallback(async (budgets: Budget[]) => {
    try {
      console.log('Goal setting completed with budgets:', budgets.length);
      setShowGoalSetting(false);
    } catch (error) {
      console.error('Error completing goal setting:', error);
      setShowGoalSetting(false);
    }
  }, []);

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

export default memo(function AppWrapper({ children }: AppWrapperProps) {
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
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});