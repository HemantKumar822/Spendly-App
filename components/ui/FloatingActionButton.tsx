import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/contexts/ThemeContext';
import AnimationService from '@/services/animationService';

interface FloatingActionButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  iconColor?: string;
  disabled?: boolean;
  delay?: number;
}

const FloatingActionButton = React.memo(function FloatingActionButton({
  icon,
  onPress,
  style,
  size = 'medium',
  color,
  iconColor,
  disabled = false,
  delay = 0,
}: FloatingActionButtonProps) {
  const { theme } = useTheme();
  const { triggerMediumHaptic } = useHaptics();
  const animationService = AnimationService.getInstance();
  
  // Animation values
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const pressScaleValue = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Entrance animation on mount
  useEffect(() => {
    const entranceAnimation = animationService.createEntranceAnimation(
      { opacity: opacityValue, scale: scaleValue },
      'scale'
    );
    
    if (delay > 0) {
      setTimeout(() => entranceAnimation.start(), delay);
    } else {
      entranceAnimation.start();
    }
  }, [animationService, delay, opacityValue, scaleValue]);

  const handlePressIn = () => {
    if (disabled) return;
    
    triggerMediumHaptic();
    
    // Combined press animation with rotation
    animationService.createScaleAnimation(pressScaleValue, 0.9).start();
    animationService.createScaleAnimation(rotateAnim, 1, {
      duration: 300
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    animationService.createScaleAnimation(pressScaleValue, 1).start();
    animationService.createScaleAnimation(rotateAnim, 0, {
      duration: 300
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1} // We handle opacity through animation
      style={[styles.container, style]}
    >
      <Animated.View
        style={[
          styles.button,
          getSizeStyle(),
          {
            backgroundColor: color || theme.primary,
            opacity: disabled ? 0.5 : opacityValue,
            transform: [
              { scale: Animated.multiply(scaleValue, pressScaleValue) },
            ],
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [{ rotate: rotation }],
          }}
        >
          <MaterialIcons
            name={icon}
            size={getIconSize()}
            color={iconColor || '#FFFFFF'}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
});

export default FloatingActionButton;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  button: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  small: {
    width: 48,
    height: 48,
  },
  medium: {
    width: 56,
    height: 56,
  },
  large: {
    width: 64,
    height: 64,
  },
});