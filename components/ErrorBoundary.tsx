import { Component, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';


interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: any, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  showDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('📊 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to a crash reporting service
    // Example: Crashlytics.recordError(error);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    
    Alert.alert(
      'Report Error',
      'Would you like to report this error to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // In a real app, send error details to your error reporting service
            console.log('📤 Error reported:', { error, errorInfo });
            Alert.alert('Thank You', 'Error report has been sent successfully.');
          },
        },
      ]
    );
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error!, errorInfo, this.handleRetry);
      }

      // Default error UI
      return <DefaultErrorFallback 
        error={error!} 
        errorInfo={errorInfo}
        onRetry={this.handleRetry}
        onReport={this.handleReportError}
        showDetails={showDetails}
      />;
    }

    return children;
  }
}

// Default error fallback component with theme support
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  onRetry, 
  onReport, 
  showDetails 
}: {
  error: Error;
  errorInfo: any;
  onRetry: () => void;
  onReport: () => void;
  showDetails: boolean;
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <MaterialIcons name="error-outline" size={80} color={theme.error} />
        </View>

        {/* Error Message */}
        <Text style={styles.title}>Oops! Something went wrong</Text>
        <Text style={styles.subtitle}>
          We're sorry for the inconvenience. The app encountered an unexpected error.
        </Text>

        {/* Error Details (if enabled) */}
        {showDetails && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Error Details:</Text>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error.name}: {error.message}
              </Text>
              {error.stack && (
                <Text style={styles.stackTrace} numberOfLines={10}>
                  {error.stack}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.retryButton, styles.button]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.reportButton, styles.secondaryButton]}
            onPress={onReport}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Report Error</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          If the problem persists, try restarting the app or contact support.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 50,
    backgroundColor: theme.error + '15',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: theme.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.error,
  },
  errorText: {
    fontSize: 14,
    color: theme.error,
    fontWeight: '600',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 12,
    color: theme.textTertiary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  retryButton: {
    width: '100%',
  },
  reportButton: {
    width: '100%',
  },
  button: {
    backgroundColor: theme.primary || '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.primary || '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.primary || '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: theme.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

// Specific error boundaries for different parts of the app
export function ScreenErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🔴 Screen Error:', error.message);
      }}
      fallback={(error, errorInfo, retry) => (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={retry}
          onReport={() => {}}
          showDetails={false}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: ReactNode;
  componentName: string;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`🔴 ${componentName} Error:`, error.message);
      }}
      fallback={(error, errorInfo, retry) => (
        <View style={{ padding: 16, backgroundColor: '#FEF2F2', borderRadius: 8 }}>
          <Text style={{ color: '#DC2626', fontWeight: '600', marginBottom: 8 }}>
            {componentName} Error
          </Text>
          <Text style={{ color: '#7F1D1D', fontSize: 14, marginBottom: 12 }}>
            {error.message}
          </Text>
          <TouchableOpacity
            onPress={retry}
            style={{
              backgroundColor: '#DC2626',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;