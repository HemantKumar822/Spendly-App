import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHaptics } from '@/hooks/useHaptics';
import AnimationService from '@/services/animationService';
import { useTheme } from '@/contexts/ThemeContext';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

const AnimatedButton = React.memo(function AnimatedButton({
  title,
  onPress,
  style,
  textStyle,
  icon,
  iconSize = 20,
  iconColor,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
}: AnimatedButtonProps) {
  const { theme } = useTheme();
  const { triggerLightHaptic } = useHaptics();
  const animationService = AnimationService.getInstance();
  
  // Animation values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const loadingDot1 = useRef(new Animated.Value(0.3)).current;
  const loadingDot2 = useRef(new Animated.Value(0.3)).current;
  const loadingDot3 = useRef(new Animated.Value(0.3)).current;
  
  // Animation references
  const loadingAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Start loading animation when loading prop changes
  React.useEffect(() => {
    if (loading) {
      loadingAnimationRef.current = animationService.createLoadingAnimation([
        loadingDot1,
        loadingDot2,
        loadingDot3,
      ]);
      loadingAnimationRef.current.start();
    } else {
      if (loadingAnimationRef.current) {
        loadingAnimationRef.current.stop();
        loadingAnimationRef.current = null;
      }
      // Reset dots to initial state
      loadingDot1.setValue(0.3);
      loadingDot2.setValue(0.3);
      loadingDot3.setValue(0.3);
    }
    
    return () => {
      if (loadingAnimationRef.current) {
        loadingAnimationRef.current.stop();
      }
    };
  }, [loading, animationService, loadingDot1, loadingDot2, loadingDot3]);

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    triggerLightHaptic();
    animationService.createScaleAnimation(scaleValue, 0.95).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    animationService.createScaleAnimation(scaleValue, 1).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button, styles[size]];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabled);
    } else {
      baseStyle.push(styles[variant]);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.text, styles[`${size}Text`]];
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledText);
    } else {
      baseStyle.push(styles[`${variant}Text`]);
    }
    
    return baseStyle;
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    if (disabled || loading) return '#A0AEC0';
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return '#4ECDC4';
      case 'ghost':
        return '#4A5568';
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          getButtonStyle(),
          {
            transform: [{ scale: scaleValue }],
          },
          style,
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View 
              style={[
                styles.loadingDot, 
                { opacity: loadingDot1 }
              ]} 
            />
            <Animated.View 
              style={[
                styles.loadingDot, 
                { opacity: loadingDot2 }
              ]} 
            />
            <Animated.View 
              style={[
                styles.loadingDot, 
                { opacity: loadingDot3 }
              ]} 
            />
          </View>
        ) : (
          <View style={styles.content}>
            {icon && (
              <MaterialIcons 
                name={icon} 
                size={iconSize} 
                color={getIconColor()} 
                style={styles.icon}
              />
            )}
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

export default AnimatedButton;

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  
  // Size variants
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  
  // Color variants
  primary: {
    backgroundColor: '#4ECDC4',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#E53E3E',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Text color variants
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#4ECDC4',
  },
  ghostText: {
    color: '#4A5568',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  
  // States
  disabled: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: '#A0AEC0',
  },
  fullWidth: {
    width: '100%',
  },
  
  // Loading animation
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 2,
  },
  dot1: {
    // Animation will be added via ref
  },
  dot2: {
    // Animation will be added via ref
  },
  dot3: {
    // Animation will be added via ref
  },
});