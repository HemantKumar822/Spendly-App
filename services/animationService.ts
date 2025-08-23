import { Animated, Easing } from 'react-native';

// Animation timing constants
export const ANIMATION_TIMING = {
  INSTANT: 0,
  FAST: 150,
  QUICK: 200,
  MEDIUM: 300,
  SLOW: 500,
  EXTRA_SLOW: 800,
  PAGE_TRANSITION: 400,
  MICRO_INTERACTION: 100,
} as const;

// Enhanced easing functions
export const ANIMATION_EASING = {
  // Basic easing
  LINEAR: Easing.linear,
  EASE_IN: Easing.in(Easing.quad),
  EASE_OUT: Easing.out(Easing.quad),
  EASE_IN_OUT: Easing.inOut(Easing.quad),
  
  // Cubic bezier equivalents
  EASE_IN_CUBIC: Easing.in(Easing.cubic),
  EASE_OUT_CUBIC: Easing.out(Easing.cubic),
  EASE_IN_OUT_CUBIC: Easing.inOut(Easing.cubic),
  
  // Special effects
  BOUNCE: Easing.bounce,
  ELASTIC: Easing.elastic(1),
  BACK: Easing.back(1.5),
  
  // Material Design inspired
  STANDARD: Easing.bezier(0.4, 0.0, 0.2, 1),
  DECELERATE: Easing.bezier(0.0, 0.0, 0.2, 1),
  ACCELERATE: Easing.bezier(0.4, 0.0, 1, 1),
  SHARP: Easing.bezier(0.4, 0.0, 0.6, 1),
} as const;

