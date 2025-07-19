import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { logger } from '../../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to our error reporting service
    logger.error({
      type: 'react_component_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({ 
      hasError: false, 
      error: null 
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise render default error UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The application encountered an unexpected error.
          </Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
          <Button
            title="Try Again"
            onPress={this.resetError}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Screen-level error boundary with navigation reset capability
export const ScreenErrorBoundary: React.FC<ErrorBoundaryProps & { screenName: string }> = ({ 
  children, 
  screenName,
  onError,
}) => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error({
          type: 'screen_error',
          screen: screenName,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
        
        if (onError) {
          onError(error, errorInfo);
        }
      }}
      fallback={
        <View style={styles.container}>
          <Text style={styles.title}>Screen Error</Text>
          <Text style={styles.message}>
            There was a problem loading the {screenName} screen.
          </Text>
          <Button
            title="Go Back"
            onPress={() => {
              // Navigation would be handled here
              // For example: navigation.goBack()
            }}
          />
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontStyle: 'italic',
  },
});