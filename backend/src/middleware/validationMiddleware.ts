import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequestBody } from '../utils/validation';
import xss from 'xss';

/**
 * Middleware to validate request body against a Zod schema
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validateRequestBody(schema, req.body);
    
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors
      });
      return;
    }
    
    // Update request body with validated data
    req.body = result.data;
    next();
  };
};

/**
 * Middleware to sanitize request body to prevent XSS attacks
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
}

/**
 * Middleware to validate and sanitize ID parameters
 */
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!id || typeof id !== 'string' || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName} parameter`
      });
      return;
    }
    
    next();
  };
};