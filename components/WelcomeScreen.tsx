import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { useResponsive, useResponsiveSpacing, useResponsiveTypography, useResponsiveIcons } from '@/hooks/useResponsive';

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const { theme } = useTheme();
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const typography = useResponsiveTypography();
  const icons = useResponsiveIcons();
  const styles = getStyles(theme, isTablet, spacing, typography, icons);
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.timing(logoScale, {
      toValue: 1,
      duration: 800,
      easing: Easing.elastic(1.5),
      useNativeDriver: true,
    }).start();
    
    // Animate title fade in
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
    
    // Animate button entrance
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        delay: 600,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <MaterialIcons 
            name="account-balance-wallet" 
            size={isTablet ? 120 : 100} 
            color={theme.primary} 
          />
        </Animated.View>
        
        {/* Title */}
        <Animated.View style={{ opacity: titleOpacity }}>
          <Text style={[styles.title, { color: theme.text }]}>
            Spendly
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Smart Expense Tracking
          </Text>
        </Animated.View>
      </View>
      
      {/* Start Button */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: theme.primary }]}
          onPress={onStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Get Started</Text>
          <MaterialIcons 
            name="arrow-forward" 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const getStyles = (theme: Theme, isTablet: boolean, spacing: any, typography: any, icons: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.containerPadding,
  },
  logoContainer: {
    marginBottom: spacing.sectionPadding,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: isTablet ? typography.h1 : typography.h2,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: spacing.listGap,
  },
  subtitle: {
    fontSize: isTablet ? typography.h3 : typography.h4,
    fontWeight: '500',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.sectionPadding,
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: spacing.listGap,
    paddingHorizontal: spacing.itemMargin,
    borderRadius: spacing.buttonRadius,
  },
  startButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: spacing.listGap,
  },
});