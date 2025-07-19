import AsyncStorage from '@react-native-async-storage/async-storage';

// Log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log entry interface
interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  data?: any;
}

// Logger configuration
const config = {
  logLevel: LogLevel.INFO, // Default log level
  maxLogEntries: 1000, // Maximum number of log entries to store
  logToConsole: true, // Whether to log to console
  logToStorage: true, // Whether to store logs in AsyncStorage
  logStorageKey: '@CommunityDelivery:logs', // AsyncStorage key for logs
};

// Configure logger
export const configureLogger = (options: Partial<typeof config>) => {
  Object.assign(config, options);
};

// Format log message
const formatLogMessage = (level: string, message: any): string => {
  const timestamp = new Date().toISOString();
  const formattedMessage = typeof message === 'object' 
    ? JSON.stringify(message) 
    : message;
  
  return `[${timestamp}] [${level}] ${formattedMessage}`;
};

// Store log in AsyncStorage
const storeLog = async (entry: LogEntry): Promise<void> => {
  if (!config.logToStorage) return;
  
  try {
    // Get existing logs
    const logsJson = await AsyncStorage.getItem(config.logStorageKey);
    let logs: LogEntry[] = logsJson ? JSON.parse(logsJson) : [];
    
    // Add new log entry
    logs.unshift(entry);
    
    // Trim logs if exceeding max entries
    if (logs.length > config.maxLogEntries) {
      logs = logs.slice(0, config.maxLogEntries);
    }
    
    // Save logs
    await AsyncStorage.setItem(config.logStorageKey, JSON.stringify(logs));
  } catch (error) {
    // If storing logs fails, at least log to console
    if (config.logToConsole) {
      console.error('Failed to store log:', error);
    }
  }
};

// Get stored logs
export const getLogs = async (): Promise<LogEntry[]> => {
  try {
    const logsJson = await AsyncStorage.getItem(config.logStorageKey);
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (error) {
    console.error('Failed to retrieve logs:', error);
    return [];
  }
};

// Clear stored logs
export const clearLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(config.logStorageKey);
  } catch (error) {
    console.error('Failed to clear logs:', error);
  }
};

// Send logs to server
export const sendLogsToServer = async (apiEndpoint: string): Promise<boolean> => {
  try {
    const logs = await getLogs();
    
    // Don't send if no logs
    if (logs.length === 0) return true;
    
    // Send logs to server
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    if (config.logToConsole) {
      console.error('Failed to send logs to server:', error);
    }
    return false;
  }
};

// Logger implementation
export const logger = {
  error: (message: any): void => {
    if (config.logLevel >= LogLevel.ERROR) {
      const entry: LogEntry = {
        level: 'ERROR',
        message: typeof message === 'object' ? JSON.stringify(message) : message,
        timestamp: new Date().toISOString(),
        data: typeof message === 'object' ? message : undefined,
      };
      
      if (config.logToConsole) {
        console.error(formatLogMessage('ERROR', message));
      }
      
      storeLog(entry);
    }
  },
  
  warn: (message: any): void => {
    if (config.logLevel >= LogLevel.WARN) {
      const entry: LogEntry = {
        level: 'WARN',
        message: typeof message === 'object' ? JSON.stringify(message) : message,
        timestamp: new Date().toISOString(),
        data: typeof message === 'object' ? message : undefined,
      };
      
      if (config.logToConsole) {
        console.warn(formatLogMessage('WARN', message));
      }
      
      storeLog(entry);
    }
  },
  
  info: (message: any): void => {
    if (config.logLevel >= LogLevel.INFO) {
      const entry: LogEntry = {
        level: 'INFO',
        message: typeof message === 'object' ? JSON.stringify(message) : message,
        timestamp: new Date().toISOString(),
        data: typeof message === 'object' ? message : undefined,
      };
      
      if (config.logToConsole) {
        console.info(formatLogMessage('INFO', message));
      }
      
      storeLog(entry);
    }
  },
  
  debug: (message: any): void => {
    if (config.logLevel >= LogLevel.DEBUG) {
      const entry: LogEntry = {
        level: 'DEBUG',
        message: typeof message === 'object' ? JSON.stringify(message) : message,
        timestamp: new Date().toISOString(),
        data: typeof message === 'object' ? message : undefined,
      };
      
      if (config.logToConsole) {
        console.debug(formatLogMessage('DEBUG', message));
      }
      
      storeLog(entry);
    }
  }
};