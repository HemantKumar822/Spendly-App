import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

import { useFadeInAnimation } from '@/hooks/useAnimations';
import { useHaptics } from '@/hooks/useHaptics';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  type?: 'default' | 'search' | 'error' | 'success' | 'celebration';
  illustration?: 'expenses' | 'budget' | 'analytics' | 'achievements' | 'search' | 'offline' | 'onboarding';
  enableMicroInteractions?: boolean;
}

export default function EmptyState({
  icon,
  title,
  message,
  actionText,
  onAction,
  style,
  type = 'default',
  illustration,
  enableMicroInteractions = true,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const { triggerLightHaptic } = useHaptics();
  const fadeAnim = useFadeInAnimation(400);
  const styles = getStyles(theme);
  
  // Enhanced animation references
  const illustrationScale = useRef(new Animated.Value(0.8)).current;
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const titleSlideAnim = useRef(new Animated.Value(30)).current;
  const messageSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonSlideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    if (enableMicroInteractions) {
      // Staggered entrance animations
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          // Main illustration entrance with spring
          Animated.spring(illustrationScale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          // Title slide up
          Animated.timing(titleSlideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
      
      // Message animation with delay
      Animated.timing(messageSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      
      // Button animation with delay
      if (actionText && onAction) {
        Animated.timing(buttonSlideAnim, {
          toValue: 0,
          duration: 600,
          delay: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
      
      // Floating animations for decorative elements
      startFloatingAnimations();
      
      // Subtle pulse animation for main illustration
      startPulseAnimation();
    }
  }, [enableMicroInteractions, actionText, onAction]);
  
  const startFloatingAnimations = () => {
    const createFloatingAnimation = (animValue: Animated.Value, delay: number = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000 + delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 2000 + delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };
    
    // Start floating animations with different phases
    Animated.parallel([
      createFloatingAnimation(floatingAnim1, 0),
      createFloatingAnimation(floatingAnim2, 500),
      createFloatingAnimation(floatingAnim3, 1000),
    ]).start();
  };
  
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  const handleIllustrationPress = () => {
    if (enableMicroInteractions) {
      triggerLightHaptic();
      
      // Playful bounce animation on press
      Animated.sequence([
        Animated.spring(illustrationScale, {
          toValue: 0.95,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(illustrationScale, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const getIllustrationIcon = () => {
    switch (illustration) {
      case 'expenses':
        return 'receipt-long';
      case 'budget':
        return 'account-balance-wallet';
      case 'analytics':
        return 'analytics';
      case 'achievements':
        return 'emoji-events';
      case 'search':
        return 'search-off';
      case 'offline':
        return 'cloud-off';
      case 'onboarding':
        return 'rocket-launch';
      default:
        return icon || 'help';
    }
  };

  const getIllustrationColor = () => {
    switch (type) {
      case 'error':
        return theme.error;
      case 'success':
        return theme.success;
      case 'search':
        return theme.textTertiary;
      case 'celebration':
        return theme.gold || theme.primary;
      default:
        return theme.primary;
    }
  };

  const getIllustrationBackground = () => {
    switch (type) {
      case 'error':
        return theme.error + '15';
      case 'success':
        return theme.success + '15';
      case 'search':
        return theme.surfaceVariant;
      case 'celebration':
        return (theme.gold || theme.primary) + '15';
      default:
        return theme.primary + '15';
    }
  };

  const renderDefaultIllustration = () => {
    return (
      <View style={styles.illustrationContainer}>
        <Animated.View 
          style={[
            styles.illustrationCircle, 
            { 
              backgroundColor: getIllustrationBackground(),
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <MaterialIcons 
            name={getIllustrationIcon()} 
            size={48} 
            color={getIllustrationColor()} 
          />
        </Animated.View>
        
        {/* Floating decorative elements */}
        {enableMicroInteractions && (
          <>
            <Animated.View
              style={[
                styles.floatingDot,
                {
                  top: -10,
                  left: -20,
                  transform: [
                    {
                      translateY: floatingAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                  ],
                  opacity: floatingAnim1.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 0.8, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingDot,
                styles.floatingDotMedium,
                {
                  top: 20,
                  right: -15,
                  transform: [
                    {
                      translateY: floatingAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 6],
                      }),
                    },
                    {
                      scale: floatingAnim2.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.2, 0.8],
                      }),
                    },
                  ],
                  opacity: floatingAnim2.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.2, 0.6, 0.2],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingDot,
                styles.floatingDotSmall,
                {
                  bottom: 10,
                  left: 10,
                  transform: [
                    {
                      translateY: floatingAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                    {
                      rotate: floatingAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                  opacity: floatingAnim3.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.4, 0.7, 0.4],
                  }),
                },
              ]}
            />
            {/* Additional ambient particles */}
            <Animated.View
              style={[
                styles.floatingDot,
                styles.floatingDotTiny,
                {
                  top: 50,
                  right: 30,
                  transform: [
                    {
                      translateX: floatingAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 4],
                      }),
                    },
                  ],
                  opacity: floatingAnim1.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 0.4, 0.4, 0],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.floatingDot,
                styles.floatingDotTiny,
                {
                  bottom: 30,
                  right: 20,
                  transform: [
                    {
                      translateX: floatingAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -3],
                      }),
                    },
                  ],
                  opacity: floatingAnim2.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0, 0.3, 0.3, 0],
                  }),
                },
              ]}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={handleIllustrationPress}
        disabled={!enableMicroInteractions}
      >
        <Animated.View 
          style={{
            transform: [{ scale: illustrationScale }]
          }}
        >
          {renderDefaultIllustration()}
        </Animated.View>
      </TouchableOpacity>
      
      <Animated.View
        style={{
          transform: [{ translateY: titleSlideAnim }],
          opacity: fadeAnim,
        }}
      >
        <Text style={styles.title}>{title}</Text>
      </Animated.View>
      
      <Animated.View
        style={{
          transform: [{ translateY: messageSlideAnim }],
          opacity: fadeAnim,
        }}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
      
      {actionText && onAction && (
        <Animated.View
          style={{
            transform: [{ translateY: buttonSlideAnim }],
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.button]}
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{actionText}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
  },
  floatingDotMedium: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary + '80',
  },
  floatingDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.secondary || theme.primary,
  },
  floatingDotTiny: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.primary + '60',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
    letterSpacing: 0.2,
  },
  actionButton: {
    marginTop: 8,
    minWidth: 160,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    backgroundColor: theme.primary || '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});