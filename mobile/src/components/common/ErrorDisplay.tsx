import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppError, ErrorType } from '../../utils/errorHandler';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Component for displaying errors to users with appropriate styling and actions
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss 
}) => {
  // Determine icon and color based on error type
  const getErrorConfig = () => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          icon: '🌐',
          color: '#e74c3c',
          title: 'Connection Error',
        };
      case ErrorType.SERVER:
        return {
          icon: '🖥️',
          color: '#e67e22',
          title: 'Server Error',
        };
      case ErrorType.VALIDATION:
        return {
          icon: '⚠️',
          color: '#f39c12',
          title: 'Validation Error',
        };
      case ErrorType.AUTHENTICATION:
        return {
          icon: '🔒',
          color: '#3498db',
          title: 'Authentication Error',
        };
      case ErrorType.PERMISSION:
        return {
          icon: '🚫',
          color: '#9b59b6',
          title: 'Permission Error',
        };
      case ErrorType.NOT_FOUND:
        return {
          icon: '🔍',
          color: '#95a5a6',
          title: 'Not Found',
        };
      case ErrorType.TIMEOUT:
        return {
          icon: '⏱️',
          color: '#f1c40f',
          title: 'Request Timeout',
        };
      default:
        return {
          icon: '❓',
          color: '#7f8c8d',
          title: 'Error',
        };
    }
  };

  const { icon, color, title } = getErrorConfig();

  return (
    <View style={[styles.container, { borderColor: color }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>
      
      <Text style={styles.message}>{error.message}</Text>
      
      {error.code && (
        <Text style={styles.code}>Error code: {error.code}</Text>
      )}
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.button, styles.retryButton]} 
            onPress={onRetry}
            testID="retry-button"
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity 
            style={[styles.button, styles.dismissButton]} 
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Inline error display for form fields
export const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <Text style={styles.fieldError}>{message}</Text>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  code: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#3498db',
  },
  dismissButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});