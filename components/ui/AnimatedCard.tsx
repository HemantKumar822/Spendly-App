import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import AnimationService from '@/services/animationService';
import { useTheme } from '@/contexts/ThemeContext';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  delay?: number;
  animationType?: 'fade' | 'slide' | 'scale' | 'slide-scale';
  elevation?: number;
  pressAnimation?: boolean;
  pressScaleValue?: number;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

const AnimatedCard = React.memo(function AnimatedCard({
  children,
  style,
  onPress,
  disabled = false,
  delay = 0,
  animationType = 'fade',
  elevation = 4,
  pressAnimation = true,
  pressScaleValue = 0.98,
  pointerEvents,
}: AnimatedCardProps) {
  const { theme } = useTheme();
  const animationService = AnimationService.getInstance();
  
  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(animationType === 'scale' || animationType === 'slide-scale' ? 0.9 : 1)).current;
  const translateY = useRef(new Animated.Value(animationType === 'slide' || animationType === 'slide-scale' ? 50 : 0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  
  // Press interaction scale
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = animationService.createEntranceAnimation(
      { opacity, scale, translateY, translateX },
      animationType
    );
    
    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [animationType, delay, animationService, opacity, scale, translateY, translateX]);

  // Press animation handlers
  const handlePressIn = () => {
    if (pressAnimation && !disabled) {
      animationService.createScaleAnimation(pressScale, pressScaleValue).start();
    }
  };

  const handlePressOut = () => {
    if (pressAnimation && !disabled) {
      animationService.createScaleAnimation(pressScale, 1).start();
    }
  };

  const getAnimatedStyle = () => {
    const transforms: any[] = [];
    
    // Add entrance animation transforms based on type
    switch (animationType) {
      case 'slide':
        transforms.push({ translateY });
        break;
      case 'scale':
        transforms.push({ scale });
        break;
      case 'slide-scale':
        transforms.push({ translateY }, { scale });
        break;
      default:
        // fade only
        break;
    }

    // Add press animation scale if interactable
    if (onPress && !disabled && pressAnimation) {
      if (transforms.length > 0) {
        // Combine with existing scale or add new one
        const existingScaleIndex = transforms.findIndex(t => t.scale);
        if (existingScaleIndex >= 0) {
          transforms[existingScaleIndex] = {
            scale: Animated.multiply(scale, pressScale)
          };
        } else {
          transforms.push({ scale: pressScale });
        }
      } else {
        transforms.push({ scale: pressScale });
      }
    }

    return {
      opacity,
      transform: transforms,
    };
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surface,
      shadowColor: theme.shadow,
      elevation,
    },
    style,
  ];

  if (onPress && !disabled) {
    return (
      <View pointerEvents={pointerEvents}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1} // We handle opacity through animation
        >
          <Animated.View style={[cardStyle, getAnimatedStyle()]}>
            {children}
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View pointerEvents={pointerEvents}>
      <Animated.View style={[cardStyle, getAnimatedStyle()]}>
        {children}
      </Animated.View>
    </View>
  );
});

export default AnimatedCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});