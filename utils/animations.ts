import { Animated, Easing } from 'react-native';

// Animation duration constants
export const ANIMATION_DURATION = {
  FAST: 200,
  MEDIUM: 300,
  SLOW: 500,
  EXTRA_SLOW: 800
};

// Easing functions for different animation types
export const EASING = {
  BOUNCE: Easing.bounce,
  EASE_IN: Easing.in(Easing.quad),
  EASE_OUT: Easing.out(Easing.quad),
  EASE_IN_OUT: Easing.inOut(Easing.quad),
  SPRING: Easing.elastic(1),
  LINEAR: Easing.linear
};

// Fade animations
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM,
  toValue: number = 1
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM,
  toValue: number = 0
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

// Scale animations
export const scaleIn = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM,
  toValue: number = 1
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.BOUNCE,
    useNativeDriver: true,
  });
};

export const scaleOut = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM,
  toValue: number = 0
) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: EASING.EASE_IN,
    useNativeDriver: true,
  });
};

// Bounce animation for interactions
export const bounceScale = (
  animatedValue: Animated.Value,
  toValue: number = 0.95,
  duration: number = ANIMATION_DURATION.FAST
) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue,
      duration: duration / 2,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: duration / 2,
      easing: EASING.EASE_OUT,
      useNativeDriver: true,
    }),
  ]);
};

// Slide animations
export const slideInFromRight = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

export const slideInFromLeft = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

export const slideInFromBottom = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.MEDIUM
) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.EASE_OUT,
    useNativeDriver: true,
  });
};

// Staggered animations for lists
export const staggerAnimation = (
  animations: Animated.CompositeAnimation[],
  delay: number = 100
) => {
  return Animated.stagger(delay, animations);
};

// Spring animation for natural movement
export const springAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  tension: number = 100,
  friction: number = 8
) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver: true,
  });
};

// Pulse animation for highlighting
export const pulseAnimation = (
  animatedValue: Animated.Value,
  duration: number = ANIMATION_DURATION.SLOW
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.05,
        duration: duration / 2,
        easing: EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: EASING.EASE_IN_OUT,
        useNativeDriver: true,
      }),
    ])
  );
};

// Shake animation for errors
export const shakeAnimation = (
  animatedValue: Animated.Value,
  intensity: number = 10,
  duration: number = ANIMATION_DURATION.MEDIUM
) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: duration / 8,
      easing: EASING.LINEAR,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity,
      duration: duration / 4,
      easing: EASING.LINEAR,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: duration / 4,
      easing: EASING.LINEAR,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity,
      duration: duration / 4,
      easing: EASING.LINEAR,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: duration / 8,
      easing: EASING.LINEAR,
      useNativeDriver: true,
    }),
  ]);
};

// Progressive reveal animation
export const progressiveReveal = (
  animatedValues: Animated.Value[],
  delay: number = 100,
  duration: number = ANIMATION_DURATION.MEDIUM
) => {
  return Animated.stagger(
    delay,
    animatedValues.map(value =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        easing: EASING.EASE_OUT,
        useNativeDriver: true,
      })
    )
  );
};