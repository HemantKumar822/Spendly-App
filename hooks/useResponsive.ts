import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface ResponsiveValues {
  isTablet: boolean;
  isPhone: boolean;
  screenWidth: number;
  screenHeight: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

interface ResponsiveConfig<T> {
  phone: T;
  tablet: T;
}

export function useResponsive(): ResponsiveValues {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isPortrait = height > width;

  // Tablet breakpoint: width >= 768px or height >= 1024px
  const isTablet = width >= 768 || height >= 1024;
  const isPhone = !isTablet;

  return {
    isTablet,
    isPhone,
    screenWidth: width,
    screenHeight: height,
    isLandscape,
    isPortrait,
  };
}

// Hook for responsive values
export function useResponsiveValue<T>(config: ResponsiveConfig<T>): T {
  const { isTablet } = useResponsive();
  return isTablet ? config.tablet : config.phone;
}

// Hook for responsive spacing
export function useResponsiveSpacing() {
  const { isTablet } = useResponsive();
  
  return {
    // Padding values
    containerPadding: isTablet ? 40 : 20,
    cardPadding: isTablet ? 24 : 20,
    sectionPadding: isTablet ? 32 : 20,
    
    // Margin values
    cardMargin: isTablet ? 20 : 16,
    itemMargin: isTablet ? 16 : 12,
    
    // Gap values
    gridGap: isTablet ? 20 : 16,
    listGap: isTablet ? 16 : 12,
    
    // Border radius
    cardRadius: isTablet ? 20 : 16,
    buttonRadius: isTablet ? 16 : 12,
  };
}

// Hook for responsive typography
export function useResponsiveTypography() {
  const { isTablet } = useResponsive();
  
  return {
    // Headers
    h1: isTablet ? 36 : 28,
    h2: isTablet ? 30 : 24,
    h3: isTablet ? 24 : 20,
    h4: isTablet ? 20 : 18,
    h5: isTablet ? 18 : 16,
    h6: isTablet ? 16 : 14,
    
    // Body text
    body: isTablet ? 18 : 16,
    bodySmall: isTablet ? 16 : 14,
    caption: isTablet ? 14 : 12,
    
    // UI elements
    button: isTablet ? 18 : 16,
    input: isTablet ? 18 : 16,
    label: isTablet ? 16 : 14,
  };
}

// Hook for responsive layout
export function useResponsiveLayout() {
  const { isTablet, screenWidth } = useResponsive();
  
  // Grid columns based on screen width
  const getGridColumns = (itemWidth: number) => {
    const padding = isTablet ? 80 : 40; // Total horizontal padding
    const gap = isTablet ? 20 : 16;
    const availableWidth = screenWidth - padding;
    const columns = Math.floor((availableWidth + gap) / (itemWidth + gap));
    return Math.max(1, Math.min(columns, isTablet ? 4 : 2));
  };
  
  return {
    // Grid layouts
    categoryGridColumns: getGridColumns(isTablet ? 140 : 100),
    quickActionColumns: getGridColumns(isTablet ? 160 : 120),
    
    // Container widths
    maxContentWidth: isTablet ? 1200 : '100%',
    cardMaxWidth: isTablet ? 600 : '100%',
    modalMaxWidth: isTablet ? 800 : '90%',
    
    // Sidebar for tablets
    sidebarWidth: isTablet ? 280 : 0,
    contentPadding: isTablet ? 40 : 20,
    
    // Chart dimensions
    chartHeight: isTablet ? 240 : 180,
    chartPadding: isTablet ? 30 : 20,
  };
}

// Hook for responsive icons
export function useResponsiveIcons() {
  const { isTablet } = useResponsive();
  
  return {
    small: isTablet ? 20 : 16,
    medium: isTablet ? 28 : 24,
    large: isTablet ? 36 : 32,
    xlarge: isTablet ? 48 : 40,
    
    // Specific UI elements
    tabIcon: isTablet ? 28 : 24,
    buttonIcon: isTablet ? 24 : 20,
    headerIcon: isTablet ? 32 : 28,
    cardIcon: isTablet ? 48 : 40,
  };
}

// Utility function to get responsive styles
export function getResponsiveStyle<T>(phone: T, tablet: T, isTablet: boolean): T {
  return isTablet ? tablet : phone;
}