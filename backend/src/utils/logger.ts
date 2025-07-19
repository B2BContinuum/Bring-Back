import fs from 'fs';
import path from 'path';

// Log levels
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Environment-based configuration
const LOG_LEVEL = process.env.LOG_LEVEL 
  ? (LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO)
  : LogLevel.INFO;

const LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE !== 'false';
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs');
const MAX_LOG_FILE_SIZE = parseInt(process.env.MAX_LOG_FILE_SIZE || '10485760', 10); // 10MB default

// Ensure log directory exists
if (LOG_TO_FILE) {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      fs.mkdirSync(LOG_FILE_PATH, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
}

// Format log message
const formatLogMessage = (level: string, message: any): string => {
  const timestamp = new Date().toISOString();
  const formattedMessage = typeof message === 'object' 
    ? JSON.stringify(message, null, 2) 
    : message;
  
  return `[${timestamp}] [${level}] ${formattedMessage}`;
};

// Write log to file
const writeToFile = (level: string, message: string): void => {
  if (!LOG_TO_FILE) return;
  
  try {
    const logFile = path.join(LOG_FILE_PATH, `${level.toLowerCase()}.log`);
    const logMessage = `${message}\n`;
    
    // Check file size before writing
    try {
      const stats = fs.statSync(logFile);
      if (stats.size > MAX_LOG_FILE_SIZE) {
        // Rotate log file
        const backupFile = `${logFile}.${Date.now()}.backup`;
        fs.renameSync(logFile, backupFile);
      }
    } catch (error) {
      // File doesn't exist yet, that's fine
    }
    
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

// Logger implementation
export const logger = {
  error: (message: any): void => {
    if (LOG_LEVEL >= LogLevel.ERROR) {
      const formattedMessage = formatLogMessage('ERROR', message);
      if (LOG_TO_CONSOLE) console.error(formattedMessage);
      writeToFile('ERROR', formattedMessage);
    }
  },
  
  warn: (message: any): void => {
    if (LOG_LEVEL >= LogLevel.WARN) {
      const formattedMessage = formatLogMessage('WARN', message);
      if (LOG_TO_CONSOLE) console.warn(formattedMessage);
      writeToFile('WARN', formattedMessage);
    }
  },
  
  info: (message: any): void => {
    if (LOG_LEVEL >= LogLevel.INFO) {
      const formattedMessage = formatLogMessage('INFO', message);
      if (LOG_TO_CONSOLE) console.info(formattedMessage);
      writeToFile('INFO', formattedMessage);
    }
  },
  
  debug: (message: any): void => {
    if (LOG_LEVEL >= LogLevel.DEBUG) {
      const formattedMessage = formatLogMessage('DEBUG', message);
      if (LOG_TO_CONSOLE) console.debug(formattedMessage);
      writeToFile('DEBUG', formattedMessage);
    }
  }
};

// Request logger middleware
export const requestLogger = (req: any, res: any, next: Function): void => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Add request ID to headers if not present
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = requestId;
  }
  
  // Log request
  logger.info({
    type: 'request',
    requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id || 'unauthenticated'
  });
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - start;
    
    // Log response
    logger.info({
      type: 'response',
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      size: body ? Buffer.byteLength(body) : 0
    });
    
    return originalSend.call(this, body);
  };
  
  next();
};