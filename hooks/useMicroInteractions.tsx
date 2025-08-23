import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

interface MicroInteractionConfig {
  enableFloating?: boolean;
  enablePulse?: boolean;
  enableBounce?: boolean;
  staggerDelay?: number;
}

export const useMicroInteractions = (config: MicroInteractionConfig = {}) => {
  const {
    enableFloating = true,
    enablePulse = true,
    enableBounce = true,
    staggerDelay = 100
  } = config;

  // Animation references
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous animations
    if (enableFloating) {
      startFloatingAnimation();
    }
    if (enablePulse) {
      startPulseAnimation();
    }
  }, [enableFloating, enablePulse]);

  const startFloatingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const triggerBounce = () => {
    if (!enableBounce) return;
    
    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 0.95,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    floatingAnim,
    pulseAnim,
    bounceAnim,
    fadeAnim,
    slideAnim,
    triggerBounce,
  };
};
