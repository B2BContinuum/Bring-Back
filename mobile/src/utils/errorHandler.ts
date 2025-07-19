import { Alert } from 'react-native';
import { logger } from './logger';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// Error interface
export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  originalError?: any;
}

// Create standardized error object
export const createError = (error: any): AppError => {
  // Default error
  let appError: AppError = {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred',
  };

  // Handle axios errors
  if (error.isAxiosError) {
    // Network error
    if (!error.response) {
      appError = {
        type: ErrorType.NETWORK,
        message: 'Network connection error. Please check your internet connection.',
        originalError: error,
      };
    } 
    // Server response with error
    else {
      const status = error.response.status;
      const data = error.response.data;

      // Map HTTP status codes to error types
      if (status === 400) {
        appError = {
          type: ErrorType.VALIDATION,
          message: data.error?.message || 'Invalid request data',
          code: data.error?.code || 'VALIDATION_ERROR',
          details: data.error?.details,
          originalError: error,
        };
      } else if (status === 401) {
        appError = {
          type: ErrorType.AUTHENTICATION,
          message: data.error?.message || 'Authentication required',
          code: data.error?.code || 'UNAUTHORIZED',
          originalError: error,
        };
      } else if (status === 403) {
        appError = {
          type: ErrorType.PERMISSION,
          message: data.error?.message || 'You do not have permission to perform this action',
          code: data.error?.code || 'FORBIDDEN',
          originalError: error,
        };
      } else if (status === 404) {
        appError = {
          type: ErrorType.NOT_FOUND,
          message: data.error?.message || 'Resource not found',
          code: data.error?.code || 'NOT_FOUND',
          originalError: error,
        };
      } else if (status === 408 || status === 504) {
        appError = {
          type: ErrorType.TIMEOUT,
          message: data.error?.message || 'Request timed out',
          code: data.error?.code || 'TIMEOUT',
          originalError: error,
        };
      } else if (status >= 500) {
        appError = {
          type: ErrorType.SERVER,
          message: data.error?.message || 'Server error, please try again later',
          code: data.error?.code || 'SERVER_ERROR',
          originalError: error,
        };
      }
    }
  } 
  // Handle other error types
  else if (error instanceof Error) {
    appError = {
      type: ErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred',
      originalError: error,
    };
  }

  // Log the error
  logger.error({
    type: appError.type,
    message: appError.message,
    code: appError.code,
    details: appError.details,
    originalError: error instanceof Error ? error.stack : undefined,
  });

  return appError;
};

// Retry function with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 300,
  backoffFactor = 2
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    // Create standardized error
    const appError = createError(error);
    
    // Don't retry for certain error types
    if (
      appError.type === ErrorType.VALIDATION ||
      appError.type === ErrorType.AUTHENTICATION ||
      appError.type === ErrorType.PERMISSION ||
      appError.type === ErrorType.NOT_FOUND ||
      retries <= 0
    ) {
      throw appError;
    }
    
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with increased delay
    return retryWithBackoff(fn, retries - 1, delay * backoffFactor, backoffFactor);
  }
};

// Show error alert to user
export const showErrorAlert = (error: AppError, onRetry?: () => void) => {
  // Customize message based on error type
  let title = 'Error';
  let message = error.message;
  let buttons = [];
  
  switch (error.type) {
    case ErrorType.NETWORK:
      title = 'Connection Error';
      message = 'Please check your internet connection and try again.';
      break;
    case ErrorType.AUTHENTICATION:
      title = 'Authentication Error';
      message = 'Please log in again to continue.';
      break;
    case ErrorType.SERVER:
      title = 'Server Error';
      message = 'Something went wrong on our end. Please try again later.';
      break;
    case ErrorType.TIMEOUT:
      title = 'Request Timeout';
      message = 'The operation is taking longer than expected. Please try again.';
      break;
  }
  
  // Add retry button if callback provided
  if (onRetry) {
    buttons.push({
      text: 'Retry',
      onPress: onRetry,
    });
  }
  
  // Add OK button
  buttons.push({
    text: 'OK',
    style: 'cancel',
  });
  
  // Show alert
  Alert.alert(title, message, buttons);
};

// Error boundary component for React components
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error({
      message: 'Component error',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise default error message
      return this.props.fallback || (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            The application encountered an unexpected error. Please try again.
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
};