import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive, useResponsiveSpacing, useResponsiveLayout } from '@/hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: boolean;
  centerContent?: boolean;
  variant?: 'full' | 'content' | 'card';
}

export default function ResponsiveContainer({
  children,
  style,
  maxWidth = true,
  centerContent = false,
  variant = 'content',
}: ResponsiveContainerProps) {
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const layout = useResponsiveLayout();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
    };

    switch (variant) {
      case 'full':
        // Full width, no padding
        break;
      case 'content':
        baseStyle.paddingHorizontal = spacing.containerPadding;
        if (maxWidth && isTablet) {
          baseStyle.maxWidth = layout.maxContentWidth;
        }
        break;
      case 'card':
        baseStyle.paddingHorizontal = spacing.cardPadding;
        if (maxWidth && isTablet) {
          baseStyle.maxWidth = layout.cardMaxWidth;
        }
        break;
    }

    if (centerContent && isTablet) {
      baseStyle.alignSelf = 'center';
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  return (
    <View style={[getContainerStyle(), style]}>
      {children}
    </View>
  );
}

// Grid container for responsive layouts
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

export function ResponsiveGrid({
  children,
  columns,
  gap,
  style,
}: ResponsiveGridProps) {
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  
  const gridGap = gap || spacing.gridGap;
  const gridColumns = columns || (isTablet ? 3 : 2);

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -gridGap / 2,
  };

  const childStyle: ViewStyle = {
    width: `${100 / gridColumns}%`,
    paddingHorizontal: gridGap / 2,
    marginBottom: gridGap,
  };

  return (
    <View style={[gridStyle, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={childStyle}>
          {child}
        </View>
      ))}
    </View>
  );
}

// Two-column layout for tablets
interface ResponsiveTwoColumnProps {
  children: React.ReactNode;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth?: number; // Percentage
  gap?: number;
  style?: ViewStyle;
}

export function ResponsiveTwoColumn({
  children,
  leftContent,
  rightContent,
  leftWidth = 40,
  gap,
  style,
}: ResponsiveTwoColumnProps) {
  const { isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  
  const columnGap = gap || spacing.gridGap;
  const rightWidth = 100 - leftWidth;

  if (!isTablet) {
    // On phones, render single column
    return (
      <View style={style}>
        {children || (
          <>
            {leftContent}
            {rightContent}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      <View style={{ width: `${leftWidth}%`, paddingRight: columnGap / 2 }}>
        {leftContent}
      </View>
      <View style={{ width: `${rightWidth}%`, paddingLeft: columnGap / 2 }}>
        {rightContent}
      </View>
    </View>
  );
}

// Responsive card layout
interface ResponsiveCardLayoutProps {
  children: React.ReactNode;
  columns?: number;
  minCardWidth?: number;
  gap?: number;
  style?: ViewStyle;
}

export function ResponsiveCardLayout({
  children,
  columns,
  minCardWidth = 280,
  gap,
  style,
}: ResponsiveCardLayoutProps) {
  const { isTablet, screenWidth } = useResponsive();
  const spacing = useResponsiveSpacing();
  
  const layoutGap = gap || spacing.gridGap;
  const containerPadding = spacing.containerPadding * 2;
  const availableWidth = screenWidth - containerPadding;
  
  // Calculate optimal columns
  const maxColumns = columns || (isTablet ? 3 : 1);
  const calculatedColumns = Math.floor((availableWidth + layoutGap) / (minCardWidth + layoutGap));
  const actualColumns = Math.max(1, Math.min(maxColumns, calculatedColumns));
  
  const cardWidth = (availableWidth - (layoutGap * (actualColumns - 1))) / actualColumns;

  const containerStyle: ViewStyle = {
    flexDirection: isTablet && actualColumns > 1 ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  };

  const childStyle: ViewStyle = isTablet && actualColumns > 1 
    ? { width: cardWidth, marginBottom: layoutGap }
    : { marginBottom: layoutGap };

  return (
    <View style={[containerStyle, style]}>
      {React.Children.map(children, (child, index) => (
        <View key={index} style={childStyle}>
          {child}
        </View>
      ))}
    </View>
  );
}