// Animation presets for consistency
export const ANIMATION_PRESETS = {
  // Entrance animations
  FADE_IN: {
    duration: ANIMATION_TIMING.MEDIUM,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  SLIDE_IN: {
    duration: ANIMATION_TIMING.MEDIUM,
    easing: ANIMATION_EASING.STANDARD,
  },
  SCALE_IN: {
    duration: ANIMATION_TIMING.QUICK,
    easing: ANIMATION_EASING.BACK,
  },
  
  // Exit animations
  FADE_OUT: {
    duration: ANIMATION_TIMING.QUICK,
    easing: ANIMATION_EASING.EASE_IN,
  },
  SLIDE_OUT: {
    duration: ANIMATION_TIMING.QUICK,
    easing: ANIMATION_EASING.ACCELERATE,
  },
  SCALE_OUT: {
    duration: ANIMATION_TIMING.FAST,
    easing: ANIMATION_EASING.EASE_IN,
  },
  
  // Interaction animations
  BUTTON_PRESS: {
    duration: ANIMATION_TIMING.MICRO_INTERACTION,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  CARD_HOVER: {
    duration: ANIMATION_TIMING.FAST,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  
  // Page transitions
  PAGE_ENTER: {
    duration: ANIMATION_TIMING.PAGE_TRANSITION,
    easing: ANIMATION_EASING.STANDARD,
  },
  PAGE_EXIT: {
    duration: ANIMATION_TIMING.PAGE_TRANSITION,
    easing: ANIMATION_EASING.ACCELERATE,
  },
} as const;

interface AnimationConfig {
  duration?: number;
  easing?: Animated.EasingFunction;
  delay?: number;
  useNativeDriver?: boolean;
}

class AnimationService {
  private static instance: AnimationService;
  
  static getInstance(): AnimationService {
    if (!AnimationService.instance) {
      AnimationService.instance = new AnimationService();
    }
    return AnimationService.instance;
  }

  // Enhanced fade animations
  createFadeAnimation(
    animatedValue: Animated.Value,
    toValue: number,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const preset = toValue > 0 ? ANIMATION_PRESETS.FADE_IN : ANIMATION_PRESETS.FADE_OUT;
    
    return Animated.timing(animatedValue, {
      toValue,
      duration: config.duration ?? preset.duration,
      easing: config.easing ?? preset.easing,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Enhanced scale animations
  createScaleAnimation(
    animatedValue: Animated.Value,
    toValue: number,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const preset = toValue > 0 ? ANIMATION_PRESETS.SCALE_IN : ANIMATION_PRESETS.SCALE_OUT;
    
    return Animated.timing(animatedValue, {
      toValue,
      duration: config.duration ?? preset.duration,
      easing: config.easing ?? preset.easing,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Enhanced slide animations
  createSlideAnimation(
    animatedValue: Animated.Value,
    fromValue: number,
    toValue: number,
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const preset = ANIMATION_PRESETS.SLIDE_IN;
    
    animatedValue.setValue(fromValue);
    
    return Animated.timing(animatedValue, {
      toValue,
      duration: config.duration ?? preset.duration,
      easing: config.easing ?? preset.easing,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Spring animations for natural movement
  createSpringAnimation(
    animatedValue: Animated.Value,
    toValue: number,
    config: {
      tension?: number;
      friction?: number;
      useNativeDriver?: boolean;
    } = {}
  ): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue,
      tension: config.tension ?? 100,
      friction: config.friction ?? 8,
      useNativeDriver: config.useNativeDriver ?? true,
    });
  }

  // Button interaction animation
  createButtonPressAnimation(
    scaleValue: Animated.Value,
    pressScale: number = 0.95
  ): {
    pressIn: () => void;
    pressOut: () => void;
  } {
    return {
      pressIn: () => {
        Animated.timing(scaleValue, {
          toValue: pressScale,
          duration: ANIMATION_PRESETS.BUTTON_PRESS.duration,
          easing: ANIMATION_PRESETS.BUTTON_PRESS.easing,
          useNativeDriver: true,
        }).start();
      },
      pressOut: () => {
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: ANIMATION_PRESETS.BUTTON_PRESS.duration,
          easing: ANIMATION_PRESETS.BUTTON_PRESS.easing,
          useNativeDriver: true,
        }).start();
      },
    };
  }

  // Staggered animations for lists
  createStaggeredAnimation(
    animatedValues: Animated.Value[],
    config: {
      stagger?: number;
      duration?: number;
      easing?: Animated.EasingFunction;
    } = {}
  ): Animated.CompositeAnimation {
    const animations = animatedValues.map(value =>
      Animated.timing(value, {
        toValue: 1,
        duration: config.duration ?? ANIMATION_TIMING.MEDIUM,
        easing: config.easing ?? ANIMATION_EASING.EASE_OUT,
        useNativeDriver: true,
      })
    );

    return Animated.stagger(config.stagger ?? 100, animations);
  }

  // Entrance animation sequence for cards/components
  createEntranceAnimation(
    animatedValues: {
      opacity: Animated.Value;
      scale?: Animated.Value;
      translateY?: Animated.Value;
      translateX?: Animated.Value;
    },
    type: 'fade' | 'slide' | 'scale' | 'slide-scale' = 'fade',
    config: AnimationConfig = {}
  ): Animated.CompositeAnimation {
    const animations: Animated.CompositeAnimation[] = [];
    
    // Always include opacity
    animations.push(
      this.createFadeAnimation(animatedValues.opacity, 1, config)
    );

    switch (type) {
      case 'slide':
        if (animatedValues.translateY) {
          animations.push(
            this.createSlideAnimation(animatedValues.translateY, 50, 0, config)
          );
        }
        if (animatedValues.translateX) {
          animations.push(
            this.createSlideAnimation(animatedValues.translateX, 50, 0, config)
          );
        }
        break;
        
      case 'scale':
        if (animatedValues.scale) {
          animations.push(
            this.createScaleAnimation(animatedValues.scale, 1, config)
          );
        }
        break;
        
      case 'slide-scale':
        if (animatedValues.translateY) {
          animations.push(
            this.createSlideAnimation(animatedValues.translateY, 30, 0, config)
          );
        }
        if (animatedValues.scale) {
          animations.push(
            this.createScaleAnimation(animatedValues.scale, 1, config)
          );
        }
        break;
    }

    return Animated.parallel(animations);
  }

  // Loading animation for buttons
  createLoadingAnimation(
    animatedValues: Animated.Value[]
  ): Animated.CompositeAnimation {
    const dotAnimations = animatedValues.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: ANIMATION_TIMING.MEDIUM,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.3,
            duration: ANIMATION_TIMING.MEDIUM,
            easing: ANIMATION_EASING.EASE_IN_OUT,
            useNativeDriver: true,
          }),
        ])
      )
    );

    return Animated.stagger(100, dotAnimations);
  }

  // Shake animation for errors
  createShakeAnimation(
    animatedValue: Animated.Value,
    intensity: number = 10
  ): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration: ANIMATION_TIMING.MICRO_INTERACTION,
        easing: ANIMATION_EASING.LINEAR,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: ANIMATION_TIMING.MICRO_INTERACTION * 2,
        easing: ANIMATION_EASING.LINEAR,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: intensity * 0.7,
        duration: ANIMATION_TIMING.MICRO_INTERACTION * 2,
        easing: ANIMATION_EASING.LINEAR,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -intensity * 0.7,
        duration: ANIMATION_TIMING.MICRO_INTERACTION * 2,
        easing: ANIMATION_EASING.LINEAR,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: ANIMATION_TIMING.MICRO_INTERACTION,
        easing: ANIMATION_EASING.LINEAR,
        useNativeDriver: true,
      }),
    ]);
  }

  // Pulse animation for highlighting
  createPulseAnimation(
    animatedValue: Animated.Value,
    minScale: number = 1,
    maxScale: number = 1.05
  ): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: maxScale,
          duration: ANIMATION_TIMING.SLOW,
          easing: ANIMATION_EASING.EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: minScale,
          duration: ANIMATION_TIMING.SLOW,
          easing: ANIMATION_EASING.EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ])
    );
  }

  // Slide and fade page transition
  createPageTransition(
    entering: {
      opacity: Animated.Value;
      translateX: Animated.Value;
    },
    exiting?: {
      opacity: Animated.Value;
      translateX: Animated.Value;
    }
  ): Animated.CompositeAnimation {
    const animations: Animated.CompositeAnimation[] = [];
    
    // Entering page animation
    entering.opacity.setValue(0);
    entering.translateX.setValue(50);
    
    animations.push(
      Animated.parallel([
        this.createFadeAnimation(entering.opacity, 1, ANIMATION_PRESETS.PAGE_ENTER),
        this.createSlideAnimation(entering.translateX, 50, 0, ANIMATION_PRESETS.PAGE_ENTER),
      ])
    );

    // Exiting page animation (if provided)
    if (exiting) {
      animations.push(
        Animated.parallel([
          this.createFadeAnimation(exiting.opacity, 0, ANIMATION_PRESETS.PAGE_EXIT),
          this.createSlideAnimation(exiting.translateX, 0, -50, ANIMATION_PRESETS.PAGE_EXIT),
        ])
      );
    }

    return Animated.parallel(animations);
  }

  // Utility method to create delayed animation
  createDelayedAnimation(
    animation: Animated.CompositeAnimation,
    delay: number
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        animation.start(() => resolve());
      }, delay);
    });
  }

  // Utility method to sequence multiple animations
  createSequence(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.sequence(animations);
  }

  // Utility method to run animations in parallel
  createParallel(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.parallel(animations);
  }
}

export default AnimationService;
export { ANIMATION_TIMING, ANIMATION_EASING, ANIMATION_PRESETS };