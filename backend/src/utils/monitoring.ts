import { Request, Response, NextFunction } from 'express';
import os from 'os';
import { logger } from './logger';

// System metrics
interface SystemMetrics {
  cpu: {
    loadAvg: number[];
    usage: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  uptime: number;
  processMemory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

// Performance metrics
interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
}

// Store metrics
const metrics = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    notFound: 0,
  },
  responseTime: {
    sum: 0,
    count: 0,
    max: 0,
    min: Number.MAX_SAFE_INTEGER,
  },
  lastRequests: [] as RequestMetrics[],
};

// Maximum number of recent requests to store
const MAX_RECENT_REQUESTS = 100;

// Get system metrics
export const getSystemMetrics = (): SystemMetrics => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  const processMemory = process.memoryUsage();
  
  return {
    cpu: {
      loadAvg: os.loadavg(),
      usage: os.loadavg()[0] / os.cpus().length, // Approximation of CPU usage
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usagePercent: (usedMem / totalMem) * 100,
    },
    uptime: process.uptime(),
    processMemory: {
      rss: processMemory.rss,
      heapTotal: processMemory.heapTotal,
      heapUsed: processMemory.heapUsed,
      external: processMemory.external,
    },
  };
};

// Get request metrics
export const getRequestMetrics = () => {
  return {
    ...metrics,
    responseTime: {
      ...metrics.responseTime,
      avg: metrics.responseTime.count > 0 
        ? metrics.responseTime.sum / metrics.responseTime.count 
        : 0,
    },
  };
};

// Reset metrics (for testing or periodic resets)
export const resetMetrics = () => {
  metrics.requests.total = 0;
  metrics.requests.success = 0;
  metrics.requests.error = 0;
  metrics.requests.notFound = 0;
  metrics.responseTime.sum = 0;
  metrics.responseTime.count = 0;
  metrics.responseTime.max = 0;
  metrics.responseTime.min = Number.MAX_SAFE_INTEGER;
  metrics.lastRequests = [];
};

// Middleware to collect request metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Track request
  metrics.requests.total++;
  
  // Track response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const responseTime = Date.now() - start;
    
    // Update response time metrics
    metrics.responseTime.sum += responseTime;
    metrics.responseTime.count++;
    metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);
    metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTime);
    
    // Update request status metrics
    if (res.statusCode >= 500) {
      metrics.requests.error++;
    } else if (res.statusCode === 404) {
      metrics.requests.notFound++;
    } else if (res.statusCode < 400) {
      metrics.requests.success++;
    }
    
    // Store recent request data
    const requestMetric: RequestMetrics = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
    };
    
    metrics.lastRequests.unshift(requestMetric);
    if (metrics.lastRequests.length > MAX_RECENT_REQUESTS) {
      metrics.lastRequests.pop();
    }
    
    // Log slow requests
    if (responseTime > 1000) { // 1 second threshold
      logger.warn({
        message: 'Slow request detected',
        path: req.path,
        method: req.method,
        responseTime: `${responseTime}ms`,
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    }
    
    return originalEnd.apply(res, args);
  };
  
  next();
};

// Health check endpoint handler
export const healthCheck = (req: Request, res: Response) => {
  const systemMetrics = getSystemMetrics();
  const requestMetrics = getRequestMetrics();
  
  // Check if system is healthy
  const isHealthy = systemMetrics.memory.usagePercent < 90 && // Memory usage below 90%
                   systemMetrics.cpu.usage < 0.9;            // CPU usage below 90%
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: systemMetrics.uptime,
    system: {
      cpu: systemMetrics.cpu,
      memory: systemMetrics.memory,
    },
    process: {
      memory: systemMetrics.processMemory,
    },
    requests: {
      total: requestMetrics.requests.total,
      success: requestMetrics.requests.success,
      error: requestMetrics.requests.error,
      notFound: requestMetrics.requests.notFound,
    },
    responseTime: {
      avg: requestMetrics.responseTime.avg,
      max: requestMetrics.responseTime.max,
      min: requestMetrics.responseTime.min !== Number.MAX_SAFE_INTEGER ? requestMetrics.responseTime.min : 0,
    },
  });
};

// Alert system
export const checkAlertThresholds = () => {
  const systemMetrics = getSystemMetrics();
  const requestMetrics = getRequestMetrics();
  
  // Check memory usage
  if (systemMetrics.memory.usagePercent > 85) {
    logger.error({
      alert: 'HIGH_MEMORY_USAGE',
      message: `High memory usage detected: ${systemMetrics.memory.usagePercent.toFixed(2)}%`,
      memory: systemMetrics.memory,
    });
  }
  
  // Check CPU usage
  if (systemMetrics.cpu.usage > 0.85) {
    logger.error({
      alert: 'HIGH_CPU_USAGE',
      message: `High CPU usage detected: ${(systemMetrics.cpu.usage * 100).toFixed(2)}%`,
      cpu: systemMetrics.cpu,
    });
  }
  
  // Check error rate
  const totalRequests = requestMetrics.requests.total;
  if (totalRequests > 100) { // Only check after sufficient requests
    const errorRate = requestMetrics.requests.error / totalRequests;
    if (errorRate > 0.05) { // 5% error rate threshold
      logger.error({
        alert: 'HIGH_ERROR_RATE',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        errors: requestMetrics.requests.error,
        total: totalRequests,
      });
    }
  }
  
  // Check average response time
  if (requestMetrics.responseTime.avg > 500) { // 500ms threshold
    logger.warn({
      alert: 'HIGH_RESPONSE_TIME',
      message: `High average response time: ${requestMetrics.responseTime.avg.toFixed(2)}ms`,
      responseTime: requestMetrics.responseTime,
    });
  }
};

// Start periodic monitoring
export const startMonitoring = (intervalMs = 60000) => { // Default: check every minute
  const intervalId = setInterval(() => {
    checkAlertThresholds();
  }, intervalMs);
  
  return () => clearInterval(intervalId); // Return function to stop monitoring
};