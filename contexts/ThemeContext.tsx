import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName, Platform, StatusBar as RNStatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme color definitions
export const lightTheme = {
  // Background colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F7FAFC',
  
  // Primary colors
  primary: '#4ECDC4',
  primaryContainer: '#E6FFFA',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#2D3748',
  
  // Secondary colors
  secondary: '#96CEB4',
  secondaryContainer: '#F0FFF4',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#2D3748',
  
  // Text colors
  onBackground: '#2D3748',
  onSurface: '#2D3748',
  text: '#2D3748',
  textSecondary: '#718096',
  textTertiary: '#A0AEC0',
  
  // Status colors
  success: '#48BB78',
  warning: '#ED8936',
  error: '#E53E3E',
  info: '#4299E1',
  
  // Accent colors for gamification
  gold: '#FFD700',
  purple: '#9F7AEA',
  orange: '#FFB366',
  
  // Border and divider colors
  border: '#E2E8F0',
  divider: '#F7FAFC',
  
  // Button colors
  buttonPrimary: '#4ECDC4',
  buttonSecondary: '#F7FAFC',
  buttonDanger: '#E53E3E',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export const darkTheme = {
  // Background colors
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2D2D2D',
  
  // Primary colors
  primary: '#4ECDC4',
  primaryContainer: '#1A2D2A',
  onPrimary: '#000000',
  onPrimaryContainer: '#E6FFFA',
  
  // Secondary colors
  secondary: '#96CEB4',
  secondaryContainer: '#1A2D1F',
  onSecondary: '#000000',
  onSecondaryContainer: '#F0FFF4',
  
  // Text colors
  onBackground: '#E2E8F0',
  onSurface: '#E2E8F0',
  text: '#E2E8F0',
  textSecondary: '#A0AEC0',
  textTertiary: '#718096',
  
  // Status colors
  success: '#68D391',
  warning: '#F6AD55',
  error: '#FC8181',
  info: '#63B3ED',
  
  // Accent colors for gamification
  gold: '#FFD700',
  purple: '#B794F6',
  orange: '#FFB366',
  
  // Border and divider colors
  border: '#3A3A3A',
  divider: '#2D2D2D',
  
  // Button colors
  buttonPrimary: '#4ECDC4',
  buttonSecondary: '#2D2D2D',
  buttonDanger: '#FC8181',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@spendly/theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Determine if we should use dark theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // Update system UI when theme changes
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Update Android status bar
      RNStatusBar.setBackgroundColor(theme.background, true);
      RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
    }
  }, [isDark, theme.background]);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark (skip system)
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility function to create themed styles
export function createThemedStyles<T>(
  styleCreator: (theme: Theme) => T
): (theme: Theme) => T {
  return styleCreator;
}

// Utility hook to get themed styles
export function useThemedStyles<T>(
  styleCreator: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return styleCreator(theme);
}

// Utility function to get theme-aware colors
export function getThemeColors(isDark: boolean) {
  return isDark ? darkTheme : lightTheme;
}