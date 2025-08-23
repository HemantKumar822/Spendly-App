import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 
  | 'light'    // Light tap (button press, selection)
  | 'medium'   // Medium tap (navigation, toggle)
  | 'heavy'    // Heavy tap (delete, error actions)
  | 'success'  // Success feedback (save, complete)
  | 'warning'  // Warning feedback (validation error)
  | 'error';   // Error feedback (delete, critical action)

interface UseHapticsReturn {
  triggerHaptic: (type: HapticType) => void;
  triggerLightHaptic: () => void;
  triggerMediumHaptic: () => void;
  triggerHeavyHaptic: () => void;
  triggerSuccessHaptic: () => void;
  triggerWarningHaptic: () => void;
  triggerErrorHaptic: () => void;
}

/**
 * Custom hook for haptic feedback with different intensity levels
 * Provides consistent tactile feedback across the app
 */
export function useHaptics(): UseHapticsReturn {
  const triggerHaptic = useCallback(async (type: HapticType) => {
    // Only trigger haptics on mobile devices
    if (Platform.OS === 'web') {
      return;
    }

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      // Fail silently if haptics are not supported
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  // Convenience functions for common haptic types
  const triggerLightHaptic = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const triggerMediumHaptic = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const triggerHeavyHaptic = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);
  const triggerSuccessHaptic = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const triggerWarningHaptic = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const triggerErrorHaptic = useCallback(() => triggerHaptic('error'), [triggerHaptic]);

  return {
    triggerHaptic,
    triggerLightHaptic,
    triggerMediumHaptic,
    triggerHeavyHaptic,
    triggerSuccessHaptic,
    triggerWarningHaptic,
    triggerErrorHaptic,
  };
}