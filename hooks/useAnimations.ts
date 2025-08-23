import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import AnimationService, { ANIMATION_TIMING, ANIMATION_EASING } from '@/services/animationService';
import { progressiveReveal } from '@/utils/animations';

interface UseStaggeredAnimationProps {
  itemCount: number;
  delay?: number;
  duration?: number;
  resetTrigger?: any; // Value that when changed, resets the animation
}

interface UseStaggeredAnimationReturn {
  animatedValues: Animated.Value[];
  triggerAnimation: () => void;
  resetAnimation: () => void;
}

export function useStaggeredAnimation({
  itemCount,
  delay = 100,
  duration = ANIMATION_TIMING.MEDIUM,
  resetTrigger,
}: UseStaggeredAnimationProps): UseStaggeredAnimationReturn {
  const animatedValues = useRef<Animated.Value[]>([]).current;
  const animationService = AnimationService.getInstance();

  // Initialize animated values
  useEffect(() => {
    // Clear existing values
    animatedValues.length = 0;
    
    // Create new values for each item
    for (let i = 0; i < itemCount; i++) {
      animatedValues.push(new Animated.Value(0));
    }
  }, [itemCount]);

  // Reset animation when trigger changes
  useEffect(() => {
    resetAnimation();
    triggerAnimation();
  }, [resetTrigger]);

  const triggerAnimation = useCallback(() => {
    if (animatedValues.length === 0) return;
    
    animationService.createStaggeredAnimation(animatedValues, {
      stagger: delay,
      duration,
      easing: ANIMATION_EASING.EASE_OUT,
    }).start();
  }, [animatedValues, delay, duration, animationService]);

  const resetAnimation = useCallback(() => {
    animatedValues.forEach(value => {
      value.setValue(0);
    });
  }, [animatedValues]);

  return {
    animatedValues,
    triggerAnimation,
    resetAnimation,
  };
}

