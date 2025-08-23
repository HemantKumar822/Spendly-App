import React, { ComponentType, Suspense, lazy } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Generic loading component for lazy-loaded screens/components
const LoadingFallback: React.FC<{ componentName?: string }> = ({ componentName }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
        {componentName ? `Loading ${componentName}...` : 'Loading...'}
      </Text>
    </View>
  );
};

// Error boundary component for lazy loading failures
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC = () => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Failed to load component</Text>
    <Text style={styles.errorSubtext}>Please try refreshing the app</Text>
  </View>
);

// Utility function to create lazy-loaded components with consistent loading states
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName?: string,
  fallbackComponent?: ComponentType
): ComponentType {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <LazyLoadErrorBoundary fallback={fallbackComponent}>
      <Suspense fallback={<LoadingFallback componentName={componentName} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
}

// Preload function for components that might be needed soon
export function preloadComponent(importFn: () => Promise<{ default: ComponentType<any> }>) {
  // Start loading the component in the background
  importFn().catch((error) => {
    console.warn('Failed to preload component:', error);
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53E3E',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});