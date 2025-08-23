import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

const TabBarBackground = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.background,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          // Extend background to cover safe area
          paddingBottom: Platform.OS === 'ios' ? 0 : Math.max(insets.bottom, 0),
        }
      ]} 
    />
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    borderTopWidth: 1,
  },
});

export default TabBarBackground;

export function useBottomTabOverflow() {
  return 0;
}