// Enhanced hook for fade-in animation with more control
export function useFadeInAnimation(delay: number = 0, config?: {
  duration?: number;
  easing?: Animated.EasingFunction;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animationService = AnimationService.getInstance();

  useEffect(() => {
    const animation = animationService.createFadeAnimation(fadeAnim, 1, {
      duration: config?.duration,
      easing: config?.easing,
    });

    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [delay, config?.duration, config?.easing, animationService]);

  return fadeAnim;
}

// Enhanced hook for scale-in animation
export function useScaleInAnimation(delay: number = 0, config?: {
  duration?: number;
  springConfig?: { tension?: number; friction?: number };
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const animationService = AnimationService.getInstance();

  useEffect(() => {
    const animations = [
      animationService.createFadeAnimation(opacityAnim, 1, {
        duration: config?.duration,
      }),
    ];

    if (config?.springConfig) {
      animations.push(
        animationService.createSpringAnimation(scaleAnim, 1, config.springConfig)
      );
    } else {
      animations.push(
        animationService.createScaleAnimation(scaleAnim, 1, {
          duration: config?.duration,
        })
      );
    }

    const animation = animationService.createParallel(animations);

    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [delay, config?.duration, config?.springConfig, animationService]);

  return {
    opacity: opacityAnim,
    transform: [{ scale: scaleAnim }],
  };
}

// Enhanced hook for slide-in from direction animation
export function useSlideInAnimation(
  direction: 'left' | 'right' | 'up' | 'down' = 'up',
  delay: number = 0,
  distance: number = 50,
  config?: {
    duration?: number;
    easing?: Animated.EasingFunction;
  }
) {
  const translateAnim = useRef(new Animated.Value(distance)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const animationService = AnimationService.getInstance();

  useEffect(() => {
    // Set initial position based on direction
    let initialValue = distance;
    if (direction === 'left') {
      initialValue = -distance;
    } else if (direction === 'right') {
      initialValue = distance;
    } else if (direction === 'up') {
      initialValue = distance;
    } else if (direction === 'down') {
      initialValue = -distance;
    }

    translateAnim.setValue(initialValue);

    const animation = animationService.createParallel([
      animationService.createFadeAnimation(opacityAnim, 1, config),
      animationService.createSlideAnimation(translateAnim, initialValue, 0, config),
    ]);

    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [delay, direction, distance, config?.duration, config?.easing, animationService]);

  const getTransform = useCallback(() => {
    if (direction === 'left' || direction === 'right') {
      return [{ translateX: translateAnim }];
    } else {
      return [{ translateY: translateAnim }];
    }
  }, [direction, translateAnim]);

  return {
    opacity: opacityAnim,
    transform: getTransform(),
  };
}

// Hook for button interaction animations
export function useButtonAnimation(config?: {
  pressScale?: number;
  hapticFeedback?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animationService = AnimationService.getInstance();
  
  const buttonAnimation = useMemo(() => 
    animationService.createButtonPressAnimation(scaleAnim, config?.pressScale),
    [animationService, scaleAnim, config?.pressScale]
  );

  return {
    scale: scaleAnim,
    pressIn: buttonAnimation.pressIn,
    pressOut: buttonAnimation.pressOut,
  };
}

// Hook for entrance animations with multiple options
export function useEntranceAnimation(
  type: 'fade' | 'slide' | 'scale' | 'slide-scale' = 'fade',
  delay: number = 0,
  config?: {
    duration?: number;
    easing?: Animated.EasingFunction;
  }
) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const translateX = useRef(new Animated.Value(50)).current;
  const animationService = AnimationService.getInstance();

  useEffect(() => {
    const animation = animationService.createEntranceAnimation(
      { opacity, scale, translateY, translateX },
      type,
      config
    );

    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [type, delay, config?.duration, config?.easing, animationService]);

  const getAnimatedStyle = useCallback(() => {
    const baseStyle: any = { opacity };
    
    switch (type) {
      case 'slide':
        baseStyle.transform = [{ translateY }];
        break;
      case 'scale':
        baseStyle.transform = [{ scale }];
        break;
      case 'slide-scale':
        baseStyle.transform = [{ translateY }, { scale }];
        break;
      default:
        baseStyle.transform = [];
    }
    
    return baseStyle;
  }, [type, opacity, scale, translateY]);

  return getAnimatedStyle();
}

// Hook for loading animation (dots)
export function useLoadingAnimation(dotCount: number = 3) {
  const animatedValues = useRef<Animated.Value[]>([]).current;
  const animationService = AnimationService.getInstance();
  const isRunning = useRef(false);

  // Initialize animated values
  useEffect(() => {
    animatedValues.length = 0;
    for (let i = 0; i < dotCount; i++) {
      animatedValues.push(new Animated.Value(0.3));
    }
  }, [dotCount]);

  const startAnimation = useCallback(() => {
    if (isRunning.current) return;
    isRunning.current = true;
    
    animationService.createLoadingAnimation(animatedValues).start();
  }, [animationService, animatedValues]);

  const stopAnimation = useCallback(() => {
    isRunning.current = false;
    animatedValues.forEach(value => {
      value.stopAnimation();
      value.setValue(0.3);
    });
  }, [animatedValues]);

  return {
    animatedValues,
    startAnimation,
    stopAnimation,
  };
}

// Hook for shake animation (for form errors)
export function useShakeAnimation() {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const animationService = AnimationService.getInstance();

  const shake = useCallback((intensity: number = 10) => {
    animationService.createShakeAnimation(shakeAnim, intensity).start(() => {
      shakeAnim.setValue(0);
    });
  }, [animationService, shakeAnim]);

  return {
    shakeValue: shakeAnim,
    shake,
  };
}

// Hook for pulse animation (highlighting)
export function usePulseAnimation(autoStart: boolean = false) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationService = AnimationService.getInstance();
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startPulse = useCallback((minScale: number = 1, maxScale: number = 1.05) => {
    animationRef.current = animationService.createPulseAnimation(pulseAnim, minScale, maxScale);
    animationRef.current.start();
  }, [animationService, pulseAnim]);

  const stopPulse = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.stop();
      pulseAnim.setValue(1);
    }
  }, [pulseAnim]);

  useEffect(() => {
    if (autoStart) {
      startPulse();
    }
    
    return () => {
      stopPulse();
    };
  }, [autoStart, startPulse, stopPulse]);

  return {
    pulseValue: pulseAnim,
    startPulse,
    stopPulse,
  };
}

// Hook for page transition animations
export function usePageTransition() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(50)).current;
  const animationService = AnimationService.getInstance();

  const enter = useCallback(() => {
    const animation = animationService.createPageTransition({
      opacity,
      translateX,
    });
    animation.start();
  }, [animationService, opacity, translateX]);

  const exit = useCallback(() => {
    return new Promise<void>((resolve) => {
      const animation = animationService.createParallel([
        animationService.createFadeAnimation(opacity, 0),
        animationService.createSlideAnimation(translateX, 0, -50),
      ]);
      animation.start(() => resolve());
    });
  }, [animationService, opacity, translateX]);

  return {
    style: {
      opacity,
      transform: [{ translateX }],
    },
    enter,
    exit,
  };
}