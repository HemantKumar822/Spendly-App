import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useFadeInAnimation } from '@/hooks/useAnimations';

interface LoadingStateProps {
  type?: 'default' | 'overlay' | 'inline' | 'skeleton' | 'pull-refresh';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  visible?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  children?: React.ReactNode;
}

export default function LoadingState({
  type = 'default',
  message,
  size = 'medium',
  color,
  style,
  visible = true,
  icon,
  children,
}: LoadingStateProps) {
  const { theme } = useTheme();
  const fadeAnim = useFadeInAnimation(300);
  const styles = getStyles(theme);

  if (!visible) return null;

  const loadingColor = color || theme.primary;
  const activityIndicatorSize: 'small' | 'large' = size === 'small' ? 'small' : 'large';
  const indicatorSize = size === 'small' ? 20 : size === 'large' ? 40 : 30;

  const renderContent = () => {
    switch (type) {
      case 'overlay':
        return (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              {icon ? (
                <MaterialIcons name={icon} size={indicatorSize} color={loadingColor} />
              ) : (
                <ActivityIndicator size={activityIndicatorSize} color={loadingColor} />
              )}
              {message && <Text style={styles.overlayMessage}>{message}</Text>}
            </View>
          </View>
        );

      case 'inline':
        return (
          <View style={[styles.inline, style]}>
            {icon ? (
              <MaterialIcons name={icon} size={indicatorSize} color={loadingColor} />
            ) : (
              <ActivityIndicator size={activityIndicatorSize} color={loadingColor} />
            )}
            {message && <Text style={styles.inlineMessage}>{message}</Text>}
          </View>
        );

      case 'skeleton':
        return (
          <View style={[styles.skeleton, style]}>
            {children || <SkeletonLoader />}
          </View>
        );

      case 'pull-refresh':
        return (
          <View style={[styles.pullRefresh, style]}>
            <ActivityIndicator size={activityIndicatorSize} color={loadingColor} />
            {message && <Text style={styles.pullRefreshMessage}>{message}</Text>}
          </View>
        );

      default:
        return (
          <View style={[styles.default, style]}>
            {icon ? (
              <MaterialIcons name={icon} size={indicatorSize} color={loadingColor} />
            ) : (
              <ActivityIndicator size={activityIndicatorSize} color={loadingColor} />
            )}
            {message && <Text style={styles.defaultMessage}>{message}</Text>}
          </View>
        );
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderContent()}
    </Animated.View>
  );
}

// Skeleton loader component
function SkeletonLoader() {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonLine, styles.skeletonTitle]} />
      <View style={[styles.skeletonLine, styles.skeletonText]} />
      <View style={[styles.skeletonLine, styles.skeletonText, { width: '70%' }]} />
    </View>
  );
}

// Specific loading components for common use cases
export function ButtonLoadingState({ size = 'small', color }: {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}) {
  const { theme } = useTheme();
  const activitySize = size === 'medium' ? 'large' : size;
  return (
    <ActivityIndicator 
      size={activitySize as 'small' | 'large'} 
      color={color || theme.onPrimary} 
      style={{ marginRight: 8 }}
    />
  );
}

export function ScreenLoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <LoadingState
      type="default"
      size="large"
      message={message}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    />
  );
}

export function OverlayLoadingState({ 
  message = 'Please wait...', 
  visible = true 
}: { 
  message?: string; 
  visible?: boolean; 
}) {
  return (
    <LoadingState
      type="overlay"
      size="large"
      message={message}
      visible={visible}
    />
  );
}

export function CardLoadingState({ message }: { message?: string }) {
  return (
    <LoadingState
      type="skeleton"
      message={message}
      style={{ padding: 16, borderRadius: 12 }}
    />
  );
}

// Progress loading with percentage
interface ProgressLoadingProps {
  progress: number; // 0 to 100
  message?: string;
  color?: string;
}

export function ProgressLoading({ progress, message, color }: ProgressLoadingProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const progressColor = color || theme.primary;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: progressColor }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {message || `${Math.round(progress)}%`}
      </Text>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  // Default loading state
  default: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  defaultMessage: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },

  // Overlay loading state
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: theme.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  overlayMessage: {
    marginTop: 12,
    fontSize: 14,
    color: theme.text,
    textAlign: 'center',
  },

  // Inline loading state
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  inlineMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Skeleton loading
  skeleton: {
    backgroundColor: theme.surface,
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 16,
    width: '60%',
    marginBottom: 12,
  },
  skeletonText: {
    width: '100%',
  },

  // Pull refresh loading
  pullRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pullRefreshMessage: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Progress loading
  progressContainer: {
    padding: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});